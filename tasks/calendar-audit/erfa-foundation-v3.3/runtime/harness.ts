// Runtime-parity harness: identical code runs in Node, page and worker contexts.
import {
  erfaSolarTermsForYear,
  serializeBoundary,
  solveErfaSolarTermBoundary,
  ERFA_SOLAR_TERM_MODEL,
} from '../../../../shared/astronomy/erfa/index'

export interface ParityResult {
  model: string
  count: number
  lines: string[]
  timings: { oneRootMs: number; firstYearMs: number; warmYearMs: number; cachedYearLookupMs: number; allMs: number }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** Canonical serialized line per boundary; compared byte-for-byte across runtimes. */
export function runParity(): ParityResult {
  let t = now()
  solveErfaSolarTermBoundary(2024, 21)
  const oneRootMs = now() - t
  t = now()
  erfaSolarTermsForYear(2025)
  const firstYearMs = now() - t
  t = now()
  for (let i = 0; i < 24; i++) solveErfaSolarTermBoundary(2026, (19 + i) % 24)
  const warmYearMs = now() - t
  t = now()
  erfaSolarTermsForYear(2025)
  const cachedYearLookupMs = now() - t
  t = now()
  const lines: string[] = []
  for (let year = 1899; year <= 2101; year++)
    for (const b of erfaSolarTermsForYear(year)) {
      const s = serializeBoundary(b)
      lines.push([s.year, s.termIndex, s.id, s.targetLongitudeDeg, s.ttMs, s.civilEpochMs, s.civilIso, s.clockRegime, s.clockPolicy].join('|'))
    }
  const allMs = now() - t
  return {
    model: `${ERFA_SOLAR_TERM_MODEL.id}@${ERFA_SOLAR_TERM_MODEL.version}`,
    count: lines.length,
    lines,
    timings: { oneRootMs, firstYearMs, warmYearMs, cachedYearLookupMs, allMs },
  }
}
