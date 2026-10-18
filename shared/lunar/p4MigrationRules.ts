/**
 * Roadmap 9 (tasks/prd-p4-migration-diff.md FR-01, FR-04, owner §6.10): diff classes and
 * `UNEXPECTED_REGRESSION` invariants, frozen before any migration TSV is generated.
 * Audit-only: no runtime module imports this file. A violation stops the migration for owner review;
 * the rules are never edited to fit the data (§6.10.2).
 */
import badGodsData from '../almanac-data/bad-gods.json'
import type { ActivityRecommendation } from './activityRecommendations'
import type { Evidence } from './evidence'
import { P4_DORMANT_GODS, P4_PENALTY_POLICY_ID, P4_SCORE_ADAPTER_VERSION } from './p4ScoreAdapter'
import { VOL10_SCORING_VERSION } from './xiejiVol10Scoring'

export const P4_MIGRATION_RULES_VERSION = 'p4-migration-rules-v1'

/** Conclusion classes: every row whose score, status or hard warning changed needs at least one. */
export const CONCLUSION_CLASSES = [
  'STATE_LIFT',
  'DEFAULT_PENALTY',
  'DEFAULT_PENALTY_ALL_TABOO',
  'DORMANT_GOD_ADDED',
  'CHAIN_REPLACED',
  'CAP_REALLOCATION',
] as const
/** Review and non-conclusion classes (FR-04). */
export const REPORT_CLASSES = [
  'CHAIN_REPLACED_LIGHTER',
  'ALIAS_STAR_SWAP',
  'SCHEMA_ONLY',
  'MULTI_HEADING_BASELINE',
] as const
export type MigrationClass = (typeof CONCLUSION_CLASSES)[number] | (typeof REPORT_CLASSES)[number]

export type Rec = Pick<
  ActivityRecommendation,
  'activityId' | 'score' | 'status' | 'hardWarning' | 'contributions' | 'warnings'
>

export interface ActivityDiffRow {
  date: string
  /** False outside 2025–2027 (P4_DOMAIN). */
  inDomain: boolean
  /** `p4ActivityState(...).state` of the full run. */
  state: string
  /** Heading states of the activity in the full run, in catalog order (empty: no heading). */
  headingStates: readonly string[]
  /** 忌 protected `han` tokens of the activity's headings (`P4HeadingInput.prot`). */
  prot: ReadonlySet<string>
  /** Flag OFF (baseline v1 equal on score/status/hard warning). */
  base: Rec
  full: Rec
  /** Balancing-only run of the same row; enables CAP_REALLOCATION (b). */
  balancing?: Rec
  /** Golden v2 `presence/dated.tsv` dormant IDs of the date. */
  goldenDormant?: ReadonlySet<string>
  /** Golden score v1 `activity-states.tsv` state, when the activity is listed. */
  goldenState?: string
}

const BAD_HAN = new Map(badGodsData.items.map((god) => [god.id, god.han]))
const IN_SCOPE = new Set<Evidence['source']>(['truc', 'good_god', 'bad_god'])
const AVOID = new Set(['avoid', 'strong_avoid'])
const RESOLVED = new Set(['only_ji', 'both_present', 'neither_recorded', 'only_yi'])

const conclusionChanged = (a: Rec, b: Rec) =>
  a.score !== b.score || a.status !== b.status || a.hardWarning !== b.hardWarning
const isLift = (row: Evidence) => row.classical?.version === P4_SCORE_ADAPTER_VERSION
const isPenalty = (row: Evidence) => row.policyId === P4_PENALTY_POLICY_ID
const nonDormantGodSum = (rec: Rec) =>
  rec.contributions
    .filter(
      (c) =>
        (c.source === 'good_god' || c.source === 'bad_god') &&
        !P4_DORMANT_GODS.has(c.ruleId) &&
        !isPenalty(c),
    )
    .reduce((sum, c) => sum + Math.abs(c.scoreDelta), 0)

export function classifyActivityRow(row: ActivityDiffRow): {
  changed: boolean
  classes: MigrationClass[]
} {
  const { base, full, state } = row
  const changed = conclusionChanged(base, full)
  const classes: MigrationClass[] = []
  const lift = full.contributions.some(isLift)
  if (lift) classes.push('STATE_LIFT')
  const penalty = full.contributions.find(isPenalty)
  if (penalty)
    classes.push(
      penalty.sourceClauseId?.endsWith(':all_taboo')
        ? 'DEFAULT_PENALTY_ALL_TABOO'
        : 'DEFAULT_PENALTY',
    )
  if (
    full.contributions.some(
      (c) => P4_DORMANT_GODS.has(c.ruleId) && c.status === 'applied' && c.scoreDelta !== 0,
    )
  )
    classes.push('DORMANT_GOD_ADDED')
  const chain =
    state !== 'baseline' &&
    base.contributions.some((c) => c.classical?.version === VOL10_SCORING_VERSION)
  if (chain) classes.push('CHAIN_REPLACED')
  if (row.balancing && nonDormantGodSum(full) < nonDormantGodSum(row.balancing))
    classes.push('CAP_REALLOCATION')
  // §6.10.7: lighter only because the 6 chains are gone, no state lift to explain it.
  if (
    changed &&
    chain &&
    !lift &&
    ((AVOID.has(base.status) && !AVOID.has(full.status)) ||
      (base.status === 'strong_avoid' && full.status === 'avoid'))
  )
    classes.push('CHAIN_REPLACED_LIGHTER')
  if (
    state === 'baseline' &&
    row.headingStates.length > 1 &&
    row.headingStates.some((s) => RESOLVED.has(s))
  )
    classes.push('MULTI_HEADING_BASELINE')
  if (!changed) {
    if (base.warnings.join('\n') !== full.warnings.join('\n')) classes.push('ALIAS_STAR_SWAP')
    else if (JSON.stringify(base) !== JSON.stringify(full)) classes.push('SCHEMA_ONLY')
  }
  return { changed, classes }
}

/** FR-01 invariants 1–9 and 11 for one activity-date; each message starts with the invariant number. */
export function activityViolations(row: ActivityDiffRow): string[] {
  const { base, full, state } = row
  const out: string[] = []
  const { changed, classes } = classifyActivityRow(row)
  if (state === 'baseline' && conclusionChanged(base, full)) out.push('1 baseline activity changed')
  if (base.hardWarning !== full.hardWarning) out.push('2 hard warning changed')
  if (!row.inDomain && JSON.stringify(base) !== JSON.stringify(full))
    out.push('3 out-of-domain output differs')
  if (changed && !classes.some((c) => (CONCLUSION_CLASSES as readonly string[]).includes(c)))
    out.push('4 changed row without a class')
  const positive = full.contributions.some((c) => c.status === 'applied' && c.scoreDelta > 0)
  if ((full.status === 'recommended' || full.score > 50) && !positive)
    out.push('5 good result without an applied positive')
  const penalties = full.contributions.filter(isPenalty)
  if (penalties.length > 1) out.push('6 penalty more than once')
  if (
    penalties.length &&
    (state !== 'only_ji' ||
      full.contributions.some(
        (c) =>
          !isPenalty(c) &&
          IN_SCOPE.has(c.source) &&
          c.status === 'applied' &&
          (c.preCapDelta ?? c.scoreDelta) < 0,
      ))
  )
    out.push('6 penalty without only_ji or beside an applied negative')
  for (const c of full.contributions.filter(isLift)) {
    const negative = c.rawDelta < 0
    const allowed = negative
      ? state === 'only_yi' || state === 'neither_recorded'
      : state === 'only_ji' || state === 'neither_recorded'
    if (!allowed) out.push(`7 ${c.ruleId} lifted under ${state}`)
    if (
      negative &&
      (c.hardWarning || (c.source === 'bad_god' && row.prot.has(BAD_HAN.get(c.ruleId) ?? '')))
    )
      out.push(`7 protected ${c.ruleId} lifted`)
  }
  if (row.goldenDormant)
    for (const c of full.contributions)
      if (
        P4_DORMANT_GODS.has(c.ruleId) &&
        c.status === 'applied' &&
        !row.goldenDormant.has(c.ruleId)
      )
        out.push(`8 ${c.ruleId} not present in Golden v2`)
  if (row.goldenState !== undefined && row.goldenState !== state)
    out.push(`9 state ${state} ≠ Golden ${row.goldenState}`)
  if (base.status === 'no_evidence' && full.status === 'recommended' && !positive)
    out.push('11 no_evidence → recommended without an applied positive')
  return out
}

/** FR-01 invariant 10: a changed event row needs a changed activity of its profile on that date. */
export function eventViolations(row: {
  changed: boolean
  profileActivities: readonly string[]
  changedActivities: ReadonlySet<string>
}): string[] {
  return row.changed && !row.profileActivities.some((a) => row.changedActivities.has(a))
    ? ['10 event changed without a changed profile activity']
    : []
}
