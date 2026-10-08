// clock-v1: versioned mapping from canonical TT boundaries to the project's
// civil/POSIX millisecond axis. Kept separate from the TT-root authority.
//
// Regimes (by the resulting civil instant):
//   PRE1972_MODELED_UT1        before 1972-01-01T00:00:00Z: modeled historical
//                              civil time = UT1 from the Espenak–Meeus (2006)
//                              Delta-T polynomials, with Astronomy Engine 2.1.19's
//                              continuous-year argument. NOT exact physical UTC.
//   UTC_LEAP_HISTORY           1972-01-01 .. KNOWN_THROUGH: UTC from the frozen
//                              IERS leap-second table; TT − TAI = 32.184 s.
//   PROJECTED_PINNED_TAI_UTC   after KNOWN_THROUGH: TAI − UTC pinned at 37 s. A
//                              project convention, not a promise of future UTC.
// Leap seconds: an instant inside an inserted 23:59:60 second has no POSIX
// representation; clock-v1 rejects it (LEAP_SECOND_UNREPRESENTABLE).
// Serialization: integer epoch ms = first civil ms at or after the TT boundary
// (ceil); ISO-8601 with exactly 3 fractional digits.

import { J2000_TT_CLOCK_EPOCH_MS } from './solarTermRoots'

export const CLOCK_POLICY_ID = 'clock-v1'

/** IERS leap-second history: [UTC start (YYYY, M), TAI − UTC from then, s].
 * Source: IERS Leap_Second.dat (Bulletin C 72, July 2026) and IANA
 * leap-seconds.list (expires 2027-06-28); both archived with the audit. */
const LEAP_TABLE: readonly (readonly [number, number, number])[] = [
  [1972, 1, 10],
  [1972, 7, 11],
  [1973, 1, 12],
  [1974, 1, 13],
  [1975, 1, 14],
  [1976, 1, 15],
  [1977, 1, 16],
  [1978, 1, 17],
  [1979, 1, 18],
  [1980, 1, 19],
  [1981, 7, 20],
  [1982, 7, 21],
  [1983, 7, 22],
  [1985, 7, 23],
  [1988, 1, 24],
  [1990, 1, 25],
  [1991, 1, 26],
  [1992, 7, 27],
  [1993, 7, 28],
  [1994, 7, 29],
  [1996, 1, 30],
  [1997, 7, 31],
  [1999, 1, 32],
  [2006, 1, 33],
  [2009, 1, 34],
  [2012, 7, 35],
  [2015, 7, 36],
  [2017, 1, 37],
]

/** Expiry of the pinned leap-second files: civil instants at or after this are
 * labelled as projected under the pinned TAI − UTC. */
export const CLOCK_V1_KNOWN_THROUGH_UTC_MS = Date.UTC(2027, 5, 28)
const TT_MINUS_TAI_MS = 32184

const LEAPS = LEAP_TABLE.map(([year, month, taiMinusUtc]) => {
  const utcStartMs = Date.UTC(year, month - 1, 1)
  return { utcStartMs, offsetMs: TT_MINUS_TAI_MS + taiMinusUtc * 1000 }
})
const FIRST_LEAP = LEAPS[0]!
/** TT clock reading at 1972-01-01T00:00:00Z. */
const UTC_ERA_START_TT_CLOCK_MS = FIRST_LEAP.utcStartMs + FIRST_LEAP.offsetMs

export type ClockRegime = 'PRE1972_MODELED_UT1' | 'UTC_LEAP_HISTORY' | 'PROJECTED_PINNED_TAI_UTC'

export class ClockPolicyError extends Error {
  readonly code: 'LEAP_SECOND_UNREPRESENTABLE' | 'OUT_OF_RANGE'
  constructor(code: 'LEAP_SECOND_UNREPRESENTABLE' | 'OUT_OF_RANGE', message: string) {
    super(`${code}: ${message}`)
    this.name = 'ClockPolicyError'
    this.code = code
  }
}

const DAYS_PER_TROPICAL_YEAR = 365.24217

/** Espenak–Meeus Delta-T (s) for 1860 <= y < 1986, y = 2000 + (ut − 14) / 365.24217,
 * ut = UT days since J2000. Same polynomials and argument as astronomy-engine 2.1.19
 * DeltaT_EspenakMeeus (MIT); only the pre-1972 range is used by clock-v1. */
export function deltaTEspenakMeeusSeconds(utDaysSinceJ2000: number): number {
  const y = 2000 + (utDaysSinceJ2000 - 14) / DAYS_PER_TROPICAL_YEAR
  let u: number, u2: number, u3: number, u4: number, u5: number
  if (y < 1860 || y >= 1986) throw new ClockPolicyError('OUT_OF_RANGE', `Delta-T year ${y}`)
  if (y < 1900) {
    u = y - 1860
    u2 = u * u
    u3 = u * u2
    u4 = u2 * u2
    u5 = u2 * u3
    return 7.62 + 0.5737 * u - 0.251754 * u2 + 0.01680668 * u3 - 0.0004473624 * u4 + u5 / 233174
  }
  if (y < 1920) {
    u = y - 1900
    u2 = u * u
    u3 = u * u2
    u4 = u2 * u2
    return -2.79 + 1.494119 * u - 0.0598939 * u2 + 0.0061966 * u3 - 0.000197 * u4
  }
  if (y < 1941) {
    u = y - 1920
    u2 = u * u
    u3 = u * u2
    return 21.2 + 0.84493 * u - 0.0761 * u2 + 0.0020936 * u3
  }
  if (y < 1961) {
    u = y - 1950
    u2 = u * u
    u3 = u * u2
    return 29.07 + 0.407 * u - u2 / 233 + u3 / 2547
  }
  u = y - 1975
  u2 = u * u
  u3 = u * u2
  return 45.45 + 1.067 * u - u2 / 260 - u3 / 718
}

export interface CivilInstant {
  readonly clockPolicy: typeof CLOCK_POLICY_ID
  readonly regime: ClockRegime
  /** Integer POSIX milliseconds (first civil ms at or after the TT instant). */
  readonly epochMs: number
}

/** Map integer TT ms since J2000.0 TT to the clock-v1 civil axis. */
export function ttToCivil(ttMs: number): CivilInstant {
  if (!Number.isInteger(ttMs)) throw new RangeError('Expected integer TT milliseconds')
  const ttClockMs = ttMs + J2000_TT_CLOCK_EPOCH_MS
  if (ttClockMs < UTC_ERA_START_TT_CLOCK_MS) {
    // UT1 = TT − ΔT(UT1): fixed-count fixed-point iteration (ΔT' ~ 1e-9, converges at once).
    let utMs = ttMs
    for (let i = 0; i < 6; i++) utMs = ttMs - deltaTEspenakMeeusSeconds(utMs / 86400000) * 1000
    return {
      clockPolicy: CLOCK_POLICY_ID,
      regime: 'PRE1972_MODELED_UT1',
      epochMs: Math.ceil(utMs + J2000_TT_CLOCK_EPOCH_MS),
    }
  }
  let k = 0
  while (k + 1 < LEAPS.length && ttClockMs >= LEAPS[k + 1]!.utcStartMs + LEAPS[k + 1]!.offsetMs) k++
  const epochMs = ttClockMs - LEAPS[k]!.offsetMs
  const next = LEAPS[k + 1]
  if (next && epochMs >= next.utcStartMs)
    throw new ClockPolicyError(
      'LEAP_SECOND_UNREPRESENTABLE',
      `TT ${ttMs} falls inside the leap second before ${new Date(next.utcStartMs).toISOString()}`,
    )
  return {
    clockPolicy: CLOCK_POLICY_ID,
    regime:
      epochMs >= CLOCK_V1_KNOWN_THROUGH_UTC_MS ? 'PROJECTED_PINNED_TAI_UTC' : 'UTC_LEAP_HISTORY',
    epochMs,
  }
}

/** ISO-8601 UTC with exactly three fractional digits. */
export function serializeEpochMs(epochMs: number): string {
  if (!Number.isInteger(epochMs)) throw new RangeError('Expected integer epoch milliseconds')
  const iso = new Date(epochMs).toISOString()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso))
    throw new RangeError(`Unexpected ISO form ${iso}`)
  return iso
}
