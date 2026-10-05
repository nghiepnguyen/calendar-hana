import { describe, expect, it } from 'vitest'
import fixture from '../../tasks/fixtures/bazi-engine-benchmark.v1.json'
import { monthOpeningTerms, termContextAt } from './termInstants'

describe('monthOpeningTerms', () => {
  it('supports the previous term context for births at the start of 1900', () => {
    expect(termContextAt('1900-01-01T00:00:00.000Z').pillarYear).toBe(1899)
  })

  it('matches all 12 independent JPL crossings within 30 seconds', () => {
    const terms = monthOpeningTerms(2024)
    expect(terms.map((term) => term.longitude)).toEqual([
      315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285,
    ])
    for (const [index, term] of terms.entries()) {
      const reference = Date.parse(fixture.termCases[index].referenceUtc)
      expect(Math.abs(Date.parse(term.instantUtc) - reference)).toBeLessThanOrEqual(30_000)
    }
  })
})

it('changes the Bazi year and month only at Lập Xuân', () => {
  const crossing = monthOpeningTerms(2026)[0]
  expect(termContextAt(new Date(Date.parse(crossing.instantUtc) - 1).toISOString())).toMatchObject({
    pillarYear: 2025,
    monthOffset: 11,
  })
  expect(termContextAt(crossing.instantUtc)).toMatchObject({ pillarYear: 2026, monthOffset: 0 })
  expect(termContextAt('2100-12-31T16:59:59Z').pillarYear).toBe(2100)
})
