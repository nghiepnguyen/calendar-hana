import { describe, expect, it } from 'vitest'
import { solarStringToJd } from './julian'
import { getMansion } from './mansions'

describe('getMansion', () => {
  it('25/9/2026 là sao Ngưu (Kim, Trâu, xấu)', () => {
    expect(getMansion(solarStringToJd('2026-09-25'))).toMatchObject({
      name: 'Ngưu',
      luminary: 'Kim',
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
  ])('%s là sao %s (theo dated witnesses)', (date, name) => {
    expect(getMansion(solarStringToJd(date)).name).toBe(name)
  })

  it('28 ngày liên tiếp đi qua đủ 28 sao và giữ canonical 七曜', () => {
    const start = solarStringToJd('2026-01-01')
    const names = new Set<string>()
    const luminaries = new Set<string>()
    for (let i = 0; i < 28; i++) {
      const m = getMansion(start + i)
      names.add(m.name)
      luminaries.add(m.luminary)
      expect(['Nhật', 'Nguyệt', 'Hỏa', 'Thủy', 'Mộc', 'Kim', 'Thổ']).toContain(m.luminary)
      // Compatibility field for existing UI/consumers.
      expect(['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']).toContain(m.element)
    }
    expect(names.size).toBe(28)
    expect(luminaries).toEqual(new Set(['Nhật', 'Nguyệt', 'Hỏa', 'Thủy', 'Mộc', 'Kim', 'Thổ']))
    expect(getMansion(start).name).toBe(getMansion(start + 28).name)
  })

  it('preserves Nhật/Nguyệt instead of losing them in the compatibility element field', () => {
    const start = solarStringToJd('2026-01-01')
    const rows = Array.from({ length: 28 }, (_, i) => getMansion(start + i))
    expect(rows.filter((m) => m.luminary === 'Nhật')).toHaveLength(4)
    expect(rows.filter((m) => m.luminary === 'Nguyệt')).toHaveLength(4)
    expect(rows.filter((m) => m.luminary === 'Nhật').every((m) => m.element === 'Hỏa')).toBe(true)
    expect(rows.filter((m) => m.luminary === 'Nguyệt').every((m) => m.element === 'Thủy')).toBe(true)
  })

  it('uses source-faithful animal labels for Đê and Liễu', () => {
    const start = solarStringToJd('2026-01-01')
    const rows = Array.from({ length: 28 }, (_, i) => getMansion(start + i))
    const de = rows.find((m) => m.name === 'Đê')
    const lieu = rows.find((m) => m.name === 'Liễu')
    expect(de?.animal).toBe('Lạc (貉)')
    expect(lieu?.animal).toBe('Chương (獐)')
  })
})
