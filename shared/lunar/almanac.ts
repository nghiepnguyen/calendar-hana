// Thông tin lịch vạn niên đầy đủ của một ngày, dùng cho khối "Lịch vạn niên" ở xem Ngày.
//
// Tách riêng khỏi getDayInfo vì getDayInfo chạy cho mọi ô của xem Tháng, còn phần này chỉ cần
// cho ngày đang xem.

import type { SolarDateString } from '../types'
import { getAllHours, type DayHour } from './auspicious'
import type { CanChi } from './canChi'
import { getDayClashes, getMonthClashes } from './clashes'
import { getTravelDirections, type TravelDirections } from './directions'
import { getCanChiRelation, type CanChiRelation } from './elements'
import { getDayInfo } from './index'
import { getMansion, type Mansion } from './mansions'
import { getNapAm, sexagenaryIndex, type NapAm } from './napAm'
import { getOfficer, type Officer } from './officers'
import type { SolarTermInfo } from './solarTerms'
import { getStars, type Star } from './stars'

export interface Almanac {
  date: SolarDateString
  solarTerm: SolarTermInfo
  /** Nạp âm của Can Chi ngày ("Niên mệnh"). */
  napAm: NapAm
  dayCanChi: CanChi
  monthCanChi: CanChi
  relation: CanChiRelation
  mansion: Mansion
  officer: Officer
  directions: TravelDirections
  dayClashes: readonly string[]
  monthClashes: readonly string[]
  stars: { good: Star[]; bad: Star[] }
  /** Đủ 12 giờ, Tý..Hợi. */
  hours: DayHour[]
}

const CACHE_LIMIT = 2000
const cache = new Map<SolarDateString, Almanac>()

export function getAlmanac(date: SolarDateString): Almanac {
  const cached = cache.get(date)
  if (cached) return cached

  const info = getDayInfo(date)
  const { jd, lunar } = info
  const day = info.canChi.day
  const month = info.canChi.month
  const mansion = getMansion(jd)
  const officer = getOfficer(jd, day.chi)
  const almanac: Almanac = {
    date,
    solarTerm: info.solarTerm,
    napAm: getNapAm(day),
    dayCanChi: day,
    monthCanChi: month,
    relation: getCanChiRelation(day),
    mansion,
    officer,
    directions: getTravelDirections(day.can),
    dayClashes: getDayClashes(day),
    monthClashes: getMonthClashes(month),
    stars: getStars({
      lunarMonth: lunar.month,
      lunarDay: lunar.day,
      can: day.can,
      chi: day.chi,
      canChi: sexagenaryIndex(day),
      officer: officer.index,
      mansion: mansion.index,
    }),
    hours: getAllHours(jd, day.chi),
  }

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(date, almanac)
  return almanac
}
