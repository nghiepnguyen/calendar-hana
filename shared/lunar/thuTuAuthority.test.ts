import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/thu-tu-golden-v1.json'
import { getSolarMonth, solarTermsForYear } from './solarTerms'
import {
  getThuTuAtInstant,
  getThuTuDayBranchByMonthJian,
  isThuTuByMonthJian,
  THU_TU_AUTHORITY_ID,
  THU_TU_MONTH_BASIS,
} from './thuTuAuthority'

const TZ = 'Asia/Ho_Chi_Minh'
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

function branchIndex(branch: string) {
  const index = BRANCHES.indexOf(branch as (typeof BRANCHES)[number])
  if (index < 0) throw new Error(`Unknown Golden branch ${branch}`)
  return index
}

function expectedTarget(monthJianBranch: number) {
  const monthJian = BRANCHES[monthJianBranch]
  const row = golden.rows.find((x) => x.monthJian === monthJian)
  if (!row) throw new Error(`Missing Golden Month Jian row ${monthJian}`)
  return branchIndex(row.dayBranch)
}

describe('thu-tu-authority-v1', () => {
  it('locks production authority API to all 12 independent Golden rows', () => {
    expect(golden.authorityId).toBe('thu-tu-authority-v1')
    expect(golden.status).toBe('SOURCE_LOCKED')
    expect(golden.operands).toEqual(['MONTH_JIAN_BRANCH', 'DAY_BRANCH'])
    expect(golden.monthBasis).toBe('MONTH_JIAN')
    expect(golden.rows).toHaveLength(12)
    expect(THU_TU_AUTHORITY_ID).toBe(golden.authorityId)
    expect(THU_TU_MONTH_BASIS).toBe(golden.monthBasis)

    for (let monthJianBranch = 0; monthJianBranch < 12; monthJianBranch++) {
      expect(getThuTuDayBranchByMonthJian(monthJianBranch)).toBe(expectedTarget(monthJianBranch))
    }
  })

  it('has exactly one matching day branch in every Month Jian row', () => {
    for (let monthJianBranch = 0; monthJianBranch < 12; monthJianBranch++) {
      const matches = Array.from({ length: 12 }, (_, dayBranch) =>
        isThuTuByMonthJian(monthJianBranch, dayBranch),
      )
      expect(matches.filter(Boolean), BRANCHES[monthJianBranch]).toHaveLength(1)
      expect(matches[expectedTarget(monthJianBranch)]).toBe(true)
    }
  })

  it('switches authority row exactly at every 2026 Jie: T-1ms old, T/T+1ms new', () => {
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

      const beforeResult = getThuTuAtInstant(before, TZ)
      const exactResult = getThuTuAtInstant(exact, TZ)
      const afterResult = getThuTuAtInstant(after, TZ)
      expect(beforeResult.monthJianBranch, `${term.name} T-1ms`).toBe(oldMonth)
      expect(beforeResult.targetDayBranch).toBe(expectedTarget(oldMonth))
      expect(exactResult.monthJianBranch, `${term.name} T`).toBe(newMonth)
      expect(exactResult.targetDayBranch).toBe(expectedTarget(newMonth))
      expect(afterResult.monthJianBranch, `${term.name} T+1ms`).toBe(newMonth)
      expect(afterResult.targetDayBranch).toBe(expectedTarget(newMonth))
      expect(afterResult.dayBranch, `${term.name} day operand stable`).toBe(exactResult.dayBranch)
    }
  })
})
