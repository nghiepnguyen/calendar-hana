// Chuyển đổi dương lịch ↔ âm lịch Việt Nam.
//
// Thuật toán của Hồ Ngọc Đức (https://www.informatik.uni-leipzig.de/~duc/amlich/calrules.html),
// tính theo múi giờ UTC+7. Âm lịch Việt Nam và Trung Quốc (UTC+8) có thể lệch nhau một ngày
// hoặc một tháng ở một số năm (ví dụ Tết 1985, 2007), nên không được đổi múi giờ.

import type { LunarDate } from '../types'
import { jdFromDate, jdToDate, type SolarDate } from './julian'

export const TIME_ZONE_OFFSET = 7

/** Khoảng năm dương lịch app hỗ trợ (PRD mục 12). */
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100

const INT = Math.floor
const PI = Math.PI
const DR = PI / 180
/** Độ dài trung bình của một tháng âm (ngày). */
const SYNODIC_MONTH = 29.530588853
/** Số ngày Julius của điểm sóc (trăng mới) gốc 1/1/1900. */
const NEW_MOON_EPOCH = 2415021.076998695

/** Thời điểm (số ngày Julius, có phần lẻ) của điểm sóc thứ k tính từ 1/1/1900. */
function newMoon(k: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * DR)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * DR) + 0.0021 * Math.sin(2 * DR * M)
  C1 = C1 - 0.4068 * Math.sin(Mpr * DR) + 0.0161 * Math.sin(DR * 2 * Mpr)
  C1 = C1 - 0.0004 * Math.sin(DR * 3 * Mpr)
  C1 = C1 + 0.0104 * Math.sin(DR * 2 * F) - 0.0051 * Math.sin(DR * (M + Mpr))
  C1 = C1 - 0.0074 * Math.sin(DR * (M - Mpr)) + 0.0004 * Math.sin(DR * (2 * F + M))
  C1 = C1 - 0.0004 * Math.sin(DR * (2 * F - M)) - 0.0006 * Math.sin(DR * (2 * F + Mpr))
  C1 = C1 + 0.001 * Math.sin(DR * (2 * F - Mpr)) + 0.0005 * Math.sin(DR * (2 * Mpr + M))
  const deltaT =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2
  return jd1 + C1 - deltaT
}

/** Số ngày Julius của ngày (giờ địa phương) chứa điểm sóc thứ k. */
export function getNewMoonDay(k: number, timeZone = TIME_ZONE_OFFSET): number {
  return INT(newMoon(k) + 0.5 + timeZone / 24)
}

/** Kinh độ Mặt Trời (radian, 0..2π) tại thời điểm jdn (số ngày Julius, có phần lẻ, UTC). */
export function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525
  const T2 = T * T
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(DR * M)
  DL += (0.019993 - 0.000101 * T) * Math.sin(DR * 2 * M) + 0.00029 * Math.sin(DR * 3 * M)
  let L = (L0 + DL) * DR
  L -= PI * 2 * INT(L / (PI * 2))
  return L
}

/** Cung hoàng đạo (0..11, mỗi cung 30°) của Mặt Trời lúc 0h giờ địa phương của ngày dayNumber. */
export function getSunLongitudeSector(dayNumber: number, timeZone = TIME_ZONE_OFFSET): number {
  return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6)
}

const month11Cache = new Map<number, number>()

/** Số ngày Julius của ngày đầu tháng 11 âm lịch (tháng chứa Đông chí) của năm dương yy. */
export function getLunarMonth11(yy: number, timeZone = TIME_ZONE_OFFSET): number {
  const cacheKey = yy * 100 + timeZone
  const cached = month11Cache.get(cacheKey)
  if (cached !== undefined) return cached
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = INT(off / SYNODIC_MONTH)
  let nm = getNewMoonDay(k, timeZone)
  if (getSunLongitudeSector(nm, timeZone) >= 9) {
    nm = getNewMoonDay(k - 1, timeZone)
  }
  month11Cache.set(cacheKey, nm)
  return nm
}

/** Vị trí (tính từ tháng 11 âm) của tháng nhuận trong năm có 13 tháng bắt đầu từ a11. */
export function getLeapMonthOffset(a11: number, timeZone = TIME_ZONE_OFFSET): number {
  const k = INT((a11 - NEW_MOON_EPOCH) / SYNODIC_MONTH + 0.5)
  let last: number
  let i = 1
  let arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i++
    arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

function assertSupportedYear(year: number): void {
  if (year < MIN_YEAR - 1 || year > MAX_YEAR + 1) {
    throw new RangeError(`Năm ${year} nằm ngoài khoảng hỗ trợ ${MIN_YEAR}–${MAX_YEAR}`)
  }
}

/** Dương lịch → âm lịch. */
export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  assertSupportedYear(yy)
  const tz = TIME_ZONE_OFFSET
  const dayNumber = jdFromDate(dd, mm, yy)
  // Ước lượng k có thể lệch một tháng quanh điểm sóc, nên chỉnh lại cho tới khi
  // dayNumber nằm trong [sóc k+1, sóc k+2).
  let k = INT((dayNumber - NEW_MOON_EPOCH) / SYNODIC_MONTH)
  while (getNewMoonDay(k + 1, tz) > dayNumber) k--
  while (getNewMoonDay(k + 2, tz) <= dayNumber) k++
  const monthStart = getNewMoonDay(k + 1, tz)

  let a11 = getLunarMonth11(yy, tz)
  let b11 = a11
  let lunarYear: number
  if (a11 >= monthStart) {
    lunarYear = yy
    a11 = getLunarMonth11(yy - 1, tz)
  } else {
    lunarYear = yy + 1
    b11 = getLunarMonth11(yy + 1, tz)
  }

  const lunarDay = dayNumber - monthStart + 1
  const diff = INT((monthStart - a11) / 29)
  let isLeap = false
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) isLeap = true
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap }
}

/**
 * Tìm ngày đầu (số ngày Julius) và độ dài của một tháng âm.
 * Trả về null nếu tháng không tồn tại (ví dụ đòi tháng nhuận ở năm không nhuận tháng đó).
 */
export function getLunarMonthInfo(
  lunarMonth: number,
  lunarYear: number,
  isLeap: boolean,
): { startJd: number; length: 29 | 30 } | null {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) return null
  assertSupportedYear(lunarYear)
  const tz = TIME_ZONE_OFFSET
  let a11: number
  let b11: number
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, tz)
    b11 = getLunarMonth11(lunarYear, tz)
  } else {
    a11 = getLunarMonth11(lunarYear, tz)
    b11 = getLunarMonth11(lunarYear + 1, tz)
  }
  const k = INT(0.5 + (a11 - NEW_MOON_EPOCH) / SYNODIC_MONTH)
  let off = lunarMonth - 11
  if (off < 0) off += 12
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz)
    let leapMonth = leapOff - 2
    if (leapMonth < 0) leapMonth += 12
    if (isLeap && lunarMonth !== leapMonth) return null
    if (isLeap || off >= leapOff) off += 1
  } else if (isLeap) {
    return null
  }
  const startJd = getNewMoonDay(k + off, tz)
  const nextStartJd = getNewMoonDay(k + off + 1, tz)
  return { startJd, length: (nextStartJd - startJd) as 29 | 30 }
}

/** Âm lịch → dương lịch. Trả về null nếu ngày âm không tồn tại. */
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeap = false,
): SolarDate | null {
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) return null
  const info = getLunarMonthInfo(lunarMonth, lunarYear, isLeap)
  if (!info || lunarDay > info.length) return null
  return jdToDate(info.startJd + lunarDay - 1)
}

/** Số ngày (29 hoặc 30) của tháng âm. Trả về null nếu tháng không tồn tại. */
export function getLunarMonthLength(month: number, year: number, isLeap = false): 29 | 30 | null {
  return getLunarMonthInfo(month, year, isLeap)?.length ?? null
}

const leapMonthCache = new Map<number, number | null>()

/** Tháng nhuận của năm âm lịch (1..12), hoặc null nếu năm đó không có tháng nhuận. */
export function getLeapMonth(lunarYear: number): number | null {
  const cached = leapMonthCache.get(lunarYear)
  if (cached !== undefined) return cached
  let result: number | null = null
  for (let month = 1; month <= 12; month++) {
    if (getLunarMonthInfo(month, lunarYear, true)) {
      result = month
      break
    }
  }
  leapMonthCache.set(lunarYear, result)
  return result
}
