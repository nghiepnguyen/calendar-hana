import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freezeNow, makeEvent } from '../../test/fixtures'
import {
  changeStartTime,
  draftFromDefaults,
  draftFromEvent,
  draftSolarDate,
  draftToInput,
  setAllDay,
  switchCalendar,
} from './draft'

beforeEach(() => freezeNow('2026-09-23T03:20:00Z')) // 10:20 giờ Việt Nam
afterEach(() => vi.useRealTimers())

describe('draft sự kiện', () => {
  it('mặc định: giờ tròn kế tiếp nếu là hôm nay, 9:00 nếu ngày khác', () => {
    expect(draftFromDefaults({ date: '2026-09-23' })).toMatchObject({
      startTime: '11:00',
      endTime: '12:00',
      allDay: false,
      categoryId: 'personal',
      calendarType: 'solar',
    })
    expect(draftFromDefaults({ date: '2026-09-30' }).startTime).toBe('09:00')
    expect(draftFromDefaults({ date: '2026-09-30', startTime: '14:30' }).endTime).toBe('15:30')
  })

  it('đổi Dương → Âm giữ đúng ngày và bỏ kiểu lặp không hỗ trợ', () => {
    const solar = { ...draftFromDefaults({ date: '2026-04-28' }), repeat: 'weekly' as const }
    const lunar = switchCalendar(solar, 'lunar')
    expect(lunar.lunarDate).toEqual({ day: 12, month: 3, year: 2026, isLeap: false })
    expect(lunar.repeat).toBe('none')
    expect(draftSolarDate(lunar)).toBe('2026-04-28')
    const back = switchCalendar({ ...lunar, lunarDate: { ...lunar.lunarDate, day: 15 } }, 'solar')
    expect(back.solarDate).toBe('2026-05-01')
  })

  it('đổi giờ bắt đầu thì giờ kết thúc dời theo', () => {
    const draft = { ...draftFromDefaults({ date: '2026-09-30' }), endTime: '10:30' }
    expect(changeStartTime(draft, '14:00')).toMatchObject({ startTime: '14:00', endTime: '15:30' })
    expect(changeStartTime(draft, '23:30').endTime).toBe('23:59')
  })

  it('tạo dữ liệu lưu cho giỗ âm lặp hằng năm', () => {
    const draft = {
      ...setAllDay(switchCalendar(draftFromDefaults({ date: '2026-04-28' }), 'lunar'), true),
      title: '  Giỗ ông nội ',
      repeat: 'yearly' as const,
      categoryId: 'memorial',
    }
    expect(draftToInput(draft)).toEqual({
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      allDay: true,
      categoryId: 'memorial',
      reminders: [{ offsetMinutes: 0, channel: 'notification' }],
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    })
  })

  it('đọc lại sự kiện có sẵn (đi 2 chiều không mất dữ liệu)', () => {
    const event = makeEvent({
      title: 'Họp team',
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      categoryId: 'work',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1], count: 8 },
      location: 'Phòng họp A',
    })
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = event
    expect(draftToInput(draftFromEvent(event))).toEqual(rest)
  })

  it('sửa riêng một lần: điền ngày của lần đó', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 15, month: 1, year: 2026, isLeap: false },
      recurrence: { freq: 'monthly', calendar: 'lunar' },
    })
    const draft = draftFromEvent(event, '2026-09-25')
    expect(draft.solarDate).toBe('2026-09-25')
    expect(draft.lunarDate).toEqual({ day: 15, month: 8, year: 2026, isLeap: false })
  })
})

describe('nhắc hẹn mặc định', () => {
  it('sự kiện mới có sẵn một thông báo: trước 15 phút, cả ngày thì trong ngày', () => {
    expect(draftFromDefaults({ date: '2026-09-23' }).reminders).toEqual([
      { offsetMinutes: 15, channel: 'notification' },
    ])
    expect(draftFromDefaults({ date: '2026-09-23', allDay: true }).reminders).toEqual([
      { offsetMinutes: 0, channel: 'notification' },
    ])
  })

  it('bật/tắt cả ngày đổi nhắc hẹn mặc định theo, giữ nhắc hẹn đã chỉnh', () => {
    const draft = draftFromDefaults({ date: '2026-09-23' })
    const allDay = setAllDay(draft, true)
    expect(allDay.reminders).toEqual([{ offsetMinutes: 0, channel: 'notification' }])
    expect(setAllDay(allDay, false).reminders).toEqual(draft.reminders)

    const custom = { ...draft, reminders: [{ offsetMinutes: 60, channel: 'email' as const }] }
    expect(setAllDay(custom, true).reminders).toEqual(custom.reminders)
    expect(setAllDay({ ...draft, reminders: [] }, true).reminders).toEqual([])
  })
})

describe('ngày dương đang gõ dở', () => {
  it('đổi sang âm lịch khi năm chưa gõ xong thì giữ ngày âm cũ', () => {
    const draft = draftFromDefaults({ date: '2026-04-28' })
    for (const solarDate of ['0001-04-28', '']) {
      expect(switchCalendar({ ...draft, solarDate }, 'lunar').lunarDate).toEqual(draft.lunarDate)
    }
  })
})
