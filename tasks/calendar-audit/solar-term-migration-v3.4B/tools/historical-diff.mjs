// Recomputes the golden-v3 → astronomy-authority-v4 semantic difference set
// from frozen evidence only (no production code): golden-v3 Group B fixtures,
// the golden-v4 JPL authority rows (clock-v1 civil ms), the frozen v3 source
// rule lookup and the 3B.4.4A audit diff. Writes the expected-difference
// manifest consumed by the historical regression suite.
//
//   node tasks/calendar-audit/solar-term-migration-v3.4B/tools/historical-diff.mjs [--check]

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const OUT = 'tasks/calendar-audit/solar-term-migration-v3.4B/calendar-golden-v3-historical-diff-v3.4B.json'
const RULES = ['month-breaker', 'robbery-sha', 'disaster-sha', 'month-sha', 'month-virtue']
const BR = '子丑寅卯辰巳午未申酉戌亥'
const inputs = {
  authority: 'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json',
  extraction: 'calendar-rule-extraction-v3.json',
  evidence: 'calendar-group-b-exact-jie-evidence.json',
  auditDiff: 'tasks/calendar-audit/astronomy-authority-v3.4A/analysis/golden-diff.json',
  ...Object.fromEntries(RULES.map((r) => [`golden-v3/${r}`, `golden-v3/group-b/${r}.json`])),
}
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = (p) => JSON.parse(readFileSync(p, 'utf8'))

// Jie only: Month Jian = branch opened by the last Jie (odd term index) at or before t.
const jie = json(inputs.authority)
  .rows.map((r) => r.split('|'))
  .filter((r) => +r[1] % 2 === 1)
  .map((r) => ({ year: +r[0], longitude: +r[1] * 15, civil: +r[4], iso: r[5], tt: +r[3] }))
const jianOfLongitude = (lon) => BR[(2 + ((lon - 315 + 360) % 360) / 30) % 12]
const floorMs = (instant) => {
  // Integer civil ms (floor) of an ISO instant with any number of fraction digits.
  const m = instant.match(/^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/)
  if (!m) throw new Error(`bad instant ${instant}`)
  return Date.parse(`${m[1]}.${(m[2] ?? '').padEnd(3, '0').slice(0, 3)}${m[3]}`)
}
const activeJie = (t) => {
  let lo = 0
  let hi = jie.length - 1
  if (t < jie[0].civil || t >= jie[hi].civil) throw new Error('outside authority')
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (jie[mid].civil <= t) lo = mid
    else hi = mid
  }
  return { active: jie[lo], next: jie[lo + 1] }
}

const lookup = Object.fromEntries(
  json(inputs.extraction)
    .rules.filter((r) => RULES.includes(r.id))
    .map((r) => [r.id, Object.fromEntries(r.rule.lookup.map((x) => [x.sourceMonthJianBranch, x.target.value]))]),
)

const audit = json(inputs.auditDiff)
const auditInvalid = new Map(audit.oldFixturesUnderNewAuthority.invalidCases.map((c) => [c.id, c]))

const differences = []
const unexpected = []
let checked = 0
for (const rule of RULES) {
  for (const f of json(inputs[`golden-v3/${rule}`]).fixtures) {
    checked++
    const t = floorMs(f.instant)
    const { active, next } = activeJie(t)
    const v4Jian = jianOfLongitude(active.longitude)
    const target = lookup[f.derivation.ruleId][v4Jian]
    const observed = f.derivation.operandType === 'DAY_STEM' ? f.context.dayStem : f.context.dayBranch
    const v4Expected = observed === target
    if (v4Jian === f.context.monthJian && v4Expected === f.expected) continue
    // Mechanism: the v3 instant lies within 1 s before the v4 boundary that opens
    // the v3 month, i.e. the authority root moved later than the old sample.
    const nearest = next
    const msBeforeNewT = nearest.civil - t
    const opensV3Month = jianOfLongitude(nearest.longitude) === f.context.monthJian
    const a = auditInvalid.get(f.id)
    const record = {
      id: f.id,
      ruleId: f.derivation.ruleId,
      fixtureClass: f.fixtureClass,
      instant: f.instant,
      civilDate: f.context.civilDate,
      v3: { monthJian: f.context.monthJian, expected: f.expected, target: f.derivation.expectedTarget },
      v4: { monthJian: v4Jian, expected: v4Expected, target },
      v4Boundary: { jieLongitudeDeg: nearest.longitude, civilIso: nearest.iso, ttMs: nearest.tt },
      msBeforeV4Boundary: msBeforeNewT,
      auditDiffAgrees:
        !!a && a.newAuthorityMonthJian === v4Jian && a.newAuthorityExpected === v4Expected,
    }
    const expected = opensV3Month && msBeforeNewT > 0 && msBeforeNewT <= 1000 && record.auditDiffAgrees
    record.classification = expected ? 'EXPECTED_AUTHORITY_MIGRATION_CHANGE' : 'UNEXPECTED_REGRESSION'
    ;(expected ? differences : unexpected).push(record)
  }
}

// Exact-Jie evidence (v3.1 P2): Swiss DE441 instants sampled at T_old − 60 s, T_old, T_old + 60 s.
const evidenceDifferences = []
for (const tr of json(inputs.evidence).transitions) {
  const tOld = floorMs(tr.instantUTC)
  const samples = [
    ['before', tOld - 60_000, tr.oldMonthJian],
    ['at', tOld, tr.newMonthJian],
    ['after', tOld + 60_000, tr.newMonthJian],
  ]
  for (const [sample, t, v3Jian] of samples) {
    const { active } = activeJie(t)
    const v4Jian = jianOfLongitude(active.longitude)
    if (v4Jian === v3Jian) continue
    const boundary = jie.find((j) => j.year === tr.year && j.longitude === tr.longitudeDegrees)
    const ok = sample === 'at' && boundary.civil > tOld && boundary.civil - tOld <= 1000
    ;(ok ? evidenceDifferences : unexpected).push({
      transitionId: tr.id,
      sample,
      instantUTC: tr.instantUTC,
      v3MonthJian: v3Jian,
      v4MonthJian: v4Jian,
      v4BoundaryCivilIso: boundary.iso,
      msV4AfterV3: boundary.civil - tOld,
      classification: ok ? 'EXPECTED_AUTHORITY_MIGRATION_CHANGE' : 'UNEXPECTED_REGRESSION',
    })
  }
}

const out = {
  phase: '3B.4.4B',
  kind: 'HISTORICAL_AUTHORITY_REGRESSION expected-difference manifest',
  historicalGolden: 'golden-v3 (Swiss Ephemeris DE441 authority, immutable)',
  currentAuthority: 'astronomy-authority-v4 / clock-v1 (golden-v4)',
  method:
    'Recomputed from frozen data only: v4 Month Jian = branch of the last JPL Jie whose clock-v1 civil ms <= floor(instant ms); target from calendar-rule-extraction-v3 lookup; day operands from the v3 fixture (instants unchanged, so civil dates unchanged). Expected iff the v3 instant lies 0 < d <= 1000 ms before the v4 Jie that opens the v3 month and the 3B.4.4A audit diff records the same v4 values.',
  inputs: Object.fromEntries(Object.entries(inputs).map(([k, p]) => [k, { path: p, sha256: sha(p) }])),
  fixturesChecked: checked,
  counts: {
    expectedFixtureDifferences: differences.length,
    byClass: differences.reduce((m, d) => ({ ...m, [d.fixtureClass]: (m[d.fixtureClass] ?? 0) + 1 }), {}),
    expectedEvidenceDifferences: evidenceDifferences.length,
    unexpected: unexpected.length,
    auditDiffInvalidCases: auditInvalid.size,
    setEqualsAuditDiff:
      differences.length === auditInvalid.size && differences.every((d) => auditInvalid.has(d.id)),
  },
  expectedDifferences: differences,
  expectedEvidenceDifferences: evidenceDifferences,
  unexpected,
}
const text = JSON.stringify(out, null, 2) + '\n'
if (process.argv.includes('--check')) {
  if (readFileSync(OUT, 'utf8') !== text) {
    console.error(`${OUT} is stale`)
    process.exit(1)
  }
} else writeFileSync(OUT, text)
console.log(JSON.stringify(out.counts))
if (unexpected.length || !out.counts.setEqualsAuditDiff) process.exit(2)
