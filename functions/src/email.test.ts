import { describe, expect, it } from 'vitest'
import type { ReminderInstance } from '@shared/reminders/nextReminder'
import type { CalendarEvent } from '@shared/types'
import { renderReminderEmail } from './email'

function instance(partial: Partial<CalendarEvent>, date = '2026-04-28'): ReminderInstance {
  const event: CalendarEvent = {
    id: 'e1',
    title: 'Giỗ ông nội',
    calendarType: 'lunar',
    date: { day: 12, month: 3, year: 2026, isLeap: false },
    allDay: true,
    categoryId: 'memorial',
    reminders: [{ offsetMinutes: 1440, channel: 'email' }],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
  return {
    eventId: event.id,
    occurrenceKey: date,
    date,
    reminder: event.reminders[0],
    fireAt: new Date(),
    event,
  }
}

describe('renderReminderEmail', () => {
  it('gồm tiêu đề, ngày dương, ngày âm, giờ, địa điểm, ghi chú và link', () => {
    const email = renderReminderEmail(
      [instance({ location: 'Nhà thờ họ', note: 'Mua hoa quả\nĐặt mâm cỗ' })],
      'https://calendar-hana.web.app/',
      '2026-04-27',
    )
    expect(email.subject).toBe('Nhắc hẹn: Giỗ ông nội - Ngày mai, 12/3 âm lịch')
    expect(email.text).toContain('Ngày: Thứ Ba, 28/4/2026')
    expect(email.text).toContain('Âm lịch: 12/3 âm lịch')
    expect(email.text).toContain('Giờ: Cả ngày')
    expect(email.text).toContain('Địa điểm: Nhà thờ họ')
    expect(email.text).toContain('Ghi chú: Mua hoa quả\nĐặt mâm cỗ')
    expect(email.text).toContain(
      'https://calendar-hana.web.app/day/2026-04-28?event=e1&occurrence=2026-04-28',
    )
    expect(email.html).toContain('lang="vi"')
  })

  it('escape HTML trong nội dung người dùng nhập', () => {
    const email = renderReminderEmail(
      [
        instance({
          title: '<script>alert(1)</script>',
          allDay: false,
          startTime: '09:00',
          endTime: '10:30',
        }),
      ],
      'https://app.example',
      '2026-04-28',
    )
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.text).toContain('Giờ: 9:00-10:30')
  })
})
