import { formatTime } from '@shared/format'
import type { Occurrence } from '@shared/recurrence/recurrence'

export function isLunarEvent({ event }: Occurrence): boolean {
  return event.calendarType === 'lunar' || event.recurrence?.calendar === 'lunar'
}

/** Tên đọc cho trình đọc màn hình và tooltip: "Giỗ ông nội, Cả ngày, âm lịch". */
export function eventLabel(occurrence: Occurrence): string {
  const { event } = occurrence
  const time = !event.allDay && event.startTime ? formatTime(event.startTime) : null
  const timeRange =
    !event.allDay && event.startTime && event.endTime
      ? `${formatTime(event.startTime)}-${formatTime(event.endTime)}`
      : time
  return [event.title, timeRange ?? 'Cả ngày', isLunarEvent(occurrence) ? 'âm lịch' : null]
    .filter(Boolean)
    .join(', ')
}
