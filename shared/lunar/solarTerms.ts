// 24 tiết khí, mỗi tiết khí ứng với 15° kinh độ Mặt Trời.
// Boundaries come from the canonical JPL authority table (shared/astronomy/solarTerms).

import {
  getCanonicalSolarTermAt,
  getCanonicalSolarTermsForYear,
  memoizeSolarTermDerived,
  monthJianBranchForTermIndex,
  SOLAR_TERM_AUTHORITY,
  type CanonicalSolarTermBoundary,
} from '../astronomy/solarTerms'
import { TIME_ZONE_OFFSET } from './lunar'

/** Tên tiết khí theo thứ tự kinh độ Mặt Trời 0°, 15°, 30°... (0° = Xuân phân). */
export const SOLAR_TERMS = [
  'Xuân phân',
  'Thanh minh',
  'Cốc vũ',
  'Lập hạ',
  'Tiểu mãn',
  'Mang chủng',
  'Hạ chí',
  'Tiểu thử',
  'Đại thử',
  'Lập thu',
  'Xử thử',
  'Bạch lộ',
  'Thu phân',
  'Hàn lộ',
  'Sương giáng',
  'Lập đông',
  'Tiểu tuyết',
  'Đại tuyết',
  'Đông chí',
  'Tiểu hàn',
  'Đại hàn',
  'Lập xuân',
  'Vũ thủy',
  'Kinh trập',
] as const

/** Stable identifiers, aligned with SOLAR_TERMS and longitude / 15. */
const TERM_IDS = [
  'xuan-phan',
  'thanh-minh',
  'coc-vu',
  'lap-ha',
  'tieu-man',
  'mang-chung',
  'ha-chi',
  'tieu-thu',
  'dai-thu',
  'lap-thu',
  'xu-thu',
  'bach-lo',
  'thu-phan',
  'han-lo',
  'suong-giang',
  'lap-dong',
  'tieu-tuyet',
  'dai-tuyet',
  'dong-chi',
  'tieu-han',
  'dai-han',
  'lap-xuan',
  'vu-thuy',
  'kinh-trap',
] as const

/** Boundary source identity reported by solar-term consumers (authority + clock). */
export const SOLAR_TERM_METHOD = `jpl-de440s-table:${SOLAR_TERM_AUTHORITY.authorityVersion}:${SOLAR_TERM_AUTHORITY.clockVersion}`

export interface SolarTermInstant {
  readonly id: (typeof TERM_IDS)[number]
  readonly index: number
  readonly name: (typeof SOLAR_TERMS)[number]
  readonly longitude: number
  /** clock-v1 civil instant of the canonical boundary, 3 fractional digits. */
  readonly instantUtc: string
  /** Canonical T, integer TT ms since J2000.0 TT. */
  readonly ttMs: number
}

function toInstant(boundary: CanonicalSolarTermBoundary): SolarTermInstant {
  return Object.freeze({
    id: TERM_IDS[boundary.termIndex]!,
    index: boundary.termIndex,
    name: SOLAR_TERMS[boundary.termIndex]!,
    longitude: boundary.targetLongitudeDeg,
    instantUtc: boundary.civilIso,
    ttMs: boundary.ttMs,
  })
}

/** All 24 crossings in a Gregorian UTC year, ordered from Tiểu hàn to Đông chí.
 * Adjacent years support calendar / Bazi boundaries; public calendar supports 1900–2100.
 * Source: the frozen JPL authority table only (no runtime astronomy, no fallback).
 */
export function solarTermsForYear(year: number): readonly SolarTermInstant[] {
  if (!Number.isInteger(year) || year < 1899 || year > 2101)
    throw new RangeError('Unsupported solar term year')
  return memoizeSolarTermDerived('solar-terms-for-year', String(year), 256, () =>
    Object.freeze(getCanonicalSolarTermsForYear(year).map(toInstant)),
  )
}

/** Active term at an absolute instant. A crossing belongs to the new term:
 * t < T is the old term, t >= T the new one, exact to the millisecond.
 */
export function getSolarTermAt(instantUtc: string): SolarTermInstant {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instantUtc)) throw new RangeError('Expected zoned instant')
  const instant = Date.parse(instantUtc)
  if (!Number.isFinite(instant)) throw new RangeError('Invalid instant')
  const active = getCanonicalSolarTermAt(instant)
  return solarTermsForYear(active.year)[(active.termIndex - 19 + 24) % 24]!
}

/** Active solar-month branch (0 = Tý), using the exact crossing instant.
 * dateTime must include Z or an explicit offset; timezone is an explicit IANA zone.
 * The month is global at a given instant; timezone determines the civil day for callers.
 * At a month-opening crossing the new month is active, never at midnight in advance.
 */
export function getSolarMonth(dateTime: string, timezone: string): number {
  if (typeof timezone !== 'string' || !timezone.trim())
    throw new RangeError('Expected explicit timezone')
  new Intl.DateTimeFormat('en', { timeZone: timezone })
  return monthJianBranchForTermIndex(getSolarTermAt(dateTime).index)
}

export interface SolarTermInfo {
  index: number
  name: string
  /** True when this term starts during this Vietnamese calendar day. */
  startsToday: boolean
  /** Start of the displayed term, including on non-transition days. */
  startsAtUtc: string
}

/** Calendar label uses the term immediately before the next Vietnamese midnight.
 * This intentionally labels the entire transition day with the new term.
 * Use getSolarTermAt for time-sensitive calculations such as Bazi.
 */
export function getSolarTerm(jd: number): SolarTermInfo {
  if (!Number.isInteger(jd)) throw new RangeError('Expected integer Julian day number')
  const startMs = (jd - 0.5 - TIME_ZONE_OFFSET / 24 - 2440587.5) * 86400000
  const start = Math.round(startMs)
  const end = start + 86400000
  const term = getSolarTermAt(new Date(end - 1).toISOString())
  const crossing = Date.parse(term.instantUtc)
  return {
    index: term.index,
    name: term.name,
    startsToday: crossing >= start && crossing < end,
    startsAtUtc: term.instantUtc,
  }
}

/** Calendar-day month branch: the whole crossing day uses the new month.
 * Bazi uses the exact crossing instant instead.
 */
export function solarTermMonthChi(jd: number): number {
  return monthJianBranchForTermIndex(getSolarTerm(jd).index)
}
