import { describe, expect, it } from 'vitest'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { CalendarEvent } from '@shared/types'
import { layoutTimedEvents } from './layout'

function occ(id: string, startTime: string, endTime?: string): Occurrence {
  const event: CalendarEvent = {
    id,
    title: id,
    calendarType: 'solar',
    date: '2026-09-23',
    allDay: false,
    startTime,
    endTime,
    categoryId: 'work',
    reminders: [],
    createdAt: '',
    updatedAt: '',
  }
  return {
    eventId: id,
    occurrenceKey: '2026-09-23',
    date: '2026-09-23',
    index: 0,
    event,
    isRecurring: false,
    isException: false,
  }
}

function summary(items: ReturnType<typeof layoutTimedEvents>) {
  return Object.fromEntries(items.map((i) => [i.occurrence.eventId, [i.column, i.columns]]))
}

describe('layoutTimedEvents', () => {
  it('sự kiện không trùng giờ chiếm cả cột', () => {
    const result = layoutTimedEvents([occ('a', '09:00', '10:00'), occ('b', '10:00', '11:00')])
    expect(summary(result)).toEqual({ a: [0, 1], b: [0, 1] })
  })

  it('sự kiện trùng giờ chia cột', () => {
    const result = layoutTimedEvents([
      occ('a', '09:00', '11:00'),
      occ('b', '09:30', '10:00'),
      occ('c', '10:00', '10:30'),
      occ('d', '13:00', '14:00'),
    ])
    // b và c dùng chung cột 1 vì không trùng nhau.
    expect(summary(result)).toEqual({ a: [0, 2], b: [1, 2], c: [1, 2], d: [0, 1] })
  })

  it('không có giờ kết thúc thì mặc định 1 tiếng, sự kiện ngắn có chiều cao tối thiểu', () => {
    const [noEnd] = layoutTimedEvents([occ('a', '09:00')])
    expect(noEnd.endMinutes - noEnd.startMinutes).toBe(60)
    const [short] = layoutTimedEvents([occ('b', '09:00', '09:05')])
    expect(short.endMinutes - short.startMinutes).toBe(25)
  })
})
