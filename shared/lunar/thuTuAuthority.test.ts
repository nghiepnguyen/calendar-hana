import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/thu-tu-golden-v1.json'
import { getSolarMonth, solarTermsForYear } from './solarTerms'

const TZ = 'Asia/Ho_Chi_Minh'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

function rowForMonthJian(monthJianBranch: number) {
  const month = ((monthJianBranch + 10) % 12) + 1
  const row = golden.rows.find((candidate) => candidate.month === month)
  if (!row) throw new Error(`Missing Thụ Tử Golden row for Month Jian branch ${monthJianBranch}`)
  return row
}

function isThuTu(monthJianBranch: number, dayBranch: number) {
  return rowForMonthJian(monthJianBranch).dayBranch === BRANCHES[dayBranch]
}

describe('thu-tu-authority-v1 independent Golden', () => {
  it('locks source, operands, Month Jian basis and 12 canonical rows', () => {
    expect(golden.authorityId).toBe('thu-tu-authority-v1')
    expect(golden.status).toBe('SOURCE_LOCKED')
    expect(golden.star).toMatchObject({ name: 'Thụ Tử', han: '受死', kind: 'HUNG' })
    expect(golden.operands).toEqual(['MONTH_JIAN_BRANCH', 'DAY_BRANCH'])
    expect(golden.monthBasis).toBe('MONTH_JIAN')
    expect(golden.boundary).toBe('EXACT_JIE_INSTANT')
    expect(golden.leapMonthSemantics).toBe('NONE')
    expect(golden.rows).toHaveLength(12)
    expect(golden.rows.map((row) => row.dayBranch)).toEqual(['戌', '辰', '亥', '巳', '子', '午', '丑', '未', '寅', '申', '卯', '酉'])
    expect(golden.gates.noLunarMonthFallback).toBe(true)
    expect(golden.gates.satChuInferenceForbidden).toBe(true)
    expect(golden.globalScoreAllowed).toBe(false)
  })

  it('has exactly one matching day branch in each Month Jian row', () => {
    for (let monthJianBranch = 0; monthJianBranch < 12; monthJianBranch++) {
      const matches = Array.from({ length: 12 }, (_, dayBranch) => dayBranch).filter((dayBranch) =>
        isThuTu(monthJianBranch, dayBranch),
      )
      expect(matches, `Month Jian ${BRANCHES[monthJianBranch]}`).toHaveLength(1)
      expect(BRANCHES[matches[0]!]).toBe(rowForMonthJian(monthJianBranch).dayBranch)
    }
  })

  it('switches Month Jian exactly at every 2026 Jie boundary: T-1ms old, T/T+1ms new', () => {
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

      expect(newMonth, term.name).not.toBe(oldMonth)
      expect(getSolarMonth(after, TZ), term.name).toBe(newMonth)
      expect(rowForMonthJian(oldMonth).dayBranch, `${term.name} old row`).not.toBe(rowForMonthJian(newMonth).dayBranch)
      expect(rowForMonthJian(getSolarMonth(after, TZ)), `${term.name} T+1ms`).toEqual(rowForMonthJian(newMonth))
    }
  })
})
