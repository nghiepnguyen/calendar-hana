import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import {
  SOURCE_LOCKED_CAT_HUNG_STAR_NAMES,
  getSourceLockedCatHungStarsForDate,
} from './catHungStars'
import { solarStringToJd } from './julian'
import { solarTermMonthChi } from './solarTerms'

const LOCKED = new Set<string>(SOURCE_LOCKED_CAT_HUNG_STAR_NAMES)
const ALWAYS_LOCKED = new Set<string>(['Nguyệt Đức', 'Nguyệt Đức Hợp', 'Nguyệt Phá', 'Kiếp Sát'])
const TIAN_DE = new Set<string>(['Thiên Đức', 'Thiên Đức Hợp'])
const DIRECT_TOKEN = /^[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]$/

function names(stars: ReturnType<typeof getAlmanac>['stars']) {
  return new Set([...stars.good, ...stars.bad].map((star) => star.name))
}

function expectedNames(date: string) {
  const stars = getSourceLockedCatHungStarsForDate(date)
  return new Set([...stars.good, ...stars.bad].map((star) => star.name))
}

function replacementNames(date: string) {
  const jd = solarStringToJd(date)
  const row = getCatHungAuthorityByMonthJian(solarTermMonthChi(jd))
  const result = new Set(ALWAYS_LOCKED)
  if (DIRECT_TOKEN.test(row.tianDe)) for (const name of TIAN_DE) result.add(name)
  return result
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
  it('production almanac uses authority overlay for every replaceable identity 2025-2027', () => {
    for (const date of datesInRange(2025, 2027)) {
      const actual = names(getAlmanac(date).stars)
      const expected = expectedNames(date)
      const replaceable = replacementNames(date)
      for (const name of replaceable) {
        expect(actual.has(name), `${date} ${name}`).toBe(expected.has(name))
      }
    }
    // Roadmap 10: 1095 almanacs with P4 balancing ON (~32 ms/day locally, CI slower).
  }, 300_000)

  it('never emits duplicate source-locked star identities', () => {
    for (const date of datesInRange(2026, 2026)) {
      const stars = getAlmanac(date).stars
      const locked = [...stars.good, ...stars.bad]
        .filter((star) => LOCKED.has(star.name))
        .map((star) => star.name)
      expect(new Set(locked).size, date).toBe(locked.length)
    }
  })
})
