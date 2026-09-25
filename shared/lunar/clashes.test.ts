import { describe, expect, it } from 'vitest'
import { CAN, CHI } from './canChi'
import { getDayClashes, getMonthClashes } from './clashes'
import { CLASHES } from './clashes.data'

describe('tuổi xung', () => {
  it('ngày Nhâm Dần xung Canh Thân, Bính Thân, Bính Dần', () => {
    expect(getDayClashes({ can: 8, chi: 2 })).toEqual(['Canh Thân', 'Bính Thân', 'Bính Dần'])
  })

  it('tháng Đinh Dậu dùng cùng bảng', () => {
    expect(getMonthClashes({ can: 3, chi: 9 })).toEqual(getDayClashes({ can: 3, chi: 9 }))
  })

  it('đủ 60 dòng, mỗi tuổi là một Can Chi hợp lệ', () => {
    expect(CLASHES).toHaveLength(60)
    const valid = new Set(CAN.flatMap((c) => CHI.map((h) => `${c} ${h}`)))
    for (const row of CLASHES) {
      expect(row.length).toBeGreaterThan(0)
      for (const name of row) expect(valid.has(name), name).toBe(true)
    }
  })
})
