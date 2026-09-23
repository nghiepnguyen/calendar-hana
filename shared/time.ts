// Giờ Việt Nam (UTC+7, không có giờ mùa hè) cho mọi phép tính "hôm nay", "bây giờ".

import type { SolarDateString, TimeString } from './types'
import { parseSolarDate } from './lunar/julian'

export const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60

function shifted(now: Date): Date {
  return new Date(now.getTime() + VIETNAM_UTC_OFFSET_MINUTES * 60_000)
}

/** Ngày hôm nay theo giờ Việt Nam, dạng 'YYYY-MM-DD'. */
export function todayInVietnam(now: Date = new Date()): SolarDateString {
  return shifted(now).toISOString().slice(0, 10)
}

/** Số phút đã qua trong ngày theo giờ Việt Nam (0..1439). */
export function minutesNowInVietnam(now: Date = new Date()): number {
  const d = shifted(now)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

/** 'HH:mm' → số phút trong ngày. */
export function timeToMinutes(time: TimeString): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Số phút trong ngày → 'HH:mm'. */
export function minutesToTime(minutes: number): TimeString {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Thời điểm tuyệt đối (Date) của ngày + giờ theo giờ Việt Nam. */
export function vietnamDateTimeToDate(date: SolarDateString, time: TimeString = '00:00'): Date {
  const { day, month, year } = parseSolarDate(date)
  const minutes = timeToMinutes(time) - VIETNAM_UTC_OFFSET_MINUTES
  return new Date(Date.UTC(year, month - 1, day, 0, minutes))
}
