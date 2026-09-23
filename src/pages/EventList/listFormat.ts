import { formatTime } from '@shared/format'
import type { Occurrence } from '@shared/recurrence/recurrence'

/** Khoá chọn ổn định của một lần diễn ra (không đổi khi lần đó bị dời ngày). */
export function selectionKey(o: Pick<Occurrence, 'eventId' | 'occurrenceKey'>): string {
  return `${o.eventId}:${o.occurrenceKey}`
}

/** "Cả ngày", "9:00" hoặc "9:00 – 10:00". */
export function timeLabel({
  allDay,
  startTime,
  endTime,
}: Pick<Occurrence['event'], 'allDay' | 'startTime' | 'endTime'>): string {
  if (allDay || !startTime) return 'Cả ngày'
  return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime)
}
