import { describe, expect, it } from 'vitest'
import { assessPersonalAnnualAfflictions } from '../personalFengShui/annual/afflictions'
import { getAnnualDirectionsAtInstant } from './annualDirectionsAuthority'
import golden from './audit-fixtures/annual-directions-golden-v1.json'
import { solarToLunar } from './lunar'
import { solarTermsForYear } from './solarTerms'

const branches = [...'子丑寅卯辰巳午未申酉戌亥']

describe('Phase 6 additive calendar migration', () => {
  it('checks every civil date 2025–2027 and classifies alternate year conventions', () => {
    let lunarDifferences = 0
    let gregorianDifferences = 0
    let unchanged = 0
    for (let year = 2025; year <= 2027; year++) {
      const boundary = Date.parse(
        solarTermsForYear(year).find((t) => t.id === 'lap-xuan')!.instantUtc,
      )
      for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 86400000) {
        const date = new Date(t)
        const lunar = solarToLunar(date.getUTCDate(), date.getUTCMonth() + 1, year)
        const result = getAnnualDirectionsAtInstant(date.toISOString())
        const expectedYear = t < boundary ? year - 1 : year
        const row = golden.rows[(((expectedYear - 1984) % 12) + 12) % 12]!
        expect(result.taiSui.branches).toEqual([branches.indexOf(row.taiSui)])
        expect(result.suiPo.branches).toEqual([branches.indexOf(row.suiPo)])
        expect(result.sanSha.branches).toEqual(row.sanSha.map((b) => branches.indexOf(b)))
        if (result.solarYear !== lunar.year) lunarDifferences++
        else unchanged++
        if (result.solarYear !== year) gregorianDifferences++
      }
    }
    // Alternate conventions differ only in the year-turnover interval, not a rule-table bug.
    expect(lunarDifferences).toBeGreaterThan(0)
    expect(gregorianDifferences).toBeGreaterThan(0)
    expect(unchanged).toBeGreaterThan(1000)
  })

  it('keeps legacy personal lunar-year interpretation separate from calendar directions', () => {
    const personal = assessPersonalAnnualAfflictions('1990-06-01', '2026-02-10')
    expect(personal.status).toBe('ready')
    if (personal.status !== 'ready') throw new Error('Expected supported personal fixture')
    expect(personal.viewLunarYear).toBe(2025)
    expect(personal.viewYearChi).toBe(5)
    const calendar = getAnnualDirectionsAtInstant('2026-02-10T00:00:00Z')
    expect(calendar.solarYear).toBe(2026)
    expect(calendar.yearBranch).toBe(6)
    expect(calendar).not.toHaveProperty('thaiTue')
    expect(calendar).not.toHaveProperty('birthYearChi')
  })
})
