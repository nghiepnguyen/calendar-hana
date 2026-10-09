import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/cat-hung-golden-v1.json'
import {
  CAT_HUNG_AUTHORITY_ID,
  CAT_HUNG_JIE,
  CAT_HUNG_MONTH_BASIS,
  CAT_HUNG_MONTH_JIAN_BRANCHES,
  getCatHungAuthorityAtInstant,
  getCatHungAuthorityByMonthJian,
} from './catHungAuthority'
import { getSolarMonth, solarTermsForYear } from './solarTerms'

const TZ = 'Asia/Ho_Chi_Minh'

const MONTH_JIAN_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const
const JIE = ['立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'] as const

function expectedRow(monthJianBranch: number) {
  if (!Number.isInteger(monthJianBranch) || monthJianBranch < 0 || monthJianBranch > 11)
    throw new RangeError(`Invalid Golden Month Jian branch ${monthJianBranch}`)
  // Project branch encoding is 子=0..亥=11, while the Golden rows are 寅..丑.
  // Therefore 子(0)->row 10, 丑(1)->row 11, 寅(2)->row 0 ... 亥(11)->row 9.
  const row = golden.rows[(monthJianBranch + 10) % 12]
  if (!row) throw new Error(`Missing Golden row for Month Jian branch ${monthJianBranch}`)
  return row
}

describe('cat-hung-authority-v1 independent Golden', () => {
  it('locks authority metadata and source-locked scope', () => {
    expect(golden.authorityId).toBe('cat-hung-authority-v1')
    expect(golden.status).toBe('PARTIAL_SOURCE_LOCK')
    expect(golden.monthBasis.type).toBe('MONTH_JIAN')
    expect(golden.monthBasis.boundary).toBe('EXACT_JIE_INSTANT')
    expect(golden.monthBasis.clockAuthority).toBe('astronomy-authority-v4 / clock-v1')
    expect(golden.source.confidence).toBe('PRIMARY')
    expect(golden.encoding.monthJianBranches).toEqual(MONTH_JIAN_BRANCHES)
    expect(golden.encoding.jie).toEqual(JIE)
    expect(golden.rows).toHaveLength(12)
    expect(golden.lockedStars).toHaveLength(6)
    expect(golden.lockedStars.every((star) => star.status === 'SOURCE_LOCKED')).toBe(true)

    expect(CAT_HUNG_AUTHORITY_ID).toBe(golden.authorityId)
    expect(CAT_HUNG_MONTH_BASIS).toBe(golden.monthBasis.type)
    expect(CAT_HUNG_MONTH_JIAN_BRANCHES).toEqual(golden.encoding.monthJianBranches)
    expect(CAT_HUNG_JIE).toEqual(golden.encoding.jie)
  })

  it('keeps authority Golden independent from legacy production assumptions', () => {
    expect(golden.gates.productionIndependence).toBe(true)
    expect(golden.gates.noLunarMonthFallback).toBe(true)
    expect(golden.gates.exactJieBoundaryRequired).toBe(true)
    expect(golden.gates.rawTokenNormalizationMustBeExplicit).toBe(true)
    expect(golden.gates.globalScoreAllowed).toBe(false)

    expect(golden.rows[1]?.tianDe).toBe('坤')
    expect(golden.rows[4]?.tianDe).toBe('乾')
    expect(golden.rows[7]?.tianDe).toBe('艮')
    expect(golden.rows[10]?.tianDe).toBe('巽')
    expect(golden.rows[1]?.tianDeHe).toBeNull()
    expect(golden.rows[4]?.tianDeHe).toBeNull()
    expect(golden.rows[7]?.tianDeHe).toBeNull()
    expect(golden.rows[10]?.tianDeHe).toBeNull()
  })

  it('matches all 12 source rows without reading stars.data.ts', () => {
    for (let monthJianBranch = 0; monthJianBranch < 12; monthJianBranch++) {
      expect(getCatHungAuthorityByMonthJian(monthJianBranch)).toEqual(expectedRow(monthJianBranch))
    }
  })

  it('rejects invalid Month Jian branch operands', () => {
    for (const value of [-1, 12, 1.5, Number.NaN]) {
      expect(() => getCatHungAuthorityByMonthJian(value)).toThrow(RangeError)
    }
  })

  it('switches production authority exactly at every 2026 Jie: T-1ms old, T and T+1ms new', () => {
    const jie = solarTermsForYear(2026).filter((term) => {
      const before = new Date(Date.parse(term.instantUtc) - 1).toISOString()
      return getSolarMonth(before, TZ) !== getSolarMonth(term.instantUtc, TZ)
    })
    expect(jie).toHaveLength(12)

    for (const term of jie) {
      const t = Date.parse(term.instantUtc)
      const before = new Date(t - 1).toISOString()
      const exact = new Date(t).toISOString()
      const after = new Date(t + 1).toISOString()

      const oldMonth = getSolarMonth(before, TZ)
      const newMonth = getSolarMonth(exact, TZ)
      expect(newMonth, `${term.name} changes Month Jian`).not.toBe(oldMonth)
      expect(getSolarMonth(after, TZ), `${term.name} T+1ms`).toBe(newMonth)

      const beforeAuthority = getCatHungAuthorityAtInstant(before, TZ)
      const exactAuthority = getCatHungAuthorityAtInstant(exact, TZ)
      const afterAuthority = getCatHungAuthorityAtInstant(after, TZ)

      expect(beforeAuthority.monthJianBranch, `${term.name} T-1ms`).toBe(oldMonth)
      expect(exactAuthority.monthJianBranch, `${term.name} T`).toBe(newMonth)
      expect(afterAuthority.monthJianBranch, `${term.name} T+1ms`).toBe(newMonth)
      expect(beforeAuthority.row, `${term.name} T-1ms row`).toEqual(expectedRow(oldMonth))
      expect(exactAuthority.row, `${term.name} T row`).toEqual(expectedRow(newMonth))
      expect(afterAuthority.row, `${term.name} T+1ms row`).toEqual(expectedRow(newMonth))
      expect(exactAuthority.authorityId).toBe(golden.authorityId)
      expect(exactAuthority.monthBasis).toBe('MONTH_JIAN')
    }
  })
})
