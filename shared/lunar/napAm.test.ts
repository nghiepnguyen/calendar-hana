import { describe, expect, it } from 'vitest'
import { getNapAm, NAP_AM, sexagenaryIndex } from './napAm'

describe('getNapAm', () => {
  it('Giáp Tý là Hải Trung Kim, Nhâm Dần là Kim Bạch Kim, Tân Hợi là Thoa Xuyến Kim', () => {
    expect(getNapAm({ can: 0, chi: 0 })).toEqual({ name: 'Hải Trung Kim', element: 'Kim' })
    expect(getNapAm({ can: 8, chi: 2 }).name).toBe('Kim Bạch Kim')
    expect(getNapAm({ can: 7, chi: 11 }).name).toBe('Thoa Xuyến Kim')
    expect(getNapAm({ can: 9, chi: 11 }).name).toBe('Đại Hải Thủy')
  })

  it('đủ 60 Hoa Giáp, mỗi nạp âm dùng cho đúng 2 Can Chi liền nhau', () => {
    const seen = new Map<string, number>()
    for (let i = 0; i < 60; i++) {
      const canChi = { can: i % 10, chi: i % 12 }
      expect(sexagenaryIndex(canChi)).toBe(i)
      const { name } = getNapAm(canChi)
      seen.set(name, (seen.get(name) ?? 0) + 1)
    }
    expect(seen.size).toBe(NAP_AM.length)
    expect([...seen.values()].every((n) => n === 2)).toBe(true)
  })
})
