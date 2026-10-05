import activitiesData from '../almanac-data/activities.json'
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import trucData from '../almanac-data/truc.json'
import manifest from '../almanac-data/manifest.json'
import overrides from '../almanac-data/overrides.json'
import patterns from '../almanac-data/mansion-patterns.json'
import { extractMansionEvidence, type MansionText } from './mansionEvidence'
import type { Evidence } from './evidence'

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
        scope:
          patterns.items.find(
            (pattern) => pattern.activityId === activity.id && pattern.scope !== 'travel_road',
          )?.scope ?? activity.id,
        label,
        sourcePhrase: label,
        sourceRef: `shared/almanac-data/${source === 'truc' ? 'truc' : source === 'good_god' ? 'good-gods' : 'bad-gods'}.json#${ruleId}`,
        confidence: 'high',
        status,
        rawDelta: delta,
        scoreDelta: delta,
        polarity: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral',
      })
      contributions.push(
        rule
          ? make('truc', `${input.officerId}:${activity.id}`, `Trực ${officer!.label}`, rule.weight)
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
          const row = make(source, god.id, god.label, weights[god.tier] ?? 0)
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
      const status: ActivityStatus = !applied.length
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
