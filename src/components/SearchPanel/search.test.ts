import { describe, expect, it } from 'vitest'
import { makeEvent } from '../../test/fixtures'
import { normalizeText, searchEvents } from './search'

describe('search', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(normalizeText('Giỗ ông nội Đà Nẵng')).toBe('gio ong noi da nang')
  })

  const events = [
    makeEvent({
      id: 'gio',
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2020, isLeap: false },
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    }),
    makeEvent({ id: 'kham', title: 'Khám răng', date: '2026-10-01', note: 'Nha khoa gần nhà' }),
    makeEvent({ id: 'cu', title: 'Họp cũ', date: '2025-01-01' }),
  ]

  it('tìm không phân biệt dấu, theo tiêu đề và ghi chú', () => {
    expect(searchEvents(events, 'gio', '2026-09-23').map((r) => r.event.id)).toEqual(['gio'])
    expect(searchEvents(events, 'nha khoa', '2026-09-23').map((r) => r.event.id)).toEqual(['kham'])
    expect(searchEvents(events, '   ', '2026-09-23')).toEqual([])
  })

  it('trả ngày lần tới, sự kiện đã qua xếp sau', () => {
    const results = searchEvents(events, 'o', '2026-09-23')
    expect(results.map((r) => [r.event.id, r.date, r.isPast])).toEqual([
      ['kham', '2026-10-01', false],
      ['gio', '2027-04-18', false],
      ['cu', '2025-01-01', true],
    ])
  })
})
