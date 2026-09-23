import type { SolarDateString } from '../types'

/** Đường dẫn trong app mở chi tiết một lần diễn ra: /day/2026-09-23?event=...&occurrence=... */
export function occurrencePath(
  date: SolarDateString,
  eventId: string,
  occurrenceKey: SolarDateString,
): string {
  const query = new URLSearchParams({ event: eventId, occurrence: occurrenceKey })
  return `/day/${date}?${query}`
}

/** Tag của thông báo: cùng lần nhắc thì thay thế, không hiện trùng. */
export function reminderTag(eventId: string, occurrenceKey: string, offsetMinutes: number): string {
  return `${eventId}|${occurrenceKey}|${offsetMinutes}`
}
