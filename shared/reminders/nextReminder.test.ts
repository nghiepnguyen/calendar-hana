import { describe, expect, it } from 'vitest'
import { lunarToSolar } from '../lunar/lunar'
import type { CalendarEvent } from '../types'
import { nextReminderBatch, reminderFireAt, upcomingReminders } from './nextReminder'

// 10:00 sáng Thứ Tư 23/9/2026 giờ Việt Nam.
const NOW = new Date('2026-09-23T03:00:00Z')

function event(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    title: 'Sự kiện',
    calendarType: 'solar',
    date: '2026-09-23',
    allDay: true,
    categoryId: 'other',
    reminders: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

const iso = (date: Date | undefined) => date?.toISOString()

describe('reminderFireAt', () => {
  it('sự kiện có giờ: trừ offset khỏi giờ bắt đầu', () => {
    const fire = reminderFireAt(
      { allDay: false, startTime: '09:00' },
      '2026-09-28',
      { offsetMinutes: 15 },
      '08:00',
    )
    expect(iso(fire)).toBe('2026-09-28T01:45:00.000Z')
  })

  it('sự kiện cả ngày: mốc là giờ nhắc mặc định', () => {
    const fire = reminderFireAt({ allDay: true }, '2026-09-28', { offsetMinutes: 24 * 60 }, '08:00')
    expect(iso(fire)).toBe('2026-09-27T01:00:00.000Z')
  })
})

describe('nextReminderBatch', () => {
  it('giỗ âm lịch lặp hằng năm nhắc trước 1 ngày lúc 8:00', () => {
    const giỗ = event({
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      recurrence: { freq: 'yearly', calendar: 'lunar' },
      reminders: [{ offsetMinutes: 24 * 60, channel: 'notification' }],
    })
    const next = nextReminderBatch(giỗ, NOW, '08:00')
    // Năm 2026 đã qua (28/4), lần kế tiếp là 12/3 âm năm 2027.
    expect(lunarToSolar(12, 3, 2027, false)).toEqual({ day: 18, month: 4, year: 2027 })
    expect(next?.instances).toHaveLength(1)
    expect(next?.instances[0].date).toBe('2027-04-18')
    expect(iso(next?.fireAt)).toBe('2027-04-17T01:00:00.000Z')
  })

  it('sự kiện hằng tuần nhắc trước 15 phút', () => {
    const gym = event({
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1] },
      reminders: [{ offsetMinutes: 15, channel: 'notification' }],
    })
    const next = nextReminderBatch(gym, NOW, '08:00')
    expect(next?.instances[0].occurrenceKey).toBe('2026-09-28')
    expect(iso(next?.fireAt)).toBe('2026-09-28T01:45:00.000Z')
  })

  it('bỏ qua lần đã bị xóa trong exceptions', () => {
    const gym = event({
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1] },
      exceptions: { '2026-09-28': 'deleted' },
      reminders: [{ offsetMinutes: 15, channel: 'notification' }],
    })
    expect(iso(nextReminderBatch(gym, NOW, '08:00')?.fireAt)).toBe('2026-10-05T01:45:00.000Z')
  })

  it('lần bị dời ngày dùng ngày mới, lần sửa riêng dùng nhắc hẹn riêng', () => {
    const e = event({
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1] },
      exceptions: {
        '2026-10-05': { date: '2026-09-24' },
        '2026-09-28': { reminders: [{ offsetMinutes: 60, channel: 'email' }] },
      },
      reminders: [{ offsetMinutes: 15, channel: 'notification' }],
    })
    const first = nextReminderBatch(e, NOW, '08:00')!
    expect(first.instances[0].occurrenceKey).toBe('2026-10-05')
    expect(iso(first.fireAt)).toBe('2026-09-24T01:45:00.000Z')
    const second = nextReminderBatch(e, first.fireAt, '08:00')!
    expect(second.instances[0].reminder).toEqual({ offsetMinutes: 60, channel: 'email' })
    expect(iso(second.fireAt)).toBe('2026-09-28T01:00:00.000Z')
  })

  it('gom các nhắc hẹn cùng thời điểm vào một nhóm', () => {
    const e = event({
      date: '2026-09-24',
      reminders: [
        { offsetMinutes: 0, channel: 'notification' },
        { offsetMinutes: 0, channel: 'email' },
        { offsetMinutes: 24 * 60, channel: 'notification' },
      ],
    })
    const first = nextReminderBatch(e, NOW, '08:00')!
    expect(iso(first.fireAt)).toBe('2026-09-24T01:00:00.000Z')
    expect(first.instances.map((i) => i.reminder.channel)).toEqual(['notification', 'email'])
  })

  it('trả về null khi đã qua mọi lần nhắc', () => {
    const e = event({
      date: '2026-09-20',
      recurrence: { freq: 'daily', calendar: 'solar', count: 3 },
      reminders: [{ offsetMinutes: 0, channel: 'notification' }],
    })
    expect(nextReminderBatch(e, NOW, '08:00')).toBeNull()
    expect(nextReminderBatch(event({}), NOW, '08:00')).toBeNull()
  })
})

describe('upcomingReminders', () => {
  it('lấy mọi nhắc hẹn trong khoảng thời gian, theo thứ tự', () => {
    const daily = event({
      date: '2026-09-01',
      allDay: false,
      startTime: '10:30',
      recurrence: { freq: 'daily', calendar: 'solar' },
      reminders: [
        { offsetMinutes: 5, channel: 'notification' },
        { offsetMinutes: 60, channel: 'notification' },
      ],
    })
    const until = new Date(NOW.getTime() + 24 * 3600_000)
    const result = upcomingReminders(daily, NOW, until, '08:00')
    expect(result.map((r) => iso(r.fireAt))).toEqual([
      '2026-09-23T03:25:00.000Z',
      '2026-09-24T02:30:00.000Z',
    ])
  })
})
