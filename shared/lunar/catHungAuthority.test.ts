import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/cat-hung-golden-v1.json'
import { getSolarMonth, solarTermsForYear } from './solarTerms'

const TZ = 'Asia/Ho_Chi_Minh'

const MONTH_JIAN_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const
const JIE = ['立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'] as const

function expectedRow(monthJianBranch: number) {
  const month = MONTH_JIAN_BRANCHES.indexOf(
    golden.encoding.monthJianBranches[monthJianBranch] as (typeof MONTH_JIAN_BRANCHES)[number],
  )
  if (month < 0) throw new Error(`Missing Golden Month Jian branch ${monthJianBranch}`)
  const row = golden.rows[month]
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
  })

  it('keeps authority Golden independent from legacy production assumptions', () => {
    expect(golden.gates.productionIndependence).toBe(true)
    expect(golden.gates.noLunarMonthFallback).toBe(true)
    expect(golden.gates.exactJieBoundaryRequired).toBe(true)
    expect(golden.gates.rawTokenNormalizationMustBeExplicit).toBe(true)
    expect(golden.gates.globalScoreAllowed).toBe(false)

    // These four canonical 天德 tokens are deliberately not coerced into a day stem/branch.
    // Any future normalization must be explicit and independently sourced.
    expect(golden.rows[1]?.tianDe).toBe('坤')
    expect(golden.rows[4]?.tianDe).toBe('乾')
    expect(golden.rows[7]?.tianDe).toBe('艮')
    expect(golden.rows[10]?.tianDe).toBe('巽')
    expect(golden.rows[1]?.tianDeHe).toBeNull()
    expect(golden.rows[4]?.tianDeHe).toBeNull()
    expect(golden.rows[7]?.tianDeHe).toBeNull()
    expect(golden.rows[10]?.tianDeHe).toBeNull()
  })

  it('has one unique authority row for every Month Jian branch', () => {
    const branches = golden.rows.map((row) => row.monthJian)
    expect(new Set(branches).size).toBe(12)
    expect(branches).toEqual(MONTH_JIAN_BRANCHES)

    for (let monthJianBranch = 0; monthJianBranch < 12; monthJianBranch++) {
      const row = expectedRow(monthJianBranch)
      expect(row.monthJian).toBe(MONTH_JIAN_BRANCHES[monthJianBranch])
      expect(row.jie).toBe(JIE[monthJianBranch])
    }
  })

  it('switches Golden Month Jian exactly at every 2026 Jie boundary: T-1ms old, T and T+1ms new', () => {
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

      const beforeRow = expectedRow(oldMonth)
      const exactRow = expectedRow(newMonth)
      const afterRow = expectedRow(getSolarMonth(after, TZ))

      expect(beforeRow.monthJian, `${term.name} T-1ms`).toBe(MONTH_JIAN_BRANCHES[oldMonth])
      expect(exactRow.monthJian, `${term.name} T`).toBe(MONTH_JIAN_BRANCHES[newMonth])
      expect(afterRow, `${term.name} T+1ms`).toEqual(exactRow)
    }
  })
})
