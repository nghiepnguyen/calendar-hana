// Phase 3B.4.3 migration-impact projection: classify what replacing the
// production Astronomy Engine roots by ERFA + clock-v1 WOULD change. No
// production behaviour is changed by this script.
// Usage (repo root): IMPACT_OUT=<dir> node .../impact/compare-impact.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { MakeTime } from 'astronomy-engine'

const out = process.env.IMPACT_OUT
const base = JSON.parse(readFileSync(`${out}/baseline.json`, 'utf8'))
const erfa = JSON.parse(readFileSync(`${out}/erfa.json`, 'utf8'))
const { crossings } = base.probes
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Sanity: the mocked production pipeline really emitted the ERFA clock-v1 instants.
const mocked = new Map(erfa.roots.map((r) => [`${r.year}:${r.longitude}`, r.civilMs]))
const injectionMismatches = crossings.filter((c) => mocked.get(`${c.year}:${c.longitude}`) !== c.newCivilMs)
if (injectionMismatches.length) throw new Error(`injection mismatch ${injectionMismatches.length}`)

const vnDate = (ms, d = 0) => new Date(ms + 7 * 3600000 + d * 86400000).toISOString().slice(0, 10)
const JIE = new Set([315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285])
const termOf = { 0: 'Xuân phân', 15: 'Thanh minh', 30: 'Cốc vũ', 45: 'Lập hạ', 60: 'Tiểu mãn', 75: 'Mang chủng', 90: 'Hạ chí', 105: 'Tiểu thử', 120: 'Đại thử', 135: 'Lập thu', 150: 'Xử thử', 165: 'Bạch lộ', 180: 'Thu phân', 195: 'Hàn lộ', 210: 'Sương giáng', 225: 'Lập đông', 240: 'Tiểu tuyết', 255: 'Đại tuyết', 270: 'Đông chí', 285: 'Tiểu hàn', 300: 'Đại hàn', 315: 'Lập xuân', 330: 'Vũ thủy', 345: 'Kinh trập' }

const instantFields = {
  solarTermAt: 'getSolarTermAt',
  solarMonth: 'MONTH_JIAN_CHANGE',
  officerAtInstant: 'OFFICER_CHANGE',
  groupA: 'GROUP_A_CHANGE',
  groupB: 'GROUP_B_CHANGE',
  baziTerm: 'BAZI_CHANGE',
  baziPillars: 'BAZI_CHANGE',
}
const dayFields = {
  monthChi: 'MONTH_JIAN_CHANGE',
  officer: 'OFFICER_CHANGE',
  groupA: 'GROUP_A_CHANGE',
  almanac: 'ALMANAC_DAILY_CHANGE',
  almanacOfficerAndStars: 'ALMANAC_DAILY_CHANGE',
  seo: 'SEO_CHANGE',
}

const rows = crossings.map((c) => {
  const a = Math.min(c.oldCivilMs, c.newCivilMs)
  const b = Math.max(c.oldCivilMs, c.newCivilMs)
  const probes = a === b ? [a - 1, a] : [a - 1, a, Math.floor((a + b) / 2), b - 1, b]
  const exact = new Set()
  const daily = new Set()
  const display = new Set()
  const unknown = []
  const evidence = {}
  for (const ms of probes) {
    const x = base.instants[ms]
    const y = erfa.instants[ms]
    for (const [f, label] of Object.entries(instantFields)) {
      if (eq(x[f], y[f])) continue
      if (x[f]?.error || y[f]?.error) unknown.push({ ms, f, x: x[f], y: y[f] })
      else {
        exact.add(label)
        evidence[`instant:${f}`] ??= { iso: new Date(ms).toISOString(), production: x[f], erfa: y[f] }
      }
    }
  }
  const dates = [...new Set([c.oldCivilMs, c.newCivilMs].flatMap((ms) => [-1, 0, 1].map((d) => vnDate(ms, d))))].filter((d) => base.days[d])
  for (const d of dates) {
    const x = base.days[d]
    const y = erfa.days[d]
    for (const [f, label] of Object.entries(dayFields)) {
      if (eq(x[f], y[f])) continue
      if (x[f]?.error || y[f]?.error) unknown.push({ d, f, x: x[f], y: y[f] })
      else {
        daily.add(label)
        evidence[`day:${f}`] ??= { date: d, production: x[f], erfa: y[f] }
      }
    }
    if (!eq(x.solarTerm?.index, y.solarTerm?.index) || !eq(x.solarTerm?.startsToday, y.solarTerm?.startsToday)) {
      daily.add('DAILY_SOLAR_TERM_LABEL_CHANGE')
      evidence['day:solarTerm'] ??= { date: d, production: x.solarTerm, erfa: y.solarTerm }
    }
    if (!eq(x.solarTermDisplayVn, y.solarTermDisplayVn)) display.add('DISPLAY_MINUTE_CHANGE')
    if (!eq(x.solarTerm?.startsAtUtc, y.solarTerm?.startsAtUtc) || !eq(x.almanacTermTimestamp, y.almanacTermTimestamp))
      display.add('DISPLAY_TIMESTAMP_CHANGE')
  }
  const civilDateChange = vnDate(c.oldCivilMs) !== vnDate(c.newCivilMs)
  const oldTtMs = MakeTime(new Date(c.oldCivilMs)).tt * 86400000
  const rootDeltaSeconds = (c.newTtMs - oldTtMs) / 1000
  const civilDeltaSeconds = (c.newCivilMs - c.oldCivilMs) / 1000
  const labels = new Set()
  if (c.newCivilMs !== c.oldCivilMs) labels.add('EXACT_INTERVAL_CHANGE')
  if (civilDateChange) labels.add('CIVIL_DATE_CHANGE')
  for (const l of [...exact, ...daily]) if (l !== 'getSolarTermAt') labels.add(l)
  if (unknown.length) labels.add('UNKNOWN')
  const dayLevel = civilDateChange || daily.size > 0
  // ROOT_TIME_ONLY: the instant moved but nothing day-level or minute-displayed changed;
  // only exact-instant answers inside the moved interval differ.
  if (c.newCivilMs !== c.oldCivilMs && !dayLevel && !unknown.length && !display.has('DISPLAY_MINUTE_CHANGE'))
    labels.add('ROOT_TIME_ONLY')
  if (!dayLevel && !unknown.length && display.has('DISPLAY_MINUTE_CHANGE')) labels.add('DISPLAY_ONLY')
  if (display.has('DISPLAY_MINUTE_CHANGE')) labels.add('DISPLAY_MINUTE_CHANGE')
  if (display.has('DISPLAY_TIMESTAMP_CHANGE')) labels.add('DISPLAY_TIMESTAMP_CHANGE')
  return {
    year: c.year,
    longitude: c.longitude,
    term: termOf[c.longitude],
    jie: JIE.has(c.longitude),
    productionInstantUtc: new Date(c.oldCivilMs).toISOString(),
    erfaInstantUtc: new Date(c.newCivilMs).toISOString(),
    erfaClockRegime: c.newClockRegime,
    civilDeltaSeconds,
    rootDeltaSeconds,
    clockContributionSeconds: civilDeltaSeconds - rootDeltaSeconds,
    productionVnDate: vnDate(c.oldCivilMs),
    erfaVnDate: vnDate(c.newCivilMs),
    labels: [...labels].sort(),
    exactConsumers: [...exact].sort(),
    dailyConsumers: [...daily].sort(),
    evidence,
    unknown: unknown.slice(0, 5),
  }
})

const count = (pred) => rows.filter(pred).length
const allLabels = [...new Set(rows.flatMap((r) => r.labels))].sort()
const abs = (xs) => xs.map(Math.abs).sort((p, q) => p - q)
const q = (s, p) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]
const civilAbs = abs(rows.map((r) => r.civilDeltaSeconds))
const rootAbs = abs(rows.map((r) => r.rootDeltaSeconds))
const regimeStats = {}
for (const r of rows) {
  const s = (regimeStats[r.erfaClockRegime] ??= { count: 0, maxAbsCivilDeltaSeconds: 0, maxAbsRootDeltaSeconds: 0, maxAbsClockContributionSeconds: 0 })
  s.count++
  s.maxAbsCivilDeltaSeconds = Math.max(s.maxAbsCivilDeltaSeconds, Math.abs(r.civilDeltaSeconds))
  s.maxAbsRootDeltaSeconds = Math.max(s.maxAbsRootDeltaSeconds, Math.abs(r.rootDeltaSeconds))
  s.maxAbsClockContributionSeconds = Math.max(s.maxAbsClockContributionSeconds, Math.abs(r.clockContributionSeconds))
}
const decade = {}
for (const r of rows) {
  const d = (decade[Math.floor(r.year / 10) * 10] ??= { count: 0, maxAbsCivilDeltaSeconds: 0, civilDateChanges: 0, monthJianChanges: 0, officerChanges: 0 })
  d.count++
  d.maxAbsCivilDeltaSeconds = Math.max(d.maxAbsCivilDeltaSeconds, Math.abs(r.civilDeltaSeconds))
  if (r.labels.includes('CIVIL_DATE_CHANGE')) d.civilDateChanges++
  if (r.labels.includes('MONTH_JIAN_CHANGE')) d.monthJianChanges++
  if (r.labels.includes('OFFICER_CHANGE')) d.officerChanges++
}
const intervalTotalSeconds = rows.reduce((s, r) => s + Math.abs(r.civilDeltaSeconds), 0)
const summary = {
  crossings: rows.length,
  labelCounts: Object.fromEntries(allLabels.map((l) => [l, count((r) => r.labels.includes(l))])),
  unchangedCrossings: count((r) => r.labels.length === 0),
  civilDelta: { maxAbsSeconds: civilAbs.at(-1), medianAbsSeconds: q(civilAbs, 0.5), p95AbsSeconds: q(civilAbs, 0.95), above30s: civilAbs.filter((x) => x > 30).length },
  rootDelta: { maxAbsSeconds: rootAbs.at(-1), medianAbsSeconds: q(rootAbs, 0.5), p95AbsSeconds: q(rootAbs, 0.95), above30s: rootAbs.filter((x) => x > 30).length },
  byClockRegime: regimeStats,
  exactIntervalTotalSeconds: intervalTotalSeconds,
  jieCrossingsWithExactChange: count((r) => r.jie && r.labels.includes('EXACT_INTERVAL_CHANGE')),
  probeCounts: { instants: base.probes.instants.length, days: base.probes.days.length },
  prerenderWindowNote: 'scripts/prerenderDays.ts renders current year ±1 (2025–2027 at time of audit)',
  prerenderWindowAffected: rows.filter((r) => r.labels.includes('SEO_CHANGE') && r.year >= 2025 && r.year <= 2027).map((r) => `${r.year} ${r.term}`),
}
const result = {
  phase: '3B.4.3',
  classification: 'PROJECTION_ONLY — production behaviour unchanged',
  method: 'Production consumers evaluated twice in Vitest: (a) unmodified; (b) vi.mock replacing only astronomy-engine SearchSunLongitude with ERFA canonical TT roots serialized via clock-v1. Probes: T-1, T, midpoint, upper-1 and upper of every moved interval; Vietnamese civil dates of old/new crossings ±1 day.',
  consumersCovered: ['getSolarTermAt', 'getSolarMonth', 'getOfficerAtInstant (exact-instant 12 Officer)', 'getOfficer via solarTermMonthChi (daily 12 Officer)', 'evaluateGroupAAtInstant', 'evaluateGroupBAtInstant', 'Bazi termContextAt + calculatePillars (month/year)', 'getSolarTerm (daily label + startsAtUtc display)', 'getAlmanac (daily aggregation)', 'getDaySeo (prerender/SEO model)'],
  outOfScope: ['lunar conversion core (own sunLongitude, not Astronomy Engine)', 'Bazi true solar time (HourAngle, unchanged)'],
  summary,
  byDecade: decade,
  civilDateChanges: rows.filter((r) => r.labels.includes('CIVIL_DATE_CHANGE')),
  dayLevelChanges: rows.filter((r) => r.dailyConsumers.length),
  rows: 'tasks/calendar-audit/erfa-foundation-v3.3/impact/migration-impact-rows-v3.3.tsv',
}
const tsv = [
  'year\tlongitude\tterm\tproductionInstantUtc\terfaInstantUtc\terfaClockRegime\tcivilDeltaSeconds\trootDeltaSeconds\tclockContributionSeconds\tlabels',
  ...rows.map((r) => [r.year, r.longitude, r.term, r.productionInstantUtc, r.erfaInstantUtc, r.erfaClockRegime, r.civilDeltaSeconds, r.rootDeltaSeconds.toFixed(4), r.clockContributionSeconds.toFixed(4), r.labels.join(',')].join('\t')),
].join('\n') + '\n'
writeFileSync('tasks/calendar-audit/erfa-foundation-v3.3/impact/migration-impact-rows-v3.3.tsv', tsv)
const prettier = await import('prettier')
writeFileSync(
  'calendar-erfa-migration-impact-v3.3.json',
  await prettier.format(JSON.stringify(result), { ...(await prettier.resolveConfig('x.json')), parser: 'json' }),
)
console.log(JSON.stringify(summary, null, 1))
