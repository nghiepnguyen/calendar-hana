import { daysInSolarMonth, parseSolarDate, toSolarDateString } from '@shared/lunar/julian'
import { MAX_YEAR, MIN_YEAR } from '@shared/lunar/lunar'
import type { SolarDateString } from '@shared/types'

/** Khoảng ngày đã tải, tính cả hai đầu. */
export interface DateRange {
  start: SolarDateString
  end: SolarDateString
}

export const FIRST_DATE: SolarDateString = `${MIN_YEAR}-01-01`
export const LAST_DATE: SolarDateString = `${MAX_YEAR}-12-31`

/** Số tháng tải thêm mỗi lần cuộn tới đầu/cuối. */
export const STEP_MONTHS = 3
/** Số tháng tải thêm khi bấm "Tìm xa hơn". */
export const SEARCH_MORE_MONTHS = 12

function clamp(date: SolarDateString): SolarDateString {
  if (date < FIRST_DATE) return FIRST_DATE
  if (date > LAST_DATE) return LAST_DATE
  return date
}

/** Ngày đầu tháng, cách tháng của date `months` tháng. */
function monthStart(date: SolarDateString, months: number): SolarDateString {
  const { month, year } = parseSolarDate(date)
  const index = year * 12 + (month - 1) + months
  return toSolarDateString({ day: 1, month: (index % 12) + 1, year: Math.floor(index / 12) })
}

/** Ngày cuối tháng, cách tháng của date `months` tháng. */
function monthEnd(date: SolarDateString, months: number): SolarDateString {
  const first = parseSolarDate(monthStart(date, months))
  return toSolarDateString({ ...first, day: daysInSolarMonth(first.month, first.year) })
}

/** Mặc định: từ đầu tháng của 3 tháng trước đến cuối tháng của 6 tháng sau. */
export function defaultRange(today: SolarDateString): DateRange {
  return { start: clamp(monthStart(today, -3)), end: clamp(monthEnd(today, 6)) }
}

export function extendBefore(range: DateRange, months = STEP_MONTHS): DateRange {
  return { ...range, start: clamp(monthStart(range.start, -months)) }
}

export function extendAfter(range: DateRange, months = STEP_MONTHS): DateRange {
  return { ...range, end: clamp(monthEnd(range.end, months)) }
}

export function isAtStart(range: DateRange): boolean {
  return range.start <= FIRST_DATE
}

export function isAtEnd(range: DateRange): boolean {
  return range.end >= LAST_DATE
}
