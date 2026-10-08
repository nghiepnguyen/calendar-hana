import type { ClockRegime } from './clock'

/** One canonical crossing from the frozen JPL authority (golden-v4). */
export interface CanonicalSolarTermBoundary {
  /** Authority row year: terms 19 (Tiểu hàn) … 18 (Đông chí) of this civil year. */
  readonly year: number
  /** longitude / 15, 0 = Xuân phân. */
  readonly termIndex: number
  readonly targetLongitudeDeg: number
  /** Canonical T: first integer TT ms since J2000.0 TT at or after the root. */
  readonly ttMs: number
  /** clock-v1: first civil POSIX ms at or after T. */
  readonly civilEpochMs: number
  readonly civilIso: string
  readonly clockRegime: ClockRegime
}

export type SolarTermAuthorityErrorCode =
  'VERSION_MISMATCH' | 'HASH_MISMATCH' | 'MALFORMED' | 'OUT_OF_RANGE'

/** Fail-closed error: there is no fallback boundary source. */
export class SolarTermAuthorityError extends Error {
  readonly code: SolarTermAuthorityErrorCode
  constructor(code: SolarTermAuthorityErrorCode, message: string) {
    super(`${code}: ${message}`)
    this.name = 'SolarTermAuthorityError'
    this.code = code
  }
}
