import { describe, expect, it, vi } from 'vitest'
import golden from './audit-fixtures/sat-chu-golden-v1.json'
import { getAlmanac } from './almanac'
import { getLeapMonth, solarToLunar } from './lunar'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { STARS } from './stars.data'
import { getAllHours, SAT_CHU_HOUR } from './auspicious'
import { evaluateSatChu, SAT_CHU_AM, SAT_CHU_DUONG } from '../personalFengShui/annual/afflictions'
import type { SolarDateString } from '../types'
import manifest from '../almanac-data/manifest.json'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

// Calendar table before this audit (Nôm-verse variant), frozen to classify the migration diff.
const PRE_AUDIT = [5, 0, 7, 3, 8, 10, 1, 11, 6, 9, 2, 4]

describe('Sát Chủ (ngày) folk table, independent golden', () => {
  it('records the selected Hán-văn verse and keeps the rejected Nôm variant', () => {
    expect(golden.rows.map((r) => r.chi)).toEqual([5, 0, 7, 3, 8, 10, 11, 1, 6, 9, 2, 4])
    expect(golden.rows[6]).toMatchObject({ month: 7, dayBranch: 'Hợi', verseWord: 'Trư (Heo)' })
    expect(golden.rows[7]).toMatchObject({ month: 8, dayBranch: 'Sửu', verseWord: 'Ngưu (Trâu)' })
    expect(golden.rejectedVariants[0].rows).toEqual({ '7': 'Sửu', '8': 'Hợi' })
    expect(golden.globalScoreAllowed).toBe(false)
  })
  it('uses one table in the calendar and personal layers', () => {
    const star = STARS.find((s) => s.name === 'Sát Chủ')!
    expect(star.rule.byMonth!.map((row) => row!.chi)).toEqual(golden.rows.map((r) => [r.chi]))
    expect([...SAT_CHU_AM]).toEqual(golden.rows.map((r) => r.chi))
  })
  it('changes 2025–2027 only on Sửu/Hợi days of lunar months 7 and 8', () => {
    let changed = 0
    for (let year = 2025; year <= 2027; year++)
      for (let month = 1; month <= 12; month++)
        for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
          const date =
            `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` as SolarDateString
          const lunar = solarToLunar(d, month, year)
          const chi = dayCanChi(solarStringToJd(date)).chi
          const before = PRE_AUDIT[lunar.month - 1] === chi
          const after = getAlmanac(date).stars.bad.some((s) => s.name === 'Sát Chủ')
          expect(after, date).toBe(golden.rows[lunar.month - 1].chi === chi)
          if (before !== after) {
            // EXPECTED_AUTHORITY_MIGRATION_CHANGE
            expect([7, 8], date).toContain(lunar.month)
            expect([1, 11], date).toContain(chi)
            changed++
          }
        }
    expect(changed).toBeGreaterThan(0)
  }, 60000)
})

// Ngọc Hạp Chánh Tông tr. 129–133, chép tay từ bản scan; mỗi bảng khớp cả thơ lẫn phần giải nghĩa.
describe('Sát Chủ / Sát Sư variants, Ngọc Hạp Chánh Tông', () => {
  const byMonth = (name: string) =>
    STARS.find((s) => s.name === name)!.rule.byMonth!.map((row) => row!.chi)
  it.each([
    ['Tháng Sát Chủ', [0, 1, 1, 10, 4, 4, 1, 4, 1, 4, 7, 4]],
    ['Bốn Mùa Sát Chủ', [0, 3, 6, 9, 0, 9, 6, 3, 0, 3, 6, 9]],
    ['Sát Chủ Trong Bốn Mùa', [6, 6, 6, 0, 0, 0, 7, 7, 7, 3, 3, 3]],
    ['Ngày Sát Sư', [5, 0, 7, 3, 11, 10, 6, 8, 1, 9, 2, 4]],
    ['Tháng Sát Sư', [0, 1, 7, 3, 9, 7, 7, 9, 6, 9, 0, 9]],
  ])('%s', (name, chi) => {
    expect(byMonth(name)).toEqual(chi.map((c) => [c]))
  })
  it('Tháng Sát Chủ uses the personal-panel table (Sát Chủ Dương)', () => {
    expect(byMonth('Tháng Sát Chủ')).toEqual(SAT_CHU_DUONG.map((c) => [c]))
  })
  it('Giờ Sát Chủ: one hour per lunar month', () => {
    expect([...SAT_CHU_HOUR]).toEqual([2, 5, 8, 4, 9, 3, 2, 5, 8, 4, 9, 3])
    for (let month = 1; month <= 12; month++) {
      const hits = getAllHours(2461309, 0, month).filter((h) => h.isSatChu)
      expect(hits.map((h) => h.chi)).toEqual([SAT_CHU_HOUR[month - 1]])
    }
  })
  it('Sát Chủ meaning follows the book (cất nhà, cưới gả), not "mọi công việc"', () => {
    expect(STARS.find((s) => s.name === 'Sát Chủ')!.meaning).toBe(
      'Đại kỵ cất nhà, cưới gả, an táng; hạn chế việc trọng đại.',
    )
  })
})

describe('policy satChuNgocHapStars', () => {
  it('ships ON; this file pins only the P4 flag, so the stars appear', () => {
    expect(manifest.policies.satChuNgocHapStars).toBe(true)
    // 2025-01-28: lunar 12/29, day Dậu -> Bốn Mùa Sát Chủ and Tháng Sát Sư.
    const bad = getAlmanac('2025-01-28').stars.bad.map((s) => s.name)
    expect(bad).toEqual(expect.arrayContaining(['Bốn Mùa Sát Chủ', 'Tháng Sát Sư']))
  })
})

// Owner decision 2026-10-20: a leap month uses its base month (nhuận 4 → tháng 4). The golden's
// leapMonthSemantics still reads UNRESOLVED: its bytes are hash-locked by yi-freeze-v1, so the
// decision lives here and in PROJECT_CONTEXT S2 (stars.ts header already states the rule).
describe('leap month uses the base-month tables', () => {
  it('every day of nhuận 6/2025 (2025-07-25..2025-08-22)', () => {
    expect(getLeapMonth(2025)).toBe(6)
    const names = [
      'Sát Chủ',
      'Tháng Sát Chủ',
      'Bốn Mùa Sát Chủ',
      'Sát Chủ Trong Bốn Mùa',
      'Ngày Sát Sư',
      'Tháng Sát Sư',
    ]
    let leapDays = 0
    for (let t = Date.UTC(2025, 6, 25); t <= Date.UTC(2025, 7, 22); t += 864e5) {
      const date = new Date(t).toISOString().slice(0, 10) as SolarDateString
      const [y, m, d] = date.split('-').map(Number)
      const lunar = solarToLunar(d, m, y)
      expect(lunar, date).toMatchObject({ month: 6, isLeap: true })
      leapDays++
      const chi = dayCanChi(solarStringToJd(date)).chi
      const almanac = getAlmanac(date)
      const bad = almanac.stars.bad.map((s) => s.name)
      for (const name of names) {
        const row = STARS.find((s) => s.name === name)!.rule.byMonth![5]!
        expect(bad.includes(name), `${date} ${name}`).toBe(row.chi!.includes(chi))
      }
      expect(almanac.hours.filter((h) => h.isSatChu).map((h) => h.chi)).toEqual([SAT_CHU_HOUR[5]])
      expect(evaluateSatChu(lunar.month, chi)).toMatchObject({
        amBranch: SAT_CHU_AM[5],
        duongBranch: SAT_CHU_DUONG[5],
      })
    }
    expect(leapDays).toBe(29)
  })
})
