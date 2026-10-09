import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/day-gods-golden-v1.json'
import { getDayGodByMonthJian, TWELVE_GODS } from './auspicious'

function authority(month: number, day: number) {
  const row = golden.monthJianRows.find((x) => x.monthJianBranch === month)!
  const god = golden.gods[(day - row.qingLongStartBranch + 12) % 12]!
  return { name: god.name, isHoangDao: god.isHoangDao }
}

function evaluate(mutant: (month: number, day: number) => { name: string; isHoangDao: boolean }) {
  let killed = 0
  for (let month = 0; month < 12; month++)
    for (let day = 0; day < 12; day++)
      if (JSON.stringify(mutant(month, day)) !== JSON.stringify(authority(month, day))) killed++
  return killed
}

describe('day-gods authority migration gate', () => {
  it('current production matches all 144 independent authority cells', () => {
    for (let month = 0; month < 12; month++)
      for (let day = 0; day < 12; day++)
        expect(getDayGodByMonthJian(month, day), `${month}/${day}`).toEqual(authority(month, day))
  })

  it('kills representative operand/table mutants', () => {
    const godAt = (index: number) => {
      const g = TWELVE_GODS[((index % 12) + 12) % 12]!
      return { name: g.name, isHoangDao: g.good }
    }
    const mutants = {
      'lunar-month-style row shift': (month: number, day: number) =>
        godAt(day - ((month % 6) * 2)),
      'Month Jian +1': (month: number, day: number) =>
        getDayGodByMonthJian((month + 1) % 12, day),
      'day branch +1': (month: number, day: number) =>
        getDayGodByMonthJian(month, (day + 1) % 12),
      'Qing Long start +2': (month: number, day: number) => {
        const row = golden.monthJianRows.find((x) => x.monthJianBranch === month)!
        return godAt(day - ((row.qingLongStartBranch + 2) % 12))
      },
      'good/bad flipped': (month: number, day: number) => {
        const a = authority(month, day)
        return { name: a.name, isHoangDao: !a.isHoangDao }
      },
    }
    for (const [name, mutant] of Object.entries(mutants))
      expect(evaluate(mutant), `${name} must be killed`).toBeGreaterThan(0)
  })
})
