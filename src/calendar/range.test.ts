import { describe, expect, it } from 'vitest'
import {
  addMonths,
  canShift,
  monthGridDays,
  shiftDate,
  startOfWeek,
  viewRange,
  weekDays,
} from './range'

describe('range', () => {
  it('đầu tuần theo Thứ Hai hoặc Chủ nhật', () => {
    // 23/9/2026 là Thứ Tư.
    expect(startOfWeek('2026-09-23', 1)).toBe('2026-09-21')
    expect(startOfWeek('2026-09-23', 0)).toBe('2026-09-20')
    expect(startOfWeek('2026-09-27', 1)).toBe('2026-09-21')
    expect(startOfWeek('2026-09-27', 0)).toBe('2026-09-27')
  })

  it('7 ngày của tuần', () => {
    expect(weekDays('2026-09-23', 1)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })

  it('lưới tháng có 42 ngày và bắt đầu từ đầu tuần chứa ngày 1', () => {
    const days = monthGridDays('2026-09-23', 1)
    expect(days).toHaveLength(42)
    // 1/9/2026 là Thứ Ba.
    expect(days[0]).toBe('2026-08-31')
    expect(days).toContain('2026-09-30')
  })

  it('khoảng tải dữ liệu theo chế độ xem', () => {
    expect(viewRange('day', '2026-09-23', 1)).toMatchObject({
      start: '2026-09-23',
      end: '2026-09-23',
    })
    expect(viewRange('week', '2026-09-23', 1)).toMatchObject({
      start: '2026-09-21',
      end: '2026-09-27',
    })
  })

  it('cộng tháng giữ ngày, kẹp vào cuối tháng', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('trang trước / sau', () => {
    expect(shiftDate('day', '2026-09-23', 1)).toBe('2026-09-24')
    expect(shiftDate('week', '2026-09-23', -1)).toBe('2026-09-16')
    expect(shiftDate('month', '2026-09-23', 1)).toBe('2026-10-23')
  })
})

describe('canShift', () => {
  it('không đi ra ngoài 1900–2100', () => {
    expect(canShift('day', '1900-01-01', -1)).toBe(false)
    expect(canShift('day', '1900-01-01', 1)).toBe(true)
    expect(canShift('day', '2100-12-31', 1)).toBe(false)
    expect(canShift('week', '2100-12-28', 1)).toBe(false)
    expect(canShift('month', '2100-12-15', 1)).toBe(false)
    expect(canShift('month', '1900-01-15', -1)).toBe(false)
  })

  it('ngày bình thường thì đi được cả hai phía', () => {
    expect(canShift('day', '2026-09-28', -1)).toBe(true)
    expect(canShift('month', '2026-09-28', 1)).toBe(true)
  })
})
