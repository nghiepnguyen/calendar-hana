import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/sat-chu-golden-v1.json'
import { getAlmanac } from './almanac'
import { solarToLunar } from './lunar'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { STARS } from './stars.data'
import { SAT_CHU_AM } from '../personalFengShui/annual/afflictions'
import type { SolarDateString } from '../types'

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
