import { vi } from 'vitest'
import { expandOccurrences, type Occurrence } from '@shared/recurrence/recurrence'
import type { CalendarEvent } from '@shared/types'
import { createDefaultSettings } from '../data/defaultCategories'
import type { CalendarViewProps } from '../views/viewProps'

export function makeEvent(partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: partial.id ?? `e-${Math.random().toString(36).slice(2)}`,
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

export function occurrencesOf(events: CalendarEvent[], start: string, end: string): Occurrence[] {
  return events.flatMap((e) => expandOccurrences(e, start, end))
}

export function viewProps(overrides: Partial<CalendarViewProps> = {}): CalendarViewProps {
  return {
    date: '2026-09-23',
    today: '2026-09-23',
    days: ['2026-09-23'],
    occurrences: [],
    settings: createDefaultSettings(''),
    colorOf: () => '#2563eb',
    getCategory: () => undefined,
    onOpenDay: vi.fn(),
    onOpenEvent: vi.fn(),
    onCreate: vi.fn(),
    ...overrides,
  }
}

/** Cố định "bây giờ" là 10h sáng 23/9/2026 giờ Việt Nam. */
export function freezeNow(iso = '2026-09-23T03:00:00Z'): void {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}
