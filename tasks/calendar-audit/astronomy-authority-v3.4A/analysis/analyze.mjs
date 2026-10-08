// Phase 3B.4.4A analyses AFTER the freeze (validation / projection only; nothing
// here feeds Golden values). Reads frozen golden-v4, golden-v3 (read-only), the
// isolated ERFA foundation and the production Astronomy Engine path (read-only).
// Usage (repo root): node .../analysis/analyze.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const A = 'tasks/calendar-audit/astronomy-authority-v3.4A'
const tmp = mkdtempSync(join(tmpdir(), 'v34a-analysis-'))
const bundle = (entry, name) => {
  execFileSync('npx', ['rolldown', entry, '--format', 'esm', '--file', join(tmp, name)], { stdio: 'ignore' })
  return import(join(tmp, name))
}
const E = await bundle('shared/astronomy/erfa/index.ts', 'erfa.mjs')
const P = await bundle('shared/lunar/solarTerms.ts', 'prod.mjs')
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'
const vnDate = (ms) => new Date(ms + 7 * 3600000).toISOString().slice(0, 10)
const vnMinute = (ms) => new Date(ms + 7 * 3600000).toISOString().slice(0, 16)
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); const i = (s.length - 1) * p; const lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo) }

// ---- Authority -----------------------------------------------------------------------
const auth = JSON.parse(readFileSync('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', 'utf8'))
if (auth.reviewStatus !== 'REVIEWED_FROZEN') throw new Error('authority not frozen')
const rows = auth.rows.map((s) => { const f = s.split('|'); return { year: +f[0], term: +f[1], root: +f[2], T: +f[3], civil: +f[4], iso: f[5], regime: f[6] } })
const key = (y, t) => `${y}:${t}`
const byKey = new Map(rows.map((r) => [key(r.year, r.term), r]))

// ---- 1. ERFA vs authority -------------------------------------------------------------------
const erfaRows = []
for (let y = 1899; y <= 2101; y++)
  for (const b of E.erfaSolarTermsForYear(y)) {
    const a = byKey.get(key(y, b.termIndex))
    const civil = E.ttToCivil(b.ttMs).epochMs
    const tsClockOnJpl = E.ttToCivil(a.T).epochMs
    erfaRows.push({ year: y, term: b.termIndex, jie: b.termIndex % 2 === 1, supported: y >= 1900 && y <= 2100, erfaT: b.ttMs, jplT: a.T, jplRoot: a.root, rootDeltaS: (b.ttMs - a.root) / 1000, canonicalDeltaMs: b.ttMs - a.T, erfaCivil: civil, jplCivil: a.civil, tsClockMatchesAuthorityClock: tsClockOnJpl === a.civil })
  }
const sup = erfaRows.filter((r) => r.supported)
const absRoot = sup.map((r) => Math.abs(r.rootDeltaS))
const civilDateMismatch = (h) => sup.filter((r) => new Date(r.erfaCivil + h * 3600000).toISOString().slice(0, 10) !== new Date(r.jplCivil + h * 3600000).toISOString().slice(0, 10))
const erfaVsAuthority = {
  phase: '3B.4.4A',
  classification: 'VALIDATION ONLY — ERFA did not influence any Golden value',
  authority: { dataset: auth.datasetId, status: auth.reviewStatus, sha256ManifestRef: 'golden-v4/manifest.json' },
  erfaModel: E.ERFA_SOLAR_TERM_MODEL.id + '@' + E.ERFA_SOLAR_TERM_MODEL.version,
  accuracyGate: { rule: '|ERFA TT root - JPL TT root| <= 0.5 s', maxAbsSeconds: Math.max(...absRoot), medianAbsSeconds: q(absRoot, 0.5), p95AbsSeconds: q(absRoot, 0.95), p99AbsSeconds: q(absRoot, 0.99), above05s: absRoot.filter((x) => x > 0.5).length, verdict: Math.max(...absRoot) <= 0.5 ? 'PASS' : 'FAIL', padding: { maxAbsSeconds: Math.max(...erfaRows.filter((r) => !r.supported).map((r) => Math.abs(r.rootDeltaS))) } },
  canonicalIntegerMs: {
    note: 'Exact identity is NOT required by the accuracy gate; reported to inform the 3B.4.4B runtime-boundary decision.',
    equal: sup.filter((r) => r.canonicalDeltaMs === 0).length,
    differ: sup.filter((r) => r.canonicalDeltaMs !== 0).length,
    erfaLater: sup.filter((r) => r.canonicalDeltaMs > 0).length,
    erfaEarlier: sup.filter((r) => r.canonicalDeltaMs < 0).length,
    maxAbsDeltaMs: Math.max(...sup.map((r) => Math.abs(r.canonicalDeltaMs))),
    medianAbsDeltaMs: q(sup.map((r) => Math.abs(r.canonicalDeltaMs)), 0.5),
    jieDiffer: sup.filter((r) => r.jie && r.canonicalDeltaMs !== 0).length,
  },
  civilDateMismatches: { UTC: civilDateMismatch(0).length, 'UTC+7': civilDateMismatch(7).length, 'UTC+8': civilDateMismatch(8).length },
  monthJianWithinRootDelta: {
    note: 'For a Jie with ERFA T != JPL T, every instant in [min, max) gets a different Month Jian (and Officer / Group B month context). The interval is narrow (<= max |delta|).',
    jieCrossingsWithDifferingInterval: sup.filter((r) => r.jie && r.canonicalDeltaMs !== 0).length,
    totalDifferingMilliseconds: sup.filter((r) => r.jie).reduce((s, r) => s + Math.abs(r.canonicalDeltaMs), 0),
  },
  clockImplementationsAgree: { tsClockV1OnAuthorityT: sup.filter((r) => r.tsClockMatchesAuthorityClock).length + '/' + sup.length },
}

// ERFA as runtime boundary (architecture A) against the frozen Group B vNext Golden, with an audit evaluator.
const extraction = JSON.parse(readFileSync('calendar-rule-extraction-v3.json', 'utf8'))
const RULES = ['month-breaker', 'robbery-sha', 'disaster-sha', 'month-sha', 'month-virtue']
const cells = Object.fromEntries(RULES.map((r) => [r, Object.fromEntries(extraction.rules.find((x) => x.id === r).rule.lookup.map((l) => [l.sourceMonthJianBranch, l.target.value]))]))
const ORACLE = Date.UTC(2014, 1, 5)
const dayIdx = (d) => ((((43 + (Date.parse(`${d}T00:00:00Z`) - ORACLE) / 86400000) % 60) + 60) % 60)
const jieList = (civilOf) => erfaRows.filter((r) => r.jie).map((r) => ({ civil: civilOf(r), branch: BR[(((r.term * 15 - 315) / 30 + 2) % 12 + 12) % 12] })).sort((a, b) => a.civil - b.civil)
const jieErfa = jieList((r) => r.erfaCivil)
const jieJpl = jieList((r) => r.jplCivil)
const jianAt = (list, ms) => { let lo = 0, hi = list.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (list[m].civil <= ms) lo = m; else hi = m - 1 } return list[lo].branch }
function evalFixture(rule, f, list) {
  const ms = Date.parse(f.instant)
  const jian = jianAt(list, ms)
  const idx = dayIdx(vnDate(ms))
  const target = cells[rule][jian]
  const observed = rule === 'month-virtue' ? ST[idx % 10] : BR[idx % 12]
  return { monthJian: jian, expected: observed === target }
}
const archA = { fixtures: 0, fail: 0, byClass: {}, failingTransitions: new Set() }
const jplSelf = { fixtures: 0, fail: 0 }
for (const rule of RULES) {
  for (const f of JSON.parse(readFileSync(`golden-v4/group-b/${rule}.json`, 'utf8')).fixtures) {
    const e = evalFixture(rule, f, jieErfa)
    const j = evalFixture(rule, f, jieJpl)
    archA.fixtures++
    jplSelf.fixtures++
    if (j.monthJian !== f.context.monthJian || j.expected !== f.expected) jplSelf.fail++
    if (e.monthJian !== f.context.monthJian || e.expected !== f.expected) {
      archA.fail++
      archA.byClass[f.fixtureClass] = (archA.byClass[f.fixtureClass] ?? 0) + 1
      if (f.boundary) archA.failingTransitions.add(`${f.boundary.transitionId}:${f.boundary.sample}`)
    }
  }
}
erfaVsAuthority.architectureA_ERFARuntimeVsGoldenV4 = { fixtures: archA.fixtures, wouldFail: archA.fail, byClass: archA.byClass, failingSamples: [...archA.failingTransitions].sort(), controlAuditEvaluatorWithAuthorityTables: `${jplSelf.fixtures - jplSelf.fail}/${jplSelf.fixtures} pass` }
erfaVsAuthority.rows = 'tasks/calendar-audit/astronomy-authority-v3.4A/analysis/erfa-vs-authority-rows.tsv'
writeFileSync(`${A}/analysis/erfa-vs-authority-rows.tsv`, ['year\tterm\terfaTtMs\tjplTtMs\tjplRootTtMs\trootDeltaS\tcanonicalDeltaMs\terfaCivilIso\tjplCivilIso', ...erfaRows.map((r) => [r.year, r.term, r.erfaT, r.jplT, r.jplRoot.toFixed(3), r.rootDeltaS.toFixed(4), r.canonicalDeltaMs, new Date(r.erfaCivil).toISOString(), new Date(r.jplCivil).toISOString()].join('\t'))].join('\n') + '\n')
writeFileSync('calendar-erfa-vs-authority-v3.4A.json', JSON.stringify(erfaVsAuthority, null, 2) + '\n')

// ---- 2. Old vs new Group B Golden ------------------------------------------------------------
const evidence = JSON.parse(readFileSync('calendar-group-b-exact-jie-evidence.json', 'utf8'))
const transitions = evidence.transitions.map((t) => {
  const lonTerm = t.longitudeDegrees / 15
  const a = byKey.get(key(t.year, lonTerm))
  const oldCivil = Date.parse(t.instantUTC)
  const oldCivilExactMs = Number(t.instantUTC.match(/\.(\d+)Z/)?.[1].padEnd(6, '0')) / 1000 + Math.floor(oldCivil / 1000) * 1000
  const oldTtMs = (t.jdTT - 2451545) * 86400000
  return {
    id: t.id, newId: `jie-${t.year}-${String(t.longitudeDegrees).padStart(3, '0')}`, name: t.name,
    oldInstantUTC: t.instantUTC, newInstantUTC: a.iso,
    civilDeltaMs: a.civil - oldCivilExactMs,
    rootDeltaMs: a.root - oldTtMs,
    clockContributionMs: (a.civil - a.T) - (oldCivilExactMs - oldTtMs),
    newCanonicalTtMs: a.T,
  }
})
const oldFixtures = RULES.flatMap((r) => JSON.parse(readFileSync(`golden-v3/group-b/${r}.json`, 'utf8')).fixtures.map((f) => ({ ...f, rule: r })))
const newFixtures = RULES.flatMap((r) => JSON.parse(readFileSync(`golden-v4/group-b/${r}.json`, 'utf8')).fixtures.map((f) => ({ ...f, rule: r })))
let stillValid = 0
const invalidOld = []
for (const f of oldFixtures) {
  const j = evalFixture(f.rule, f, jieJpl)
  const ok = j.monthJian === f.context.monthJian && j.expected === f.expected
  if (ok) stillValid++
  else invalidOld.push({ id: f.id, fixtureClass: f.fixtureClass, instant: f.instant, oldMonthJian: f.context.monthJian, newAuthorityMonthJian: j.monthJian, oldExpected: f.expected, newAuthorityExpected: j.expected })
}
// Design-level pairing for exact boundaries: old (T_old + {-60 s, 0, +60 s}) -> new (T_new + {-1, 0, +1} ms).
const pairs = []
for (const f of oldFixtures.filter((x) => x.fixtureClass === 'exact-boundary')) {
  const tr = transitions.find((t) => t.id === f.boundary.transitionId)
  const g = newFixtures.find((n) => n.rule === f.rule && n.boundary?.transitionId === tr.newId && n.boundary.sample === f.boundary.sample)
  const labels = ['AUTHORITY_ROOT_CHANGE', 'CANONICAL_MS_REANCHOR']
  if (tr.clockContributionMs !== 0 && Math.abs(tr.clockContributionMs) >= 1) labels.push('CLOCK_POLICY_CHANGE')
  if (g.context.monthJian !== f.context.monthJian) labels.push('EXPECTED_MONTH_JIAN_CHANGE')
  if (g.expected !== f.expected) labels.push('EXPECTED_GROUP_B_CHANGE')
  if (g.context.civilDate !== f.context.civilDate || g.context.dayBranch !== f.context.dayBranch) labels.push('DAY_OPERAND_CHANGE')
  pairs.push({ old: f.id, new: g.id, sample: f.boundary.sample, labels })
}
const count = (pred) => pairs.filter(pred).length
const diff = {
  phase: '3B.4.4A',
  oldGolden: { version: 'golden-v3 group-b', fixtures: oldFixtures.length, authority: evidence.method.ephemeris + ' / ' + evidence.method.binding, boundarySamples: 'T_old - 60 s, T_old, T_old + 60 s' },
  newGolden: { version: 'golden-v4 group-b', fixtures: newFixtures.length, authority: auth.referenceEngine, boundarySamples: 'T_new - 1 ms, T_new, T_new + 1 ms' },
  transitions,
  transitionStats: { maxAbsCivilDeltaMs: Math.max(...transitions.map((t) => Math.abs(t.civilDeltaMs))), maxAbsRootDeltaMs: Math.max(...transitions.map((t) => Math.abs(t.rootDeltaMs))), maxAbsClockContributionMs: Math.max(...transitions.map((t) => Math.abs(t.clockContributionMs))) },
  oldFixturesUnderNewAuthority: { stillValid, invalid: invalidOld.length, invalidByClass: invalidOld.reduce((m, x) => ((m[x.fixtureClass] = (m[x.fixtureClass] ?? 0) + 1), m), {}), invalidCases: invalidOld },
  boundaryPairs: { count: pairs.length, labelCounts: Object.fromEntries([...new Set(pairs.flatMap((p) => p.labels))].map((l) => [l, count((p) => p.labels.includes(l))])), pairs },
  classCounts: {
    old: oldFixtures.reduce((m, x) => ((m[x.fixtureClass] = (m[x.fixtureClass] ?? 0) + 1), m), {}),
    new: newFixtures.reduce((m, x) => ((m[x.fixtureClass] = (m[x.fixtureClass] ?? 0) + 1), m), {}),
  },
}
writeFileSync(`${A}/analysis/golden-diff.json`, JSON.stringify(diff, null, 2) + '\n')

// ---- 3. Group A and 4. Bazi projections (production AE vs authority) -------------------------
const prod = new Map()
for (let y = 1899; y <= 2101; y++) for (const t of P.solarTermsForYear(y)) prod.set(key(y, t.longitude / 15), Date.parse(t.instantUtc))
const groupA = { tuLy: [], tuTuyet: [] }
const bazi = { jie: 0, lapXuan: [], civilDateChanges: [], minuteChanges: 0, deltas: [] }
for (const r of rows.filter((x) => x.year >= 1900 && x.year <= 2100)) {
  const old = prod.get(key(r.year, r.term))
  const lon = r.term * 15
  const dayBefore = (ms) => new Date(Date.parse(vnDate(ms)) - 86400000).toISOString().slice(0, 10)
  const change = { year: r.year, longitude: lon, production: new Date(old).toISOString(), authority: r.iso, productionDay: dayBefore(old), authorityDay: dayBefore(r.civil) }
  if ([0, 90, 180, 270].includes(lon) && change.productionDay !== change.authorityDay) groupA.tuLy.push(change)
  if ([315, 45, 135, 225].includes(lon) && change.productionDay !== change.authorityDay) groupA.tuTuyet.push(change)
  if (lon % 30 === 15) {
    bazi.jie++
    bazi.deltas.push((r.civil - old) / 1000)
    if (vnDate(old) !== vnDate(r.civil)) bazi.civilDateChanges.push({ year: r.year, longitude: lon, production: change.production, authority: change.authority, productionVnDate: vnDate(old), authorityVnDate: vnDate(r.civil) })
    if (vnMinute(old) !== vnMinute(r.civil)) bazi.minuteChanges++
    if (lon === 315) bazi.lapXuan.push({ year: r.year, deltaSeconds: (r.civil - old) / 1000 })
  }
}
const absD = bazi.deltas.map(Math.abs)
writeFileSync(`${A}/analysis/impact.json`, JSON.stringify({
  phase: '3B.4.4A',
  classification: 'PROJECTION ONLY',
  groupA: { tuLyChanges: groupA.tuLy, tuTuyetChanges: groupA.tuTuyet, nguyetKy: 'lunar days 5/14/23 only; no solar-term input => NO_CHANGE' },
  bazi: {
    jieCrossings: bazi.jie,
    civilDeltaSeconds: { median: q(absD, 0.5), p95: q(absD, 0.95), max: Math.max(...absD), above30s: absD.filter((x) => x > 30).length },
    lapXuan: { count: bazi.lapXuan.length, maxAbsSeconds: Math.max(...bazi.lapXuan.map((x) => Math.abs(x.deltaSeconds))), above30s: bazi.lapXuan.filter((x) => Math.abs(x.deltaSeconds) > 30).length },
    vnCivilDateChanges: bazi.civilDateChanges,
    vnDisplayedMinuteChanges: bazi.minuteChanges,
    totalMovedSeconds: absD.reduce((a, b) => a + b, 0),
  },
}, null, 2) + '\n')

console.log(JSON.stringify({ accuracy: erfaVsAuthority.accuracyGate, canonical: erfaVsAuthority.canonicalIntegerMs, civil: erfaVsAuthority.civilDateMismatches, archA: erfaVsAuthority.architectureA_ERFARuntimeVsGoldenV4.wouldFail, archAByClass: erfaVsAuthority.architectureA_ERFARuntimeVsGoldenV4.byClass, control: erfaVsAuthority.architectureA_ERFARuntimeVsGoldenV4.controlAuditEvaluatorWithAuthorityTables, clock: erfaVsAuthority.clockImplementationsAgree, oldValid: stillValid, oldInvalid: diff.oldFixturesUnderNewAuthority.invalidByClass, transitions: diff.transitionStats, pairLabels: diff.boundaryPairs.labelCounts, groupA: [groupA.tuLy.length, groupA.tuTuyet.length], baziDates: bazi.civilDateChanges.length }, null, 1))
