import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/thu-tu-golden-v1.json'
import { getThuTuDayBranchByMonthJian, isThuTuByMonthJian } from './thuTuAuthority'

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

function branchIndex(value: string) {
  const index = BRANCHES.indexOf(value as (typeof BRANCHES)[number])
  if (index < 0) throw new Error(`Unknown branch ${value}`)
  return index
}

const expectedByMonthJian = new Map(
  golden.rows.map((row) => [branchIndex(row.monthJian), branchIndex(row.dayBranch)] as const),
)

function countMismatches(mutant: (monthJian: number, dayBranch: number) => boolean) {
  let mismatches = 0
  for (let monthJian = 0; monthJian < 12; monthJian++) {
    const expectedTarget = expectedByMonthJian.get(monthJian)!
    for (let dayBranch = 0; dayBranch < 12; dayBranch++) {
      if (mutant(monthJian, dayBranch) !== (dayBranch === expectedTarget)) mismatches++
    }
  }
  return mismatches
}

describe('Thụ Tử mutation gate', () => {
  it('production matches the independent 12x12 Golden matrix', () => {
    expect(countMismatches(isThuTuByMonthJian)).toBe(0)
  })

  it('kills Month Jian row shift +1', () => {
    const mutant = (monthJian: number, dayBranch: number) =>
      dayBranch === getThuTuDayBranchByMonthJian((monthJian + 1) % 12)
    expect(countMismatches(mutant)).toBeGreaterThan(0)
  })

  it('kills Month Jian row shift -1', () => {
    const mutant = (monthJian: number, dayBranch: number) =>
      dayBranch === getThuTuDayBranchByMonthJian((monthJian + 11) % 12)
    expect(countMismatches(mutant)).toBeGreaterThan(0)
  })

  it('kills day branch +1', () => {
    const mutant = (monthJian: number, dayBranch: number) =>
      (dayBranch + 1) % 12 === getThuTuDayBranchByMonthJian(monthJian)
    expect(countMismatches(mutant)).toBeGreaterThan(0)
  })

  it('kills a rotated target row', () => {
    const mutant = (monthJian: number, dayBranch: number) =>
      dayBranch === (getThuTuDayBranchByMonthJian(monthJian) + 1) % 12
    expect(countMismatches(mutant)).toBeGreaterThan(0)
  })
})
