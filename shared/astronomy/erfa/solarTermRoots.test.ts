import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SOLAR_TERMS } from '../../lunar/solarTerms'
import { apparentSunTrueEclipticOfDate } from './apparentSun'
import {
  ERFA_SOLAR_TERM_IDS,
  ERFA_SOLAR_TERM_NAMES,
  erfaSolarTermAtTT,
  erfaSolarTermsForYear,
  longitudeResidualDeg,
  solarTermTargetLongitude,
  solveErfaSolarTermBoundary,
  SolarTermRootError,
  type ErfaSolarTermBoundary,
} from './solarTermRoots'

const reference = JSON.parse(
  readFileSync(
    'tasks/calendar-audit/erfa-foundation-v3.3/fixtures/jpl-de440s-reference-v3.3.json',
    'utf8',
  ),
) as { kernel: { sha256: string }; rows: [number, number, number][] }

const residual = (b: ErfaSolarTermBoundary, ttMs: number) =>
  longitudeResidualDeg(apparentSunTrueEclipticOfDate(ttMs).longitudeDeg, b.targetLongitudeDeg)

// Computed lazily inside tests so a failing engine is reported per test, not as an import error.
let cache: ErfaSolarTermBoundary[] | undefined
function allBoundaries() {
  if (!cache) {
    const list: ErfaSolarTermBoundary[] = []
    for (let year = 1899; year <= 2101; year++) list.push(...erfaSolarTermsForYear(year))
    cache = list
  }
  return cache
}
const supportedBoundaries = () => allBoundaries().filter((b) => b.year >= 1900 && b.year <= 2100)

describe('ERFA solar-term boundaries: identity and targets', { timeout: 120000 }, () => {
  it('uses the production term order and exact 15° targets', () => {
    expect([...ERFA_SOLAR_TERM_NAMES]).toEqual([...SOLAR_TERMS])
    expect(ERFA_SOLAR_TERM_IDS).toHaveLength(24)
    for (let i = 0; i < 24; i++) expect(solarTermTargetLongitude(i)).toBe(i * 15)
  })

  it('produces 4,824 supported crossings plus padding, strictly increasing', () => {
    const all = allBoundaries()
    const supported = supportedBoundaries()
    expect(supported).toHaveLength(4824)
    expect(all).toHaveLength(4872)
    for (let i = 1; i < all.length; i++) expect(all[i]!.ttMs).toBeGreaterThan(all[i - 1]!.ttMs)
    for (const b of all) {
      expect(Number.isInteger(b.ttMs)).toBe(true)
      expect(b.targetLongitudeDeg).toBe(b.termIndex * 15)
      expect(ERFA_SOLAR_TERM_IDS[b.termIndex]).toBe(b.id)
    }
    // eraEpv00 flags |t| > 100 Julian years from J2000, i.e. after 2100-01-01.5 TT:
    // every 2100 crossing and the padding years carry upstream's range warning.
    const flagged = supported.filter((b) => b.outsideNominalRange)
    expect(flagged.every((b) => b.year === 2100)).toBe(true)
    expect(flagged).toHaveLength(24)
  })
})

describe('canonical root semantics: T = first integer TT ms at/after the crossing', () => {
  it('T - 1 ms is OLD, T and T + 1 ms are NEW, for every crossing', () => {
    const all = allBoundaries()
    for (let i = 1; i < all.length; i++) {
      const b = all[i]!
      const previous = all[i - 1]!
      if (b.year < 1900 || b.year > 2100) continue
      // Direct model evaluation: the numerical crossing lies in (T - 1, T].
      expect(residual(b, b.ttMs - 1), `${b.year} ${b.id}`).toBeLessThan(0)
      expect(residual(b, b.ttMs), `${b.year} ${b.id}`).toBeGreaterThanOrEqual(0)
      // Domain classification: [T, nextT).
      expect(erfaSolarTermAtTT(b.ttMs - 1).id).toBe(previous.id)
      expect(erfaSolarTermAtTT(b.ttMs).id).toBe(b.id)
      expect(erfaSolarTermAtTT(b.ttMs + 1).id).toBe(b.id)
    }
  }, 120000)

  it('agrees with the independent JPL DE440s reference within the 0.5 s accuracy gate', () => {
    expect(reference.kernel.sha256).toBe(
      'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2',
    )
    const byKey = new Map(reference.rows.map(([y, k, ms]) => [`${y}:${k}`, ms]))
    let max = 0
    for (const b of allBoundaries()) {
      const jpl = byKey.get(`${b.year}:${b.termIndex}`)
      expect(jpl, `${b.year}:${b.termIndex}`).toBeDefined()
      max = Math.max(max, Math.abs(b.ttMs - jpl!) / 1000)
    }
    // Reference-accuracy gate only; domain comparisons above use zero tolerance.
    expect(max).toBeLessThanOrEqual(0.5)
  })

  it('wraps 0°/360° correctly at Xuân phân', () => {
    const march = erfaSolarTermsForYear(2024).find((b) => b.termIndex === 0)!
    expect(apparentSunTrueEclipticOfDate(march.ttMs - 1).longitudeDeg).toBeGreaterThan(359)
    expect(apparentSunTrueEclipticOfDate(march.ttMs).longitudeDeg).toBeLessThan(1)
    expect(longitudeResidualDeg(359.9, 0)).toBeCloseTo(-0.1, 12)
    expect(longitudeResidualDeg(0.1, 0)).toBeCloseTo(0.1, 12)
    expect(longitudeResidualDeg(180, 0)).toBe(-180)
  })

  it('is deterministic and independent of cache state', () => {
    const fresh = solveErfaSolarTermBoundary(1946, 17)
    expect(fresh).toEqual(erfaSolarTermsForYear(1946).find((b) => b.termIndex === 17))
    expect(solveErfaSolarTermBoundary(1946, 17)).toEqual(fresh)
  })

  it('fails closed outside the supported range or for invalid terms', () => {
    expect(() => solveErfaSolarTermBoundary(1898, 0)).toThrow(SolarTermRootError)
    expect(() => solveErfaSolarTermBoundary(2102, 0)).toThrow(SolarTermRootError)
    expect(() => solveErfaSolarTermBoundary(2000, 24)).toThrow(SolarTermRootError)
    expect(() => solveErfaSolarTermBoundary(2000.5, 0)).toThrow(SolarTermRootError)
    expect(() => erfaSolarTermAtTT(1.5)).toThrow(RangeError)
  })
})
