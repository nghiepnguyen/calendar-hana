import { calculateTamTai } from './tamTai'
import { describe, expect, it } from 'vitest'
import { ANNUAL_FIXTURES } from './annual.fixtures'

describe('Tam Tai branch cycles', () => {
  for (const [birthChi, row] of ANNUAL_FIXTURES.tamTai.rows.entries()) {
    it.each(row.map((stage, viewChi) => ({ birthChi, viewChi, stage })))(
      'birth Chi $birthChi / view Chi $viewChi',
      ({ birthChi, viewChi, stage }) => {
        expect(calculateTamTai(birthChi, viewChi)).toEqual({
          hit: stage !== 0,
          stage: stage || null,
        })
      },
    )
  }
  it.each([-1, 12, 1.5, NaN, Infinity])('rejects invalid Chi %s for either operand', (chi) => {
    expect(() => calculateTamTai(chi, 0)).toThrow(RangeError)
    expect(() => calculateTamTai(0, chi)).toThrow(RangeError)
  })
})
