// Solar-term boundaries on the TT axis from the ERFA apparent-Sun model.
//
// Canonical boundary semantics (zero tolerance):
//   T = the first integer TT millisecond (since J2000.0 TT) at or after the
//       numerical crossing, i.e. the smallest integer t with
//       residual(t) = wrap(longitude(t) - target) >= 0.
//   An instant t belongs to the previous term when t < T and to the new term
//   when t >= T. T - 1 ms is OLD; T and T + 1 ms are NEW.
// No epsilon participates anywhere: the solver works on the integer grid and
// keeps the exact bracket invariant residual(lo) < 0 <= residual(hi).

import { apparentSunTrueEclipticOfDate, MS_PER_DAY } from './apparentSun'

/** Indexed by target longitude / 15; 0 = Xuân phân (0°). Mirrors the production order. */
export const ERFA_SOLAR_TERM_IDS = [
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

export const ERFA_SOLAR_TERM_NAMES = [
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

/** Public calendar range is 1900–2100; 1899 and 2101 are internal padding. */
export const ERFA_SOLAR_TERM_YEAR_RANGE = { min: 1899, max: 2101 } as const
/** J2000.0 TT (JD 2451545.0 TT) read on the TT clock: 2000-01-01T12:00:00.000 TT. */
export const J2000_TT_CLOCK_EPOCH_MS = 946728000000
/** Bracket half-width around the calendar estimate. The estimate is within
 * ~3 days of every crossing in range; residuals stay within ±15° inside it. */
const BRACKET_HALF_WIDTH_MS = 10 * MS_PER_DAY
const MAX_ITERATIONS = 200

export type SolarTermRootErrorCode =
  'UNSUPPORTED_YEAR' | 'INVALID_TERM' | 'UNBRACKETED' | 'NO_CONVERGENCE' | 'OUT_OF_RANGE'

export class SolarTermRootError extends Error {
  readonly code: SolarTermRootErrorCode
  constructor(code: SolarTermRootErrorCode, message: string) {
    super(`${code}: ${message}`)
    this.name = 'SolarTermRootError'
    this.code = code
  }
}

export interface ErfaSolarTermBoundary {
  /** Gregorian year (TT clock) whose January–December sequence contains the crossing. */
  readonly year: number
  /** 0 = Xuân phân; equals targetLongitudeDeg / 15. */
  readonly termIndex: number
  readonly id: (typeof ERFA_SOLAR_TERM_IDS)[number]
  readonly name: (typeof ERFA_SOLAR_TERM_NAMES)[number]
  /** Exact multiple of 15°. */
  readonly targetLongitudeDeg: number
  /** Canonical T: integer TT milliseconds since J2000.0 TT. */
  readonly ttMs: number
  /** eraEpv00 range warning (only possible for padding years). */
  readonly outsideNominalRange: boolean
}

/** Exact 15° target for a term index. */
export function solarTermTargetLongitude(termIndex: number): number {
  if (!Number.isInteger(termIndex) || termIndex < 0 || termIndex > 23)
    throw new SolarTermRootError('INVALID_TERM', `term index ${termIndex}`)
  return termIndex * 15
}

/** Signed angular residual longitude - target, wrapped into [-180, 180). */
export function longitudeResidualDeg(longitudeDeg: number, targetDeg: number): number {
  let r = longitudeDeg - targetDeg
  if (r >= 180) r -= 360
  else if (r < -180) r += 360
  return r
}

function residualAt(ttMs: number, targetDeg: number): number {
  return longitudeResidualDeg(apparentSunTrueEclipticOfDate(ttMs).longitudeDeg, targetDeg)
}

/** Calendar seed: TT Jan 1 + 5 days + mean motion from Tiểu hàn (285°). */
function seedMs(year: number, targetDeg: number): number {
  const jan1 = Date.UTC(year, 0, 1) - J2000_TT_CLOCK_EPOCH_MS
  const days = 5 + (((targetDeg - 285 + 360) % 360) / 360) * 365.2422
  return jan1 + Math.floor(days * MS_PER_DAY)
}

/** Integer-grid bracketed solve. Illinois false position with forced bisection
 * whenever the bracket fails to halve within three steps. Deterministic: every
 * operation is IEEE-754 basic arithmetic or floor on exactly representable ints. */
function solveBoundary(
  targetDeg: number,
  loStart: number,
  hiStart: number,
): { ttMs: number; iterations: number } {
  let lo = loStart
  let hi = hiStart
  let flo = residualAt(lo, targetDeg)
  let fhi = residualAt(hi, targetDeg)
  if (!(flo < 0 && fhi >= 0))
    throw new SolarTermRootError(
      'UNBRACKETED',
      `target ${targetDeg}° not bracketed (${flo}, ${fhi})`,
    )
  let side = 0
  let iterations = 0
  let widthCheckpoint = hi - lo
  let stepsSinceHalving = 0
  while (hi - lo > 1) {
    if (++iterations > MAX_ITERATIONS)
      throw new SolarTermRootError('NO_CONVERGENCE', `target ${targetDeg}°`)
    const width = hi - lo
    let m: number
    if (stepsSinceHalving >= 3) {
      m = lo + Math.floor(width / 2)
    } else {
      m = lo + Math.floor((-flo / (fhi - flo)) * width)
      if (m <= lo) m = lo + 1
      else if (m >= hi) m = hi - 1
    }
    const fm = residualAt(m, targetDeg)
    if (fm >= 0) {
      hi = m
      fhi = fm
      if (side === 1) flo /= 2
      side = 1
    } else {
      lo = m
      flo = fm
      if (side === -1) fhi /= 2
      side = -1
    }
    if (hi - lo <= widthCheckpoint / 2) {
      widthCheckpoint = hi - lo
      stepsSinceHalving = 0
    } else stepsSinceHalving++
  }
  return { ttMs: hi, iterations }
}

/** Canonical boundary for one (year, term). */
export function solveErfaSolarTermBoundary(year: number, termIndex: number): ErfaSolarTermBoundary {
  if (
    !Number.isInteger(year) ||
    year < ERFA_SOLAR_TERM_YEAR_RANGE.min ||
    year > ERFA_SOLAR_TERM_YEAR_RANGE.max
  )
    throw new SolarTermRootError('UNSUPPORTED_YEAR', String(year))
  const targetLongitudeDeg = solarTermTargetLongitude(termIndex)
  const seed = seedMs(year, targetLongitudeDeg)
  const { ttMs } = solveBoundary(
    targetLongitudeDeg,
    seed - BRACKET_HALF_WIDTH_MS,
    seed + BRACKET_HALF_WIDTH_MS,
  )
  return Object.freeze({
    year,
    termIndex,
    id: ERFA_SOLAR_TERM_IDS[termIndex]!,
    name: ERFA_SOLAR_TERM_NAMES[termIndex]!,
    targetLongitudeDeg,
    ttMs,
    outsideNominalRange: apparentSunTrueEclipticOfDate(ttMs).outsideNominalRange,
  })
}

const yearCache = new Map<number, readonly ErfaSolarTermBoundary[]>()
const YEAR_CACHE_LIMIT = 32

/** The 24 boundaries of a year in order Tiểu hàn (285°) … Đông chí (270°).
 * Deterministic memoisation of the canonical engine; no stored timestamps. */
export function erfaSolarTermsForYear(year: number): readonly ErfaSolarTermBoundary[] {
  const cached = yearCache.get(year)
  if (cached) return cached
  const roots = Object.freeze(
    Array.from({ length: 24 }, (_, offset) => solveErfaSolarTermBoundary(year, (19 + offset) % 24)),
  )
  for (let i = 1; i < roots.length; i++)
    if (!(roots[i]!.ttMs > roots[i - 1]!.ttMs))
      throw new SolarTermRootError('NO_CONVERGENCE', `non-monotone sequence in ${year}`)
  if (yearCache.size >= YEAR_CACHE_LIMIT) yearCache.delete(yearCache.keys().next().value!)
  yearCache.set(year, roots)
  return roots
}

/** Active term at an integer TT millisecond: last boundary with T <= t. */
export function erfaSolarTermAtTT(ttMs: number): ErfaSolarTermBoundary {
  if (!Number.isInteger(ttMs)) throw new RangeError('Expected integer TT milliseconds')
  const year = new Date(ttMs + J2000_TT_CLOCK_EPOCH_MS).getUTCFullYear()
  if (year < ERFA_SOLAR_TERM_YEAR_RANGE.min + 1 || year > ERFA_SOLAR_TERM_YEAR_RANGE.max)
    throw new SolarTermRootError('OUT_OF_RANGE', `TT year ${year}`)
  const active = erfaSolarTermsForYear(year)
    .filter((boundary) => boundary.ttMs <= ttMs)
    .at(-1)
  return active ?? erfaSolarTermsForYear(year - 1).at(-1)!
}
