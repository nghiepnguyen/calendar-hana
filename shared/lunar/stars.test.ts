import { describe, expect, it } from 'vitest'
import { getStars, starApplies, type StarContext, type StarDefinition } from './stars'
import { STARS } from './stars.data'

const ctx = (over: Partial<StarContext> = {}): StarContext => ({
  lunarMonth: 8,
  lunarDay: 15,
  can: 8,
  chi: 2,
  canChi: 38,
  officer: 5,
  mansion: 8,
  ...over,
})

describe('starApplies', () => {
  const byMonthChi = { byMonth: [null, { chi: [2] }] }

  it('quy tắc theo tháng chỉ áp dụng cho đúng tháng', () => {
    expect(starApplies(byMonthChi, ctx({ lunarMonth: 2, chi: 2 }))).toBe(true)
    expect(starApplies(byMonthChi, ctx({ lunarMonth: 2, chi: 3 }))).toBe(false)
    expect(starApplies(byMonthChi, ctx({ lunarMonth: 1, chi: 2 }))).toBe(false)
  })

  it('quy tắc always không phụ thuộc tháng', () => {
    expect(starApplies({ always: { can: [8] } }, ctx({ lunarMonth: 3 }))).toBe(true)
  })
})

describe('getStars', () => {
  it('tách sao tốt và sao xấu, giữ thứ tự bảng', () => {
    const table: StarDefinition[] = [
      { name: 'B', isGood: false, meaning: '', rule: { always: { chi: [2] } } },
      { name: 'A', isGood: true, meaning: '', rule: { always: { chi: [2] } } },
      { name: 'C', isGood: true, meaning: '', rule: { always: { chi: [3] } } },
    ]
    const r = getStars(ctx(), table)
    expect(r.good.map((s) => s.name)).toEqual(['A'])
    expect(r.bad.map((s) => s.name)).toEqual(['B'])
  })

  it('bảng dữ liệu: tên không trùng, byMonth đủ 12 tháng, có ý nghĩa', () => {
    expect(new Set(STARS.map((s) => s.name)).size).toBe(STARS.length)
    for (const s of STARS) {
      if (s.rule.byMonth) expect(s.rule.byMonth, s.name).toHaveLength(12)
      expect(s.meaning, s.name).not.toBe('')
    }
  })

  it('Thiên Xá chỉ rơi vào đúng Can Chi theo mùa (mùa Thu: Mậu Thân)', () => {
    const thienXa = STARS.find((s) => s.name === 'Thiên Xá')!
    // Mậu Thân = 44, Mậu Tý = 24.
    expect(starApplies(thienXa.rule, ctx({ lunarMonth: 8, canChi: 44 }))).toBe(true)
    expect(starApplies(thienXa.rule, ctx({ lunarMonth: 8, canChi: 24 }))).toBe(false)
  })
})
