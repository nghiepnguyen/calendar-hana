import activitiesData from '../almanac-data/activities.json'
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import trucData from '../almanac-data/truc.json'
import manifest from '../almanac-data/manifest.json'
import overrides from '../almanac-data/overrides.json'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import xiejiReview from '../almanac-data/xieji-activity-mapping-review.json'
import { getActivityScope } from './activityTaxonomy'
import { extractMansionEvidence, type MansionText } from './mansionEvidence'
import type { Evidence } from './evidence'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring } from './xiejiVol10Scoring'

export type ActivityStatus =
  'recommended' | 'neutral' | 'avoid' | 'watch' | 'strong_avoid' | 'consider' | 'no_evidence'
export interface ActivityRecommendation {
  activityId: string
  label: string
  group: string
  score: number
  status: ActivityStatus
  evidence: string[]
  contributions: Evidence[]
  warnings: string[]
  generalScore: number
  personalModifier: number
  positiveMagnitude: number
  negativeMagnitude: number
  hasVeto: boolean
  hardWarning: boolean
  conflictLevel: 'low' | 'high'
  sourceRefs: string[]
}
export interface ActivityAvoidance extends ActivityRecommendation {
  status: 'watch' | 'avoid' | 'strong_avoid' | 'consider'
}
export interface ActivityInput {
  officerId: string
  mansion?: MansionText
  presentGoodGods?: string[]
  presentBadGods?: string[]
  personalModifier?: number
  mansionNature?: 'good' | 'bad'
  /** Explicit presence operands of source-locked or day-rule gods (diagnostics only). */
  godPresence?: Readonly<Record<string, readonly { operand: string; equals: number }[]>>
  /** Day operands for 協紀 卷十 (Month Jian branch, day stem/branch); needed for its scoring. */
  classicalDay?: { monthJianBranch: number; dayStem: number; dayBranch: number }
  /** Overrides `manifest.policies.xiejiVol10Scoring` (tests and migration proof). */
  xiejiVol10Scoring?: boolean
}

export const XIEJI_AUTHORITY_ID = 'xiejibianfangshu-vol11'
const TRUC_ORDER = trucData.calculation.order as readonly string[]
const XIEJI_HEADINGS = xieji.activityEntries as Record<string, string[] | undefined>
const XIEJI_REVIEW = xiejiReview.activities as Record<
  string,
  { status: 'reviewed' | 'pending'; term: string; note: string } | undefined
>

/** Diagnostics metadata for a Trực/god rule: which 用事 heading, which authority, which operands.
 * The heading → activity mapping is a product interpretation (xieji-activity-mapping-review.json);
 * a reviewed mapping is never a scoring permission; no score effect. */
function xiejiEvidence(
  activityId: string,
  ruleKey: string,
  conditions: readonly { operand: string; equals: number }[],
): Pick<Evidence, 'activityMapping' | 'conditions' | 'exceptions'> {
  const headings = XIEJI_HEADINGS[activityId] ?? []
  const review = XIEJI_REVIEW[activityId]
  const reviewed = review?.status === 'reviewed'
  return {
    activityMapping: {
      version: 'xieji-activity-mapping-v1',
      activityId,
      status: 'exact_catalog_pair',
      reviewStatus: reviewed ? 'interpretation_reviewed' : 'interpretation_pending',
      reason: `協紀 卷十一 用事 ${headings.join('、')} → ${activityId}; ${reviewed ? 'cách hiểu đã thẩm định' : 'cách hiểu chưa thẩm định'}.`,
      ...(reviewed ? { reviewTerm: review.term } : {}),
      ...(review ? { reviewNote: review.note } : {}),
      authorityId: XIEJI_AUTHORITY_ID,
      clauseId: `${headings.join('+')}:${ruleKey}`,
    },
    conditions,
    // 卷十一 lists carry no per-heading exception; 鋪註條例 extra taboos are missing witnesses.
    exceptions: [],
  }
}
export const ACTIVITY_LABELS = Object.fromEntries(
  activitiesData.items.map((item) => [item.id, item.label]),
)
const clamp = (score: number) => Math.max(0, Math.min(100, score))

export function getActivityRecommendations(input: ActivityInput): ActivityRecommendation[] {
  const officer = trucData.items.find((item) => item.id === input.officerId)
  const subsumed = new Set((officer as { subsumesGods?: string[] } | undefined)?.subsumesGods)
  const mansion = input.mansion ? extractMansionEvidence(input.mansion) : []
  const warnings = [
    ...(input.presentGoodGods === undefined ? ['Chưa truyền danh sách cát thần theo ngày.'] : []),
    ...(input.presentBadGods === undefined ? ['Chưa truyền danh sách hung thần theo ngày.'] : []),
  ]
  const vol10Enabled =
    (input.xiejiVol10Scoring ?? manifest.policies.xiejiVol10Scoring) && input.classicalDay
  const vol10Items = vol10Enabled
    ? resolveVol10(
        {
          ...input.classicalDay!,
          officerId: input.officerId,
          presentGods: new Set(Object.keys(input.godPresence ?? {})),
          unknownGods: new Set(),
        },
        activitiesData.items.filter((item) => item.enabled).map((item) => item.id),
      )
    : []
  return activitiesData.items
    .filter((item) => item.enabled)
    .map((activity) => {
      const contributions: Evidence[] = []
      const rule = officer?.activityRules.find((rule) => rule.activityId === activity.id)
      const make = (
        source: Evidence['source'],
        ruleId: string,
        label: string,
        delta: number,
        status: Evidence['status'] = 'applied',
      ): Evidence => ({
        source,
        ruleId,
        activityId: activity.id,
        scope: getActivityScope(activity.id) ?? activity.id,
        label,
        sourcePhrase: label,
        sourceRef: `shared/almanac-data/${source === 'truc' ? 'truc' : source === 'good_god' ? 'good-gods' : 'bad-gods'}.json#${ruleId}`,
        confidence: 'high',
        status,
        rawDelta: delta,
        scoreDelta: delta,
        polarity: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral',
      })
      const officerIndex = TRUC_ORDER.indexOf(input.officerId)
      contributions.push(
        rule
          ? {
              ...make(
                'truc',
                `${input.officerId}:${activity.id}`,
                `Trực ${officer!.label}`,
                rule.weight,
              ),
              ...(officerIndex >= 0 && XIEJI_HEADINGS[activity.id]
                ? xiejiEvidence(activity.id, `truc:${input.officerId}`, [
                    { operand: 'OFFICER_INDEX', equals: officerIndex },
                  ])
                : {}),
            }
          : make(
              'truc',
              `${input.officerId}:${activity.id}`,
              officer ? `Trực ${officer.label}` : 'Trực chưa xác định',
              0,
              'no_evidence',
            ),
      )
      for (const [source, dataset, present] of [
        ['good_god', goodGodsData, input.presentGoodGods],
        ['bad_god', badGodsData, input.presentBadGods],
      ] as const) {
        let used = 0
        for (const god of dataset.items.filter(
          (god) => new Set(present ?? []).has(god.id) && god.activityIds.includes(activity.id),
        )) {
          const weights: Record<string, number> = dataset.weights
          const presence = input.godPresence?.[god.id]
          const row: Evidence = {
            ...make(source, god.id, god.label, weights[god.tier] ?? 0),
            ...(presence && XIEJI_HEADINGS[activity.id]
              ? xiejiEvidence(activity.id, `${source}:${god.id}`, presence)
              : {}),
          }
          // A god that always falls on this Trực restates the same day relation; when the Trực
          // already scores this activity, keep the god visible (and its hard warning) but do not
          // count it a second time.
          if (rule && subsumed.has(god.id)) {
            row.status = 'informational'
            row.scoreDelta = 0
            row.sourcePhrase = `${god.label} trùng với Trực ${officer!.label}, không tính điểm lần nữa`
          } else {
            const available = Math.max(0, Math.abs(dataset.capPerActivity) - used)
            row.scoreDelta = Math.sign(row.rawDelta) * Math.min(Math.abs(row.rawDelta), available)
            used += Math.abs(row.scoreDelta)
          }
          if (
            source === 'bad_god' &&
            overrides.items.some(
              (item) =>
                item.enabled &&
                item.action === 'preserve_bad' &&
                item.when.targetPresent === god.id &&
                item.activityIds.includes(activity.id),
            )
          )
            row.hardWarning = true
          contributions.push(row)
        }
      }
      // Unreviewed text candidates remain informational, even if the feature flag is accidentally enabled.
      contributions.push(
        ...mansion
          .filter((row) => row.activityId === activity.id)
          .map((row) => ({
            ...row,
            status:
              row.status === 'conflict'
                ? ('conflict' as const)
                : manifest.policies.mansion28ScoringEnabled
                  ? ('not_audited' as const)
                  : ('informational' as const),
            scoreDelta: 0,
          })),
      )
      if (vol10Enabled)
        contributions.splice(
          0,
          contributions.length,
          ...applyVol10Scoring(contributions, vol10Items, {
            activityId: activity.id,
            scope: getActivityScope(activity.id) ?? activity.id,
            badGodCap: badGodsData.capPerActivity,
          }),
        )
      const applied = contributions.filter((row) => row.status === 'applied')
      const positiveMagnitude = applied.reduce((sum, row) => sum + Math.max(0, row.scoreDelta), 0)
      const negativeMagnitude = applied.reduce(
        (sum, row) => sum + Math.abs(Math.min(0, row.scoreDelta)),
        0,
      )
      const generalScore = clamp(manifest.baseScore + positiveMagnitude - negativeMagnitude)
      const personalModifier = input.personalModifier ?? 0
      const score = clamp(generalScore + personalModifier)
      const hardWarning = contributions.some((row) => row.hardWarning)
      // Owner decision 2026-10-10: when 卷十 lifts every applied rule (不註宜忌 / 不忌), the
      // activity is neutral, not "no evidence" — the source has spoken about it.
      const classicalNeutral =
        !applied.length &&
        contributions.some(
          (row) =>
            row.classical?.verdict === 'no_annotation' || row.classical?.verdict === 'not_avoided',
        )
      const status: ActivityStatus = classicalNeutral
        ? 'neutral'
        : !applied.length
          ? 'no_evidence'
          : hardWarning && manifest.policies.hardVetoFromClassicalJi
            ? 'strong_avoid'
            : hardWarning || (positiveMagnitude >= 30 && negativeMagnitude >= 30)
              ? 'consider'
              : score <= 19
                ? 'strong_avoid'
                : score <= 29
                  ? 'avoid'
                  : negativeMagnitude > 0
                    ? 'watch'
                    : score >= 65
                      ? 'recommended'
                      : 'neutral'
      return {
        activityId: activity.id,
        label: activity.label,
        group: activity.group,
        score,
        status,
        contributions,
        warnings: [...warnings],
        evidence: [...new Set(applied.map((row) => row.label))],
        generalScore,
        personalModifier,
        positiveMagnitude,
        negativeMagnitude,
        hardWarning,
        hasVeto: hardWarning && manifest.policies.hardVetoFromClassicalJi,
        conflictLevel: positiveMagnitude >= 30 && negativeMagnitude >= 30 ? 'high' : 'low',
        sourceRefs: [...new Set(applied.map((row) => row.sourceRef))],
      }
    })
}

/** Both public lists share one computation, including source caps and disabled-Tú policy. */
export function getActivityAvoidances(input: ActivityInput): ActivityAvoidance[] {
  return getActivityRecommendations(input).filter((row): row is ActivityAvoidance =>
    ['watch', 'avoid', 'strong_avoid', 'consider'].includes(row.status),
  )
}
