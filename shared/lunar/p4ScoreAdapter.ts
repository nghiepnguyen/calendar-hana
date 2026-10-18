/** Roadmap 8: P4 score adapter behind `xiejiVol10BalancingEnabled` (PRD tasks/prd-p4-score-adapter.md). */
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import type { Evidence } from './evidence'

export type P4HeadingInput = { state: string; rule?: string; prot?: readonly string[] }
export type P4ActivityState = { state: string; heading?: string; allTaboo?: boolean }

export const P4_SCORE_ADAPTER_VERSION = 'p4-score-adapter-v1'
export const P4_DEFAULT_PENALTY = -25
export const P4_PENALTY_POLICY_ID = 'product_policy_default_penalty'
/** Spec §5: the 21 catalog gods that score only with balancing ON. */
export const P4_DORMANT_GODS: ReadonlySet<string> = new Set([
  'thien_nguyen',
  'tu_tuong',
  'thoi_duc',
  'ngu_hop',
  'bat_tuong',
  'thien_thuong',
  'pho_ho',
  'tai_sat',
  'nguyet_sat',
  'nguyet_hai',
  'nguyet_yem',
  'yem_doi',
  'dai_thoi',
  'tu_phe',
  'tu_ky',
  'tu_cung',
  'ngu_mo',
  'ngu_ly',
  'vang_vong',
  'bat_chuyen',
  'quy_ky',
])

export type P4DayOperands = {
  monthJianBranch: number
  dayStem: number
  dayBranch: number
  lunarDay: number
}
let headingsProvider:
  ((date: string, day: P4DayOperands) => Record<string, P4HeadingInput>) | undefined
/** FR-08: the P4 resolver (~400 kB) is not in the main bundle; `p4AlmanacHeadings` registers itself
 * on import. Roadmap 10 must load it before the first almanac with the flag ON. */
export function setP4HeadingsProvider(fn: typeof headingsProvider) {
  headingsProvider = fn
}
/** P4 operands (moon phase, soil) are frozen for these civil dates only. */
export const P4_DOMAIN = ['2025-01-01', '2027-12-31'] as const
/** Spec §5 forbids a dormant-gods-only release: balancing runs only once the provider is loaded.
 * Outside the P4 domain flag ON is the whole flag-OFF output, stars included (owner 2026-10-18). */
export const p4BalancingReady = (date: string) =>
  headingsProvider !== undefined && date >= P4_DOMAIN[0] && date <= P4_DOMAIN[1]
/** Heading states of a day; `{}` (every activity on baseline) until a provider is registered. */
export const getP4Headings = (date: string, day: P4DayOperands) =>
  headingsProvider?.(date, day) ?? {}

const HEADINGS = xieji.activityEntries as Record<string, string[] | undefined>
// PRD §6.5 `p4_multi_heading_strictest`: keep negatives first, then drop positives.
const ORDER = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']
const BAD_HAN = new Map(badGodsData.items.map((god) => [god.id, god.han]))

/** Activity state from its 卷十一 headings; any heading not_recorded/undetermined/unknown keeps the baseline. */
export function p4ActivityState(
  activityId: string,
  headings: Readonly<Record<string, P4HeadingInput>>,
): P4ActivityState {
  const hs = HEADINGS[activityId]
  if (!hs?.length) return { state: 'baseline' }
  const states = hs.map((h) => headings[h]?.state)
  if (states.some((s) => s === undefined || !ORDER.includes(s))) return { state: 'baseline' }
  const best = Math.min(...states.map((s) => ORDER.indexOf(s!)))
  const state = ORDER[best]!
  return {
    state,
    heading: hs[states.indexOf(state)],
    ...(state === 'only_ji' && hs.some((h) => headings[h]!.rule === 'all_taboo')
      ? { allTaboo: true }
      : {}),
  }
}

/**
 * Rows of one activity (god rows uncapped) in, resolved rows out (spec §4.1 steps 4–5, PRD FR-02/FR-04):
 * lift by state, one −25 when only_ji leaves no applied negative, then one cap allocation per god source.
 */
export function applyP4Balancing(
  rows: readonly Evidence[],
  p4: P4ActivityState,
  headings: Readonly<Record<string, P4HeadingInput>>,
  opts: { activityId: string; scope: string },
): Evidence[] {
  const { state, heading } = p4
  const prot = new Set((HEADINGS[opts.activityId] ?? []).flatMap((h) => headings[h]?.prot ?? []))
  const inScope = (row: Evidence) => ['truc', 'good_god', 'bad_god'].includes(row.source)
  const out = rows.map((row): Evidence => {
    if (!inScope(row)) return row
    const tagged = {
      ...row,
      preCapDelta: row.status === 'applied' ? row.rawDelta : 0,
      evidenceOrigin: 'canonical' as const,
    }
    if (row.status !== 'applied' || row.rawDelta === 0) return tagged
    const negative = row.rawDelta < 0
    // 忌 protected (§6.9) and preserve_bad overrides (§6.4) are never lifted.
    if (
      negative &&
      (row.hardWarning || (row.source === 'bad_god' && prot.has(BAD_HAN.get(row.ruleId)!)))
    )
      return tagged
    const lifted = negative
      ? state === 'only_yi' || state === 'neither_recorded'
      : state === 'only_ji' || state === 'neither_recorded'
    if (!lifted) return tagged
    return {
      ...tagged,
      status: 'informational',
      preCapDelta: 0,
      scoreDelta: 0,
      classical: {
        version: P4_SCORE_ADAPTER_VERSION,
        entry: heading!,
        verdict:
          state === 'neither_recorded' ? 'no_annotation' : negative ? 'not_avoided' : 'avoid',
        quote: '',
      },
    }
  })
  // §6.7/§6.8/§6.11/§6.13: only applied negatives (not Trực-subsumed gods) block the penalty.
  if (state === 'only_ji' && !out.some((r) => r.status === 'applied' && (r.preCapDelta ?? 0) < 0))
    out.push({
      source: 'bad_god',
      ruleId: `p4_default_penalty:${opts.activityId}`,
      activityId: opts.activityId,
      scope: opts.scope,
      label: 'Điểm trừ mặc định của ứng dụng',
      sourcePhrase: `${heading} 從忌不從宜${p4.allTaboo ? ' (諸事皆忌)' : ''}: điểm trừ mặc định của ứng dụng, không phải quy tắc của sách`,
      sourceRef: `tasks/prd-p4-score-adapter.md#${P4_PENALTY_POLICY_ID}`,
      confidence: 'high',
      status: 'applied',
      rawDelta: P4_DEFAULT_PENALTY,
      preCapDelta: P4_DEFAULT_PENALTY,
      scoreDelta: P4_DEFAULT_PENALTY,
      polarity: 'negative',
      evidenceOrigin: 'product_policy',
      policyId: P4_PENALTY_POLICY_ID,
      sourceClauseId: `p4:${heading}${p4.allTaboo ? ':all_taboo' : ''}`,
      balancingEligible: false,
    })
  for (const [source, cap] of [
    ['good_god', goodGodsData.capPerActivity],
    ['bad_god', badGodsData.capPerActivity],
  ] as const) {
    let used = 0
    for (const row of out) {
      if (row.source !== source || row.status !== 'applied') continue
      const take = Math.min(Math.abs(row.preCapDelta!), Math.max(0, Math.abs(cap) - used))
      row.scoreDelta = take && (row.preCapDelta! < 0 ? -take : take) // no -0 in output
      used += take
    }
  }
  return out
}
