import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/day-gods-golden-v1.json'
import { TWELVE_GODS, getDayGodByMonthJian, getDayGodAtInstant } from './auspicious'
import { getSolarMonth, solarTermsForYear } from './solarTerms'

const TZ = 'Asia/Ho_Chi_Minh'

function expected(monthJianBranch: number, dayBranch: number) {
  const row = golden.monthJianRows.find((x) => x.monthJianBranch === monthJianBranch)
  if (!row) throw new Error(`Missing Golden Month Jian row ${monthJianBranch}`)
  const god = golden.gods[(dayBranch - row.qingLongStartBranch + 12) % 12]!
  return { name: god.name, isHoangDao: god.isHoangDao }
}

describe('day-gods-authority-v1', () => {
  it('locks authority metadata and canonical 12-god order', () => {
    expect(golden.authorityId).toBe('day-gods-authority-v1')
    expect(golden.monthOperand).toBe('MONTH_JIAN_BRANCH')
    expect(golden.dayOperand).toBe('DAY_BRANCH')
    expect(golden.monthJianRows).toHaveLength(12)
    expect(golden.gods).toHaveLength(12)
    expect(TWELVE_GODS.map(({ name, good }) => ({ name, isHoangDao: good }))).toEqual(golden.gods)
  })

  it('matches all 12 Month Jian × 12 day branches = 144 authority cells', () => {
    let cells = 0
    for (const row of golden.monthJianRows) {
      for (let dayBranch = 0; dayBranch < 12; dayBranch++) {
        expect(
          getDayGodByMonthJian(row.monthJianBranch, dayBranch),
          `${row.monthJian}/${golden.branchOrder[dayBranch]}`,
        ).toEqual(expected(row.monthJianBranch, dayBranch))
        cells++
      }
    }
    expect(cells).toBe(144)
  })

  it('switches exactly at every 2026 Jie boundary: T-1ms old, T and T+1ms new', () => {
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

      const beforeGod = getDayGodAtInstant(before, TZ)
      const exactGod = getDayGodAtInstant(exact, TZ)
      const afterGod = getDayGodAtInstant(after, TZ)
      expect(beforeGod, `${term.name} T-1ms`).toEqual(expected(oldMonth, beforeGod.dayBranch))
      expect(exactGod, `${term.name} T`).toEqual(expected(newMonth, exactGod.dayBranch))
      expect(afterGod, `${term.name} T+1ms`).toEqual(expected(newMonth, afterGod.dayBranch))
      expect(afterGod.dayBranch, `${term.name} day operand stable across 1ms`).toBe(exactGod.dayBranch)
    }
  })
})
