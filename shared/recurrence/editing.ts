// Sửa / xóa sự kiện lặp theo 3 lựa chọn (PRD mục 30):
// - 'single': chỉ lần này (ghi vào exceptions)
// - 'following': lần này và các lần sau (cắt sự kiện cũ, tạo sự kiện mới từ lần này)
// - 'all': tất cả (sửa sự kiện gốc)

import { addDays, parseSolarDate } from '../lunar/julian'
import { solarToLunar } from '../lunar/lunar'
import type { CalendarEvent, EventOverride, SolarDateString } from '../types'
import { iterateOccurrences, type Occurrence } from './recurrence'

export type RecurringScope = 'single' | 'following' | 'all'

/** Các trường có thể sửa riêng cho một lần. */
const OVERRIDABLE_FIELDS = [
  'title',
  'allDay',
  'startTime',
  'endTime',
  'categoryId',
  'reminders',
  'location',
  'note',
] as const satisfies readonly (keyof EventOverride)[]

type EditableFields = Pick<CalendarEvent, (typeof OVERRIDABLE_FIELDS)[number]>

export type DeleteResult = { action: 'delete' } | { action: 'update'; event: CalendarEvent }

/** Kết quả xóa một lần diễn ra theo phạm vi. */
export function deleteOccurrence(
  event: CalendarEvent,
  occurrence: Pick<Occurrence, 'occurrenceKey' | 'index'>,
  scope: RecurringScope,
): DeleteResult {
  if (!event.recurrence || scope === 'all') return { action: 'delete' }
  if (scope === 'following') {
    if (occurrence.index === 0) return { action: 'delete' }
    return { action: 'update', event: endBefore(event, occurrence) }
  }
  return {
    action: 'update',
    event: {
      ...event,
      exceptions: { ...event.exceptions, [occurrence.occurrenceKey]: 'deleted' },
    },
  }
}

/**
 * Xoá nhiều lần của cùng một sự kiện trong một lần lưu: các lần của sự kiện lặp được ghi
 * thành exception 'deleted' (giữ exceptions cũ). Không còn lần nào thì xoá hẳn sự kiện.
 */
export function deleteOccurrences(
  event: CalendarEvent,
  occurrences: readonly Pick<Occurrence, 'occurrenceKey'>[],
): DeleteResult {
  if (!event.recurrence) return { action: 'delete' }
  const exceptions = { ...event.exceptions }
  for (const { occurrenceKey } of occurrences) exceptions[occurrenceKey] = 'deleted'
  const next: CalendarEvent = { ...event, exceptions }
  if (iterateOccurrences(next).next().done) return { action: 'delete' }
  return { action: 'update', event: next }
}

/** Sự kiện cũ dừng ngay trước lần occurrence (giữ exceptions trước đó). */
function endBefore(
  event: CalendarEvent,
  occurrence: Pick<Occurrence, 'occurrenceKey' | 'index'>,
): CalendarEvent {
  const rule = event.recurrence!
  const exceptions = Object.fromEntries(
    Object.entries(event.exceptions ?? {}).filter(([key]) => key < occurrence.occurrenceKey),
  )
  const { count: _count, until: _until, ...rest } = rule
  return {
    ...event,
    recurrence:
      rule.count !== undefined
        ? { ...rest, count: occurrence.index }
        : { ...rest, until: addDays(occurrence.occurrenceKey, -1) },
    exceptions: Object.keys(exceptions).length ? exceptions : undefined,
  }
}

/**
 * Tách sự kiện lặp tại một lần: trả về sự kiện cũ (đã cắt) và phần gốc cho sự kiện mới
 * (bắt đầu từ lần này, giữ số lần còn lại và các exceptions từ lần này trở đi).
 * Nếu là lần đầu tiên thì không cần tách: before = null.
 */
export function splitAt(
  event: CalendarEvent,
  occurrence: Pick<Occurrence, 'occurrenceKey' | 'index'>,
): { before: CalendarEvent | null; after: CalendarEvent } {
  if (!event.recurrence || occurrence.index === 0) return { before: null, after: event }
  const rule = event.recurrence
  const key = occurrence.occurrenceKey
  const { day, month, year } = parseSolarDate(key)
  const laterExceptions = Object.fromEntries(
    Object.entries(event.exceptions ?? {}).filter(([k]) => k >= key),
  )
  const after: CalendarEvent = {
    ...event,
    date: event.calendarType === 'lunar' ? solarToLunar(day, month, year) : key,
    recurrence:
      rule.count !== undefined ? { ...rule, count: rule.count - occurrence.index } : { ...rule },
    exceptions: Object.keys(laterExceptions).length ? laterExceptions : undefined,
  }
  return { before: endBefore(event, occurrence), after }
}

/**
 * Tạo phần ghi đè cho một lần: chỉ giữ các trường khác với sự kiện gốc.
 * newDate khác ngày gốc của lần này thì lần này bị dời ngày.
 */
export function buildOverride(
  base: CalendarEvent,
  updated: EditableFields,
  occurrenceKey: SolarDateString,
  newDate: SolarDateString,
): EventOverride {
  const override: EventOverride = {}
  for (const field of OVERRIDABLE_FIELDS) {
    const before = base[field]
    const after = updated[field]
    if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) {
      ;(override as Record<string, unknown>)[field] = after
    }
  }
  if (newDate !== occurrenceKey) override.date = newDate
  return override
}

/** Ghi phần ghi đè vào exceptions. Phần ghi đè rỗng thì xóa exception cũ (lần này trở lại như gốc). */
export function applyOccurrenceOverride(
  base: CalendarEvent,
  occurrenceKey: SolarDateString,
  override: EventOverride,
): CalendarEvent {
  const exceptions = { ...base.exceptions }
  if (Object.keys(override).length === 0) delete exceptions[occurrenceKey]
  else exceptions[occurrenceKey] = override
  return { ...base, exceptions: Object.keys(exceptions).length ? exceptions : undefined }
}
