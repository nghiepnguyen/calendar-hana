// Phần dùng chung cho nhập / xuất ICS và CSV (định dạng Google Calendar).

import { diffDays, parseSolarDate } from '@shared/lunar/julian'
import { minutesToTime, timeToMinutes, VIETNAM_UTC_OFFSET_MINUTES } from '@shared/time'
import {
  EVENT_NOTE_MAX,
  EVENT_TITLE_MAX,
  type CalendarEvent,
  type Category,
  type Recurrence,
  type SolarDateString,
  type TimeString,
} from '@shared/types'
import { EVENT_LOCATION_MAX } from '@shared/validation'
import { OTHER_CATEGORY_ID } from '../defaultCategories'

/** Dữ liệu cần để chuyển file ngoài thành sự kiện của app. */
export interface InteropContext {
  /** Danh mục hiện có, để khớp CATEGORIES theo tên. */
  categories: readonly Category[]
  /** Giờ nhắc của sự kiện cả ngày ('HH:mm'), để đổi qua lại với báo trước của ICS. */
  allDayReminderTime: TimeString
}

/** Kết quả đọc file ICS / CSV. */
export interface ParsedEvents {
  events: CalendarEvent[]
  /** Bản ghi không đọc được hoặc không hợp lệ. */
  skipped: number
  /** Sự kiện lặp có quy tắc app không hỗ trợ, chỉ nhập lần đầu. */
  simplified: number
}

/** Mốc "chưa từng sửa": nhập lại cùng file thì bản đã có trong app (mới hơn) được giữ. */
export const EPOCH_ISO = '1970-01-01T00:00:00.000Z'

export const NO_TITLE = '(Không có tiêu đề)'

/** Băm chuỗi thành id ngắn, cố định: nhập lại cùng sự kiện thì ghi đè thay vì tạo bản trùng. */
export function stableId(prefix: string, source: string): string {
  // cyrb53
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < source.length; i++) {
    const ch = source.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return `${prefix}-${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`
}

export function truncate(value: string | undefined, max: number): string | undefined {
  const text = value?.trim()
  if (!text) return undefined
  return text.length > max ? text.slice(0, max) : text
}

/** Chuẩn hoá tiêu đề, ghi chú, địa điểm về giới hạn độ dài của app. */
export function textFields(title: string | undefined, note?: string, location?: string) {
  return {
    title: truncate(title, EVENT_TITLE_MAX) ?? NO_TITLE,
    note: truncate(note, EVENT_NOTE_MAX),
    location: truncate(location, EVENT_LOCATION_MAX),
  }
}

export function categoryIdByName(categories: readonly Category[], name: string | undefined) {
  const wanted = name?.trim().toLocaleLowerCase('vi')
  if (!wanted) return OTHER_CATEGORY_ID
  return (
    categories.find((c) => c.name.trim().toLocaleLowerCase('vi') === wanted)?.id ??
    OTHER_CATEGORY_ID
  )
}

/** Ngày + giờ theo giờ Việt Nam. */
export interface VietnamDateTime {
  date: SolarDateString
  time: TimeString
}

/** Thời điểm UTC (ms) → ngày giờ Việt Nam. */
export function utcToVietnam(utcMs: number): VietnamDateTime {
  const iso = new Date(utcMs + VIETNAM_UTC_OFFSET_MINUTES * 60_000).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

/** Độ lệch (phút) của múi giờ `timeZone` so với UTC tại thời điểm `utcMs`. Múi lạ: null. */
function zoneOffsetMinutes(utcMs: number, timeZone: string): number | null {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(utcMs))
  } catch {
    return null
  }
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return Math.round((asUtc - utcMs) / 60_000)
}

/**
 * Giờ đồng hồ tại múi `timeZone` → thời điểm UTC (ms). Không có múi hoặc múi lạ (ví dụ tên
 * múi của Windows) thì coi là giờ Việt Nam.
 */
export function wallTimeToUtc(
  wall: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string | undefined,
): number {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  const offsetAt = (ms: number) =>
    (timeZone ? zoneOffsetMinutes(ms, timeZone) : null) ?? VIETNAM_UTC_OFFSET_MINUTES
  const first = offsetAt(guess)
  const second = offsetAt(guess - first * 60_000)
  return guess - second * 60_000
}

/** Giờ kết thúc hợp lệ cho app (cùng ngày, sau giờ bắt đầu). null nếu không thể. */
export function clampEndTime(
  startDate: SolarDateString,
  startTime: TimeString,
  end: VietnamDateTime | null,
): TimeString | null {
  const startMinutes = timeToMinutes(startTime)
  if (startMinutes >= 24 * 60 - 1) return null
  if (!end) return minutesToTime(Math.min(startMinutes + 60, 24 * 60 - 1))
  if (end.date > startDate) return '23:59'
  if (end.date < startDate || end.time <= startTime) {
    return minutesToTime(Math.min(startMinutes + 60, 24 * 60 - 1))
  }
  return end.time
}

/**
 * Sự kiện cả ngày kéo dài nhiều ngày (không lặp): app chưa có sự kiện nhiều ngày nên nhập
 * thành sự kiện lặp hằng ngày đúng số ngày đó.
 */
export function multiDayRecurrence(
  startDate: SolarDateString,
  endDateExclusive: SolarDateString | null,
): Recurrence | undefined {
  if (!endDateExclusive) return undefined
  const days = diffDays(startDate, endDateExclusive)
  return days > 1 ? { freq: 'daily', calendar: 'solar', count: days } : undefined
}

/** Chuỗi 'YYYY-MM-DD' là ngày có thật. */
export function isRealDate(date: SolarDateString): boolean {
  try {
    parseSolarDate(date)
    return true
  } catch {
    return false
  }
}
