// 24 tiết khí, mỗi tiết khí ứng với 15° kinh độ Mặt Trời.

import { SearchSunLongitude } from 'astronomy-engine'
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

export const SOLAR_TERM_METHOD = 'astronomy-engine-search-sun-longitude-v1'

export interface SolarTermInstant {
  readonly id: (typeof TERM_IDS)[number]
  readonly index: number
  readonly name: (typeof SOLAR_TERMS)[number]
  readonly longitude: number
  readonly instantUtc: string
}

const yearCache = new Map<number, readonly SolarTermInstant[]>()
const YEAR_CACHE_LIMIT = 16

/** All 24 crossings in a Gregorian UTC year, ordered from Tiểu hàn to Đông chí.
 * Adjacent years support calendar / Bazi boundaries; public calendar supports 1900–2100.
 */
export function solarTermsForYear(year: number): readonly SolarTermInstant[] {
  if (!Number.isInteger(year) || year < 1899 || year > 2101)
    throw new RangeError('Unsupported solar term year')
  const cached = yearCache.get(year)
  if (cached) return cached
  let start = new Date(Date.UTC(year, 0, 1))
  const terms = Array.from({ length: 24 }, (_, offset) => {
    const index = (19 + offset) % 24
    const longitude = index * 15
    const found = SearchSunLongitude(longitude, start, 20)
    if (!found) throw new Error(`Cannot find solar term ${longitude} in ${year}`)
    start = new Date(found.date.getTime() + 1000)
    return Object.freeze({
      id: TERM_IDS[index],
      index,
      name: SOLAR_TERMS[index],
      longitude,
      instantUtc: found.date.toISOString(),
    })
  })
  if (yearCache.size >= YEAR_CACHE_LIMIT) yearCache.delete(yearCache.keys().next().value!)
  const result = Object.freeze(terms)
  yearCache.set(year, result)
  return result
}

/** Active term at an absolute instant. A crossing belongs to the new term. */
export function getSolarTermAt(instantUtc: string): SolarTermInstant {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instantUtc)) throw new RangeError('Expected zoned instant')
  const instant = Date.parse(instantUtc)
  if (!Number.isFinite(instant)) throw new RangeError('Invalid instant')
  const year = new Date(instant).getUTCFullYear()
  const active = solarTermsForYear(year)
    .filter((t) => Date.parse(t.instantUtc) <= instant)
    .at(-1)
  return active ?? solarTermsForYear(year - 1).at(-1)!
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
  const { index } = getSolarTerm(jd)
  return ((Math.floor((index - 21 + 24) / 2) % 12) + 2) % 12
}
