import { describe, expect, it } from 'vitest'
import type { SolarDateString } from '../types'
import { getAlmanac } from './almanac'
import { ALMANAC_FIXTURES } from './almanac.fixtures'
import { addDays } from './julian'

// Ba sao licham.vn tính sai, không có trong fixture (xem stars.data.ts).
const SKIP = new Set(['Thiên Xá', 'Âm Thác', 'Dương Thác'])
const names = (stars: { name: string }[]) => stars.map((s) => s.name).filter((n) => !SKIP.has(n))

describe('getAlmanac', () => {
  it('ngày mẫu 25/9/2026', () => {
    const a = getAlmanac('2026-09-25')
    expect(a.solarTerm.name).toBe('Thu phân')
    expect(a.napAm.name).toBe('Kim Bạch Kim')
    expect(a.dayCanChi.name).toBe('Nhâm Dần')
    expect(a.relation.text).toBe('Can sinh Chi (Thủy sinh Mộc), là ngày cát (bảo nhật).')
    expect(a.mansion).toMatchObject({ name: 'Ngưu', element: 'Kim', isGood: false })
    expect(a.officer.name).toBe('Chấp')
    expect(a.directions).toEqual({ hyThan: 'Nam', taiThan: 'Tây' })
    expect(a.dayClashes).toEqual(['Canh Thân', 'Bính Thân', 'Bính Dần'])
    expect(a.monthCanChi.name).toBe('Đinh Dậu')
    expect(a.monthClashes).toEqual(['Ất Mão', 'Quý Mão', 'Quý Tỵ', 'Quý Hợi'])
    expect(names(a.stars.good)).toEqual(['Thiên Đức', 'Giải Thần', 'Thanh Long Hoàng Đạo'])
    expect(names(a.stars.bad)).toEqual(['Kiếp Sát', 'Hoàng Sa'])
    expect(a.hours).toHaveLength(12)
    expect(a.hours.filter((h) => h.isGood).map((h) => h.name)).toEqual([
      'Tý',
      'Sửu',
      'Thìn',
      'Tỵ',
      'Mùi',
      'Tuất',
    ])
  })

  it.each(ALMANAC_FIXTURES)('khớp licham.vn ngày $date', (f) => {
    const a = getAlmanac(f.date as SolarDateString)
    expect(a.dayCanChi.name).toBe(f.dayCanChi)
    expect(a.mansion.name).toBe(f.mansion)
    expect(a.officer.name).toBe(f.officer)
    expect(a.directions).toEqual({ hyThan: f.hyThan, taiThan: f.taiThan })
    expect(a.dayClashes).toEqual(f.dayClashes)
    expect(names(a.stars.good).sort()).toEqual([...f.good].sort())
    expect(names(a.stars.bad).sort()).toEqual([...f.bad].sort())
  })

  it('cache: gọi lại cùng ngày trả về cùng object', () => {
    expect(getAlmanac('2026-01-15')).toBe(getAlmanac('2026-01-15'))
  })

  it('chạy được ở hai đầu khoảng hỗ trợ (1900 và 2100)', () => {
    expect(getAlmanac('1900-01-31').hours).toHaveLength(12)
    expect(getAlmanac('2100-12-31').mansion.name).toBeTruthy()
  })

  it('đủ nhanh: dưới 5ms mỗi ngày khi chưa có cache', () => {
    const start = performance.now()
    let date: SolarDateString = '2031-01-01'
    for (let i = 0; i < 365; i++) {
      getAlmanac(date)
      date = addDays(date, 1)
    }
    expect((performance.now() - start) / 365).toBeLessThan(5)
  })
})
