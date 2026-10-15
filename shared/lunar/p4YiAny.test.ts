import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-p4-yi-operands-v1.json'
import { composeP4YiEvidence } from './p4YiEvidence'

type Operand = Record<string, unknown> & { presence: string; traceId: string }
type Fixture = {
  id: string
  input: { kind: string; heading: string; operands: Operand[] }
  expected: {
    yi: boolean | null
    trace: Operand[]
    unresolvedTraceIds: string[]
  }
}
const block = golden.blocks.find((candidate) => candidate.kind === 'composition')!
const frozen = JSON.parse(readFileSync(block.path, 'utf8')) as {
  sections: { any: Fixture[] }
}
const cases = frozen.sections.any.map((fixture, caseNumber) => ({ ...fixture, caseNumber }))

describe('P4-C 5.2 frozen ANY selection', () => {
  it('pins all ordered ternary vectors of lengths zero through three', () => {
    expect(createHash('sha256').update(readFileSync(block.path)).digest('hex')).toBe(block.sha256)
    expect(cases).toHaveLength(40)
    expect(new Set(cases.map((fixture) => fixture.id)).size).toBe(40)
    let vectors: string[][] = [[]]
    for (let length = 0; length <= 3; length++) {
      const selected = cases.filter((fixture) => fixture.input.operands.length === length)
      expect(selected).toHaveLength(3 ** length)
      expect(
        selected.map((fixture) => fixture.input.operands.map((operand) => operand.presence)),
      ).toEqual(vectors)
      vectors = vectors.flatMap((vector) =>
        ['present', 'absent', 'unknown'].map((state) => [...vector, state]),
      )
    }
    expect(
      cases.filter(
        (fixture) => fixture.expected.yi === true && fixture.expected.unresolvedTraceIds.length > 0,
      ),
    ).toHaveLength(14)
    for (const fixture of cases) {
      expect(fixture.input.kind).toBe('SYNTHETIC_LISTED_OPERANDS')
      expect(fixture.input.heading).toBe('求醫療病')
    }
  })
})

// Isolated listed operands; these vectors do not claim physical co-presence.
// Frozen expected is read directly: no provider or duplicate ANY oracle.
describe('P4-C 5.2 ANY decision RED', () => {
  it.each(cases)('decision $caseNumber $id', ({ input, expected }) => {
    expect(composeP4YiEvidence(input.heading, input.operands).yi).toBe(
      expected.yi === null ? undefined : expected.yi,
    )
  })
})

describe('P4-C 5.2 complete ordered evidence trace RED', () => {
  it.each(cases)('trace $caseNumber $id', ({ input, expected }) => {
    expect(composeP4YiEvidence(input.heading, input.operands).trace).toEqual(expected.trace)
  })
})

describe('P4-C 5.2 unresolved trace independent of ANY result RED', () => {
  it.each(cases)('unresolved $caseNumber $id', ({ input, expected }) => {
    expect(composeP4YiEvidence(input.heading, input.operands).unresolvedTraceIds).toEqual(
      expected.unresolvedTraceIds,
    )
  })
})

describe('P4-C 5.2 caller evidence remains unchanged', () => {
  it.each(cases)('input $caseNumber $id', ({ input }) => {
    const before = structuredClone(input)
    composeP4YiEvidence(input.heading, input.operands)
    expect(input).toEqual(before)
  })
})
