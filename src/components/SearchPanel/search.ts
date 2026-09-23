import { findNextOccurrence, getEventStartDate } from '@shared/recurrence/recurrence'
import type { CalendarEvent, SolarDateString } from '@shared/types'

/** Bỏ dấu tiếng Việt và viết thường để tìm không phân biệt dấu: "Giỗ" ~ "gio". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Các từ khoá đã bỏ dấu, viết thường. Chuỗi rỗng hoặc toàn khoảng trắng: []. */
export function queryWords(query: string): string[] {
  return normalizeText(query).trim().split(/\s+/).filter(Boolean)
}

/** Tiêu đề, ghi chú hoặc địa điểm chứa đủ mọi từ. Không có từ nào thì luôn khớp. */
export function matchesQuery(
  event: Pick<CalendarEvent, 'title' | 'note' | 'location'>,
  words: readonly string[],
): boolean {
  if (words.length === 0) return true
  const haystack = normalizeText(`${event.title} ${event.note ?? ''} ${event.location ?? ''}`)
  return words.every((w) => haystack.includes(w))
}

export interface SearchResult {
  event: CalendarEvent
  /** Ngày để nhảy tới: lần kế tiếp từ hôm nay, hoặc lần đầu nếu đã qua hết. */
  date: SolarDateString
  isPast: boolean
}

/** Tìm theo tiêu đề, ghi chú, địa điểm. Kết quả sắp theo ngày gần nhất sắp tới trước. */
export function searchEvents(
  events: CalendarEvent[],
  query: string,
  today: SolarDateString,
  limit = 50,
): SearchResult[] {
  const words = queryWords(query)
  if (words.length === 0) return []
  const results: SearchResult[] = []
  for (const event of events) {
    if (!matchesQuery(event, words)) continue
    const next = findNextOccurrence(event, today)
    results.push(
      next
        ? { event, date: next.date, isPast: false }
        : { event, date: getEventStartDate(event), isPast: true },
    )
  }
  return results
    .sort((a, b) => {
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1
      // Sắp tới: gần nhất trước. Đã qua: mới nhất trước.
      return a.isPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    })
    .slice(0, limit)
}
