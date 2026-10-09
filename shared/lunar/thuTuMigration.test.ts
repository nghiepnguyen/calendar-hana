import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { solarToLunar } from './lunar'
import { getStars } from './stars'
import { getThuTuForDate } from './thuTuAuthority'

function legacyThuTu(date: `${number}-${number}-${number}`) {
  const [year, month, day] = date.split('-').map(Number)
  const jd = solarStringToJd(date)
  const lunar = solarToLunar(day!, month!, year!)
  const dayCC = dayCanChi(jd)
  return getStars({
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    can: dayCC.can,
    chi: dayCC.chi,
    canChi: dayCC.index,
    officer: 0,
    mansion: 0,
  }).bad.some((star) => star.name === 'Thụ Tử')
}

describe('Thụ Tử migration', () => {
  it('production output follows Month Jian authority, not legacy lunar-month presence', () => {
    let authorityDays = 0
    let migrationDifferences = 0

    for (let month = 1; month <= 12; month++) {
      const days = new Date(2026, month, 0).getDate()
      for (let day = 1; day <= days; day++) {
        const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as `${number}-${number}-${number}`
        const authority = getThuTuForDate(date).applies
        const legacy = legacyThuTu(date)
        const production = getAlmanac(date).stars.bad.some((star) => star.name === 'Thụ Tử')

        expect(production, date).toBe(authority)
        if (authority) authorityDays++
        if (authority !== legacy) migrationDifferences++
      }
    }

    expect(authorityDays).toBeGreaterThan(0)
    // A zero diff would mean the gate accidentally stopped discriminating Month Jian from lunar month.
    expect(migrationDifferences).toBeGreaterThan(0)
  })

  it('never emits duplicate Thụ Tử identities after replacing the legacy star', () => {
    for (let month = 1; month <= 12; month++) {
      const date = `2026-${String(month).padStart(2, '0')}-15` as `${number}-${number}-${number}`
      const matches = getAlmanac(date).stars.bad.filter((star) => star.name === 'Thụ Tử')
      expect(matches.length, date).toBeLessThanOrEqual(1)
    }
  })
})
