import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expandOccurrences } from '@shared/recurrence/recurrence'
import type { CalendarEvent } from '@shared/types'
import { draftFromEvent } from '../components/EventForm/draft'
import { CalendarDatabase } from './db'
import { deleteEventOccurrence, deleteEventOccurrences, updateEventFromDraft } from './eventActions'
import { LocalRepository } from './localRepository'

let repo: LocalRepository
let counter = 0
let base: CalendarEvent

beforeEach(async () => {
  repo = new LocalRepository(new CalendarDatabase(`actions-${++counter}`))
  base = await repo.saveEvent({
    title: 'Họp team',
    calendarType: 'solar',
    date: '2026-09-21',
    allDay: false,
    startTime: '09:00',
    endTime: '10:00',
    categoryId: 'work',
    recurrence: { freq: 'weekly', calendar: 'solar' },
    reminders: [],
  })
})

afterEach(async () => {
  await repo.db.delete()
})

async function allOccurrences(from = '2026-09-01', to = '2026-10-31') {
  const events = await repo.listEvents()
  return events
    .flatMap((e) => expandOccurrences(e, from, to))
    .map((o) => `${o.date} ${o.event.title} ${o.event.startTime ?? ''}`.trim())
    .sort()
}

function occ(date: string) {
  return expandOccurrences(base, date, date)[0]
}

describe('sửa sự kiện lặp', () => {
  it('chỉ lần này', async () => {
    const o = occ('2026-10-05')
    const draft = { ...draftFromEvent(o.event, o.date), title: 'Họp online', startTime: '14:00' }
    await updateEventFromDraft(repo, base, draft, 'single', o)
    expect(await repo.listEvents()).toHaveLength(1)
    expect(await allOccurrences('2026-09-28', '2026-10-12')).toEqual([
      '2026-09-28 Họp team 09:00',
      '2026-10-05 Họp online 14:00',
      '2026-10-12 Họp team 09:00',
    ])
  })

  it('chỉ lần này, dời sang ngày khác', async () => {
    const o = occ('2026-10-05')
    await updateEventFromDraft(
      repo,
      base,
      { ...draftFromEvent(o.event, o.date), solarDate: '2026-10-07' },
      'single',
      o,
    )
    expect(await allOccurrences('2026-10-01', '2026-10-10')).toEqual(['2026-10-07 Họp team 09:00'])
  })

  it('lần này và các lần sau: tách thành 2 sự kiện', async () => {
    const o = occ('2026-10-05')
    const draft = { ...draftFromEvent({ ...base, date: '2026-10-05' }), title: 'Họp team mới' }
    await updateEventFromDraft(repo, base, draft, 'following', o)
    expect(await repo.listEvents()).toHaveLength(2)
    expect(await allOccurrences('2026-09-21', '2026-10-12')).toEqual([
      '2026-09-21 Họp team 09:00',
      '2026-09-28 Họp team 09:00',
      '2026-10-05 Họp team mới 09:00',
      '2026-10-12 Họp team mới 09:00',
    ])
  })

  it('tất cả: sửa sự kiện gốc, giữ id', async () => {
    await updateEventFromDraft(
      repo,
      base,
      { ...draftFromEvent(base), title: 'Họp tuần' },
      'all',
      occ('2026-10-05'),
    )
    const events = await repo.listEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ id: base.id, title: 'Họp tuần', createdAt: base.createdAt })
  })
})

describe('xóa sự kiện lặp', () => {
  it('chỉ lần này', async () => {
    await deleteEventOccurrence(repo, base, occ('2026-09-28'), 'single')
    expect(await allOccurrences('2026-09-21', '2026-10-05')).toEqual([
      '2026-09-21 Họp team 09:00',
      '2026-10-05 Họp team 09:00',
    ])
  })

  it('lần này và các lần sau', async () => {
    await deleteEventOccurrence(repo, base, occ('2026-10-05'), 'following')
    expect(await allOccurrences()).toEqual([
      '2026-09-21 Họp team 09:00',
      '2026-09-28 Họp team 09:00',
    ])
  })

  it('tất cả', async () => {
    await deleteEventOccurrence(repo, base, occ('2026-10-05'), 'all')
    expect(await repo.listEvents()).toEqual([])
  })
})

describe('xoá nhiều lần cùng lúc', () => {
  const pick = (occurrenceKey: string, eventId = base.id) => ({ eventId, occurrenceKey })

  it('xoá sự kiện thường và các lần của sự kiện lặp', async () => {
    const single = await repo.saveEvent({
      title: 'Khám răng',
      calendarType: 'solar',
      date: '2026-09-30',
      allDay: true,
      categoryId: 'personal',
      reminders: [],
    })
    const result = await deleteEventOccurrences(repo, [
      pick('2026-09-28'),
      pick('2026-09-30', single.id),
      pick('2026-10-12'),
    ])
    expect(result).toEqual({ deleted: 3, failed: [] })
    expect(await allOccurrences('2026-09-21', '2026-10-19')).toEqual([
      '2026-09-21 Họp team 09:00',
      '2026-10-05 Họp team 09:00',
      '2026-10-19 Họp team 09:00',
    ])
  })

  it('nhiều lần của cùng một sự kiện chỉ ghi một lần', async () => {
    const save = vi.spyOn(repo, 'saveEvent')
    await deleteEventOccurrences(repo, [pick('2026-09-21'), pick('2026-09-28'), pick('2026-10-05')])
    expect(save).toHaveBeenCalledTimes(1)
    expect(await allOccurrences('2026-09-21', '2026-10-12')).toEqual(['2026-10-12 Họp team 09:00'])
  })

  it('bỏ qua sự kiện đã bị xoá ở nơi khác', async () => {
    await repo.deleteEvent(base.id)
    expect(await deleteEventOccurrences(repo, [pick('2026-09-21')])).toEqual({
      deleted: 1,
      failed: [],
    })
  })

  it('trả về các lần ghi lỗi', async () => {
    vi.spyOn(repo, 'saveEvent').mockRejectedValueOnce(new Error('offline'))
    const result = await deleteEventOccurrences(repo, [pick('2026-09-21')])
    expect(result).toEqual({ deleted: 0, failed: [pick('2026-09-21')] })
  })
})
