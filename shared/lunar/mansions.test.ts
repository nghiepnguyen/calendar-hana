import { describe, expect, it } from 'vitest'
import { solarStringToJd } from './julian'
import { getMansion } from './mansions'

describe('getMansion', () => {
  it('25/9/2026 là sao Ngưu (Kim, Trâu, xấu)', () => {
    expect(getMansion(solarStringToJd('2026-09-25'))).toMatchObject({
      name: 'Ngưu',
      element: 'Kim',
      animal: 'Ngưu (Trâu)',
      isGood: false,
    })
  })

  it.each([
    ['2025-01-01', 'Sâm'],
    ['2025-01-09', 'Giác'],
    ['2025-01-12', 'Phòng'],
    ['2026-09-26', 'Nữ'],
  ])('%s là sao %s (theo licham.vn)', (date, name) => {
    expect(getMansion(solarStringToJd(date)).name).toBe(name)
  })

  it('28 ngày liên tiếp đi qua đủ 28 sao, sao Nhật/Nguyệt quy về Hỏa/Thủy', () => {
    const start = solarStringToJd('2026-01-01')
    const names = new Set<string>()
    for (let i = 0; i < 28; i++) {
      const m = getMansion(start + i)
      names.add(m.name)
      expect(['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']).toContain(m.element)
    }
    expect(names.size).toBe(28)
    expect(getMansion(start).name).toBe(getMansion(start + 28).name)
  })
})
