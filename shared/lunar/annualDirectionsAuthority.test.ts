import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/annual-directions-golden-v1.json'
import * as authority from './annualDirectionsAuthority'
import { solarTermsForYear } from './solarTerms'

const branches = [...'子丑寅卯辰巳午未申酉戌亥']
const index = (token: string) => branches.indexOf(token)

describe('annual calendar directional authority', () => {
  it('provides the independent calendar API', () => {
    expect(authority).toHaveProperty('getAnnualDirectionsByYearBranch')
    expect(authority).toHaveProperty('getAnnualDirectionsAtInstant')
  })

  it('matches all twelve independently transcribed source rows', () => {
    expect(golden.productionIndependence).toBe(true)
    expect(golden.rows).toHaveLength(12)
    for (const row of golden.rows) {
      const result = authority.getAnnualDirectionsByYearBranch(index(row.yearBranch))
      expect(result.taiSui.branches).toEqual([index(row.taiSui)])
      expect(result.suiPo.branches).toEqual([index(row.suiPo)])
      expect(result.sanSha.branches).toEqual(row.sanSha.map(index))
      expect(result.sanSha.direction).toBe(row.sanShaDirection)
      for (const record of [result.taiSui, result.suiPo, result.sanSha]) {
        expect(record.operands).toEqual([golden.operand])
        expect(record.yearBoundary).toBe(golden.yearBoundary)
        expect(record.recommendationPolicy).toBe(golden.recommendationPolicy)
        expect(record.source.work).toBe(golden.sourceWork)
        expect(record.status).toBe('SOURCE_LOCKED')
        expect(record).not.toHaveProperty('scoreDelta')
        expect(record).not.toHaveProperty('hit')
      }
      expect(result.taiSui.source.section).toBe(golden.ruleSections.taiSui)
      expect(result.suiPo.source.section).toBe(golden.ruleSections.suiPo)
      expect(result.sanSha.source.section).toBe(golden.ruleSections.sanSha)
      expect(new Set([result.taiSui.id, result.suiPo.id, result.sanSha.id]).size).toBe(3)
    }
  })

  it('changes exactly at Li Chun across the supported 1900–2100 range', () => {
    for (let year = 1900; year <= 2100; year++) {
      const term = solarTermsForYear(year).find((t) => t.id === 'lap-xuan')!
      const t = Date.parse(term.instantUtc)
      for (const delta of [-1, 0, 1]) {
        const result = authority.getAnnualDirectionsAtInstant(new Date(t + delta).toISOString())
        const expectedYear = delta < 0 ? year - 1 : year
        // Independent anchor: 1984 is a Jia Zi year. No production year helper.
        const chi = (((expectedYear - 1984) % 12) + 12) % 12
        expect(result.solarYear, `${year} ${delta}`).toBe(expectedYear)
        expect(result.yearBranch).toBe(chi)
        const row = golden.rows[chi]!
        expect(result.taiSui.branches).toEqual([index(row.taiSui)])
        expect(result.suiPo.branches).toEqual([index(row.suiPo)])
        expect(result.sanSha.branches).toEqual(row.sanSha.map(index))
        expect(result.boundaryPrecision).toBe(golden.boundaryPrecision)
        expect(result.authorityId).toBe(golden.authorityId)
        expect(result.astronomyMethod).toContain('astronomy-authority-v4:clock-v1')
      }
    }
  })

  it('uses the same absolute instant regardless of offset spelling', () => {
    expect(authority.getAnnualDirectionsAtInstant('2026-02-10T00:00:00Z')).toEqual(
      authority.getAnnualDirectionsAtInstant('2026-02-10T07:00:00+07:00'),
    )
    // Between Li Chun and lunar new year 2026: calendar directions already use Ngọ.
    expect(authority.getAnnualDirectionsAtInstant('2026-02-10T00:00:00Z').yearBranch).toBe(6)
    expect(authority.getAnnualDirectionsAtInstant('2026-01-01T00:00:00Z').yearBranch).toBe(5)
  })

  it('rejects invalid operands and unzoned or unsupported instants', () => {
    for (const branch of [-1, 12, 1.5, NaN, Infinity]) {
      expect(() => authority.getAnnualDirectionsByYearBranch(branch)).toThrow(RangeError)
    }
    for (const instant of [
      'bad',
      '2026-02-04',
      '2026-02-04T10:00:00',
      '1899-12-31T00:00:00Z',
      '2101-01-01T00:00:00Z',
    ]) {
      expect(() => authority.getAnnualDirectionsAtInstant(instant)).toThrow(RangeError)
    }
  })
})
