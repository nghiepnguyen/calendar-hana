import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import golden from '../almanac-data/golden-p4-yi-operands-v1.json'
import { evaluateP4YiOperand } from './p4YiOperands'
import { evaluateP4YiPredicate } from './p4YiPredicates'

const domainBlock = golden.blocks.find((block) => block.kind === 'fullDomains')!
const text = readFileSync(domainBlock.path, 'utf8')
// Frozen TSV JSON cells use CSV double-quote escaping; JSON contains escaped, not literal, tabs/newlines.
const lines = text
  .trimEnd()
  .split('\n')
  .map((line) =>
    line
      .replace(/\r$/, '')
      .split('\t')
      .map((cell) => (cell.startsWith('"') ? cell.slice(1, -1).replaceAll('""', '"') : cell)),
  )
const header = lines[0]!
const rows = lines.slice(1).map((cells) => {
  if (cells.length !== header.length) throw new Error('Malformed frozen TSV row')
  const row = Object.fromEntries(header.map((key, i) => [key, cells[i]!]))
  return {
    id: row.id!,
    han: row.han!,
    domain: row.domain!,
    inputs: JSON.parse(row.inputs!) as Record<string, unknown>,
    providerStates: JSON.parse(row.providerStates!) as Record<string, unknown>,
    inputProvenance: JSON.parse(row.inputProvenance!) as Record<string, unknown>,
    expected: JSON.parse(row.expected!) as { outcome: 'present' | 'absent' },
  }
})
const groups = [...new Set(rows.map((row) => `${row.han}:${row.domain}`))].map((id) => ({
  id,
  cases: rows.filter((row) => `${row.han}:${row.domain}` === id),
}))
const sourceFixtures = JSON.parse(
  readFileSync(golden.blocks.find((block) => block.kind === 'presence')!.path, 'utf8'),
) as {
  presenceFixtures: {
    han: string
    inputs: Record<string, unknown>
    expected: { outcome: string }
  }[]
}
const mother = sourceFixtures.presenceFixtures.find(
  (row) => row.han === '母倉' && row.expected.outcome === 'present',
)!
const soil = mother.inputs.SOIL_REIGN_STATE as Record<string, unknown>
const forgeries = [
  { id: 'soil-state', patch: { state: soil.state === 'present' ? 'absent' : 'present' } },
  { id: 'soil-onset', patch: { onset: '2025-01-01' } },
  { id: 'soil-nextLi', patch: { nextLi: '2025-06-01' } },
  { id: 'soil-row', patch: { sourceRowIndex: 0 } },
  { id: 'soil-path', patch: { sourcePath: 'unrecognized-authority.json' } },
  { id: 'soil-coverage', patch: { coverage: 'outside' } },
]

describe('P4-C 4.4 full frozen domains and soil provenance', () => {
  it('pins all 7863 records and separates conditional from full-provider domains', () => {
    expect(createHash('sha256').update(text).digest('hex')).toBe(domainBlock.sha256)
    expect(rows).toHaveLength(7863)
    expect(new Set(rows.map((row) => row.id)).size).toBe(7863)
    expect(groups).toHaveLength(13)
    expect(rows.filter((row) => row.domain === 'MU_CANG_CONDITIONAL_1440')).toHaveLength(1440)
    expect(rows.filter((row) => row.domain !== 'MU_CANG_CONDITIONAL_1440')).toHaveLength(6423)
  })

  it.each(groups)(
    '$id matches independently derived expected',
    ({ cases }) => {
      for (const row of cases) {
        const entry = authority.entries.find((candidate) => candidate.han === row.han)!
        if (row.domain === 'MU_CANG_CONDITIONAL_1440') {
          expect(row.inputProvenance.providerValidated).toBe(false)
          expect(row.inputs).not.toHaveProperty('SOIL_REIGN_STATE')
          // Actual lower layer used by the provider; never fabricate a dated soil object.
          const present = evaluateP4YiPredicate(entry, {
            monthJianBranch: row.inputs.MONTH_JIAN_BRANCH as string,
            dayBranch: row.inputs.DAY_BRANCH as string,
            soilState: row.inputs.abstractSoilState as 'present' | 'absent',
          })
          expect(present, row.id).toBe(row.expected.outcome === 'present')
        } else {
          const result = evaluateP4YiOperand(
            row.han,
            row.inputs,
            row.providerStates,
            row.inputProvenance,
          )
          expect(result.presence, row.id).toBe(row.expected.outcome)
        }
      }
    },
    60_000,
  )

  it.each(forgeries)(
    '$id: validated=true cannot authenticate contradictory evidence',
    ({ patch }) => {
      const invoke = () =>
        evaluateP4YiOperand('母倉', {
          ...mother.inputs,
          SOIL_REIGN_STATE: { ...soil, ...patch, validated: true },
        })
      expect(invoke).toThrow(RangeError)
      expect(invoke).toThrow(
        expect.objectContaining({
          code: 'MALFORMED_SOIL_PROVENANCE',
          inputKey: 'SOIL_REIGN_STATE',
          requestName: '母倉',
        }),
      )
    },
  )
})
