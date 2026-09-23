// Số ngày Julius (Julian Day Number) và các hàm ngày dương thuần.
// Mọi phép cộng/trừ ngày trong app đi qua số ngày Julius để không phụ thuộc múi giờ của máy.

import type { SolarDateString } from '../types'

export interface SolarDate {
  day: number
  month: number
  year: number
}

const INT = Math.floor

/** Ngày dương (lịch Gregory, hoặc Julius trước 15/10/1582) → số ngày Julius. */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083
  }
  return jd
}

/** Số ngày Julius → ngày dương. */
export function jdToDate(jd: number): SolarDate {
  let b: number
  let c: number
  if (jd > 2299160) {
    const a = jd + 32044
    b = INT((4 * a + 3) / 146097)
    c = a - INT((b * 146097) / 4)
  } else {
    b = 0
    c = jd + 32082
  }
  const d = INT((4 * c + 3) / 1461)
  const e = c - INT((1461 * d) / 4)
  const m = INT((5 * e + 2) / 153)
  return {
    day: e - INT((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * INT(m / 10),
    year: b * 100 + d - 4800 + INT(m / 10),
  }
}

const SOLAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseSolarDate(value: SolarDateString): SolarDate {
  const match = SOLAR_DATE_RE.exec(value)
  if (!match) throw new Error(`Ngày không hợp lệ: "${value}" (cần dạng YYYY-MM-DD)`)
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  if (!isValidSolarDate(date.day, date.month, date.year)) {
    throw new Error(`Ngày không tồn tại: "${value}"`)
  }
  return date
}

export function toSolarDateString({ day, month, year }: SolarDate): SolarDateString {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function solarStringToJd(value: SolarDateString): number {
  const { day, month, year } = parseSolarDate(value)
  return jdFromDate(day, month, year)
}

export function jdToSolarString(jd: number): SolarDateString {
  return toSolarDateString(jdToDate(jd))
}

export function isLeapSolarYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInSolarMonth(month: number, year: number): number {
  if (month === 2) return isLeapSolarYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function isValidSolarDate(day: number, month: number, year: number): boolean {
  return (
    Number.isInteger(day) &&
    Number.isInteger(month) &&
    Number.isInteger(year) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInSolarMonth(month, year)
  )
}

/** Cộng/trừ số ngày cho chuỗi 'YYYY-MM-DD'. */
export function addDays(value: SolarDateString, days: number): SolarDateString {
  return jdToSolarString(solarStringToJd(value) + days)
}

/** Số ngày từ a đến b (b - a). */
export function diffDays(a: SolarDateString, b: SolarDateString): number {
  return solarStringToJd(b) - solarStringToJd(a)
}

/** Thứ trong tuần: 0 = Chủ nhật, 1 = Thứ Hai, ... 6 = Thứ Bảy. */
export function dayOfWeek(value: SolarDateString): number {
  return (solarStringToJd(value) + 1) % 7
}
