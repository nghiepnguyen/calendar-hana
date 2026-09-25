import { describe, expect, it } from 'vitest'
import { expandOccurrences } from '@shared/recurrence/recurrence'
import type { Category } from '@shared/types'
import { makeEvent } from '../../test/fixtures'
import type { InteropContext } from './common'
import { exportIcs, parseIcs } from './ics'

const categories: Category[] = [
  { id: 'work', name: 'Công việc', color: '#2563eb', order: 0, updatedAt: '' },
  { id: 'other', name: 'Khác', color: '#475569', order: 9, isSystem: true, updatedAt: '' },
]
const ctx: InteropContext = { categories, allDayReminderTime: '08:00' }
const exportAll = (events: ReturnType<typeof makeEvent>[]) =>
  exportIcs(
    { events, categories, allDayTime: '08:00' },
    '2026-09-25',
    new Date('2026-09-25T00:00:00Z'),
  )

/** Dòng đã mở gập (bỏ CRLF + dấu cách đầu dòng nối tiếp). */
const unfolded = (ics: string) => ics.replace(/\r\n /g, '').split('\r\n')

describe('exportIcs', () => {
  it('có VCALENDAR, VTIMEZONE giờ Việt Nam, dòng kết thúc CRLF và gập ở 75 byte', () => {
    const ics = exportAll([
      makeEvent({
        title: 'Họp team '.repeat(12),
        allDay: false,
        startTime: '09:00',
        endTime: '10:30',
      }),
    ])
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics).toContain('TZID:Asia/Ho_Chi_Minh')
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
    const lines = unfolded(ics)
    expect(lines).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20260923T090000')
    expect(lines).toContain('DTEND;TZID=Asia/Ho_Chi_Minh:20260923T103000')
  })

  it('sự kiện cả ngày dùng VALUE=DATE, DTEND là ngày hôm sau; thoát ký tự đặc biệt', () => {
    const lines = unfolded(
      exportAll([
        makeEvent({
          title: 'Sinh nhật; mẹ, bố',
          note: 'Dòng 1\nDòng 2',
          location: 'Nhà',
          categoryId: 'work',
          reminders: [{ offsetMinutes: 1440, channel: 'notification' }],
        }),
      ]),
    )
    expect(lines).toContain('DTSTART;VALUE=DATE:20260923')
    expect(lines).toContain('DTEND;VALUE=DATE:20260924')
    expect(lines).toContain('SUMMARY:Sinh nhật\\; mẹ\\, bố')
    expect(lines).toContain('DESCRIPTION:Dòng 1\\nDòng 2')
    expect(lines).toContain('CATEGORIES:Công việc')
    // Nhắc trước 1 ngày lúc 8:00 = 16 giờ trước 0h ngày diễn ra.
    expect(lines).toContain('TRIGGER:-PT960M')
  })

  it('lặp dương lịch: RRULE, EXDATE và VEVENT RECURRENCE-ID cho lần sửa riêng', () => {
    const lines = unfolded(
      exportAll([
        makeEvent({
          id: 'e1',
          title: 'Họp',
          date: '2026-09-21',
          allDay: false,
          startTime: '09:00',
          endTime: '10:00',
          recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1, 3], until: '2026-12-31' },
          exceptions: {
            '2026-09-23': 'deleted',
            '2026-09-28': {
              title: 'Họp dời',
              date: '2026-09-29',
              startTime: '14:00',
              endTime: '15:00',
            },
          },
        }),
      ]),
    )
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261231T165959Z')
    expect(lines).toContain('EXDATE;TZID=Asia/Ho_Chi_Minh:20260923T090000')
    expect(lines).toContain('RECURRENCE-ID;TZID=Asia/Ho_Chi_Minh:20260928T090000')
    expect(lines).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20260929T140000')
    expect(lines.filter((l) => l === 'UID:e1@lich-hana')).toHaveLength(2)
  })

  it('lặp âm lịch được trải ra từng lần tới 10 năm sau', () => {
    const lines = unfolded(
      exportAll([
        makeEvent({
          id: 'gio',
          title: 'Giỗ ông',
          calendarType: 'lunar',
          date: { day: 12, month: 3, year: 2024, isLeap: false },
          recurrence: { freq: 'yearly', calendar: 'lunar' },
        }),
      ]),
    )
    expect(lines.some((l) => l.startsWith('RRULE'))).toBe(false)
    // 2024 → 2036: 13 lần.
    expect(lines.filter((l) => l.startsWith('UID:gio-'))).toHaveLength(13)
    // 12/3 âm 2026 = 28/4/2026.
    expect(lines).toContain('DTSTART;VALUE=DATE:20260428')
  })
})

describe('parseIcs', () => {
  // Rút gọn từ file Google Calendar xuất ra.
  const google = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'DTSTART:20260922T020000Z',
    'DTEND:20260922T030000Z',
    'RRULE:FREQ=WEEKLY;WKST=MO;UNTIL=20261231T165959Z;BYDAY=TU',
    'EXDATE;TZID=Asia/Ho_Chi_Minh:20260929T090000',
    'DTSTAMP:20260925T000000Z',
    'UID:abc123@google.com',
    'CREATED:20260901T000000Z',
    'LAST-MODIFIED:20260910T000000Z',
    'LOCATION:Phòng họp\\, tầng 3',
    'SUMMARY:Họp tuần',
    'CATEGORIES:công việc',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P0DT0H10M0S',
    'END:VALARM',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;TZID=Asia/Ho_Chi_Minh:20261006T150000',
    'DTEND;TZID=Asia/Ho_Chi_Minh:20261006T160000',
    'RECURRENCE-ID;TZID=Asia/Ho_Chi_Minh:20261006T090000',
    'UID:abc123@google.com',
    'SUMMARY:Họp tuần (dời chiều)',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20261001',
    'DTEND;VALUE=DATE:20261004',
    'UID:trip@google.com',
    'SUMMARY:Du lịch Đà Lạt',
    'DESCRIPTION:Dòng 1\\nDòng 2 rất dài được',
    '  gập dòng',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;TZID=America/New_York:20260925T200000',
    'DTEND;TZID=America/New_York:20260925T210000',
    'UID:ny@google.com',
    'SUMMARY:Gọi cho bạn ở New York',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20260901',
    'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU',
    'UID:biweekly@google.com',
    'SUMMARY:Cách tuần',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20260901',
    'UID:cancelled@google.com',
    'STATUS:CANCELLED',
    'SUMMARY:Đã huỷ',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const parsed = parseIcs(google, ctx)
  const byTitle = (title: string) => parsed.events.find((e) => e.title === title)!

  it('đổi giờ UTC và múi khác về giờ Việt Nam', () => {
    const weekly = byTitle('Họp tuần')
    expect(weekly).toMatchObject({ date: '2026-09-22', startTime: '09:00', endTime: '10:00' })
    // 20h New York (UTC-4) ngày 25/9 = 7h sáng 26/9 giờ Việt Nam.
    expect(byTitle('Gọi cho bạn ở New York')).toMatchObject({
      date: '2026-09-26',
      startTime: '07:00',
      endTime: '08:00',
    })
  })

  it('RRULE, EXDATE, lần sửa riêng, danh mục theo tên và nhắc trước', () => {
    const weekly = byTitle('Họp tuần')
    expect(weekly.recurrence).toEqual({
      freq: 'weekly',
      calendar: 'solar',
      byWeekday: [2],
      until: '2026-12-31',
    })
    expect(weekly.location).toBe('Phòng họp, tầng 3')
    expect(weekly.categoryId).toBe('work')
    expect(weekly.reminders).toEqual([{ offsetMinutes: 10, channel: 'notification' }])
    expect(weekly.updatedAt).toBe('2026-09-10T00:00:00.000Z')
    expect(weekly.exceptions?.['2026-09-29']).toBe('deleted')
    expect(weekly.exceptions?.['2026-10-06']).toMatchObject({
      title: 'Họp tuần (dời chiều)',
      startTime: '15:00',
      endTime: '16:00',
    })
    const dates = expandOccurrences(weekly, '2026-09-20', '2026-10-10').map((o) => o.date)
    expect(dates).toEqual(['2026-09-22', '2026-10-06'])
  })

  it('cả ngày nhiều ngày thành lặp hằng ngày; mở gập dòng', () => {
    const trip = byTitle('Du lịch Đà Lạt')
    expect(trip).toMatchObject({ allDay: true, date: '2026-10-01' })
    expect(trip.recurrence).toEqual({ freq: 'daily', calendar: 'solar', count: 3 })
    expect(trip.note).toBe('Dòng 1\nDòng 2 rất dài được gập dòng')
  })

  it('quy tắc không hỗ trợ thì chỉ nhập lần đầu, bỏ sự kiện đã huỷ', () => {
    expect(byTitle('Cách tuần').recurrence).toBeUndefined()
    expect(parsed.simplified).toBe(1)
    expect(parsed.events.some((e) => e.title === 'Đã huỷ')).toBe(false)
    expect(parsed.events).toHaveLength(4)
  })

  it('id cố định theo UID: đọc lại cùng file ra cùng id', () => {
    expect(parseIcs(google, ctx).events.map((e) => e.id)).toEqual(parsed.events.map((e) => e.id))
  })

  it('xuất rồi nhập lại giữ được sự kiện lặp, ngoại lệ và nhắc', () => {
    const original = makeEvent({
      id: 'e1',
      title: 'Tập thể dục',
      date: '2026-09-21',
      allDay: false,
      startTime: '06:00',
      endTime: '07:00',
      categoryId: 'work',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1, 3, 5], count: 10 },
      exceptions: { '2026-09-23': 'deleted' },
      reminders: [{ offsetMinutes: 30, channel: 'notification' }],
    })
    const allDay = makeEvent({
      title: 'Đóng tiền nhà',
      date: '2026-01-31',
      recurrence: { freq: 'monthly', calendar: 'solar' },
      reminders: [{ offsetMinutes: 1440, channel: 'notification' }],
    })
    const back = parseIcs(exportAll([original, allDay]), ctx).events
    expect(back[0]).toMatchObject({
      title: 'Tập thể dục',
      date: '2026-09-21',
      startTime: '06:00',
      endTime: '07:00',
      categoryId: 'work',
      recurrence: original.recurrence,
      exceptions: original.exceptions,
      reminders: original.reminders,
    })
    expect(back[1]).toMatchObject({
      recurrence: { freq: 'monthly', calendar: 'solar' },
      reminders: allDay.reminders,
    })
  })

  it('không phải iCalendar thì báo lỗi', () => {
    expect(() => parseIcs('hello', ctx)).toThrow(/iCalendar/)
  })
})
