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
import { getSourceLockedCatHungPresence, getSourceLockedCatHungStarsForDate } from './catHungStars'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { KEEP_LEGACY_TRIGRAM_TIAN_DE } from './tianDeLegacyPolicy'
import { solarTermMonthChi } from './solarTerms'
import { getThuTuForDate } from './thuTuAuthority'
import { resolveDayRuleGodPresence, resolveDayRuleGods, resolvePresentGods } from './godMapping'
import { isThoVuongDungSu } from './thoVuongDungSu'
import { getXiejiGodPresence, LEGACY_LUNAR_GOD_IDS } from './xiejiGodPresence'
import { STARS } from './stars.data'
import manifest from '../almanac-data/manifest.json'
import goodGodsData from '../almanac-data/good-gods.json'
import badGodsData from '../almanac-data/bad-gods.json'
import { ENGINE_VERSION } from './evidence'
import { getActivityRecommendations, type ActivityRecommendation } from './activityRecommendations'
import { getP4Headings, P4_DORMANT_GODS, p4BalancingReady } from './p4ScoreAdapter'

// Lunar day-table names proven equal to a dormant god (docs/audits/dormant-legacy-gods.md finding 3).
const DORMANT_ALIASES: Record<string, string> = {
  pho_ho: 'Phổ Hộ (Hội Hộ)',
  tai_sat: 'Phi Ma Sát (Tai Sát)',
  nguyet_sat: 'Nguyệt Hư (Nguyệt Sát)',
  nguyet_yem: 'Nguyệt Yếm Đại Hoạ',
  vang_vong: 'Vãng Vong (Thổ Kỵ)',
}

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
  /** Numeric operands for evidence diagnostics (no scoring use). */
  selectionContext: Record<string, number>
  /** Gods present by a source-locked or cited day rule; and gods whose presence is undecidable today. */
  auditedGodIds: string[]
  unknownGodIds: string[]
}

const CACHE_LIMIT = 2000
const ALWAYS_SOURCE_LOCKED = new Set<string>([
  'Nguyệt Đức',
  'Nguyệt Đức Hợp',
  'Nguyệt Phá',
  'Kiếp Sát',
])
// Month Jian stars keep the day-table position of the legacy row they replace (the UI shows the first
// five stars before “xem thêm”).
const STAR_RANK = new Map(STARS.map((star, i) => [star.name, i]))
const inTableOrder = (stars: Star[]) =>
  [...stars].sort((a, b) => STAR_RANK.get(a.name)! - STAR_RANK.get(b.name)!)
const THU_TU_NAME = 'Thụ Tử'
const THU_TU_MEANING = 'Trăm sự đều kỵ'

/** Cached per almanac dataset, engine, solar-term authority and clock version. */
export function getAlmanac(date: SolarDateString): Almanac {
  // Roadmap 10 A1: an almanac computed before the P4 provider loaded must not be served after it.
  const cacheKey = `${manifest.datasetVersion}:${ENGINE_VERSION}:${date}${p4BalancingReady(date) ? ':p4' : ''}`
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

  // Tian De/Tian De He always come from the authority. On the four trigram rows (坤/乾/艮/巽)
  // they fall on no day: the 協紀 月表 lists 天德 on no day page of those months (issue #19).
  const replaceNames = new Set<string>(ALWAYS_SOURCE_LOCKED)
  replaceNames.add(THU_TU_NAME)
  const tianDeDirect = /^[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]$/.test(
    getCatHungAuthorityByMonthJian(solarTermMonthChi(jd)).tianDe,
  )
  if (tianDeDirect || !KEEP_LEGACY_TRIGRAM_TIAN_DE) {
    replaceNames.add('Thiên Đức')
    replaceNames.add('Thiên Đức Hợp')
  }

  // 14 legacy gods: the day-table rows equal the 協紀 rule, but 協紀 reads them on Month Jian, not the
  // lunar month (docs/audits/dormant-legacy-gods.md). Replace their lunar-month stars.
  const monthJianStars: Star[] = []
  const monthJianPresence: Record<string, { operand: string; equals: number }[]> = {}
  const balancing = manifest.policies.xiejiVol10BalancingEnabled && p4BalancingReady(date)
  const present = getXiejiGodPresence(solarTermMonthChi(jd), day.can, day.chi)
  // Roadmap 8, flag ON only: the 21 dormant gods on Month Jian, after legacy stars in catalog order;
  // their lunar-table alias stars are replaced like the legacy 14.
  const dormantStars: Star[] = []
  if (balancing)
    for (const god of [...goodGodsData.items, ...badGodsData.items]) {
      if (!P4_DORMANT_GODS.has(god.id)) continue
      const alias = DORMANT_ALIASES[god.id]
      if (alias) replaceNames.add(alias)
      if (!present[god.id]) continue
      const isGood = goodGodsData.items.includes(god as never)
      const meaning = alias ? STARS.find((star) => star.name === alias)!.meaning : ''
      dormantStars.push({ name: god.label, isGood, meaning })
      monthJianPresence[god.id] = present[god.id]!
    }
  if (manifest.policies.legacyGodsMonthJian) {
    for (const god of [...goodGodsData.items, ...badGodsData.items]) {
      if (!LEGACY_LUNAR_GOD_IDS.includes(god.id)) continue
      replaceNames.add(god.label)
      if (!present[god.id]) continue
      const legacy = STARS.find((star) => star.name === god.label)!
      monthJianStars.push({ name: legacy.name, isGood: legacy.isGood, meaning: legacy.meaning })
      monthJianPresence[god.id] = present[god.id]!
    }
  }

  const authorityBadStars: Star[] = thuTu.applies
    ? [{ name: THU_TU_NAME, isGood: false, meaning: THU_TU_MEANING }]
    : []
  const stars = {
    good: [
      ...inTableOrder([
        ...legacyStars.good.filter((star) => !replaceNames.has(star.name)),
        ...monthJianStars.filter((star) => star.isGood),
      ]),
      ...lockedStars.good,
      ...dormantStars.filter((star) => star.isGood),
    ],
    bad: [
      ...inTableOrder([
        ...legacyStars.bad.filter((star) => !replaceNames.has(star.name)),
        ...monthJianStars.filter((star) => !star.isGood),
      ]),
      ...lockedStars.bad,
      ...authorityBadStars,
      ...dormantStars.filter((star) => !star.isGood),
    ],
  }

  const gods = resolvePresentGods(stars)
  const ruleDay = {
    can: day.can,
    chi: day.chi,
    lunarDay: lunar.day,
    thoVuongDungSu: isThoVuongDungSu(date),
  }
  const dayGods = resolveDayRuleGods(ruleDay)
  // Presence operands only for gods whose presence is source-locked or a cited day rule; legacy
  // lunar-month stars get none and stay out of conflict diagnostics.
  const monthJianBranch = solarTermMonthChi(jd)
  const godIdByLabel = new Map(
    [...goodGodsData.items, ...badGodsData.items].map((g) => [g.label, g.id]),
  )
  const godPresence: Record<string, { operand: string; equals: number }[]> = {
    ...resolveDayRuleGodPresence(ruleDay),
    ...monthJianPresence,
  }
  for (const { name, conditions } of getSourceLockedCatHungPresence(
    monthJianBranch,
    day.can,
    day.chi,
  )) {
    const id = godIdByLabel.get(name)
    if (id) godPresence[id] = conditions
  }
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
      godPresence,
      classicalDay: { monthJianBranch, dayStem: day.can, dayBranch: day.chi },
      xiejiVol10BalancingEnabled: balancing,
      ...(balancing
        ? {
            p4Headings: getP4Headings(date, {
              monthJianBranch,
              dayStem: day.can,
              dayBranch: day.chi,
              lunarDay: lunar.day,
            }),
          }
        : {}),
    }).map((row) => ({ ...row, warnings: [...row.warnings, ...gods.warnings] })),
    hours: getAllHours(jd, day.chi),
    auditedGodIds: Object.keys(godPresence),
    // Trigram 天德 tokens (坤/乾/艮/巽) fall on no day: the 協紀 月表 lists no 天德 day in those
    // months, and 天德合 is absent there (卷五: 四仲之月天徳居四維故無合也).
    unknownGodIds: [],
    selectionContext: {
      MANSION_INDEX: mansion.index,
      OFFICER_INDEX: officer.index,
      MONTH_JIAN_BRANCH: monthJianBranch,
      DAY_STEM: day.can,
      DAY_BRANCH: day.chi,
      LUNAR_DAY: lunar.day,
      THO_VUONG_DUNG_SU: ruleDay.thoVuongDungSu ? 1 : 0,
    },
  }
  return almanac
}
