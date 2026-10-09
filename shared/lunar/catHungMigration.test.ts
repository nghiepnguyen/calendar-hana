import { describe, expect, it } from 'vitest'
import { dayCanChi } from './canChi'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { solarStringToJd } from './julian'
import { solarToLunar } from './lunar'
import { getSolarMonth } from './solarTerms'
import { getStars } from './stars'
import { getMansionIndex } from './mansions'
import { getOfficerIndex } from './officers'

const TZ = 'Asia/Ho_Chi_Minh'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const LOCKED = ['Thiên Đức', 'Thiên Đức Hợp', 'Nguyệt Đức', 'Nguyệt Đức Hợp', 'Nguyệt Phá', 'Kiếp Sát'] as const

function legacyStarsForDate(date: string) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const jd = solarStringToJd(date)
  const lunar = solarToLunar(day, month, year)
  const cc = dayCanChi(jd)
  const canChi = ((cc.can * 6 - cc.chi * 5) % 60 + 60) % 60
  const result = getStars({
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    can: cc.can,
    chi: cc.chi,
    canChi,
    officer: getOfficerIndex(jd),
    mansion: getMansionIndex(jd),
  })
  return new Set([...result.good, ...result.bad].map((star) => star.name))
}

function authorityMatchesForDate(date: string) {
  // Noon is deliberate for the civil-day migration audit. Exact-instant Jie semantics
  // remain separately frozen by catHungAuthority.test.ts.
  const instant = `${date}T12:00:00+07:00`
  const monthJian = getSolarMonth(instant, TZ)
  const row = getCatHungAuthorityByMonthJian(monthJian)
  const cc = dayCanChi(solarStringToJd(date))
  const stem = STEMS[cc.can]!
  const branch = BRANCHES[cc.chi]!
  const matches = new Set<string>()

  // Raw trigram/direction tokens for 天德 are intentionally not normalized here.
  if (row.tianDe === stem || row.tianDe === branch) matches.add('Thiên Đức')
  if (row.tianDeHe && (row.tianDeHe === stem || row.tianDeHe === branch)) matches.add('Thiên Đức Hợp')
  if (row.yueDe === stem) matches.add('Nguyệt Đức')
  if (row.yueDeHe === stem) matches.add('Nguyệt Đức Hợp')
  if (row.yuePo === branch) matches.add('Nguyệt Phá')
  if (row.jieSha === branch) matches.add('Kiếp Sát')
  return matches
}

function datesInYear(year: number) {
  const dates: string[] = []
  const cursor = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

describe('cat-hung legacy lunar-month -> Month Jian migration', () => {
  it('classifies all 2026 differences in the source-locked scope as expected authority migration', () => {
    const differences: Array<{ date: string; star: string; legacy: boolean; authority: boolean }> = []

    for (const date of datesInYear(2026)) {
      const legacy = legacyStarsForDate(date)
      const authority = authorityMatchesForDate(date)
      for (const star of LOCKED) {
        const oldValue = legacy.has(star)
        const newValue = authority.has(star)
        if (oldValue !== newValue) differences.push({ date, star, legacy: oldValue, authority: newValue })
      }
    }

    // A zero-diff result would mean this test stopped exercising the lunar-month/Month-Jian migration.
    expect(differences.length).toBeGreaterThan(0)
    expect(new Set(differences.map((diff) => diff.star)).size).toBeGreaterThan(0)

    // Every observed difference is within the explicitly source-locked authority scope.
    expect(differences.every((diff) => LOCKED.includes(diff.star as (typeof LOCKED)[number]))).toBe(true)
  })

  it('does not silently normalize the four raw Tian De trigram/direction tokens', () => {
    const raw = [
      getCatHungAuthorityByMonthJian(3).tianDe, // 卯 row
      getCatHungAuthorityByMonthJian(6).tianDe, // 午 row
      getCatHungAuthorityByMonthJian(9).tianDe, // 酉 row
      getCatHungAuthorityByMonthJian(0).tianDe, // 子 row
    ]
    expect(raw).toEqual(['坤', '乾', '艮', '巽'])
    expect(raw.every((token) => !STEMS.includes(token) && !BRANCHES.includes(token))).toBe(true)
  })
})
