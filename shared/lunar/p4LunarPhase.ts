import authority from '../almanac-data/p4-lunar-phase-authority-v1.json'
import source from '../../docs/audits/sources/p4-vol10/usno-phase/normalized-response.json'

/** Frozen astronomical inputs for the P4 audit only; never a production calendar authority. */
const events = new Map<string, { phase: string; publishedTimeUT: string }>()
for (const year of source.years)
  for (const e of year.phasedata) {
    const [hour, minute] = e.time.split(':').map(Number)
    // Published UT at minute precision → Vietnam's UTC+7 civil date. The locked dataset has
    // no event within a minute of local midnight, so UT1/UTC does not change these dates.
    const local = new Date(Date.UTC(e.year, e.month - 1, e.day, hour! + 7, minute!))
    const date = local.toISOString().slice(0, 10)
    if (events.has(date)) throw new Error(`Duplicate primary phase on ${date}`)
    events.set(date, {
      phase: e.phase,
      publishedTimeUT: `${e.year}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')} ${e.time} UT`,
    })
  }

export function getP4MoonPhase(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Invalid civil date')
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    throw new RangeError('Invalid civil date')
  const [start, end] = authority.astronomicalInput.coverage
  const event = events.get(date)
  return {
    date,
    authorityId: authority.version,
    phase: date < start! || date > end! ? 'unknown' : (event?.phase ?? 'none'),
    publishedTimeUT: event?.publishedTimeUT,
    civilConvention: authority.astronomicalInput.civilConvention,
  }
}
