import { describe, expect, it } from 'vitest'
import { viewedDayTenGod } from './transit'

const chart = (...dayStems: number[]) => ({
  status: dayStems.length > 1 ? ('ambiguous' as const) : ('ready' as const),
  candidates: dayStems.map((can) => ({ pillars: { day: { can, chi: 0 } } })),
})

describe('viewedDayTenGod', () => {
  it('names the viewed day stem relative to the Day Master (PRD 8.1)', () => {
    // Nhật Nguyên Đinh (3), ngày Canh (6): Đinh khắc Canh, khác âm dương → Chính Tài.
    expect(viewedDayTenGod(chart(3), 6)).toEqual({
      status: 'ready',
      dayMaster: 'Đinh',
      viewedStem: 'Canh',
      tenGod: 'Chính Tài',
    })
  })

  it('stays ready when every candidate shares the Day Master', () => {
    expect(viewedDayTenGod(chart(3, 3), 6)).toMatchObject({ status: 'ready', tenGod: 'Chính Tài' })
  })

  it('is ambiguous when candidates have different Day Masters (PRD 8.4)', () => {
    expect(viewedDayTenGod(chart(3, 4), 6)).toEqual({ status: 'ambiguous', viewedStem: 'Canh' })
  })

  it('needs a complete chart', () => {
    expect(viewedDayTenGod({ status: 'insufficientData' }, 6)).toEqual({
      status: 'insufficientData',
    })
  })
})
