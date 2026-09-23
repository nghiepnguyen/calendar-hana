// Tính các lần diễn ra của một sự kiện (có hoặc không lặp, theo dương hoặc âm lịch).
//
// Sự kiện lặp không lưu từng lần riêng lẻ. Mỗi lần diễn ra có một occurrenceKey là ngày dương
// gốc 'YYYY-MM-DD' của lần đó. Ngoại lệ (exceptions) được gắn theo occurrenceKey.

import {
  daysInSolarMonth,
  dayOfWeek,
  jdToSolarString,
  parseSolarDate,
  solarStringToJd,
  toSolarDateString,
} from '../lunar/julian'
import { getLeapMonth, getLunarMonthInfo, MAX_YEAR, solarToLunar } from '../lunar/lunar'
import {
  isLunarDate,
  type CalendarEvent,
  type EventOverride,
  type LunarDate,
  type SolarDateString,
} from '../types'

/** Ngày cuối cùng app tính lần lặp tới. */
const LAST_SUPPORTED_DATE = `${MAX_YEAR}-12-31`

export interface Occurrence {
  eventId: string
  /** Ngày dương gốc của lần này, dùng làm khóa cho exceptions. */
  occurrenceKey: SolarDateString
  /** Ngày dương thực tế (khác occurrenceKey nếu lần này bị dời ngày). */
  date: SolarDateString
  /** Thứ tự lần diễn ra, bắt đầu từ 0. */
  index: number
  /** Sự kiện gốc đã gộp phần ghi đè của lần này. */
  event: CalendarEvent
  isRecurring: boolean
  /** true nếu lần này đã được sửa riêng. */
  isException: boolean
}

/**
 * Ngày âm với ngày được "kẹp" vào độ dài tháng: ngày 30 ở tháng thiếu rơi vào ngày 29 (PRD mục 28).
 * Trả về null nếu tháng không tồn tại.
 */
export function clampLunarToSolar(
  day: number,
  month: number,
  year: number,
  isLeap: boolean,
): SolarDateString | null {
  const info = getLunarMonthInfo(month, year, isLeap)
  if (!info) return null
  return jdToSolarString(info.startJd + Math.min(day, info.length) - 1)
}

/** Ngày dương của lần diễn ra đầu tiên. */
export function getEventStartDate(event: Pick<CalendarEvent, 'date'>): SolarDateString {
  if (!isLunarDate(event.date)) return event.date
  const { day, month, year, isLeap } = event.date
  const result = clampLunarToSolar(day, month, year, isLeap)
  if (!result) {
    throw new Error(`Ngày âm không tồn tại: ${day}/${month}${isLeap ? ' nhuận' : ''}/${year}`)
  }
  return result
}

function startLunarDate(event: CalendarEvent, startDate: SolarDateString): LunarDate {
  if (isLunarDate(event.date)) return event.date
  const { day, month, year } = parseSolarDate(startDate)
  return solarToLunar(day, month, year)
}

function nextLunarMonth(month: number, year: number, isLeap: boolean) {
  if (!isLeap && getLeapMonth(year) === month) return { month, year, isLeap: true }
  return month === 12
    ? { month: 1, year: year + 1, isLeap: false }
    : { month: month + 1, year, isLeap: false }
}

/** Sinh ngày gốc của từng lần theo quy tắc lặp, theo thứ tự tăng dần, không áp dụng exceptions. */
function* generateKeys(event: CalendarEvent): Generator<SolarDateString> {
  const start = getEventStartDate(event)
  const rule = event.recurrence
  if (!rule) {
    yield start
    return
  }

  const s = parseSolarDate(start)

  if (rule.calendar === 'lunar') {
    const lunar = startLunarDate(event, start)
    if (rule.freq === 'monthly') {
      // Lặp hằng tháng âm: tính cả tháng nhuận.
      let current = { month: lunar.month, year: lunar.year, isLeap: lunar.isLeap }
      while (current.year <= MAX_YEAR) {
        const date = clampLunarToSolar(lunar.day, current.month, current.year, current.isLeap)
        if (date) yield date
        current = nextLunarMonth(current.month, current.year, current.isLeap)
      }
      return
    }
    if (rule.freq === 'yearly') {
      // Lần đầu giữ nguyên ngày tạo (kể cả tháng nhuận), các năm sau luôn dùng tháng thường.
      yield start
      for (let year = lunar.year + 1; year <= MAX_YEAR; year++) {
        const date = clampLunarToSolar(lunar.day, lunar.month, year, false)
        if (date) yield date
      }
      return
    }
    throw new Error(`Âm lịch không hỗ trợ lặp "${rule.freq}"`)
  }

  switch (rule.freq) {
    case 'daily':
    case 'weekly': {
      const weekdays =
        rule.freq === 'weekly'
          ? new Set(rule.byWeekday?.length ? rule.byWeekday : [dayOfWeek(start)])
          : null
      const lastJd = solarStringToJd(LAST_SUPPORTED_DATE)
      for (let jd = solarStringToJd(start); jd <= lastJd; jd++) {
        // (jd + 1) % 7 là thứ trong tuần, 0 = Chủ nhật.
        if (!weekdays || weekdays.has((jd + 1) % 7)) yield jdToSolarString(jd)
      }
      return
    }
    case 'monthly': {
      // Tháng không có ngày 29/30/31 thì bỏ qua (PRD mục 29).
      let { month, year } = s
      while (year <= MAX_YEAR) {
        if (s.day <= daysInSolarMonth(month, year)) {
          yield toSolarDateString({ day: s.day, month, year })
        }
        month++
        if (month > 12) {
          month = 1
          year++
        }
      }
      return
    }
    case 'yearly': {
      // 29/2 chỉ rơi vào năm nhuận.
      for (let year = s.year; year <= MAX_YEAR; year++) {
        if (s.day <= daysInSolarMonth(s.month, year)) {
          yield toSolarDateString({ day: s.day, month: s.month, year })
        }
      }
      return
    }
  }
}

function applyOverride(event: CalendarEvent, override: EventOverride): CalendarEvent {
  const { date: _movedTo, ...fields } = override
  return { ...event, ...fields }
}

/** Duyệt mọi lần diễn ra (đã áp dụng exceptions và điều kiện kết thúc), theo thứ tự ngày gốc. */
export function* iterateOccurrences(event: CalendarEvent): Generator<Occurrence> {
  const rule = event.recurrence
  const until = rule?.until
  const count = rule?.count
  let index = 0
  for (const key of generateKeys(event)) {
    if (until && key > until) return
    if (count !== undefined && index >= count) return
    const exception = event.exceptions?.[key]
    const currentIndex = index
    index++
    if (exception === 'deleted') continue
    yield {
      eventId: event.id,
      occurrenceKey: key,
      date: exception?.date ?? key,
      index: currentIndex,
      event: exception ? applyOverride(event, exception) : event,
      isRecurring: !!rule,
      isException: !!exception,
    }
  }
}

/** Các lần diễn ra có ngày thực tế nằm trong [rangeStart, rangeEnd] (tính cả hai đầu). */
export function expandOccurrences(
  event: CalendarEvent,
  rangeStart: SolarDateString,
  rangeEnd: SolarDateString,
): Occurrence[] {
  const result: Occurrence[] = []
  // Lần bị dời ngày có ngày gốc nằm sau khoảng vẫn có thể rơi vào khoảng, nên duyệt tới
  // ngày gốc lớn nhất trong các lần bị dời.
  const lastMovedKey = maxMovedKey(event)
  const stopAfter = lastMovedKey > rangeEnd ? lastMovedKey : rangeEnd
  for (const occurrence of iterateOccurrences(event)) {
    if (occurrence.occurrenceKey > stopAfter) break
    if (occurrence.date >= rangeStart && occurrence.date <= rangeEnd) result.push(occurrence)
  }
  return result
}

/** Lần diễn ra đầu tiên có ngày thực tế >= fromDate, hoặc null nếu đã hết. */
export function findNextOccurrence(
  event: CalendarEvent,
  fromDate: SolarDateString,
): Occurrence | null {
  const lastMovedKey = maxMovedKey(event)
  let best: Occurrence | null = null
  for (const occurrence of iterateOccurrences(event)) {
    if (occurrence.date >= fromDate && (!best || occurrence.date < best.date)) best = occurrence
    // Sau lần bị dời cuối cùng, ngày thực tế tăng dần theo ngày gốc nên dừng được.
    if (best && occurrence.occurrenceKey >= fromDate && occurrence.occurrenceKey >= lastMovedKey) {
      break
    }
  }
  return best
}

/** Ngày gốc lớn nhất trong các lần bị dời ngày, hoặc '' nếu không có. */
function maxMovedKey(event: CalendarEvent): SolarDateString {
  let result = ''
  for (const [key, exception] of Object.entries(event.exceptions ?? {})) {
    if (exception !== 'deleted' && exception.date && key > result) result = key
  }
  return result
}

/** Sắp xếp lần diễn ra: theo ngày, sự kiện cả ngày trước, rồi theo giờ bắt đầu, rồi theo tiêu đề. */
export function compareOccurrences(a: Occurrence, b: Occurrence): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.event.allDay !== b.event.allDay) return a.event.allDay ? -1 : 1
  const aTime = a.event.startTime ?? ''
  const bTime = b.event.startTime ?? ''
  if (aTime !== bTime) return aTime < bTime ? -1 : 1
  return a.event.title.localeCompare(b.event.title, 'vi')
}
