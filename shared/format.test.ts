import { describe, expect, it } from 'vitest'
import {
  formatAccessibleDate,
  formatLunar,
  formatLunarShort,
  formatLunarWithYear,
  formatMonthTitle,
  formatRelativeDay,
  formatReminderMessage,
  formatSolar,
  formatSolarShort,
  formatTime,
} from './format'

describe('format ngày âm', () => {
  it('ngày thường và tháng nhuận', () => {
    expect(formatLunarShort({ day: 12, month: 3, isLeap: false })).toBe('12/3')
    expect(formatLunarShort({ day: 10, month: 4, isLeap: true })).toBe('10/4 nhuận')
    expect(formatLunar({ day: 12, month: 3, isLeap: false })).toBe('12/3 âm lịch')
    expect(formatLunarWithYear({ day: 12, month: 3, year: 2026, isLeap: false })).toBe(
      '12/3 năm Bính Ngọ (âm lịch)',
    )
  })
})

describe('format ngày dương', () => {
  it('có thứ tiếng Việt', () => {
    expect(formatSolarShort('2026-09-23')).toBe('23/9/2026')
    expect(formatSolar('2026-09-23')).toBe('Thứ Tư, 23/9/2026')
    expect(formatSolar('2026-09-27')).toBe('Chủ nhật, 27/9/2026')
  })

  it('nhãn cho trình đọc màn hình', () => {
    expect(formatAccessibleDate('2026-09-23')).toBe(
      'Thứ Tư, 23 tháng 9 năm 2026, ngày 13 tháng 8 âm lịch',
    )
  })

  it('giờ', () => {
    expect(formatTime('09:00')).toBe('9:00')
    expect(formatTime('14:30')).toBe('14:30')
  })
})

describe('formatMonthTitle', () => {
  it('tháng dương nằm trong một năm âm', () => {
    expect(formatMonthTitle(9, 2026)).toBe('Tháng 9/2026. Tháng 7-8 âm lịch, năm Bính Ngọ')
  })

  it('tháng dương vắt qua hai năm âm', () => {
    expect(formatMonthTitle(2, 2026)).toBe(
      'Tháng 2/2026. Tháng 12 năm Ất Tỵ - tháng 1 năm Bính Ngọ âm lịch',
    )
  })

  it('có tháng nhuận', () => {
    // 2025 nhuận tháng 6, bắt đầu 25/7/2025.
    expect(formatMonthTitle(8, 2025)).toBe('Tháng 8/2025. Tháng 6 nhuận-7 âm lịch, năm Ất Tỵ')
  })
})

describe('formatReminderMessage', () => {
  it('sự kiện cả ngày hôm nay', () => {
    expect(
      formatReminderMessage({ title: 'Giỗ ông nội', allDay: true }, '2026-04-28', '2026-04-28'),
    ).toEqual({ title: 'Giỗ ông nội', body: 'Hôm nay, 12/3 âm lịch' })
  })

  it('sự kiện có giờ ngày mai, có địa điểm', () => {
    expect(
      formatReminderMessage(
        { title: 'Họp', allDay: false, startTime: '09:00', location: 'Phòng 2' },
        '2026-09-24',
        '2026-09-23',
      ).body,
    ).toBe('Ngày mai lúc 9:00, 14/8 âm lịch\nPhòng 2')
  })

  it('ngày xa ghi thứ và ngày dương', () => {
    expect(formatRelativeDay('2026-09-26', '2026-09-23')).toBe('Thứ Bảy 26/9/2026')
  })
})
