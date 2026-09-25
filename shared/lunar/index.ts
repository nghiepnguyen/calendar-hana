// Điểm vào của thư viện âm lịch: gom mọi thông tin của một ngày.

import type { LunarDate, SolarDateString } from '../types'
import {
  getAuspiciousHours,
  getBadDays,
  getDayGod,
  type AuspiciousHour,
  type BadDay,
  type DayGod,
} from './auspicious'
import { dayCanChi, monthCanChi, yearCanChi, type CanChi } from './canChi'
import { getHolidays, type Holiday } from './holidays'
import { dayOfWeek, parseSolarDate, solarStringToJd, type SolarDate } from './julian'
import { solarToLunar } from './lunar'
import { getSolarTerm, type SolarTermInfo } from './solarTerms'

export * from './auspicious'
export * from './canChi'
export * from './clashes'
export * from './directions'
export * from './elements'
export * from './holidays'
export * from './julian'
export * from './lunar'
export * from './mansions'
export * from './napAm'
export * from './officers'
export * from './solarTerms'
export * from './stars'
// almanac.ts không export ở đây để tránh vòng import (nó dùng getDayInfo); import thẳng
// từ '@shared/lunar/almanac'.

export interface DayInfo {
  date: SolarDateString
  solar: SolarDate
  /** 0 = Chủ nhật ... 6 = Thứ Bảy. */
  weekday: number
  jd: number
  lunar: LunarDate
  canChi: { day: CanChi; month: CanChi; year: CanChi }
  dayGod: DayGod
  auspiciousHours: AuspiciousHour[]
  badDays: BadDay[]
  solarTerm: SolarTermInfo
  holidays: Holiday[]
}

const CACHE_LIMIT = 2000
const cache = new Map<SolarDateString, DayInfo>()

/** Toàn bộ thông tin âm lịch của một ngày dương 'YYYY-MM-DD'. Kết quả được cache. */
export function getDayInfo(date: SolarDateString): DayInfo {
  const cached = cache.get(date)
  if (cached) return cached

  const solar = parseSolarDate(date)
  const jd = solarStringToJd(date)
  const lunar = solarToLunar(solar.day, solar.month, solar.year)
  const dayCC = dayCanChi(jd)
  const info: DayInfo = {
    date,
    solar,
    weekday: dayOfWeek(date),
    jd,
    lunar,
    canChi: { day: dayCC, month: monthCanChi(lunar), year: yearCanChi(lunar.year) },
    dayGod: getDayGod(lunar.month, dayCC.chi),
    auspiciousHours: getAuspiciousHours(dayCC.chi),
    badDays: getBadDays(lunar.day),
    solarTerm: getSolarTerm(jd),
    holidays: getHolidays(solar, lunar),
  }

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(date, info)
  return info
}
