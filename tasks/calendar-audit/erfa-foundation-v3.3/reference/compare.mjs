// Phase 3B.4.3: ERFA canonical roots vs independent JPL DE440s reference.
// The 0.5 s figure is a REFERENCE ACCURACY GATE only, never a domain tolerance.
// Usage (repo root): node tasks/calendar-audit/erfa-foundation-v3.3/reference/compare.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { SearchSunLongitude } from 'astronomy-engine'
import { join } from 'node:path'

const dir = 'tasks/calendar-audit/erfa-foundation-v3.3'
const tmp = mkdtempSync(join(tmpdir(), 'erfa-ref-'))
execFileSync('npx', ['rolldown', 'shared/astronomy/erfa/index.ts', '--format', 'esm', '--file', join(tmp, 'e.mjs')], { stdio: 'ignore' })
const E = await import(join(tmp, 'e.mjs'))
const jpl = JSON.parse(readFileSync(`${dir}/fixtures/jpl-de440s-reference-v3.3.json`, 'utf8'))
const ref = new Map(jpl.rows.map(([y, k, ms]) => [`${y}:${k}`, ms]))

const rows = []
for (let year = 1899; year <= 2101; year++)
  for (const b of E.erfaSolarTermsForYear(year)) {
    const jplMs = ref.get(`${year}:${b.termIndex}`)
    if (jplMs === undefined) throw new Error(`missing reference ${year}:${b.termIndex}`)
    const s = E.serializeBoundary(b)
    const jplCivil = E.ttToCivil(Math.ceil(jplMs)).epochMs
    rows.push({
      year,
      termIndex: b.termIndex,
      id: b.id,
      jie: b.targetLongitudeDeg % 30 === 15,
      erfaTtMs: b.ttMs,
      jplTtMs: jplMs,
      deltaSeconds: (b.ttMs - jplMs) / 1000,
      erfaCivilIso: s.civilIso,
      jplCivilIso: new Date(jplCivil).toISOString(),
      clockRegime: s.clockRegime,
      civil: Object.fromEntries(
        [['UTC', 0], ['UTC+7', 7], ['UTC+8', 8]].map(([z, h]) => [
          z,
          {
            erfa: new Date(s.civilEpochMs + h * 3600000).toISOString().slice(0, 10),
            jpl: new Date(jplCivil + h * 3600000).toISOString().slice(0, 10),
          },
        ]),
      ),
    })
  }

const quantile = (sorted, p) => {
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  return sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo)
}
function stats(subset) {
  const abs = subset.map((r) => Math.abs(r.deltaSeconds)).sort((a, b) => a - b)
  const signed = subset.map((r) => r.deltaSeconds)
  return {
    count: abs.length,
    maxAbsSeconds: abs.at(-1),
    medianAbsSeconds: quantile(abs, 0.5),
    p95AbsSeconds: quantile(abs, 0.95),
    p99AbsSeconds: quantile(abs, 0.99),
    meanSignedSeconds: signed.reduce((a, b) => a + b, 0) / signed.length,
    minSignedSeconds: Math.min(...signed),
    maxSignedSeconds: Math.max(...signed),
    countAbove: Object.fromEntries([0.1, 0.25, 0.5, 1, 30].map((t) => [`${t}s`, abs.filter((x) => x > t).length])),
  }
}
const supported = rows.filter((r) => r.year >= 1900 && r.year <= 2100)
const padding = rows.filter((r) => r.year === 1899 || r.year === 2101)
const civilDisagreements = Object.fromEntries(
  ['UTC', 'UTC+7', 'UTC+8'].map((z) => [z, supported.filter((r) => r.civil[z].erfa !== r.civil[z].jpl).map((r) => ({ year: r.year, id: r.id, ...r.civil[z], erfaCivilIso: r.erfaCivilIso, jplCivilIso: r.jplCivilIso }))]),
)
const byDecade = {}
for (const r of supported) (byDecade[Math.floor(r.year / 10) * 10] ??= []).push(r)
const byTerm = {}
for (const r of supported) (byTerm[`${String(r.termIndex).padStart(2, '0')} ${r.id}`] ??= []).push(r)
const all = stats(supported)
// Context only: current production engine against the same independent roots.
const aeRows = []
for (let year = 1900; year <= 2100; year++) {
  let start = new Date(Date.UTC(year, 0, 1))
  for (let o = 0; o < 24; o++) {
    const k = (19 + o) % 24
    const t = SearchSunLongitude(k * 15, start, 20)
    start = new Date(t.date.getTime() + 1000)
    aeRows.push({ deltaSeconds: (t.tt * 86400000 - ref.get(`${year}:${k}`)) / 1000 })
  }
}
const result = {
  phase: '3B.4.3',
  classification: 'REFERENCE_ACCURACY_EVIDENCE (audit only; not a domain tolerance)',
  engine: E.ERFA_SOLAR_TERM_MODEL,
  reference: { identity: jpl.identity, kernel: jpl.kernel, seed: jpl.seed, solver: jpl.solver, maxFinalResidualDeg: jpl.maxFinalResidualDeg, maxNewtonVsBisectionMs: jpl.maxNewtonVsBisectionMs },
  comparedQuantity: 'ERFA canonical integer TT ms (ceil) minus JPL continuous TT root; includes the <= 1 ms ceil step',
  gate: { maxAbsSecondsAllowed: 0.5, scope: '1900–2100, all 24 terms' },
  supported1900to2100: all,
  jieOnly: stats(supported.filter((r) => r.jie)),
  zhongqiOnly: stats(supported.filter((r) => !r.jie)),
  padding1899and2101: stats(padding),
  productionAstronomyEngineVsSameReference: { identity: 'astronomy-engine 2.1.19 SearchSunLongitude (current production)', ...stats(aeRows) },
  byDecade: Object.fromEntries(Object.entries(byDecade).map(([k, v]) => [k, stats(v)])),
  bySolarTerm: Object.fromEntries(Object.entries(byTerm).sort().map(([k, v]) => [k, stats(v)])),
  worst20: [...supported].sort((a, b) => Math.abs(b.deltaSeconds) - Math.abs(a.deltaSeconds)).slice(0, 20).map((r) => ({ ...r, civil: undefined })),
  civilDateDisagreementsCommonClock: Object.fromEntries(Object.entries(civilDisagreements).map(([k, v]) => [k, { count: v.length, cases: v }])),
  verdict: all.maxAbsSeconds <= 0.5 && stats(padding).maxAbsSeconds <= 0.5 ? 'REFERENCE_ACCURACY_PASS' : 'BLOCK_REFERENCE_ACCURACY',
}
writeFileSync('calendar-erfa-reference-comparison-v3.3.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ verdict: result.verdict, all, jie: result.jieOnly, padding: result.padding1899and2101, civil: Object.fromEntries(Object.entries(civilDisagreements).map(([k, v]) => [k, v.length])) }, null, 1))
