// ERFA solar-term foundation (Phase 3B.4.3). Isolated: no production consumer
// imports this module yet. See ./model.ts for the versioned model identity.

import { ttToCivil, serializeEpochMs, CLOCK_POLICY_ID, type ClockRegime } from './clockV1'
import {
  erfaSolarTermAtTT,
  erfaSolarTermsForYear,
  J2000_TT_CLOCK_EPOCH_MS,
  type ErfaSolarTermBoundary,
} from './solarTermRoots'

export { ERFA_SOLAR_TERM_MODEL } from './model'
export { apparentSunTrueEclipticOfDate } from './apparentSun'
export type { ApparentSunTrueEclipticOfDate } from './apparentSun'
export * from './solarTermRoots'
export * from './clockV1'

export interface SerializedSolarTermBoundary {
  readonly year: number
  readonly termIndex: number
  readonly id: string
  readonly targetLongitudeDeg: number
  readonly ttMs: number
  readonly clockPolicy: typeof CLOCK_POLICY_ID
  readonly clockRegime: ClockRegime
  readonly civilEpochMs: number
  readonly civilIso: string
}

/** Boundary with its clock-v1 civil serialization. */
export function serializeBoundary(boundary: ErfaSolarTermBoundary): SerializedSolarTermBoundary {
  const civil = ttToCivil(boundary.ttMs)
  return {
    year: boundary.year,
    termIndex: boundary.termIndex,
    id: boundary.id,
    targetLongitudeDeg: boundary.targetLongitudeDeg,
    ttMs: boundary.ttMs,
    clockPolicy: civil.clockPolicy,
    clockRegime: civil.regime,
    civilEpochMs: civil.epochMs,
    civilIso: serializeEpochMs(civil.epochMs),
  }
}

/** Active term at an integer civil epoch ms: last boundary whose civil T <= t.
 * Civil T is the first civil ms at or after the TT boundary, so for every civil
 * instant c: c >= civil(T) exactly when its TT image is at or after T. */
export function erfaSolarTermAtCivil(epochMs: number): ErfaSolarTermBoundary {
  if (!Number.isInteger(epochMs)) throw new RangeError('Expected integer epoch milliseconds')
  const year = new Date(epochMs).getUTCFullYear()
  const candidates = [...erfaSolarTermsForYear(year - 1), ...erfaSolarTermsForYear(year)]
  const active = candidates.filter((b) => ttToCivil(b.ttMs).epochMs <= epochMs).at(-1)
  if (!active) throw new RangeError('No active solar term')
  return active
}

/** TT clock reading for a TT ms offset, for diagnostics only. */
export function ttClockIso(ttMs: number): string {
  return serializeEpochMs(ttMs + J2000_TT_CLOCK_EPOCH_MS).replace('Z', ' TT')
}

export { erfaSolarTermAtTT }
