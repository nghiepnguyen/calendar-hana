import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import golden from '../almanac-data/golden-p4-yi-operands-v1.json'
import { composeP4YiEvidence } from './p4YiEvidence'
import { canonP4Heading } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'

type Operand = Record<string, unknown> & {
  han: string
  requestName: string
  presence: string
}
type Scope = {
  id: string
  input: { heading: string; operand: Operand }
  expected: {
    listedDirectYi: boolean
    singleGodContribution: boolean | null
    deferred: boolean
  }
}
type Normalization = {
  id: string
  input: { rawHeading?: string; heading?: string; operands: Operand[] }
  expected: {
    normalizedHeading?: string
    idempotentHeading?: string
    compositionCanonicalKey?: string
    heading?: string
    canonicalHan?: string
    yi?: boolean | null
    trace?: Record<string, unknown>[]
    unresolvedTraceIds?: string[]
  }
}
const block = golden.blocks.find((candidate) => candidate.kind === 'composition')!
const frozen = JSON.parse(readFileSync(block.path, 'utf8')) as {
  sections: { headingScope: Scope[]; normalization: Normalization[] }
}
// Frozen isolated evidence vectors, not claims of real-day co-presence.
// Warehouse routing is deliberately left to 5.5; ANY combinations to 5.2.
const scope = frozen.sections.headingScope.filter((fixture) => !fixture.expected.deferred)
const numbered = <T extends { id: string }>(cases: T[]) =>
  cases.map((fixture, caseNumber) => ({ ...fixture, caseNumber }))
const normalize = (heading: string) => splitHeadings(heading).map(canonP4Heading)

describe('P4-C 5.1 frozen heading scope selection', () => {
  it('pins expected bytes and covers every god × heading × state without warehouse deferral', () => {
    expect(createHash('sha256').update(readFileSync(block.path)).digest('hex')).toBe(block.sha256)
    expect(frozen.sections.headingScope).toHaveLength(957)
    expect(frozen.sections.normalization).toHaveLength(15)
    expect(scope).toHaveLength(924)
    expect(new Set(scope.map((fixture) => fixture.id)).size).toBe(924)
    for (const entry of authority.entries) {
      const own = scope.filter((fixture) => fixture.input.operand.han === entry.han)
      expect(own).toHaveLength(84)
      for (const presence of ['present', 'absent', 'unknown']) {
        const selected = own.filter((fixture) => fixture.input.operand.presence === presence)
        expect(selected).toHaveLength(28)
        expect(selected.some((fixture) => fixture.expected.listedDirectYi)).toBe(true)
        expect(selected.some((fixture) => !fixture.expected.listedDirectYi)).toBe(true)
      }
    }
  })
})

describe('P4-C 5.1 isolated direct 宜 heading routing RED', () => {
  it.each(numbered(scope))('scope $caseNumber $id', ({ input, expected }) => {
    const before = JSON.stringify(input)
    const result = composeP4YiEvidence(input.heading, [input.operand])
    expect(result.yi).toBe(expected.singleGodContribution ?? undefined)
    expect(JSON.stringify(input)).toBe(before)
  })
})

describe('P4-C 5.1 source spelling and evaluator key normalization', () => {
  for (const fixture of numbered(frozen.sections.normalization)) {
    const { input, expected } = fixture
    const raw = input.rawHeading ?? input.heading!
    const canonical = expected.compositionCanonicalKey ?? expected.heading!
    it(`normalization helper ${fixture.caseNumber} ${fixture.id}`, () => {
      expect(normalize(raw)).toEqual([canonical])
      expect(normalize(canonical)).toEqual([expected.idempotentHeading ?? canonical])
    })
    it(`normalized routing ${fixture.caseNumber} ${fixture.id}`, () => {
      const operand = input.operands[0]!
      const basis = scope.find(
        (candidate) =>
          candidate.input.heading === canonical &&
          candidate.input.operand.han === operand.han &&
          candidate.input.operand.presence === operand.presence,
      )!
      expect(basis, 'canonical key must exist in frozen scope').toBeDefined()
      const yi = basis.expected.singleGodContribution ?? undefined
      expect(composeP4YiEvidence(raw, input.operands).yi).toBe(yi)
      expect(composeP4YiEvidence(canonical, input.operands).yi).toBe(yi)
    })
    if (expected.canonicalHan) {
      it(`alias trace ${fixture.caseNumber} ${fixture.id}`, () => {
        expect(input.operands[0]).toMatchObject({
          han: expected.canonicalHan,
          requestName: '福徳',
        })
        const result = composeP4YiEvidence(raw, input.operands)
        expect(result.trace).toEqual(expected.trace)
        expect(result.unresolvedTraceIds).toEqual(expected.unresolvedTraceIds)
      })
    }
  }
})
