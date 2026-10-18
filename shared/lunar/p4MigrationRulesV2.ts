/**
 * Roadmap 9b (tasks/prd-p4-9b.md §5, owner 2026-10-18): v2 of the roadmap 9 rules
 * (tasks/prd-p4-migration-diff.md FR-01, FR-04, owner §6.10) for ALL_TABOO_FLOOR_V1 and
 * MULTI_HEADING_JI_WINS_V1, frozen before the diff v2 TSV. v1 (`p4MigrationRules.ts`) stays unchanged.
 * Audit-only: no runtime module imports this file. A violation stops the migration for owner review;
 * the rules are never edited to fit the data (§6.10.2).
 */
import badGodsData from '../almanac-data/bad-gods.json'
import manifest from '../almanac-data/manifest.json'
import type { ActivityRecommendation } from './activityRecommendations'
import type { Evidence } from './evidence'
import {
  P4_ALL_TABOO_FLOOR,
  P4_ALL_TABOO_FLOOR_CLAUSE,
  P4_DORMANT_GODS,
  P4_PENALTY_POLICY_ID,
  P4_SCORE_ADAPTER_VERSION,
} from './p4ScoreAdapter'
import { VOL10_SCORING_VERSION } from './xiejiVol10Scoring'

export const P4_MIGRATION_RULES_VERSION = 'p4-migration-rules-v2'

/** Conclusion classes: every row whose score, status or hard warning changed needs at least one. */
export const CONCLUSION_CLASSES = [
  'STATE_LIFT',
  'DEFAULT_PENALTY',
  'DEFAULT_PENALTY_ALL_TABOO',
  'ALL_TABOO_FLOOR',
  'MULTI_HEADING_JI_WINS',
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
  /** 忌 protected `han` tokens: union of `P4HeadingInput.prot` over **all** the activity's headings
   * (as the adapter builds it), not only the deciding heading. */
  prot: ReadonlySet<string>
  /** Real manifest-OFF run (not the ON almanac with an OFF override, whose `warnings` already carry
   * the alias swap); its per-row sha256 must equal baseline v1. */
  base: Rec
  full: Rec
  /** Balancing-only run of the same row; enables CAP_REALLOCATION (b). */
  balancing?: Rec
  /** Golden v2 `presence/dated.tsv` dormant IDs of the date. */
  goldenDormant?: ReadonlySet<string>
  /** Golden score v2 `activity-states.tsv` state, when the activity is listed. */
  goldenState?: string
  /** `p4ActivityState(...).allTaboo` of the full run. */
  allTaboo?: boolean
}

const BAD_HAN = new Map(badGodsData.items.map((god) => [god.id, god.han]))
const IN_SCOPE = new Set<Evidence['source']>(['truc', 'good_god', 'bad_god'])
const AVOID = new Set(['avoid', 'strong_avoid'])
const RESOLVED = new Set(['only_ji', 'both_present', 'neither_recorded', 'only_yi'])
const JI_STATES = new Set(['only_ji', 'both_present'])

const conclusionChanged = (a: Rec, b: Rec) =>
  a.score !== b.score || a.status !== b.status || a.hardWarning !== b.hardWarning
const isChain = (row: Evidence) => row.classical?.version === VOL10_SCORING_VERSION
const replay = (rec: Rec) => {
  const applied = rec.contributions.filter((c) => c.status === 'applied')
  const pos = applied.reduce((sum, c) => sum + Math.max(0, c.scoreDelta), 0)
  const neg = applied.reduce((sum, c) => sum - Math.min(0, c.scoreDelta), 0)
  return Math.max(0, Math.min(100, manifest.baseScore + pos - neg))
}
const isLift = (row: Evidence) => row.classical?.version === P4_SCORE_ADAPTER_VERSION
const isPenalty = (row: Evidence) => row.policyId === P4_PENALTY_POLICY_ID
const isFloor = (row: Evidence) =>
  isPenalty(row) && row.sourceClauseId?.endsWith(`:${P4_ALL_TABOO_FLOOR_CLAUSE}`) === true
/** Applied in-scope negatives other than the product-policy row (after cap). */
const otherNegatives = (rec: Rec) =>
  rec.contributions.filter(
    (c) => !isPenalty(c) && IN_SCOPE.has(c.source) && c.status === 'applied' && c.scoreDelta < 0,
  )
const appliedNegativeSum = (rec: Rec) =>
  rec.contributions
    .filter((c) => IN_SCOPE.has(c.source) && c.status === 'applied')
    .reduce((sum, c) => sum + Math.max(0, -c.scoreDelta), 0)
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
      isFloor(penalty)
        ? 'ALL_TABOO_FLOOR'
        : penalty.sourceClauseId?.endsWith(':all_taboo')
          ? 'DEFAULT_PENALTY_ALL_TABOO'
          : 'DEFAULT_PENALTY',
    )
  if (state !== 'baseline' && row.headingStates.includes('not_recorded'))
    classes.push('MULTI_HEADING_JI_WINS')
  if (
    full.contributions.some(
      (c) => P4_DORMANT_GODS.has(c.ruleId) && c.status === 'applied' && c.scoreDelta !== 0,
    )
  )
    classes.push('DORMANT_GOD_ADDED')
  const chain = state !== 'baseline' && base.contributions.some(isChain)
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
  for (const p of penalties) {
    if (isFloor(p)) {
      // 9b P1 (i): only on 諸事皆忌, and exactly the missing part up to the floor.
      const others = otherNegatives(full).reduce((sum, c) => sum - c.scoreDelta, 0)
      if (!row.allTaboo || state !== 'only_ji') out.push('6 floor row without 諸事皆忌')
      else if (
        others === 0 ||
        others >= P4_ALL_TABOO_FLOOR ||
        p.scoreDelta !== others - P4_ALL_TABOO_FLOOR
      )
        out.push('6 floor row does not top up to the floor')
    } else if (
      !JI_STATES.has(state) ||
      full.contributions.some(
        (c) =>
          !isPenalty(c) &&
          IN_SCOPE.has(c.source) &&
          c.status === 'applied' &&
          (c.preCapDelta ?? c.scoreDelta) < 0,
      )
    )
      out.push('6 penalty without a 忌 state or beside an applied negative')
  }
  // 13 (9b P2): a not_recorded heading yields only to a heading that records 忌.
  if (row.headingStates.includes('not_recorded') && !row.headingStates.includes('undetermined')) {
    const rest = row.headingStates.filter((s) => s !== 'not_recorded')
    const ji = rest.some((s) => JI_STATES.has(s))
    if (state !== 'baseline' && !ji) out.push('13 not_recorded heading left baseline without 忌')
    if (state === 'baseline' && ji && rest.every((s) => RESOLVED.has(s)))
      out.push('13 忌 heading kept on baseline beside not_recorded')
  }
  // 14 (9b P1): 忌 states always show a negative; 諸事皆忌 reaches the floor.
  if (JI_STATES.has(state) && appliedNegativeSum(full) === 0)
    out.push('14 忌 state without an applied negative')
  if (row.allTaboo && appliedNegativeSum(full) < P4_ALL_TABOO_FLOOR)
    out.push('14 諸事皆忌 below the floor')
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
  // 12 (PRD FR-04): the trace explains the delta. Score replays from applied rows (no personal input),
  // and every in-scope row whose status/delta differs from flag OFF carries its reason.
  if (replay(base) !== base.score || replay(full) !== full.score) out.push('12 score ≠ replay')
  const key = (c: Evidence) => `${c.source}|${c.ruleId}`
  const baseRows = new Map(
    base.contributions.filter((c) => IN_SCOPE.has(c.source)).map((c) => [key(c), c]),
  )
  for (const c of full.contributions.filter((c) => IN_SCOPE.has(c.source))) {
    const b = baseRows.get(key(c))
    baseRows.delete(key(c))
    if (b && b.status === c.status && b.scoreDelta === c.scoreDelta) continue
    const explained =
      isLift(c) ||
      isPenalty(c) ||
      P4_DORMANT_GODS.has(c.ruleId) ||
      (c.preCapDelta !== undefined && c.preCapDelta !== c.scoreDelta) ||
      (b !== undefined && (isChain(b) || b.rawDelta !== b.scoreDelta))
    if (!explained) out.push(`12 ${key(c)} changed without a reason`)
  }
  for (const b of baseRows.values())
    if (!isChain(b)) out.push(`12 ${key(b)} dropped without a reason`)
  return out
}

/** 15 (9b, PRD 9b §5.2): against the roadmap 9 full run (frozen p4-migration-diff-v1), a changed
 * row must carry a 9b class: the floor, the −25 on both_present, or a not_recorded heading yielding. */
export function delta9bViolations(row: {
  previous: { score: number; status: string; hardWarning: boolean }
  full: Rec
  state: string
  classes: readonly MigrationClass[]
}): string[] {
  const { previous: p, full } = row
  if (p.score === full.score && p.status === full.status && p.hardWarning === full.hardWarning)
    return []
  const explained =
    row.classes.includes('ALL_TABOO_FLOOR') ||
    row.classes.includes('MULTI_HEADING_JI_WINS') ||
    (row.state === 'both_present' && row.classes.includes('DEFAULT_PENALTY'))
  const out = explained ? [] : ['15 changed against roadmap 9 without a 9b class']
  if (full.score > p.score && !row.classes.includes('MULTI_HEADING_JI_WINS'))
    out.push('15 score rose without a heading change')
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
