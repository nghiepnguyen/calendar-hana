// Khoảng ngày và điều hướng cho từng chế độ xem.

import {
  addDays,
  dayOfWeek,
  daysInSolarMonth,
  parseSolarDate,
  toSolarDateString,
} from '@shared/lunar/julian'
import { MAX_YEAR, MIN_YEAR } from '@shared/lunar/lunar'
import type { SolarDateString } from '@shared/types'

export type ViewMode = 'day' | 'week' | 'month'

export const VIEW_MODES: ViewMode[] = ['day', 'week', 'month']

export const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
}

export function isViewMode(value: string | undefined): value is ViewMode {
  return value === 'day' || value === 'week' || value === 'month'
}

/** Ngày đầu tuần chứa date. weekStartsOn: 1 = Thứ Hai, 0 = Chủ nhật. */
export function startOfWeek(date: SolarDateString, weekStartsOn: 0 | 1): SolarDateString {
  const offset = (dayOfWeek(date) - weekStartsOn + 7) % 7
  return addDays(date, -offset)
}

export function daysFrom(start: SolarDateString, count: number): SolarDateString[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function weekDays(date: SolarDateString, weekStartsOn: 0 | 1): SolarDateString[] {
  return daysFrom(startOfWeek(date, weekStartsOn), 7)
}

/** 42 ngày (6 tuần) của lưới xem Tháng, bắt đầu từ đầu tuần chứa ngày 1. */
export function monthGridDays(date: SolarDateString, weekStartsOn: 0 | 1): SolarDateString[] {
  const { month, year } = parseSolarDate(date)
  const first = toSolarDateString({ day: 1, month, year })
  return daysFrom(startOfWeek(first, weekStartsOn), 42)
}

/** Khoảng ngày cần tải sự kiện cho chế độ xem. */
export function viewRange(
  view: ViewMode,
  date: SolarDateString,
  weekStartsOn: 0 | 1,
): { start: SolarDateString; end: SolarDateString; days: SolarDateString[] } {
  const days =
    view === 'day'
      ? [date]
      : view === 'week'
        ? weekDays(date, weekStartsOn)
        : monthGridDays(date, weekStartsOn)
  return { start: days[0], end: days[days.length - 1], days }
}

/** Cộng/trừ n tháng, giữ ngày (kẹp vào ngày cuối tháng nếu cần). */
export function addMonths(date: SolarDateString, n: number): SolarDateString {
  const { day, month, year } = parseSolarDate(date)
  const index = year * 12 + (month - 1) + n
  const newYear = Math.floor(index / 12)
  const newMonth = (index % 12) + 1
  return toSolarDateString({
    day: Math.min(day, daysInSolarMonth(newMonth, newYear)),
    month: newMonth,
    year: newYear,
  })
}

/** Ngày của trang trước (-1) hoặc trang sau (+1) theo chế độ xem. */
export function shiftDate(view: ViewMode, date: SolarDateString, delta: -1 | 1): SolarDateString {
  if (view === 'day') return addDays(date, delta)
  if (view === 'week') return addDays(date, delta * 7)
  return addMonths(date, delta)
}

/** Ngày hợp lệ và nằm trong khoảng năm app hỗ trợ (1900–2100). */
export function isSupportedDate(value: string | undefined): value is SolarDateString {
  if (!value) return false
  try {
    const { year } = parseSolarDate(value)
    return year >= MIN_YEAR && year <= MAX_YEAR
  } catch {
    return false
  }
}

/** Trang trước (-1) / sau (+1) còn nằm trong khoảng năm app hỗ trợ không. */
export function canShift(view: ViewMode, date: SolarDateString, delta: -1 | 1): boolean {
  return isSupportedDate(shiftDate(view, date, delta))
}
