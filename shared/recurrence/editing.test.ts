import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../types'
import { describeRecurrence } from './describe'
import { applyOccurrenceOverride, buildOverride, deleteOccurrence, splitAt } from './editing'
import { expandOccurrences } from './recurrence'

const weekly: CalendarEvent = {
  id: 'meeting',
  title: 'Họp team',
  calendarType: 'solar',
  date: '2026-09-21',
  allDay: false,
  startTime: '09:00',
  endTime: '10:00',
  categoryId: 'work',
  recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [1] },
  reminders: [],
  createdAt: '',
  updatedAt: '',
}

function occurrence(event: CalendarEvent, date: string) {
  const found = expandOccurrences(event, date, date)[0]
  if (!found) throw new Error(`Không có lần nào ngày ${date}`)
  return found
}

function dates(event: CalendarEvent, from = '2026-09-01', to = '2026-10-31') {
  return expandOccurrences(event, from, to).map((o) => o.date)
}

describe('deleteOccurrence', () => {
  it('chỉ lần này: thêm exception deleted', () => {
    const result = deleteOccurrence(weekly, occurrence(weekly, '2026-09-28'), 'single')
    expect(result.action).toBe('update')
    if (result.action !== 'update') return
    expect(dates(result.event, '2026-09-21', '2026-10-05')).toEqual(['2026-09-21', '2026-10-05'])
  })

  it('lần này và các lần sau: dừng lặp trước lần này', () => {
    const result = deleteOccurrence(weekly, occurrence(weekly, '2026-10-05'), 'following')
    if (result.action !== 'update') throw new Error('cần update')
    expect(result.event.recurrence?.until).toBe('2026-10-04')
    expect(dates(result.event)).toEqual(['2026-09-21', '2026-09-28'])
  })

  it('lần này và các lần sau ở lần đầu tiên, hoặc tất cả: xóa hẳn', () => {
    expect(deleteOccurrence(weekly, occurrence(weekly, '2026-09-21'), 'following')).toEqual({
      action: 'delete',
    })
    expect(deleteOccurrence(weekly, occurrence(weekly, '2026-10-05'), 'all')).toEqual({
      action: 'delete',
    })
  })

  it('sự kiện có số lần: giữ đúng số lần trước điểm cắt', () => {
    const counted = { ...weekly, recurrence: { ...weekly.recurrence!, count: 5 } }
    const result = deleteOccurrence(counted, occurrence(counted, '2026-10-05'), 'following')
    if (result.action !== 'update') throw new Error('cần update')
    expect(result.event.recurrence).toMatchObject({ count: 2 })
    expect(result.event.recurrence?.until).toBeUndefined()
  })
})

describe('splitAt', () => {
  it('tách thành 2 sự kiện nối tiếp, không trùng lần nào', () => {
    const withException: CalendarEvent = {
      ...weekly,
      exceptions: { '2026-09-28': 'deleted', '2026-10-12': { title: 'Họp online' } },
    }
    const { before, after } = splitAt(withException, occurrence(withException, '2026-10-05'))
    expect(before && dates(before)).toEqual(['2026-09-21'])
    expect(before?.exceptions).toEqual({ '2026-09-28': 'deleted' })
    expect(after.date).toBe('2026-10-05')
    expect(after.exceptions).toEqual({ '2026-10-12': { title: 'Họp online' } })
    expect(dates(after)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'])
  })

  it('sự kiện âm lịch: phần mới bắt đầu từ ngày âm của lần này', () => {
    const gio: CalendarEvent = {
      ...weekly,
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      allDay: true,
      recurrence: { freq: 'yearly', calendar: 'lunar', count: 10 },
    }
    const second = expandOccurrences(gio, '2027-01-01', '2027-12-31')[0]
    const { before, after } = splitAt(gio, second)
    expect(before?.recurrence?.count).toBe(1)
    expect(after.date).toEqual({ day: 12, month: 3, year: 2027, isLeap: false })
    expect(after.recurrence?.count).toBe(9)
  })

  it('lần đầu tiên thì không cần tách', () => {
    const { before, after } = splitAt(weekly, occurrence(weekly, '2026-09-21'))
    expect(before).toBeNull()
    expect(after).toBe(weekly)
  })
})

describe('buildOverride / applyOccurrenceOverride', () => {
  it('chỉ giữ trường thay đổi, ghi nhận dời ngày', () => {
    const override = buildOverride(
      weekly,
      { ...weekly, title: 'Họp online', startTime: '14:00', endTime: '15:00' },
      '2026-10-05',
      '2026-10-06',
    )
    expect(override).toEqual({
      title: 'Họp online',
      startTime: '14:00',
      endTime: '15:00',
      date: '2026-10-06',
    })
    const updated = applyOccurrenceOverride(weekly, '2026-10-05', override)
    expect(dates(updated, '2026-10-01', '2026-10-10')).toEqual(['2026-10-06'])
  })

  it('không đổi gì thì xóa exception cũ', () => {
    const edited = applyOccurrenceOverride(weekly, '2026-10-05', { title: 'X' })
    const reverted = applyOccurrenceOverride(
      edited,
      '2026-10-05',
      buildOverride(weekly, weekly, '2026-10-05', '2026-10-05'),
    )
    expect(reverted.exceptions).toBeUndefined()
  })
})

describe('describeRecurrence', () => {
  it('mô tả các kiểu lặp', () => {
    expect(describeRecurrence({ date: '2026-09-21' })).toBe('Không lặp')
    expect(describeRecurrence(weekly)).toBe('Lặp hằng tuần vào Thứ Hai')
    expect(
      describeRecurrence({
        date: '2026-09-21',
        recurrence: { freq: 'weekly', calendar: 'solar', byWeekday: [0, 3, 1] },
      }),
    ).toBe('Lặp hằng tuần vào Thứ Hai, Thứ Tư, Chủ nhật')
    expect(
      describeRecurrence({
        date: '2026-01-31',
        recurrence: { freq: 'monthly', calendar: 'solar', count: 6 },
      }),
    ).toBe('Lặp hằng tháng vào ngày 31, 6 lần')
    expect(
      describeRecurrence({
        date: { day: 12, month: 3, year: 2026, isLeap: false },
        recurrence: { freq: 'yearly', calendar: 'lunar' },
      }),
    ).toBe('Lặp hằng năm vào ngày 12/3 âm lịch')
    expect(
      describeRecurrence({
        date: { day: 15, month: 1, year: 2026, isLeap: false },
        recurrence: { freq: 'monthly', calendar: 'lunar', until: '2026-12-31' },
      }),
    ).toBe('Lặp hằng tháng vào ngày 15 âm lịch, đến hết 31/12/2026')
  })
})
