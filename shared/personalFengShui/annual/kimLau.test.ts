import { calculateKimLau } from './kimLau'
import { describe, expect, it } from 'vitest'
import { ANNUAL_FIXTURES } from './annual.fixtures'

describe('Kim Lâu', () => {
  it.each(ANNUAL_FIXTURES.kimLau)('classifies age $age (remainder $remainder)', (row) => {
    expect(calculateKimLau(row.age)).toEqual({
      hit: row.hit,
      kind: row.kind,
      remainder: row.remainder,
    })
  })
  it.each([0, -1, 1.5, NaN, Infinity, 203])('rejects invalid age %s', (age) => {
    expect(() => calculateKimLau(age)).toThrow(RangeError)
  })
  it('supports both nominal-age domain endpoints', () => {
    expect(calculateKimLau(1)).toMatchObject({ hit: true, kind: 'than', remainder: 1 })
    expect(calculateKimLau(202)).toMatchObject({ hit: false, kind: null, remainder: 4 })
  })
})
