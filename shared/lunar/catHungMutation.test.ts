import { describe, expect, it } from 'vitest'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { getSourceLockedCatHungStars } from './catHungStars'

const LOCKED = ['Thiên Đức', 'Thiên Đức Hợp', 'Nguyệt Đức', 'Nguyệt Đức Hợp', 'Nguyệt Phá', 'Kiếp Sát'] as const

function names(result: ReturnType<typeof getSourceLockedCatHungStars>) {
  return new Set([...result.good, ...result.bad].map((star) => star.name))
}

function expectedNames(monthJian: number, can: number, chi: number) {
  const row = getCatHungAuthorityByMonthJian(monthJian)
  const stems = '甲乙丙丁戊己庚辛壬癸'
  const branches = '子丑寅卯辰巳午未申酉戌亥'
  const stem = stems[can]!
  const branch = branches[chi]!
  const result = new Set<string>()
  if (row.tianDe === stem || row.tianDe === branch) result.add('Thiên Đức')
  if (row.tianDeHe && (row.tianDeHe === stem || row.tianDeHe === branch)) result.add('Thiên Đức Hợp')
  if (row.yueDe === stem) result.add('Nguyệt Đức')
  if (row.yueDeHe === stem) result.add('Nguyệt Đức Hợp')
  if (row.yuePo === branch) result.add('Nguyệt Phá')
  if (row.jieSha === branch) result.add('Kiếp Sát')
  return result
}

describe('cat-hung Phase 4D mutation gate', () => {
  it('kills Month Jian +1 / -1 row shifts across the full operand matrix', () => {
    let plusOneKilled = false
    let minusOneKilled = false
    for (let month = 0; month < 12; month++) {
      for (let can = 0; can < 10; can++) {
        for (let chi = 0; chi < 12; chi++) {
          const canonical = names(getSourceLockedCatHungStars(month, can, chi))
          const plusOne = names(getSourceLockedCatHungStars((month + 1) % 12, can, chi))
          const minusOne = names(getSourceLockedCatHungStars((month + 11) % 12, can, chi))
          if ([...LOCKED].some((star) => canonical.has(star) !== plusOne.has(star))) plusOneKilled = true
          if ([...LOCKED].some((star) => canonical.has(star) !== minusOne.has(star))) minusOneKilled = true
        }
      }
    }
    expect(plusOneKilled).toBe(true)
    expect(minusOneKilled).toBe(true)
  })

  it('kills day stem +1 and day branch +1 mutations', () => {
    let stemKilled = false
    let branchKilled = false
    for (let month = 0; month < 12; month++) {
      for (let can = 0; can < 10; can++) {
        for (let chi = 0; chi < 12; chi++) {
          const canonical = names(getSourceLockedCatHungStars(month, can, chi))
          const stemMutant = names(getSourceLockedCatHungStars(month, (can + 1) % 10, chi))
          const branchMutant = names(getSourceLockedCatHungStars(month, can, (chi + 1) % 12))
          if ([...LOCKED].some((star) => canonical.has(star) !== stemMutant.has(star))) stemKilled = true
          if ([...LOCKED].some((star) => canonical.has(star) !== branchMutant.has(star))) branchKilled = true
        }
      }
    }
    expect(stemKilled).toBe(true)
    expect(branchKilled).toBe(true)
  })

  it('matches the independent authority matrix for all 1,440 Month Jian/day operands', () => {
    for (let month = 0; month < 12; month++) {
      for (let can = 0; can < 10; can++) {
        for (let chi = 0; chi < 12; chi++) {
          expect(names(getSourceLockedCatHungStars(month, can, chi))).toEqual(expectedNames(month, can, chi))
        }
      }
    }
  })

  it('kills accidental normalization of raw Tian De trigram/direction tokens', () => {
    // 卯/午/酉/子 Jian carry 坤/乾/艮/巽. Until an independent normalization source is admitted,
    // no day stem or branch may cause Thiên Đức to appear in these four rows.
    for (const month of [3, 6, 9, 0]) {
      for (let can = 0; can < 10; can++) {
        for (let chi = 0; chi < 12; chi++) {
          expect(names(getSourceLockedCatHungStars(month, can, chi)).has('Thiên Đức')).toBe(false)
        }
      }
    }
  })
})
