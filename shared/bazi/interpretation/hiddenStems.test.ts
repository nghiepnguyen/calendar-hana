import { describe, expect, it } from 'vitest'
import fixture from '../../../tasks/fixtures/bazi-interpretation.v1.json'
import { CAN, CHI } from '../../lunar/canChi'
import { hiddenStemsOf } from './hiddenStems'

describe('hiddenStemsOf', () => {
  it('matches the fixture order (main → middle → residual) for all 12 branches', () => {
    for (const row of fixture.hiddenStems) {
      const chi = CHI.indexOf(row.branch as (typeof CHI)[number])
      expect(hiddenStemsOf(chi, 0).map((h) => h.name)).toEqual(row.expected)
    }
    expect(fixture.hiddenStems).toHaveLength(12)
  })

  it('has 28 hidden stems in total and ranks them by position', () => {
    const all = CHI.flatMap((_, chi) => hiddenStemsOf(chi, 0))
    expect(all).toHaveLength(28)
    expect(hiddenStemsOf(CHI.indexOf('Dần'), 0).map((h) => h.rank)).toEqual([
      'main',
      'middle',
      'residual',
    ])
    expect(hiddenStemsOf(CHI.indexOf('Ngọ'), 0).map((h) => h.rank)).toEqual(['main', 'middle'])
  })

  it('labels each hidden stem with its Ten God relative to the Day Master', () => {
    // Nhật Nguyên Đinh, Chi Ngọ: Đinh là Tỷ Kiên, Kỷ là Thực Thần.
    expect(hiddenStemsOf(CHI.indexOf('Ngọ'), CAN.indexOf('Đinh'))).toEqual([
      { can: 3, name: 'Đinh', rank: 'main', tenGod: 'Tỷ Kiên' },
      { can: 5, name: 'Kỷ', rank: 'middle', tenGod: 'Thực Thần' },
    ])
  })

  it('rejects branches outside 0–11', () => {
    expect(() => hiddenStemsOf(12, 0)).toThrow(RangeError)
  })
})
