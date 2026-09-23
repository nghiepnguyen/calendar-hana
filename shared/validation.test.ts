import { describe, expect, it } from 'vitest'
import { validateEvent } from './validation'

const valid = {
  title: 'Họp team',
  calendarType: 'solar' as const,
  date: '2026-09-21',
  allDay: false,
  startTime: '09:00',
  endTime: '10:00',
  categoryId: 'work',
  reminders: [],
}

describe('validateEvent', () => {
  it('sự kiện hợp lệ không có lỗi', () => {
    expect(validateEvent(valid)).toEqual({})
  })

  it('tiêu đề bắt buộc và tối đa 200 ký tự', () => {
    expect(validateEvent({ ...valid, title: '  ' }).title).toBe('Vui lòng nhập tiêu đề.')
    expect(validateEvent({ ...valid, title: 'a'.repeat(201) }).title).toMatch(/200/)
    expect(validateEvent({ ...valid, title: 'a'.repeat(200) }).title).toBeUndefined()
  })

  it('ghi chú tối đa 2000 ký tự', () => {
    expect(validateEvent({ ...valid, note: 'a'.repeat(2001) }).note).toMatch(/2000/)
  })

  it('giờ kết thúc phải sau giờ bắt đầu', () => {
    expect(validateEvent({ ...valid, endTime: '09:00' }).time).toBe(
      'Giờ kết thúc phải sau giờ bắt đầu.',
    )
    expect(validateEvent({ ...valid, startTime: undefined }).time).toMatch(/bắt đầu/)
    expect(validateEvent({ ...valid, allDay: true, startTime: undefined }).time).toBeUndefined()
  })

  it('ngày âm phải tồn tại', () => {
    const lunar = { ...valid, calendarType: 'lunar' as const }
    expect(
      validateEvent({ ...lunar, date: { day: 12, month: 3, year: 2026, isLeap: false } }),
    ).toEqual({})
    expect(
      validateEvent({ ...lunar, date: { day: 1, month: 4, year: 2026, isLeap: true } }).date,
    ).toMatch(/nhuận/)
    expect(validateEvent({ ...lunar, date: '2026-09-21' }).date).toBeDefined()
  })

  it('ngày dương phải hợp lệ', () => {
    expect(validateEvent({ ...valid, date: '2026-02-30' }).date).toBeDefined()
  })

  it('quy tắc lặp', () => {
    expect(
      validateEvent({ ...valid, recurrence: { freq: 'weekly', calendar: 'lunar' } }).recurrence,
    ).toMatch(/Âm lịch/)
    expect(
      validateEvent({ ...valid, recurrence: { freq: 'daily', calendar: 'solar', count: 0 } })
        .recurrence,
    ).toMatch(/Số lần/)
    expect(
      validateEvent({
        ...valid,
        recurrence: { freq: 'daily', calendar: 'solar', until: '2026-09-01' },
      }).recurrence,
    ).toMatch(/sau ngày bắt đầu/)
  })

  it('tối đa 5 nhắc hẹn', () => {
    const reminders = Array.from({ length: 6 }, () => ({
      offsetMinutes: 10,
      channel: 'notification' as const,
    }))
    expect(validateEvent({ ...valid, reminders }).reminders).toMatch(/5/)
  })
})
