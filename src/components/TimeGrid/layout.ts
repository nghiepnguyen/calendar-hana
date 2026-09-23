// Xếp các sự kiện có giờ trong một ngày thành cột cạnh nhau khi trùng giờ.

import type { Occurrence } from '@shared/recurrence/recurrence'
import { timeToMinutes } from '@shared/time'

export const DEFAULT_DURATION_MINUTES = 60
/** Sự kiện ngắn vẫn cao tối thiểu từng này phút để đọc được tiêu đề. */
export const MIN_VISIBLE_MINUTES = 25

export interface PositionedEvent {
  occurrence: Occurrence
  startMinutes: number
  endMinutes: number
  /** Cột (0-based) trong nhóm trùng giờ. */
  column: number
  /** Tổng số cột của nhóm trùng giờ. */
  columns: number
}

export function occurrenceMinutes(occurrence: Occurrence): { start: number; end: number } {
  const start = timeToMinutes(occurrence.event.startTime ?? '00:00')
  const rawEnd = occurrence.event.endTime
    ? timeToMinutes(occurrence.event.endTime)
    : start + DEFAULT_DURATION_MINUTES
  const end = Math.min(24 * 60, Math.max(rawEnd, start + MIN_VISIBLE_MINUTES))
  return { start, end }
}

/** Chỉ nhận các lần có giờ (không phải cả ngày) của cùng một ngày. */
export function layoutTimedEvents(occurrences: Occurrence[]): PositionedEvent[] {
  const items = occurrences
    .map((occurrence) => ({ occurrence, ...occurrenceMinutes(occurrence) }))
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const result: PositionedEvent[] = []
  let cluster: PositionedEvent[] = []
  let columnEnds: number[] = []
  let clusterEnd = -1

  const flush = () => {
    for (const item of cluster) item.columns = columnEnds.length
    result.push(...cluster)
    cluster = []
    columnEnds = []
  }

  for (const item of items) {
    // Nhóm mới khi sự kiện này bắt đầu sau khi mọi sự kiện của nhóm cũ đã kết thúc.
    if (item.start >= clusterEnd && cluster.length > 0) flush()
    let column = columnEnds.findIndex((end) => end <= item.start)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(item.end)
    } else {
      columnEnds[column] = item.end
    }
    cluster.push({
      occurrence: item.occurrence,
      startMinutes: item.start,
      endMinutes: item.end,
      column,
      columns: 1,
    })
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  if (cluster.length > 0) flush()
  return result
}
