/**
 * Roadmap 9 (tasks/prd-p4-migration-diff.md FR-03, FR-05, FR-06, owner §6.10.4–6.10.5): TSV, summary and
 * review rows from the harness runs. Test-only, pure: no runtime module imports this file.
 */
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import type { ActivityRecommendation } from './activityRecommendations'
import type { Evidence } from './evidence'
import {
  classifyActivityRow,
  CONCLUSION_CLASSES,
  type ActivityDiffRow,
  type MigrationClass,
  type Rec,
} from './p4MigrationRules'
import { P4_DORMANT_GODS, P4_PENALTY_POLICY_ID, P4_SCORE_ADAPTER_VERSION } from './p4ScoreAdapter'

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const IN_SCOPE = new Set<Evidence['source']>(['truc', 'good_god', 'bad_god'])
const CAPS = [
  ['good_god', Math.abs(goodGodsData.capPerActivity)],
  ['bad_god', Math.abs(badGodsData.capPerActivity)],
] as const

export interface DayInfo {
  date: string
  ctx: Record<string, number>
  /** Star names of the configuration and of baseline. */
  stars: readonly string[]
  baseStars: readonly string[]
}
export interface EventDiff {
  date: string
  key: string
  base: { score: number | null; classification: string; fit: string }
  cfg: { score: number | null; classification: string; fit: string }
  profileChanged: readonly string[]
}

export const pillar = (ctx: Record<string, number>) =>
  STEMS[ctx.DAY_STEM!]! + BRANCHES[ctx.DAY_BRANCH!]!
export const monthJian = (ctx: Record<string, number>) => BRANCHES[ctx.MONTH_JIAN_BRANCH!]!
const conclusionChanged = (
  a: Pick<ActivityRecommendation, 'score' | 'status' | 'hardWarning'>,
  b: typeof a,
) => a.score !== b.score || a.status !== b.status || a.hardWarning !== b.hardWarning
const isLift = (c: Evidence) => c.classical?.version === P4_SCORE_ADAPTER_VERSION
const bump = (m: Record<string, number>, k: string, n = 1) => (m[k] = (m[k] ?? 0) + n)
const sorted = (m: Record<string, number>) =>
  Object.fromEntries(Object.entries(m).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)))

/**
 * FR-05(a): the same adapter rows capped first and lifted after; returns full − counterfactual over
 * both god pools. Expected 0 everywhere: a pool holds one sign and a lift goes by sign.
 */
export function capFirstDiff(full: Pick<ActivityRecommendation, 'contributions'>) {
  let diff = 0
  for (const [source, cap] of CAPS) {
    let used = 0
    for (const c of full.contributions) {
      if (c.source !== source || (c.status !== 'applied' && !isLift(c))) continue
      const take = Math.min(Math.abs(c.rawDelta), Math.max(0, cap - used))
      used += take
      diff += c.scoreDelta - (isLift(c) ? 0 : Math.sign(c.rawDelta) * take)
    }
  }
  return diff
}

/** In-scope rows whose status or applied delta differ from flag OFF: `source:ruleId raw/preCap/applied<base`. */
function changedRows(base: Rec, full: Rec) {
  const key = (c: Evidence) => `${c.source}:${c.ruleId}`
  const baseRows = new Map(
    base.contributions.filter((c) => IN_SCOPE.has(c.source)).map((c) => [key(c), c]),
  )
  const out: string[] = []
  for (const c of full.contributions.filter((c) => IN_SCOPE.has(c.source))) {
    const b = baseRows.get(key(c))
    baseRows.delete(key(c))
    if (b && b.status === c.status && b.scoreDelta === c.scoreDelta) continue
    const applied = c.status === 'applied' ? c.scoreDelta : 'i'
    out.push(
      `${key(c)} ${c.rawDelta}/${c.preCapDelta ?? c.rawDelta}/${applied}<${b ? (b.status === 'applied' ? b.scoreDelta : 'i') : '-'}`,
    )
  }
  for (const b of baseRows.values())
    out.push(`${key(b)} -<${b.status === 'applied' ? b.scoreDelta : 'i'}`)
  return out.join(' ')
}
const capUsed = (rec: Rec, source: string) =>
  rec.contributions
    .filter((c) => c.source === source && c.status === 'applied')
    .reduce((s, c) => s + Math.abs(c.scoreDelta), 0)

export const DAY_HEADER = 'date\tmonth_jian\tpillar\tlunar_day\tdormant\tstars_added\tstars_removed'
export function dayLine(d: DayInfo) {
  const base = new Set(d.baseStars)
  const cfg = new Set(d.stars)
  const dormant = [...P4_DORMANT_GODS].filter((id) =>
    [...goodGodsData.items, ...badGodsData.items].some((g) => g.id === id && cfg.has(g.label)),
  )
  return [
    d.date,
    monthJian(d.ctx),
    pillar(d.ctx),
    d.ctx.LUNAR_DAY,
    dormant.join(' '),
    d.stars.filter((s) => !base.has(s)).join(' | '),
    d.baseStars.filter((s) => !cfg.has(s)).join(' | '),
  ].join('\t')
}

export const ACTIVITY_HEADER =
  'date\tactivity\tstate\tdeciding_heading\theadings\tprot\tscore_before\tscore_after\tstatus_before\tstatus_after\thard_warning\tclasses\tcap_good\tcap_bad\tcap_first_diff\tsource_ids\trows'
export function activityLine(
  row: ActivityDiffRow,
  heading: string | undefined,
  hs: readonly string[],
) {
  const { base, full } = row
  const { classes } = classifyActivityRow(row)
  const ids = full.contributions
    .filter((c) => isLift(c) || c.policyId === P4_PENALTY_POLICY_ID)
    .map((c) => c.sourceClauseId ?? `${c.classical!.entry}:${c.ruleId}`)
  return [
    row.date,
    full.activityId,
    row.state,
    heading ?? '',
    hs.map((h, i) => `${h}=${row.headingStates[i]}`).join(' '),
    [...row.prot].join(' '),
    base.score,
    full.score,
    base.status,
    full.status,
    full.hardWarning,
    classes.join(' '),
    capUsed(full, 'good_god'),
    capUsed(full, 'bad_god'),
    row.state === 'baseline' ? 0 : capFirstDiff(full),
    ids.join(' '),
    changedRows(base, full),
  ].join('\t')
}

export const EVENT_HEADER =
  'date\tevent\thour\tscore_before\tscore_after\tclass_before\tclass_after\tevent_fit_before\tevent_fit_after\tprofile_changed'
export function eventLine(e: EventDiff) {
  const [id, hour] = e.key.split('|')
  return [
    e.date,
    id,
    hour,
    e.base.score ?? '',
    e.cfg.score ?? '',
    e.base.classification,
    e.cfg.classification,
    e.base.fit,
    e.cfg.fit,
    e.profileChanged.join(' '),
  ].join('\t')
}

export const CHANGED_HEADER =
  'date\tactivity\tscore_before\tscore_after\tstatus_before\tstatus_after'
export const changedLine = (date: string, b: ActivityRecommendation, r: ActivityRecommendation) =>
  [date, r.activityId, b.score, r.score, b.status, r.status].join('\t')

/** Counts for one configuration against baseline (FR-06). */
export function configSummary(
  pairs: readonly { base: ActivityRecommendation; cfg: ActivityRecommendation }[],
  events: readonly EventDiff[],
) {
  const transitions: Record<string, number> = {}
  const eventTransitions: Record<string, number> = {}
  let changed = 0
  let score = 0
  let status = 0
  let hardWarning = 0
  for (const { base, cfg } of pairs) {
    if (conclusionChanged(base, cfg)) changed++
    if (base.score !== cfg.score) score++
    if (base.hardWarning !== cfg.hardWarning) hardWarning++
    if (base.status !== cfg.status) {
      status++
      bump(transitions, `${base.status}→${cfg.status}`)
    }
  }
  let eventScore = 0
  let eventClass = 0
  for (const e of events) {
    if (e.base.score !== e.cfg.score) eventScore++
    if (e.base.classification !== e.cfg.classification) {
      eventClass++
      bump(eventTransitions, `${e.base.classification}→${e.cfg.classification}`)
    }
  }
  return {
    activity: { rows: pairs.length, changed, score, status, hardWarning },
    event: { rows: events.length, score: eventScore, classification: eventClass },
    transitions: sorted(transitions),
    eventTransitions: sorted(eventTransitions),
  }
}

/** FR-05 decomposition, class counts and slices of the full configuration. */
export function fullSummary(
  rows: readonly ActivityDiffRow[],
  chainSwapChanged: ReadonlySet<string>,
) {
  const classes: Record<string, number> = {}
  const byState: Record<string, number> = {}
  const changedByState: Record<string, number> = {}
  const dormantGods: Record<string, number> = {}
  const delta: Record<string, number> = {}
  const slices: Record<string, Record<string, number>> = { warehouse: {}, warehouse_opening: {} }
  let capFirstRows = 0
  let capStatusVsBalancing = 0
  let noDormantChanged = 0
  let noDormantExplained = 0
  let chainSwapInFull = 0
  let goodFromNothing = 0
  for (const r of rows) {
    const { changed, classes: cs } = classifyActivityRow(r)
    bump(byState, r.state)
    for (const c of cs)
      if (changed || !(CONCLUSION_CLASSES as readonly string[]).includes(c)) bump(classes, c)
    if (r.state !== 'baseline' && capFirstDiff(r.full) !== 0) capFirstRows++
    if (!changed) continue
    bump(changedByState, r.state)
    const d = Math.abs(r.full.score - r.base.score)
    bump(
      delta,
      d >= 40 ? '>=40' : d >= 30 ? '30-39' : d >= 20 ? '20-29' : d >= 10 ? '10-19' : '1-9',
    )
    if (cs.includes('CAP_REALLOCATION') && r.balancing && r.balancing.status !== r.full.status)
      capStatusVsBalancing++
    for (const c of r.full.contributions)
      if (P4_DORMANT_GODS.has(c.ruleId) && c.status === 'applied' && c.scoreDelta !== 0)
        bump(dormantGods, c.ruleId)
    if (!r.full.contributions.some((c) => P4_DORMANT_GODS.has(c.ruleId))) {
      noDormantChanged++
      if (
        cs.some((c) =>
          ['STATE_LIFT', 'DEFAULT_PENALTY', 'DEFAULT_PENALTY_ALL_TABOO', 'CHAIN_REPLACED'].includes(
            c,
          ),
        )
      )
        noDormantExplained++
    }
    if (chainSwapChanged.has(`${r.date}|${r.full.activityId}`)) chainSwapInFull++
    if (['no_evidence', 'neutral'].includes(r.base.status) && r.full.status === 'recommended')
      goodFromNothing++
    if (r.full.activityId in slices)
      bump(slices[r.full.activityId]!, `${r.base.status}→${r.full.status}`)
  }
  return {
    activityStates: sorted(byState),
    changedByState: sorted(changedByState),
    classes: sorted(classes),
    absScoreDelta: delta,
    decomposition: {
      capFirstCounterfactualRows: capFirstRows,
      capReallocationStatusVsBalancing: capStatusVsBalancing,
      chainSwapChangedRows: chainSwapChanged.size,
      chainSwapRowsAlsoChangedInFull: chainSwapInFull,
      changedWithoutDormantRow: noDormantChanged,
      changedWithoutDormantExplainedByLiftPenaltyChain: noDormantExplained,
    },
    neutralOrNoEvidenceToRecommended: goodFromNothing,
    dormantGodsApplied: sorted(dormantGods),
    warehouseTransitions: Object.fromEntries(
      Object.entries(slices).map(([k, v]) => [k, sorted(v)]),
    ),
  }
}

export const REVIEW_HEADER = 'reason\tdate\tactivity_or_event\tstate\tbefore\tafter\tclasses'
/** §6.10.5 review package. Deterministic: date order, then catalog order. */
export function reviewLines(rows: readonly ActivityDiffRow[], events: readonly EventDiff[]) {
  const out: string[] = []
  const line = (reason: string, r: ActivityDiffRow, cs: MigrationClass[]) =>
    [
      reason,
      r.date,
      r.full.activityId,
      r.state,
      `${r.base.score} ${r.base.status}`,
      `${r.full.score} ${r.full.status}`,
      cs.join(' '),
    ].join('\t')
  const changed = rows.map((r) => ({ r, c: classifyActivityRow(r) })).filter(({ c }) => c.changed)
  const top = [...changed]
    .sort(
      (a, b) =>
        Math.abs(b.r.full.score - b.r.base.score) - Math.abs(a.r.full.score - a.r.base.score),
    )
    .slice(0, 50)
  for (const { r, c } of top) out.push(line('top50_abs_delta', r, c.classes))
  for (const { r, c } of changed)
    if (r.base.status === 'recommended' && r.full.status === 'strong_avoid')
      out.push(line('recommended_to_strong_avoid', r, c.classes))
  const strata: Record<string, number> = {}
  for (const { r, c } of changed)
    for (const cls of c.classes)
      if ((strata[`${cls}|${r.state}`] = (strata[`${cls}|${r.state}`] ?? 0) + 1) <= 3)
        out.push(line(`sample:${cls}`, r, c.classes))
  for (const { r, c } of changed)
    if (
      c.classes.includes('CAP_REALLOCATION') &&
      r.balancing &&
      r.balancing.status !== r.full.status
    )
      out.push(line('cap_status_vs_balancing', r, c.classes))
  for (const { r, c } of changed)
    if (c.classes.includes('CHAIN_REPLACED_LIGHTER'))
      out.push(line('chain_replaced_lighter', r, c.classes))
  for (const r of rows) {
    const c = classifyActivityRow(r)
    if (c.classes.includes('MULTI_HEADING_BASELINE'))
      out.push(line('multi_heading_baseline', r, c.classes))
  }
  for (const e of events)
    if (e.base.classification === 'insufficient_evidence' && e.cfg.classification === 'recommended')
      out.push(
        [
          'event_insufficient_to_recommended',
          e.date,
          e.key,
          '',
          `${e.base.score ?? ''} ${e.base.classification}`,
          `${e.cfg.score ?? ''} ${e.cfg.classification}`,
          '',
        ].join('\t'),
      )
  return out
}
