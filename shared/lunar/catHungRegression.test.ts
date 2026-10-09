import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { SOURCE_LOCKED_CAT_HUNG_STAR_NAMES, getSourceLockedCatHungStarsForDate } from './catHungStars'

const LOCKED = new Set<string>(SOURCE_LOCKED_CAT_HUNG_STAR_NAMES)

function lockedNames(stars: ReturnType<typeof getAlmanac>['stars']) {
  return new Set([...stars.good, ...stars.bad].map((star) => star.name).filter((name) => LOCKED.has(name)))
}

function expectedNames(date: string) {
  const stars = getSourceLockedCatHungStarsForDate(date)
  return new Set([...stars.good, ...stars.bad].map((star) => star.name))
}

function datesInRange(startYear: number, endYear: number) {
  const dates: string[] = []
  const cursor = new Date(Date.UTC(startYear, 0, 1))
  const end = new Date(Date.UTC(endYear + 1, 0, 1))
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

describe('cat-hung source-locked production regression', () => {
  it('production almanac uses authority overlay for every civil day 2025-2027', () => {
    for (const date of datesInRange(2025, 2027)) {
      expect(lockedNames(getAlmanac(date).stars), date).toEqual(expectedNames(date))
    }
  })

  it('never emits duplicate source-locked star identities', () => {
    for (const date of datesInRange(2026, 2026)) {
      const stars = getAlmanac(date).stars
      const locked = [...stars.good, ...stars.bad].filter((star) => LOCKED.has(star.name)).map((star) => star.name)
      expect(new Set(locked).size, date).toBe(locked.length)
    }
  })
})
