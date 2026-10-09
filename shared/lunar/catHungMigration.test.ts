import { describe, expect, it } from 'vitest'
import { dayCanChi } from './canChi'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { solarStringToJd } from './julian'
import { solarToLunar } from './lunar'
import { getSolarMonth, solarTermMonthChi } from './solarTerms'
import { getStars } from './stars'
import { getMansion } from './mansions'
import { getOfficer } from './officers'

const TZ = 'Asia/Ho_Chi_Minh'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const ALWAYS_LOCKED = ['Nguyệt Đức', 'Nguyệt Đức Hợp', 'Nguyệt Phá', 'Kiếp Sát'] as const
const TIAN_DE = ['Thiên Đức', 'Thiên Đức Hợp'] as const

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
    officer: getOfficer(jd, cc.chi).index,
    mansion: getMansion(jd).index,
  })
  return new Set([...result.good, ...result.bad].map((star) => star.name))
}

function authorityMatchesForDate(date: string) {
  const jd = solarStringToJd(date)
  const monthJian = solarTermMonthChi(jd)
  const row = getCatHungAuthorityByMonthJian(monthJian)
  const cc = dayCanChi(jd)
  const stem = STEMS[cc.can]!
  const branch = BRANCHES[cc.chi]!
  const matches = new Set<string>()

  if (row.tianDe === stem || row.tianDe === branch) matches.add('Thiên Đức')
  if (row.tianDeHe && (row.tianDeHe === stem || row.tianDeHe === branch)) matches.add('Thiên Đức Hợp')
  if (row.yueDe === stem) matches.add('Nguyệt Đức')
  if (row.yueDeHe === stem) matches.add('Nguyệt Đức Hợp')
  if (row.yuePo === branch) matches.add('Nguyệt Phá')
  if (row.jieSha === branch) matches.add('Kiếp Sát')
  return { matches, tianDeDirect: STEMS.includes(row.tianDe) || BRANCHES.includes(row.tianDe) }
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
  it('classifies only month-basis changes as expected authority migration', () => {
    const differences: Array<{ date: string; star: string; legacy: boolean; authority: boolean; sameBasisRow: boolean }> = []

    for (const date of datesInYear(2026)) {
      const legacy = legacyStarsForDate(date)
      const authority = authorityMatchesForDate(date)
      const [year, month, day] = date.split('-').map(Number) as [number, number, number]
      const lunar = solarToLunar(day, month, year)
      const jd = solarStringToJd(date)
      const monthJianMonth = ((solarTermMonthChi(jd) + 10) % 12) + 1
      const sameBasisRow = lunar.month === monthJianMonth
      const comparable = authority.tianDeDirect ? [...ALWAYS_LOCKED, ...TIAN_DE] : [...ALWAYS_LOCKED]

      for (const star of comparable) {
        const oldValue = legacy.has(star)
        const newValue = authority.matches.has(star)
        if (oldValue !== newValue) differences.push({ date, star, legacy: oldValue, authority: newValue, sameBasisRow })
      }
    }

    expect(differences.length).toBeGreaterThan(0)
    expect(new Set(differences.map((diff) => diff.star)).size).toBeGreaterThan(0)
    expect(differences.filter((diff) => diff.sameBasisRow)).toEqual([])
  })

  it('does not silently normalize the four raw Tian De trigram/direction tokens', () => {
    const raw = [
      getCatHungAuthorityByMonthJian(3).tianDe,
      getCatHungAuthorityByMonthJian(6).tianDe,
      getCatHungAuthorityByMonthJian(9).tianDe,
      getCatHungAuthorityByMonthJian(0).tianDe,
    ]
    expect(raw).toEqual(['坤', '乾', '艮', '巽'])
    expect(raw.every((token) => !STEMS.includes(token) && !BRANCHES.includes(token))).toBe(true)
  })

  it('exact-instant Month Jian still changes only at Jie boundaries', () => {
    const before = getSolarMonth('2026-02-03T12:00:00Z', TZ)
    const after = getSolarMonth('2026-02-05T12:00:00Z', TZ)
    expect(before).not.toBe(after)
  })
})
