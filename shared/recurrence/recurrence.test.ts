import { describe, expect, it } from 'vitest'
import { toSolarDateString } from '../lunar/julian'
import { getLunarMonthLength, lunarToSolar } from '../lunar/lunar'
import type { CalendarEvent } from '../types'
import {
  compareOccurrences,
  expandOccurrences,
  findNextOccurrence,
  getEventStartDate,
  iterateOccurrences,
} from './recurrence'

function makeEvent(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    title: 'Sự kiện',
    calendarType: 'solar',
    date: '2026-09-23',
    allDay: true,
    categoryId: 'personal',
    reminders: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

function dates(event: CalendarEvent, from: string, to: string): string[] {
  return expandOccurrences(event, from, to).map((o) => o.date)
}

function solar(day: number, month: number, year: number, isLeap = false): string {
  const result = lunarToSolar(day, month, year, isLeap)
  if (!result) throw new Error('ngày âm không tồn tại')
  return toSolarDateString(result)
}

describe('sự kiện không lặp', () => {
  it('dương lịch: chỉ một lần', () => {
    const event = makeEvent({ date: '2026-09-23' })
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual(['2026-09-23'])
    expect(dates(event, '2026-09-24', '2026-12-31')).toEqual([])
  })

  it('âm lịch: đổi sang ngày dương', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
    })
    expect(getEventStartDate(event)).toBe('2026-04-28')
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual(['2026-04-28'])
  })
})

describe('lặp theo dương lịch', () => {
  it('hằng ngày', () => {
    const event = makeEvent({
      date: '2026-09-28',
      recurrence: { freq: 'daily', calendar: 'solar' },
    })
    expect(dates(event, '2026-09-27', '2026-10-01')).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ])
  })

  it('hằng tuần vào thứ Hai (họp team)', () => {
    const event = makeEvent({
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1] },
    })
    expect(dates(event, '2026-09-01', '2026-10-31')).toEqual([
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
  })

  it('hằng tuần nhiều thứ, mặc định là thứ của ngày bắt đầu', () => {
    const multi = makeEvent({
      date: '2026-09-21',
      recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1, 3, 5] },
    })
    expect(dates(multi, '2026-09-21', '2026-09-27')).toEqual([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
    ])
    const single = makeEvent({
      date: '2026-09-23',
      recurrence: { freq: 'weekly', calendar: 'solar' },
    })
    expect(dates(single, '2026-09-01', '2026-10-10')).toEqual([
      '2026-09-23',
      '2026-09-30',
      '2026-10-07',
    ])
  })

  it('hằng tháng vào ngày 31: bỏ qua tháng không có ngày 31', () => {
    const event = makeEvent({
      date: '2026-01-31',
      recurrence: { freq: 'monthly', calendar: 'solar' },
    })
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
      '2026-07-31',
      '2026-08-31',
      '2026-10-31',
      '2026-12-31',
    ])
  })

  it('hằng năm vào 29/2: chỉ năm nhuận', () => {
    const event = makeEvent({
      date: '2024-02-29',
      recurrence: { freq: 'yearly', calendar: 'solar' },
    })
    expect(dates(event, '2024-01-01', '2033-12-31')).toEqual([
      '2024-02-29',
      '2028-02-29',
      '2032-02-29',
    ])
  })
})

describe('lặp theo âm lịch', () => {
  it('giỗ 12/3 âm lặp hằng năm 2026–2030', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    })
    expect(dates(event, '2026-01-01', '2030-12-31')).toEqual([
      '2026-04-28',
      solar(12, 3, 2027),
      solar(12, 3, 2028),
      solar(12, 3, 2029),
      solar(12, 3, 2030),
    ])
  })

  it('rằm hằng tháng năm 2025 có cả rằm tháng 6 nhuận (13 lần)', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 15, month: 1, year: 2025, isLeap: false },
      recurrence: { freq: 'monthly', calendar: 'lunar' },
    })
    const result = dates(event, solar(1, 1, 2025), solar(29, 12, 2025))
    expect(result).toHaveLength(13)
    expect(result).toContain(solar(15, 6, 2025, true))
    expect(result[0]).toBe(solar(15, 1, 2025))
  })

  it('mùng 1 hằng tháng âm', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 1, month: 8, year: 2026, isLeap: false },
      recurrence: { freq: 'monthly', calendar: 'lunar' },
    })
    expect(dates(event, '2026-09-01', '2026-12-31')).toEqual([
      solar(1, 8, 2026),
      solar(1, 9, 2026),
      solar(1, 10, 2026),
      solar(1, 11, 2026),
    ])
  })

  it('ngày 30 âm rơi vào ngày 29 ở tháng thiếu', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 30, month: 1, year: 2026, isLeap: false },
      recurrence: { freq: 'monthly', calendar: 'lunar' },
    })
    // Tìm một tháng thiếu trong năm 2026 để kiểm tra.
    const shortMonth = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
      (m) => getLunarMonthLength(m, 2026) === 29,
    )!
    const all = dates(event, '2026-01-01', '2027-03-01')
    expect(all).toContain(solar(29, shortMonth, 2026))
    // Mỗi tháng âm có đúng một lần.
    expect(all).toHaveLength(12)
  })

  it('tạo từ tháng nhuận: các năm sau dùng tháng thường', () => {
    // 2020 nhuận tháng 4.
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 10, month: 4, year: 2020, isLeap: true },
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    })
    expect(dates(event, '2020-01-01', '2022-12-31')).toEqual([
      solar(10, 4, 2020, true),
      solar(10, 4, 2021),
      solar(10, 4, 2022),
    ])
  })

  it('lặp hằng năm từ tháng thường không tạo thêm ở tháng nhuận', () => {
    const event = makeEvent({
      calendarType: 'lunar',
      date: { day: 10, month: 4, year: 2019, isLeap: false },
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    })
    expect(dates(event, '2020-01-01', '2020-12-31')).toEqual([solar(10, 4, 2020)])
  })

  it('sự kiện dương lịch nhưng lặp theo âm lịch lấy ngày âm của ngày bắt đầu', () => {
    const event = makeEvent({
      date: '2026-04-28',
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    })
    expect(dates(event, '2027-01-01', '2027-12-31')).toEqual([solar(12, 3, 2027)])
  })
})

describe('điều kiện kết thúc', () => {
  it('sau N lần', () => {
    const event = makeEvent({
      date: '2026-09-23',
      recurrence: { freq: 'daily', calendar: 'solar', count: 3 },
    })
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual([
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
    ])
  })

  it('đến một ngày (tính cả ngày đó)', () => {
    const event = makeEvent({
      date: '2026-09-23',
      recurrence: { freq: 'weekly', calendar: 'solar', until: '2026-10-07' },
    })
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual([
      '2026-09-23',
      '2026-09-30',
      '2026-10-07',
    ])
  })

  it('lần bị xóa vẫn tính vào số lần', () => {
    const event = makeEvent({
      date: '2026-09-23',
      recurrence: { freq: 'daily', calendar: 'solar', count: 3 },
      exceptions: { '2026-09-24': 'deleted' },
    })
    expect(dates(event, '2026-01-01', '2026-12-31')).toEqual(['2026-09-23', '2026-09-25'])
  })
})

describe('ngoại lệ từng lần', () => {
  const base = makeEvent({
    date: '2026-09-21',
    title: 'Họp team',
    recurrence: { freq: 'weekly', calendar: 'solar' },
  })

  it('bỏ lần đã xóa và ghi đè lần đã sửa', () => {
    const event: CalendarEvent = {
      ...base,
      exceptions: {
        '2026-09-28': 'deleted',
        '2026-10-05': { title: 'Họp team (online)' },
      },
    }
    const result = expandOccurrences(event, '2026-09-21', '2026-10-12')
    expect(result.map((o) => o.date)).toEqual(['2026-09-21', '2026-10-05', '2026-10-12'])
    expect(result[1]).toMatchObject({ isException: true, occurrenceKey: '2026-10-05' })
    expect(result[1].event.title).toBe('Họp team (online)')
    expect(result[2].event.title).toBe('Họp team')
  })

  it('lần bị dời ngày hiện ở ngày mới, kể cả khi ngày gốc nằm ngoài khoảng', () => {
    const event: CalendarEvent = {
      ...base,
      exceptions: { '2026-10-12': { date: '2026-10-02' } },
    }
    expect(dates(event, '2026-09-29', '2026-10-04')).toEqual(['2026-10-02'])
    expect(dates(event, '2026-10-10', '2026-10-14')).toEqual([])
  })
})

describe('findNextOccurrence', () => {
  it('tìm lần kế tiếp từ một ngày', () => {
    const event = makeEvent({
      date: '2026-01-31',
      recurrence: { freq: 'monthly', calendar: 'solar' },
    })
    expect(findNextOccurrence(event, '2026-02-01')?.date).toBe('2026-03-31')
    expect(findNextOccurrence(event, '2026-03-31')?.date).toBe('2026-03-31')
  })

  it('trả null khi đã hết lần', () => {
    const event = makeEvent({
      date: '2026-09-23',
      recurrence: { freq: 'daily', calendar: 'solar', count: 2 },
    })
    expect(findNextOccurrence(event, '2026-09-25')).toBeNull()
  })

  it('tính cả lần bị dời lên sớm hơn', () => {
    const event = makeEvent({
      date: '2026-09-21',
      recurrence: { freq: 'weekly', calendar: 'solar' },
      exceptions: { '2026-10-05': { date: '2026-09-29' } },
    })
    expect(findNextOccurrence(event, '2026-09-29')?.occurrenceKey).toBe('2026-10-05')
  })
})

describe('iterateOccurrences', () => {
  it('đánh số thứ tự từ 0 và dừng ở năm 2100', () => {
    const event = makeEvent({
      date: '2099-01-01',
      recurrence: { freq: 'yearly', calendar: 'solar' },
    })
    const all = [...iterateOccurrences(event)]
    expect(all.map((o) => o.index)).toEqual([0, 1])
    expect(all.at(-1)?.date).toBe('2100-01-01')
  })
})

describe('compareOccurrences', () => {
  it('cả ngày trước, rồi theo giờ', () => {
    const allDay = expandOccurrences(makeEvent({ id: 'a', title: 'B' }), '2026-09-23', '2026-09-23')
    const morning = expandOccurrences(
      makeEvent({ id: 'b', allDay: false, startTime: '08:00', title: 'A' }),
      '2026-09-23',
      '2026-09-23',
    )
    const noon = expandOccurrences(
      makeEvent({ id: 'c', allDay: false, startTime: '12:00', title: 'C' }),
      '2026-09-23',
      '2026-09-23',
    )
    const sorted = [...noon, ...morning, ...allDay].sort(compareOccurrences)
    expect(sorted.map((o) => o.eventId)).toEqual(['a', 'b', 'c'])
  })
})
