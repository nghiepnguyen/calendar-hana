// Group A authority-v4 evidence (new version; golden-v3 Group A stays frozen).
// Tứ Ly / Tứ Tuyệt fall on the Vietnamese civil day (UTC+7) before the day of
// the seasonal crossing. Dates come from the frozen JPL authority rows only.
//
//   node tasks/calendar-audit/solar-term-migration-v3.4B/tools/group-a-evidence.mjs

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json'
const IMPACT = 'tasks/calendar-audit/solar-term-migration-v3.4B/production-impact-v3.4B.json'
const OUT = 'tasks/calendar-audit/solar-term-migration-v3.4B/group-a-authority-v4-evidence.json'
const DAY = 86_400_000
const vnDate = (ms) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const rows = JSON.parse(readFileSync(SRC, 'utf8'))
  .rows.map((r) => r.split('|'))
  .filter((r) => +r[0] >= 1900 && +r[0] <= 2100)
const pick = (lons) =>
  rows
    .filter((r) => lons.includes(+r[1] * 15))
    .map((r) => ({ term: `${r[0]}:${+r[1] * 15}`, crossing: r[5], matchedDate: vnDate(+r[4] - DAY) }))
const fourSeparations = pick([0, 90, 180, 270])
const fourExtinctions = pick([315, 45, 135, 225])
const impact = JSON.parse(readFileSync(IMPACT, 'utf8'))
const changes = impact.vnCivilDateMoves
  .map((m) => {
    const lon = +m.term.split(':')[1]
    const rule = [0, 90, 180, 270].includes(lon)
      ? 'four-separations'
      : [315, 45, 135, 225].includes(lon)
        ? 'four-extinctions'
        : undefined
    if (!rule) return undefined
    const back = (d) => new Date(Date.parse(`${d}T00:00:00Z`) - DAY).toISOString().slice(0, 10)
    return {
      rule,
      term: m.term,
      preMigrationCrossing: m.old,
      authorityCrossing: m.new,
      preMigrationMatchedDate: back(m.oldVnDate),
      authorityMatchedDate: back(m.newVnDate),
      classification: 'EXPECTED_AUTHORITY_MIGRATION_CHANGE',
    }
  })
  .filter(Boolean)
const out = {
  version: 'group-a-authority-v4-evidence',
  status: 'MIGRATION_EVIDENCE (derived from the frozen golden-v4 authority; not a new reviewed Golden)',
  rules: 'unchanged: frozen v3 extraction (四離 / 四絶: the civil day before the crossing day)',
  authority: { path: SRC, sha256: sha(SRC), clockPolicy: 'clock-v1', dayBoundary: 'UTC+7 civil midnight' },
  preMigrationImpact: { path: IMPACT, sha256: sha(IMPACT) },
  range: '1900-2100',
  nguyetKy: 'lunar days 5/14/23 only; no solar-term input => NO_CHANGE',
  migrationChanges: changes,
  fourSeparations,
  fourExtinctions,
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify({ changes, separations: fourSeparations.length, extinctions: fourExtinctions.length }))
