import { describe, expect, it } from 'vitest'
import { compareOccurrences } from '@shared/recurrence/recurrence'
import { makeEvent, occurrencesOf } from '../../test/fixtures'
import { groupByMonthAndDay } from './groupList'

const TODAY = '2026-09-23'
const RANGE = { start: '2026-08-01', end: '2026-11-30' }

function shape(months: ReturnType<typeof groupByMonthAndDay>) {
  return months.map((m) => [m.key, m.days.map((d) => `${d.date}:${d.occurrences.length}`)])
}

describe('groupByMonthAndDay', () => {
  it('nhóm theo tháng rồi ngày, bỏ tháng không có sự kiện', () => {
    const events = [
      makeEvent({ id: 'a', date: '2026-08-10' }),
      makeEvent({ id: 'b', date: '2026-08-10', title: 'B' }),
      makeEvent({ id: 'c', date: '2026-11-02' }),
    ]
    const occurrences = occurrencesOf(events, RANGE.start, RANGE.end).sort(compareOccurrences)
    expect(shape(groupByMonthAndDay(occurrences, TODAY, RANGE))).toEqual([
      ['2026-08', ['2026-08-10:2']],
      ['2026-09', ['2026-09-23:0']],
      ['2026-11', ['2026-11-02:1']],
    ])
  })

  it('luôn có nhóm hôm nay khi hôm nay nằm trong khoảng', () => {
    expect(shape(groupByMonthAndDay([], TODAY, RANGE))).toEqual([['2026-09', ['2026-09-23:0']]])
    expect(groupByMonthAndDay([], TODAY, { start: '2027-01-01', end: '2027-03-31' })).toEqual([])
    expect(groupByMonthAndDay([], TODAY)).toEqual([])
  })

  it('đánh dấu hôm nay và ngày đã qua', () => {
    const events = [makeEvent({ date: '2026-09-22' }), makeEvent({ date: TODAY })]
    const [month] = groupByMonthAndDay(occurrencesOf(events, RANGE.start, RANGE.end), TODAY)
    expect(month.days.map((d) => [d.date, d.isToday, d.isPast])).toEqual([
      ['2026-09-22', false, true],
      ['2026-09-23', true, false],
    ])
  })

  it('lần bị dời ngày nằm ở ngày mới', () => {
    const weekly = makeEvent({
      date: '2026-09-07',
      recurrence: { freq: 'weekly', calendar: 'solar' },
      exceptions: { '2026-09-14': { date: '2026-09-16' } },
    })
    const occurrences = occurrencesOf([weekly], '2026-09-01', '2026-09-20').sort(compareOccurrences)
    expect(shape(groupByMonthAndDay(occurrences, TODAY))).toEqual([
      ['2026-09', ['2026-09-07:1', '2026-09-16:1']],
    ])
  })
})
