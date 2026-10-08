import { erfaSolarTermsForYear, serializeBoundary } from '../../../../shared/astronomy/erfa/index'

export interface Crossing {
  year: number
  longitude: number
  oldCivilMs: number
  newCivilMs: number
  newTtMs: number
  newClockRegime: string
}

/** Pair production and ERFA roots by (year, longitude) and derive probes. */
export function buildProbes(old: { year: number; longitude: number; civilMs: number }[]) {
  const byKey = new Map(old.map((r) => [`${r.year}:${r.longitude}`, r.civilMs]))
  const crossings: Crossing[] = []
  for (let year = 1900; year <= 2100; year++)
    for (const b of erfaSolarTermsForYear(year)) {
      const s = serializeBoundary(b)
      const oldCivilMs = byKey.get(`${year}:${b.targetLongitudeDeg}`)
      if (oldCivilMs === undefined) throw new Error(`unpaired ${year}:${b.targetLongitudeDeg}`)
      crossings.push({ year, longitude: b.targetLongitudeDeg, oldCivilMs, newCivilMs: s.civilEpochMs, newTtMs: b.ttMs, newClockRegime: s.clockRegime })
    }
  const instants = new Set<number>()
  const days = new Set<string>()
  const vnDate = (ms: number, offsetDays = 0) =>
    new Date(ms + 7 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10)
  for (const c of crossings) {
    const a = Math.min(c.oldCivilMs, c.newCivilMs)
    const b = Math.max(c.oldCivilMs, c.newCivilMs)
    for (const t of a === b ? [a - 1, a] : [a - 1, a, Math.floor((a + b) / 2), b - 1, b]) instants.add(t)
    for (const ms of [c.oldCivilMs, c.newCivilMs]) for (const d of [-1, 0, 1]) days.add(vnDate(ms, d))
  }
  return {
    crossings,
    instants: [...instants].sort((x, y) => x - y),
    days: [...days].filter((d) => d >= '1900-01-01' && d <= '2100-12-31').sort(),
  }
}
