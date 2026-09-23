import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CalendarDatabase } from '../data/db'
import { LocalRepository } from '../data/localRepository'
import { RepositoryProvider } from '../data/RepositoryProvider'
import { useEventsInRange } from './useEventsInRange'

let repo: LocalRepository
let counter = 0

beforeEach(() => {
  repo = new LocalRepository(new CalendarDatabase(`hook-test-${++counter}`))
})

afterEach(async () => {
  await repo.db.delete()
})

function wrapper({ children }: { children: ReactNode }) {
  return <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
}

describe('useEventsInRange', () => {
  it('tính lần lặp trong khoảng, lọc danh mục ẩn, tự cập nhật', async () => {
    await repo.saveEvent({
      title: 'Rằm',
      calendarType: 'lunar',
      date: { day: 15, month: 8, year: 2026, isLeap: false },
      allDay: true,
      categoryId: 'memorial',
      recurrence: { freq: 'monthly', calendar: 'lunar' },
      reminders: [],
    })
    await repo.saveEvent({
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

    const { result, rerender } = renderHook(
      ({ hidden }: { hidden: string[] }) => useEventsInRange('2026-09-21', '2026-09-27', hidden),
      { wrapper, initialProps: { hidden: [] as string[] } },
    )

    await waitFor(() => expect(result.current).toHaveLength(2))
    expect(result.current!.map((o) => [o.date, o.event.title])).toEqual([
      ['2026-09-21', 'Họp team'],
      ['2026-09-25', 'Rằm'],
    ])

    rerender({ hidden: ['work'] })
    expect(result.current!.map((o) => o.event.title)).toEqual(['Rằm'])

    await act(async () => {
      await repo.saveEvent({
        title: 'Khám răng',
        calendarType: 'solar',
        date: '2026-09-23',
        allDay: true,
        categoryId: 'health',
        reminders: [],
      })
    })
    await waitFor(() => expect(result.current).toHaveLength(2))
    expect(result.current!.map((o) => o.event.title)).toEqual(['Khám răng', 'Rằm'])
  })
})
