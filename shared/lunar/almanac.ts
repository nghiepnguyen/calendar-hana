// Thông tin lịch vạn niên đầy đủ của một ngày, dùng cho khối "Lịch vạn niên" ở xem Ngày.
//
// Tách riêng khỏi getDayInfo vì getDayInfo chạy cho mọi ô của xem Tháng, còn phần này chỉ cần
// cho ngày đang xem.

import { memoizeSolarTermDerived } from '../astronomy/solarTerms/cache'
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
import { getSourceLockedCatHungStarsForDate } from './catHungStars'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { solarTermMonthChi } from './solarTerms'
import { getThuTuForDate } from './thuTuAuthority'
import { resolveDayRuleGods, resolvePresentGods } from './godMapping'
import manifest from '../almanac-data/manifest.json'
import { ENGINE_VERSION } from './evidence'
import { getActivityRecommendations, type ActivityRecommendation } from './activityRecommendations'

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
  activityRecommendations: ActivityRecommendation[]
  /** Đủ 12 giờ, Tý..Hợi. */
  hours: DayHour[]
}

const CACHE_LIMIT = 2000
const ALWAYS_SOURCE_LOCKED = new Set<string>(['Nguyệt Đức', 'Nguyệt Đức Hợp', 'Nguyệt Phá', 'Kiếp Sát'])
const THU_TU_NAME = 'Thụ Tử'
const THU_TU_MEANING = 'Trăm sự đều kỵ'

/** Cached per almanac dataset, engine, solar-term authority and clock version. */
export function getAlmanac(date: SolarDateString): Almanac {
  const cacheKey = `${manifest.datasetVersion}:${ENGINE_VERSION}:${date}`
  return memoizeSolarTermDerived('almanac', cacheKey, CACHE_LIMIT, () => computeAlmanac(date))
}

function computeAlmanac(date: SolarDateString): Almanac {
  const info = getDayInfo(date)
  const { jd, lunar } = info
  const day = info.canChi.day
  const month = info.canChi.month
  const mansion = getMansion(jd)
  const officer = getOfficer(jd, day.chi)

  const legacyStars = getStars({
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    can: day.can,
    chi: day.chi,
    canChi: sexagenaryIndex(day),
    officer: officer.index,
    mansion: mansion.index,
  })
  const lockedStars = getSourceLockedCatHungStarsForDate(date)
  const thuTu = getThuTuForDate(date)

  // Four Tian De source rows use raw trigram/direction tokens (坤/乾/艮/巽). Until an
  // independent normalization authority is admitted, do not delete the corresponding legacy
  // Tian De/Tian De He identities on those rows. All directly expressed stem/branch rows migrate.
  const authorityRow = getCatHungAuthorityByMonthJian(solarTermMonthChi(jd))
  const tianDeDirect = /^[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]$/.test(authorityRow.tianDe)
  const replaceNames = new Set<string>(ALWAYS_SOURCE_LOCKED)
  replaceNames.add(THU_TU_NAME)
  if (tianDeDirect) {
    replaceNames.add('Thiên Đức')
    replaceNames.add('Thiên Đức Hợp')
  }

  const authorityBadStars: Star[] = thuTu.applies
    ? [{ name: THU_TU_NAME, good: false, meaning: THU_TU_MEANING }]
    : []
  const stars = {
    good: [...legacyStars.good.filter((star) => !replaceNames.has(star.name)), ...lockedStars.good],
    bad: [
      ...legacyStars.bad.filter((star) => !replaceNames.has(star.name)),
      ...lockedStars.bad,
      ...authorityBadStars,
    ],
  }

  const gods = resolvePresentGods(stars)
  const dayGods = resolveDayRuleGods({ can: day.can, chi: day.chi, lunarDay: lunar.day })
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
    stars,
    activityRecommendations: getActivityRecommendations({
      officerId: [
        'kien',
        'tru',
        'man',
        'binh',
        'dinh',
        'chap',
        'pha',
        'nguy',
        'thanh',
        'thu',
        'khai',
        'be',
      ][officer.index],
      mansion,
      presentGoodGods: [...gods.presentGoodGods, ...dayGods.presentGoodGods],
      presentBadGods: [...gods.presentBadGods, ...dayGods.presentBadGods],
    }).map((row) => ({ ...row, warnings: [...row.warnings, ...gods.warnings] })),
    hours: getAllHours(jd, day.chi),
  }
  return almanac
}
