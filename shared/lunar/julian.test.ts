import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayOfWeek,
  daysInSolarMonth,
  diffDays,
  jdFromDate,
  jdToDate,
  parseSolarDate,
  toSolarDateString,
} from './julian'

describe('julian', () => {
  it('số ngày Julius của 1/1/2000 là 2451545', () => {
    expect(jdFromDate(1, 1, 2000)).toBe(2451545)
    expect(jdToDate(2451545)).toEqual({ day: 1, month: 1, year: 2000 })
  })

  it('cộng trừ ngày qua tháng, qua năm, năm nhuận', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(diffDays('2026-01-01', '2026-12-31')).toBe(364)
  })

  it('thứ trong tuần', () => {
    expect(dayOfWeek('2026-09-23')).toBe(3)
    expect(dayOfWeek('2026-09-27')).toBe(0)
  })

  it('số ngày của tháng', () => {
    expect(daysInSolarMonth(2, 2024)).toBe(29)
    expect(daysInSolarMonth(2, 2100)).toBe(28)
    expect(daysInSolarMonth(2, 2000)).toBe(29)
    expect(daysInSolarMonth(4, 2026)).toBe(30)
  })

  it('parse và format chuỗi ngày', () => {
    expect(parseSolarDate('2026-09-23')).toEqual({ day: 23, month: 9, year: 2026 })
    expect(toSolarDateString({ day: 3, month: 1, year: 2026 })).toBe('2026-01-03')
    expect(() => parseSolarDate('2026-13-01')).toThrow()
    expect(() => parseSolarDate('2026-9-1')).toThrow()
  })
})
