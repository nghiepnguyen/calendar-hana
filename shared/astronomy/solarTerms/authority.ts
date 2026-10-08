// Canonical solar-term boundary authority (Phase 3B.4.4B, decision D1 option B).
//
// The only production source of solar-term / Jie boundaries: the reviewed,
// frozen JPL DE440s table (golden-v4), shipped as hash-pinned data. Nothing is
// computed or fetched here. clock-v1 maps each TT boundary to the civil axis.
// Domain: t < T is the old term, t >= T the new term, with no tolerance.
// Any integrity failure throws SolarTermAuthorityError; there is no fallback.

import { AUTHORITY_DATA } from './authority.data'
import { CLOCK_POLICY_ID, serializeEpochMs, ttToCivil } from './clock'
import { sha256AsciiHex } from './sha256'
import { SolarTermAuthorityError, type CanonicalSolarTermBoundary } from './types'

/** Pinned identity. Changing the data requires changing these on purpose. */
export const SOLAR_TERM_AUTHORITY = Object.freeze({
  authorityVersion: 'astronomy-authority-v4',
  datasetId: 'solar-terms-jpl-de440s-clock-v1',
  clockVersion: CLOCK_POLICY_ID,
  goldenVersion: 'golden-v4',
  generatorVersion: 'solar-term-authority-runtime-generator 1.0.0',
  sourceSha256: '1db7a155f147210cac9db6580e3893dd3603c3d08ac3bea61815af193e9c6a60',
  encodedSha256: '9fbc1506a6dbd150013d3a3a1605e0bd713eba5181665807cf9e961f3c4f889e',
  firstYear: 1899,
  lastYear: 2101,
  /** Public calendar range; 1899 and 2101 are internal padding. */
  supportedFirstYear: 1900,
  supportedLastYear: 2100,
  rowCount: 4872,
})

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : number }
export type SolarTermAuthorityIdentity = Widen<typeof SOLAR_TERM_AUTHORITY>

export type SolarTermAuthorityData = {
  readonly [K in keyof typeof AUTHORITY_DATA]: (typeof AUTHORITY_DATA)[K] extends string
    ? string
    : (typeof AUTHORITY_DATA)[K] extends number
      ? number
      : never
}

const DAY_MS = 86_400_000
// Consecutive crossings are 14.7–15.8 days apart; anything else is corrupt data.
const MIN_GAP_MS = 14 * DAY_MS
const MAX_GAP_MS = 16 * DAY_MS

export interface DecodedSolarTermAuthority {
  readonly boundaries: readonly CanonicalSolarTermBoundary[]
  readonly ttMs: readonly number[]
  readonly civilEpochMs: readonly number[]
}

/** Validates and decodes authority data against the pinned identity. Pure; throws on any defect. */
export function decodeSolarTermAuthority(
  data: SolarTermAuthorityData,
  pinned: SolarTermAuthorityIdentity = SOLAR_TERM_AUTHORITY,
): DecodedSolarTermAuthority {
  const identity = [
    'authorityVersion',
    'datasetId',
    'clockVersion',
    'generatorVersion',
    'sourceSha256',
    'firstYear',
    'lastYear',
    'rowCount',
  ] as const
  for (const key of identity)
    if (data[key] !== pinned[key])
      throw new SolarTermAuthorityError('VERSION_MISMATCH', `${key} ${data[key]} != ${pinned[key]}`)
  if (data.timeScale !== 'TT') throw new SolarTermAuthorityError('VERSION_MISMATCH', 'timeScale')
  if (data.encodedSha256 !== pinned.encodedSha256)
    throw new SolarTermAuthorityError('HASH_MISMATCH', 'declared encoded hash')
  if (typeof data.encoded !== 'string' || sha256AsciiHex(data.encoded) !== pinned.encodedSha256)
    throw new SolarTermAuthorityError('HASH_MISMATCH', 'encoded authority table')

  const parts = data.encoded.split(',')
  if (parts.length !== pinned.rowCount)
    throw new SolarTermAuthorityError('MALFORMED', `row count ${parts.length}`)
  const ttMs: number[] = []
  const civilEpochMs: number[] = []
  const boundaries: CanonicalSolarTermBoundary[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!
    if (!(i === 0 ? /^-?[0-9a-z]+$/ : /^[0-9a-z]+$/).test(part))
      throw new SolarTermAuthorityError('MALFORMED', `row ${i} encoding`)
    const value = parseInt(part, 36)
    const t = i === 0 ? value : ttMs[i - 1]! + value
    if (!Number.isSafeInteger(t)) throw new SolarTermAuthorityError('MALFORMED', `row ${i} T`)
    if (i && (value < MIN_GAP_MS || value > MAX_GAP_MS))
      throw new SolarTermAuthorityError('MALFORMED', `row ${i} gap ${value} ms`)
    const year = pinned.firstYear + Math.floor(i / 24)
    const termIndex = (19 + (i % 24)) % 24
    const civil = ttToCivil(t)
    if (i && civil.epochMs <= civilEpochMs[i - 1]!)
      throw new SolarTermAuthorityError('MALFORMED', `row ${i} civil order`)
    if (new Date(civil.epochMs).getUTCFullYear() !== year)
      throw new SolarTermAuthorityError('MALFORMED', `row ${i} civil year`)
    ttMs.push(t)
    civilEpochMs.push(civil.epochMs)
    boundaries.push(
      Object.freeze({
        year,
        termIndex,
        targetLongitudeDeg: termIndex * 15,
        ttMs: t,
        civilEpochMs: civil.epochMs,
        civilIso: serializeEpochMs(civil.epochMs),
        clockRegime: civil.regime,
      }),
    )
  }
  return Object.freeze({
    boundaries: Object.freeze(boundaries),
    ttMs: Object.freeze(ttMs),
    civilEpochMs: Object.freeze(civilEpochMs),
  })
}

let loaded: DecodedSolarTermAuthority | undefined
let failure: unknown

function authority(): DecodedSolarTermAuthority {
  if (loaded) return loaded
  if (failure) throw failure
  try {
    loaded = decodeSolarTermAuthority(AUTHORITY_DATA)
  } catch (error) {
    failure =
      error instanceof SolarTermAuthorityError
        ? error
        : new SolarTermAuthorityError('MALFORMED', String(error))
    throw failure
  }
  return loaded
}

/** Loads and verifies the table (fail closed); returns the pinned identity. */
export function assertSolarTermAuthority(): typeof SOLAR_TERM_AUTHORITY {
  authority()
  return SOLAR_TERM_AUTHORITY
}

function checkYear(year: number): void {
  if (
    !Number.isInteger(year) ||
    year < SOLAR_TERM_AUTHORITY.firstYear ||
    year > SOLAR_TERM_AUTHORITY.lastYear
  )
    throw new SolarTermAuthorityError('OUT_OF_RANGE', `solar term year ${year}`)
}

/** The 24 crossings of an authority year, ordered term 19 (Tiểu hàn) … 18 (Đông chí). */
export function getCanonicalSolarTermsForYear(year: number): readonly CanonicalSolarTermBoundary[] {
  checkYear(year)
  const start = (year - SOLAR_TERM_AUTHORITY.firstYear) * 24
  return authority().boundaries.slice(start, start + 24)
}

export function getCanonicalSolarTermBoundary(
  year: number,
  termIndex: number,
): CanonicalSolarTermBoundary {
  checkYear(year)
  if (!Number.isInteger(termIndex) || termIndex < 0 || termIndex > 23)
    throw new SolarTermAuthorityError('OUT_OF_RANGE', `term index ${termIndex}`)
  const offset = (termIndex - 19 + 24) % 24
  return authority().boundaries[(year - SOLAR_TERM_AUTHORITY.firstYear) * 24 + offset]!
}

/** Index of the last boundary <= value; requires a following boundary (fail closed at the edges). */
function activeIndex(axis: readonly number[], value: number): number {
  if (!Number.isInteger(value)) throw new RangeError('Expected integer milliseconds')
  let lo = 0
  let hi = axis.length - 1
  if (value < axis[0]! || value >= axis[hi]!)
    throw new SolarTermAuthorityError('OUT_OF_RANGE', `instant ${value} outside authority table`)
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1
    if (axis[mid]! <= value) lo = mid
    else hi = mid
  }
  return lo
}

/** Active term at an integer civil (POSIX) ms: the crossing is the new term. */
export function getCanonicalSolarTermAt(civilEpochMs: number): CanonicalSolarTermBoundary {
  const table = authority()
  return table.boundaries[activeIndex(table.civilEpochMs, civilEpochMs)]!
}

/** Active term at an integer TT ms since J2000.0 TT. */
export function getCanonicalSolarTermAtTT(ttMs: number): CanonicalSolarTermBoundary {
  const table = authority()
  return table.boundaries[activeIndex(table.ttMs, ttMs)]!
}

/** Month Jian branch (0 = Tý) opened by the Jie at or before a term index. */
export function monthJianBranchForTermIndex(termIndex: number): number {
  return ((Math.floor((termIndex - 21 + 24) / 2) % 12) + 2) % 12
}

/** Active Month Jian branch (0 = Tý) at an integer civil ms. */
export function getCanonicalSolarMonth(civilEpochMs: number): number {
  return monthJianBranchForTermIndex(getCanonicalSolarTermAt(civilEpochMs).termIndex)
}
