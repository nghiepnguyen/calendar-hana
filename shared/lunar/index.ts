// Điểm vào của thư viện âm lịch: gom mọi thông tin của một ngày.

import { memoizeSolarTermDerived } from '../astronomy/solarTerms/cache'
import type { LunarDate, SolarDateString } from '../types'
import {
  getAuspiciousHours,
  getBadDays,
  getDayGodByMonthJian,
  type AuspiciousHour,
  type BadDay,
  type DayGod,
} from './auspicious'
import { dayCanChi, monthCanChi, yearCanChi, type CanChi } from './canChi'
import { getHolidays, type Holiday } from './holidays'
import { dayOfWeek, parseSolarDate, solarStringToJd, type SolarDate } from './julian'
import { solarToLunar } from './lunar'
import { getSolarTerm, solarTermMonthChi, type SolarTermInfo } from './solarTerms'

export * from './auspicious'
export * from './canChi'
export * from './catHungAuthority'
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
export * from './groupA'
export * from './groupB'
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

/** Toàn bộ thông tin âm lịch của một ngày dương 'YYYY-MM-DD'. Kết quả được cache
 * theo phiên bản authority tiết khí + clock (solarTerm và Month Jian phụ thuộc vào chúng).
 */
export function getDayInfo(date: SolarDateString): DayInfo {
  return memoizeSolarTermDerived('day-info', date, CACHE_LIMIT, () => computeDayInfo(date))
}

function computeDayInfo(date: SolarDateString): DayInfo {
  const solar = parseSolarDate(date)
  const jd = solarStringToJd(date)
  const lunar = solarToLunar(solar.day, solar.month, solar.year)
  const dayCC = dayCanChi(jd)
  // Day-view semantics follow the existing whole-day solar-term presentation: on a Jie
  // crossing civil day the new Month Jian applies to the whole displayed day. Exact-instant
  // consumers must use getDayGodAtInstant().
  const monthJianBranch = solarTermMonthChi(jd)
  const info: DayInfo = {
    date,
    solar,
    weekday: dayOfWeek(date),
    jd,
    lunar,
    canChi: { day: dayCC, month: monthCanChi(lunar), year: yearCanChi(lunar.year) },
    dayGod: getDayGodByMonthJian(monthJianBranch, dayCC.chi),
    auspiciousHours: getAuspiciousHours(dayCC.chi),
    badDays: getBadDays(lunar.day),
    solarTerm: getSolarTerm(jd),
    holidays: getHolidays(solar, lunar),
  }
  return info
}
