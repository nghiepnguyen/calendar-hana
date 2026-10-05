import { describe, expect, it } from 'vitest'
import { getDayInfo } from './index'

describe('getDayInfo', () => {
  it('gom đủ thông tin của ngày 23/9/2026', () => {
    const info = getDayInfo('2026-09-23')
    expect(info.weekday).toBe(3)
    expect(info.lunar).toEqual({ day: 13, month: 8, year: 2026, isLeap: false })
    expect(info.canChi.year.name).toBe('Bính Ngọ')
    expect(info.canChi.month.name).toBe('Đinh Dậu')
    expect(info.auspiciousHours).toHaveLength(6)
    expect(info.solarTerm).toMatchObject({ name: 'Thu phân', startsToday: true })
    expect(info.badDays.map((d) => d.name)).toEqual(['Tam Nương'])
    expect(info.holidays).toEqual([])
  })

  it('trả cùng object khi gọi lại (có cache)', () => {
    expect(getDayInfo('2026-02-17')).toBe(getDayInfo('2026-02-17'))
    expect(getDayInfo('2026-02-17').holidays.map((h) => h.name)).toEqual(['Tết Nguyên Đán'])
  })

  it('báo lỗi với ngày không hợp lệ', () => {
    expect(() => getDayInfo('2026-02-30')).toThrow()
    expect(() => getDayInfo('23/9/2026')).toThrow()
  })
})

it('changes lunar year at Tet rather than Lập xuân', () => {
  expect(getDayInfo('2024-02-09').canChi.year.name).toBe('Quý Mão')
  expect(getDayInfo('2024-02-10').canChi.year.name).toBe('Giáp Thìn')
})
it('keeps lunar month can chi the same for its leap month', () => {
  const normal = getDayInfo('2023-02-20')
  const leap = getDayInfo('2023-03-22')
  expect(normal.lunar).toMatchObject({ month: 2, isLeap: false })
  expect(leap.lunar).toMatchObject({ month: 2, isLeap: true })
  expect(leap.canChi.month).toEqual(normal.canChi.month)
})
