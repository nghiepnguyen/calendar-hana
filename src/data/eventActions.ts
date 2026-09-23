// Lưu / xóa sự kiện từ form và màn hình chi tiết, theo phạm vi sửa sự kiện lặp.

import {
  applyOccurrenceOverride,
  buildOverride,
  deleteOccurrence,
  deleteOccurrences,
  splitAt,
  type RecurringScope,
} from '@shared/recurrence/editing'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { CalendarEvent } from '@shared/types'
import { draftSolarDate, draftToInput, type EventDraft } from '../components/EventForm/draft'
import type { CalendarRepository } from './repository'

export async function createEventFromDraft(
  repository: CalendarRepository,
  draft: EventDraft,
): Promise<CalendarEvent> {
  return repository.saveEvent(draftToInput(draft))
}

/** Lưu thay đổi của một sự kiện có sẵn theo phạm vi. */
export async function updateEventFromDraft(
  repository: CalendarRepository,
  base: CalendarEvent,
  draft: EventDraft,
  scope: RecurringScope,
  occurrence?: Pick<Occurrence, 'occurrenceKey' | 'index'>,
): Promise<void> {
  const input = draftToInput(draft)

  if (scope === 'single' && occurrence && base.recurrence) {
    const newDate = draftSolarDate(draft) ?? occurrence.occurrenceKey
    const override = buildOverride(
      base,
      { ...base, ...input, startTime: input.startTime, endTime: input.endTime },
      occurrence.occurrenceKey,
      newDate,
    )
    await repository.saveEvent(applyOccurrenceOverride(base, occurrence.occurrenceKey, override))
    return
  }

  if (scope === 'following' && occurrence && base.recurrence) {
    const { before, after } = splitAt(base, occurrence)
    if (before) {
      await repository.saveEvent(before)
      await repository.saveEvent({ ...input, exceptions: after.exceptions })
      return
    }
  }

  // Tất cả (hoặc sự kiện không lặp): giữ id, createdAt và exceptions cũ.
  await repository.saveEvent({
    ...input,
    id: base.id,
    createdAt: base.createdAt,
    exceptions: input.recurrence ? base.exceptions : undefined,
  })
}

/** Xóa theo phạm vi. Sự kiện không lặp thì xóa hẳn. */
export async function deleteEventOccurrence(
  repository: CalendarRepository,
  base: CalendarEvent,
  occurrence: Pick<Occurrence, 'occurrenceKey' | 'index'>,
  scope: RecurringScope,
): Promise<void> {
  const result = deleteOccurrence(base, occurrence, scope)
  if (result.action === 'delete') await repository.deleteEvent(base.id)
  else await repository.saveEvent(result.event)
}

/** Một lần diễn ra được chọn để xoá (chế độ chọn nhiều của trang Danh sách). */
export interface OccurrenceSelection {
  eventId: string
  occurrenceKey: string
}

export interface BulkDeleteResult {
  /** Số lần đã xoá (kể cả lần của sự kiện đã bị xoá ở nơi khác). */
  deleted: number
  /** Các lần chưa xoá được do lỗi ghi dữ liệu. */
  failed: OccurrenceSelection[]
}

/**
 * Xoá nhiều lần cùng lúc. Gom theo sự kiện và ghi mỗi sự kiện đúng một lần, vì ghi lần lượt
 * từng lần của cùng một sự kiện lặp thì bản sau ghi đè exceptions của bản trước.
 * Luôn đọc bản gốc từ repository, không dùng occurrence.event (đã gộp phần sửa riêng).
 */
export async function deleteEventOccurrences(
  repository: CalendarRepository,
  selections: readonly OccurrenceSelection[],
): Promise<BulkDeleteResult> {
  const byEvent = new Map<string, OccurrenceSelection[]>()
  for (const selection of selections) {
    const list = byEvent.get(selection.eventId)
    if (list) list.push(selection)
    else byEvent.set(selection.eventId, [selection])
  }

  const results = await Promise.allSettled(
    [...byEvent].map(async ([eventId, group]) => {
      const base = await repository.getEvent(eventId)
      if (!base) return
      const result = deleteOccurrences(base, group)
      if (result.action === 'delete') await repository.deleteEvent(eventId)
      else await repository.saveEvent(result.event)
    }),
  )

  const failed = [...byEvent.values()].filter((_, i) => results[i].status === 'rejected').flat()
  return { deleted: selections.length - failed.length, failed }
}
