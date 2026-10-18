/** Test-only: row generators of the roadmap 8 flag-OFF baseline v1, shared by the baseline, rollback
 * (roadmap 9 FR-08) and migration-diff tests. Functions come from the caller's module graph. */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import fixture from './audit-fixtures/mansion-decision-baseline-v1.json'
import type { getAlmanac as GetAlmanac } from './almanac'
import type { evaluateEventDay as EvaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

export const BASELINE_DIR = 'docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/'
// Out of the 2025–2027 P4 domain: the adapter must degrade to this baseline there, even with the flag ON.
export const OUTSIDE_P4_DOMAIN = ['2024-12-31', '2028-01-01', '2035-06-15']
export const P4_DOMAIN_DATES = fixture.days.map((d) => d.date)
export const BASELINE_DATES = [...P4_DOMAIN_DATES, ...OUTSIDE_P4_DOMAIN]
export const recSha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
export const EVENT_HOURS = [undefined, 9] as const

/** Event output without version stamps, so a version bump alone is not a diff. */
export function eventOutput(
  evaluate: typeof EvaluateEventDay,
  date: string,
  id: string,
  hour: number | undefined,
) {
  const {
    datasetVersion: _d,
    engineVersion: _e,
    ...e
  } = evaluate(date, id, hour === undefined ? {} : { hour })
  return e
}

export function activityRows(almanac: typeof GetAlmanac, dates = BASELINE_DATES) {
  const out = ['date\tactivity\tscore\tstatus\thard_warning\tsha256']
  for (const date of dates)
    for (const r of almanac(date as never).activityRecommendations)
      out.push([date, r.activityId, r.score, r.status, r.hardWarning, recSha(r)].join('\t'))
  return out.join('\n') + '\n'
}

export function eventRows(evaluate: typeof EvaluateEventDay, dates = BASELINE_DATES) {
  const out = ['date\tevent\thour\tscore\tclassification\tsha256']
  for (const date of dates)
    for (const [id] of EVENT_OPTIONS)
      for (const hour of EVENT_HOURS) {
        const e = eventOutput(evaluate, date, id, hour)
        out.push([date, id, hour ?? '', e.score ?? '', e.classification, recSha(e)].join('\t'))
      }
  return out.join('\n') + '\n'
}

/** Frozen baseline v1 lines keyed by every column but the last values (date|activity, date|event|hour). */
export function baselineLines(name: 'activities.tsv' | 'events.tsv') {
  const [, ...rows] = readFileSync(BASELINE_DIR + name, 'utf8')
    .trimEnd()
    .split('\n')
  const keyCols = name === 'activities.tsv' ? 2 : 3
  return new Map(rows.map((r) => [r.split('\t').slice(0, keyCols).join('|'), r]))
}
