import { calculateHoangOc } from './hoangOc'
import { describe, expect, it } from 'vitest'
import { ANNUAL_FIXTURES } from './annual.fixtures'

describe('Hoang Ốc bounded age domain', () => {
  for (const row of ANNUAL_FIXTURES.hoangOc.rows) {
    it.each(row.palaces.map((palace, index) => ({ age: row.startAge + index, palace })))(
      'matches age $age => palace $palace',
      ({ age, palace }) => {
        expect(calculateHoangOc(age)).toMatchObject({
          palace,
          palaceId: ANNUAL_FIXTURES.hoangOc.palaceIds[palace - 1],
          hit: ANNUAL_FIXTURES.hoangOc.hitPalaces.includes(palace),
        })
      },
    )
  }
  it.each([0, 1, 9, 70, 202, -1, 10.5, NaN, Infinity])(
    'refuses unsupported or invalid age %s',
    (age) => {
      expect(() => calculateHoangOc(age)).toThrow(RangeError)
    },
  )
})
