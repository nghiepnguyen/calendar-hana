import type { SolarDateString } from '../types'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { getSolarMonth, SOLAR_TERM_METHOD, solarTermMonthChi } from './solarTerms'

export const THU_TU_AUTHORITY_ID = 'thu-tu-authority-v1' as const
export const THU_TU_MONTH_BASIS = 'MONTH_JIAN' as const

/** Project branch encoding: 0=Tý ... 11=Hợi. Indexed by Month Jian branch. */
const THU_TU_DAY_BRANCH_BY_MONTH_JIAN: readonly number[] = [
  3,  // Tý -> Mão
  9,  // Sửu -> Dậu
  10, // Dần -> Tuất
  4,  // Mão -> Thìn
  11, // Thìn -> Hợi
  5,  // Tỵ -> Tỵ
  0,  // Ngọ -> Tý
  6,  // Mùi -> Ngọ
  1,  // Thân -> Sửu
  7,  // Dậu -> Mùi
  2,  // Tuất -> Dần
  8,  // Hợi -> Thân
] as const

function assertBranch(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0 || value > 11)
    throw new RangeError(`Expected ${label} branch 0..11`)
}

/** Source-locked 受死 rule: Month Jian branch + day branch. */
export function getThuTuDayBranchByMonthJian(monthJianBranch: number): number {
  assertBranch(monthJianBranch, 'Month Jian')
  return THU_TU_DAY_BRANCH_BY_MONTH_JIAN[monthJianBranch]!
}

export function isThuTuByMonthJian(monthJianBranch: number, dayBranch: number): boolean {
  assertBranch(dayBranch, 'day')
  return dayBranch === getThuTuDayBranchByMonthJian(monthJianBranch)
}

/** Exact-instant Month Jian path. The day operand is the local civil date in the requested timezone. */
export function getThuTuAtInstant(dateTime: string, timezone: string) {
  const monthJianBranch = getSolarMonth(dateTime, timezone)
  const instant = new Date(dateTime)
  if (Number.isNaN(instant.getTime())) throw new RangeError(`Invalid dateTime: ${dateTime}`)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const part = (type: 'year' | 'month' | 'day') => parts.find((x) => x.type === type)?.value
  const localDate = `${part('year')}-${part('month')}-${part('day')}` as SolarDateString
  const jd = solarStringToJd(localDate)
  const dayBranch = dayCanChi(jd).chi
  return {
    authorityId: THU_TU_AUTHORITY_ID,
    monthBasis: THU_TU_MONTH_BASIS,
    monthJianBranch,
    dayBranch,
    targetDayBranch: getThuTuDayBranchByMonthJian(monthJianBranch),
    applies: isThuTuByMonthJian(monthJianBranch, dayBranch),
    astronomyMethod: SOLAR_TERM_METHOD,
  }
}

/** Civil-day presentation follows the project's established whole-day Month Jian convention. */
export function getThuTuForDate(date: SolarDateString) {
  const jd = solarStringToJd(date)
  const monthJianBranch = solarTermMonthChi(jd)
  const dayBranch = dayCanChi(jd).chi
  return {
    authorityId: THU_TU_AUTHORITY_ID,
    monthBasis: THU_TU_MONTH_BASIS,
    monthJianBranch,
    dayBranch,
    targetDayBranch: getThuTuDayBranchByMonthJian(monthJianBranch),
    applies: isThuTuByMonthJian(monthJianBranch, dayBranch),
  }
}
