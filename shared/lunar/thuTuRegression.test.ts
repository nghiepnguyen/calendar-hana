import { describe, expect, it, vi } from 'vitest'
import { getAlmanac } from './almanac'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { solarToLunar } from './lunar'
import { getMansion } from './mansions'
import { sexagenaryIndex } from './napAm'
import { getOfficer } from './officers'
import { getStars } from './stars'
import { getThuTuForDate } from './thuTuAuthority'
import type { SolarDateString } from '../types'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

const THU_TU = 'Thụ Tử'
const SAT_CHU = 'Sát Chủ'

type LegacyPresence = { thuTu: boolean; satChu: boolean }

function legacyPresence(date: SolarDateString): LegacyPresence {
  const [year, month, dayOfMonth] = date.split('-').map(Number)
  const jd = solarStringToJd(date)
  const lunar = solarToLunar(dayOfMonth!, month!, year!)
  const day = dayCanChi(jd)
  const officer = getOfficer(jd, day.chi)
  const mansion = getMansion(jd)
  const bad = getStars({
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    can: day.can,
    chi: day.chi,
    canChi: sexagenaryIndex(day),
    officer: officer.index,
    mansion: mansion.index,
  }).bad
  return {
    thuTu: bad.some((star) => star.name === THU_TU),
    satChu: bad.some((star) => star.name === SAT_CHU),
  }
}

describe('Thụ Tử migration regression', () => {
  it('classifies every 2025–2027 Thụ Tử change as expected authority migration and preserves Sát Chủ', () => {
    let expectedAuthorityChanges = 0
    let unchangedThuTuDays = 0

    for (let year = 2025; year <= 2027; year++) {
      for (let month = 1; month <= 12; month++) {
        const days = new Date(year, month, 0).getDate()
        for (let dayOfMonth = 1; dayOfMonth <= days; dayOfMonth++) {
          const date =
            `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}` as SolarDateString
          const legacy = legacyPresence(date)
          const authority = getThuTuForDate(date).applies
          const bad = getAlmanac(date).stars.bad
          const productionThuTu = bad.some((star) => star.name === THU_TU)
          const productionSatChu = bad.some((star) => star.name === SAT_CHU)

          // Production Thụ Tử is allowed to differ only because the admitted authority changed
          // the month operand from lunar month to Month Jian.
          expect(productionThuTu, `Thu Tu ${date}`).toBe(authority)
          if (legacy.thuTu === authority) unchangedThuTuDays++
          else expectedAuthorityChanges++

          // Sát Chủ remains SOURCE_DEPENDENT. Phase 5 must not infer or migrate it from Thụ Tử.
          expect(productionSatChu, `Sat Chu ${date}`).toBe(legacy.satChu)
        }
      }
    }

    expect(expectedAuthorityChanges).toBeGreaterThan(0)
    expect(unchangedThuTuDays).toBeGreaterThan(0)
  }, 60_000)

  it('keeps Thụ Tử and Sát Chủ as separate identities', () => {
    let discriminatorDays = 0
    for (let month = 1; month <= 12; month++) {
      const days = new Date(2026, month, 0).getDate()
      for (let dayOfMonth = 1; dayOfMonth <= days; dayOfMonth++) {
        const date =
          `2026-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}` as SolarDateString
        const badNames = getAlmanac(date).stars.bad.map((star) => star.name)
        const thuTu = badNames.includes(THU_TU)
        const satChu = badNames.includes(SAT_CHU)
        if (thuTu !== satChu) discriminatorDays++
      }
    }
    expect(discriminatorDays).toBeGreaterThan(0)
  })
})
