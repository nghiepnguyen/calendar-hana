import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import { getDayInfo } from './index'
import { parseSolarDate } from './julian'
import {
  getEventProfile,
  resolveEventActivityRoles,
  type EventCriterion,
  type EventInput,
} from './eventMapping'
import { ENGINE_VERSION, type Evidence } from './evidence'
import { analyzeEvidenceConflicts, type ConflictAnalysis } from './evidenceConflicts'
import { resolveVol10, type Vol10Resolution } from './xiejiVol10Resolution'
import { isVol10ChainRow } from './xiejiVol10Scoring'
import trucData from '../almanac-data/truc.json'

export { ENGINE_VERSION } from './evidence'
export type Classification =
  'recommended' | 'caution' | 'not_recommended' | 'insufficient_evidence' | 'conflict'
export type CriterionResult = {
  id: EventCriterion
  status: 'pass' | 'fail' | 'unknown'
  reason: string
}
export interface Contribution extends Evidence {
  multiplier: number
  appliedDelta: number
}
export interface EventEvaluation {
  eventId: string
  date: string
  timezone: string
  input: EventInput
  datasetVersion: string
  engineVersion: string
  score: number | null
  classification: Classification
  /** Low-severity event with no rule for its primary activity, treated as neutral by policy. */
  neutralByPolicy: boolean
  mustHave: CriterionResult[]
  criteria: CriterionResult[]
  contributions: Contribution[]
  warnings: string[]
  /** Source/context conflict diagnostics; do not alter scoring or classification. */
  conflictAnalysis: ConflictAnalysis
  /** 協紀 卷十 conclusion per present source-locked 凶 and event activity; never affects score. */
  classicalResolution: {
    version: 'xieji-vol10-v2'
    items: (Vol10Resolution & { productDelta: number; diverges: boolean })[]
  }
}
export const CRITERION_LABELS: Record<EventCriterion, string> = {
  calendar_validity: 'Ngày hợp lệ',
  event_fit: 'Hoạt động chính phù hợp',
  good_hour: 'Giờ phù hợp',
  hoang_dao: 'Ngày hoàng đạo',
  truc: 'Trực',
  lunar_lodge: 'Tú',
  good_stars: 'Cát thần',
  bad_stars: 'Hung thần',
  age_clash: 'Xung tuổi',
  age_harmony: 'Hợp tuổi',
  element_fit: 'Ngũ hành',
  direction: 'Hướng',
  participant_alignment: 'Người tham gia',
  taboo_day: 'Ngày kỵ',
}

/** All criteria have an explicit evaluator outcome. Unimplemented personal criteria remain unknown. */
export function evaluateEventDay(
  date: string,
  eventId: string,
  input: EventInput = {},
): EventEvaluation {
  const base: EventEvaluation = {
    eventId,
    date,
    timezone: manifest.timezoneDefault,
    input: { ...input },
    datasetVersion: manifest.datasetVersion,
    engineVersion: ENGINE_VERSION,
    score: null,
    classification: 'insufficient_evidence',
    neutralByPolicy: false,
    mustHave: [],
    criteria: [],
    contributions: [],
    warnings: [],
    conflictAnalysis: analyzeEvidenceConflicts([], {}),
    classicalResolution: { version: 'xieji-vol10-v2', items: [] },
  }
  const profile = getEventProfile(eventId)
  if (!profile) return { ...base, warnings: ['Chưa có mapping cho sự kiện này.'] }
  let day: ReturnType<typeof getAlmanac>
  let info: ReturnType<typeof getDayInfo>
  try {
    parseSolarDate(date)
    day = getAlmanac(date)
    info = getDayInfo(date)
  } catch {
    return {
      ...base,
      classification: 'not_recommended',
      mustHave: [
        {
          id: 'calendar_validity',
          status: 'fail',
          reason: 'Ngày không hợp lệ hoặc ngoài phạm vi hỗ trợ.',
        },
      ],
    }
  }
  const roles = resolveEventActivityRoles(eventId, input)
  const primaryId = roles.find((role) => role.role === 'primary')!.activityId
  const primary = day.activityRecommendations.find((row) => row.activityId === primaryId)!
  // No applied rule at all means no taboo either; minor events need no positive sign to proceed.
  const neutralByPolicy =
    manifest.policies.lowSeverityNoTabooMeansNeutral &&
    profile.severity === 'low' &&
    primary.status === 'no_evidence'
  const contributions: Contribution[] = roles.flatMap((role) => {
    const activity = day.activityRecommendations.find((row) => row.activityId === role.activityId)
    return (activity?.contributions ?? [])
      .filter((row) => !(row.scope === 'travel_road' && input.transportMode === 'water'))
      .map((row) => ({
        ...row,
        multiplier: role.multiplier,
        appliedDelta: row.scoreDelta * role.multiplier,
      }))
  })
  // Stable source/rule/activity/scope keys prevent multiple aliases from double counting a rule.
  const unique = contributions.filter(
    (row, index) =>
      contributions.findIndex(
        (other) =>
          other.source === row.source &&
          other.ruleId === row.ruleId &&
          other.activityId === row.activityId &&
          other.scope === row.scope,
      ) === index,
  )
  const evaluate = (id: EventCriterion): CriterionResult => {
    const outcome = (status: CriterionResult['status'], reason: string): CriterionResult => ({
      id,
      status,
      reason,
    })
    if (id === 'calendar_validity') return outcome('pass', 'Ngày nằm trong phạm vi hỗ trợ.')
    if (id === 'event_fit')
      return neutralByPolicy
        ? outcome('pass', 'Việc nhỏ, không gặp ngày kỵ nào trong nguồn: xem là bình thường.')
        : primary.status === 'no_evidence'
          ? outcome('unknown', 'Chưa có quy tắc được tính điểm cho hoạt động chính.')
          : primary.hardWarning || primary.negativeMagnitude > 0
            ? outcome('fail', 'Hoạt động chính có yếu tố bất lợi hoặc cảnh báo nghiêm trọng.')
            : outcome('pass', 'Hoạt động chính có quy tắc phù hợp.')
    if (id === 'good_hour') {
      if (input.hour === undefined)
        return outcome('unknown', 'Chọn giờ dự kiến để đánh giá giờ phù hợp.')
      if (!Number.isFinite(input.hour) || input.hour < 0 || input.hour >= 24)
        return outcome('fail', 'Giờ dự kiến không hợp lệ.')
      const hour = day.hours.find((hour) => hour.chi === Math.floor((input.hour! + 1) / 2) % 12)!
      return outcome(
        hour.isGood ? 'pass' : 'fail',
        `Giờ ${hour.name}: ${hour.isGood ? 'hoàng đạo' : 'hắc đạo'} theo lịch chung.`,
      )
    }
    if (id === 'hoang_dao')
      return outcome(info.dayGod.isHoangDao ? 'pass' : 'fail', info.dayGod.name)
    if (id === 'taboo_day')
      return outcome(
        info.badDays.length ? 'fail' : 'pass',
        info.badDays.map((day) => day.name).join(', ') ||
          'Không ghi nhận ngày kỵ trong bộ quy tắc hiện tại.',
      )
    if (id === 'truc')
      return primary.contributions.some((row) => row.source === 'truc' && row.status === 'applied')
        ? outcome('pass', `Trực ${day.officer.name} có quy tắc cho hoạt động chính.`)
        : outcome('unknown', 'Trực chưa có quy tắc cho hoạt động chính.')
    if (id === 'lunar_lodge')
      return outcome('unknown', 'Thông tin Tú chỉ mang tính tham khảo, chưa được tính vào điểm.')
    if (id === 'good_stars' || id === 'bad_stars') {
      const evidence = unique.filter(
        (row) => row.source === (id === 'good_stars' ? 'good_god' : 'bad_god'),
      )
      return outcome(
        id === 'bad_stars' && evidence.length ? 'fail' : 'pass',
        evidence.map((row) => row.label).join(', ') ||
          'Không ghi nhận thần áp dụng cho hoạt động này trong catalog chấm điểm.',
      )
    }
    return outcome(
      'unknown',
      `Chưa có bộ đánh giá ${CRITERION_LABELS[id].toLowerCase()} trong luồng chọn ngày này.`,
    )
  }
  const mustHave = profile.mustHave.map(evaluate)
  const criteria = profile.criteria.map(evaluate)
  const warnings = [...new Set(day.activityRecommendations.flatMap((row) => row.warnings))]
  for (const criterion of mustHave.filter((item) => item.status !== 'pass'))
    warnings.push(criterion.reason)
  const hardWarnings = [...new Set(unique.filter((row) => row.hardWarning).map((row) => row.label))]
  if (hardWarnings.length)
    warnings.push(
      `${hardWarnings.join(', ')} áp dụng cho hoạt động này; cát thần không tự triệt tiêu cảnh báo.`,
    )
  if (
    profile.activities.some((role) => role.role === 'conditional') &&
    roles.length < profile.activities.length
  )
    warnings.push('Hoạt động có điều kiện chưa được tính khi chưa xác nhận ngữ cảnh.')
  const score = Math.max(
    0,
    Math.min(100, manifest.baseScore + unique.reduce((sum, row) => sum + row.appliedDelta, 0)),
  )
  const classification: Classification = mustHave.some((item) => item.status === 'fail')
    ? 'not_recommended'
    : unique.some((row) => row.status === 'conflict')
      ? 'conflict'
      : mustHave.some((item) => item.status === 'unknown') ||
          (primary.status === 'no_evidence' && !neutralByPolicy)
        ? 'insufficient_evidence'
        : unique.some((row) => row.hardWarning)
          ? manifest.policies.hardVetoFromClassicalJi
            ? 'not_recommended'
            : 'caution'
          : primary.negativeMagnitude > 0 ||
              unique.some((row) => row.status === 'applied' && row.scoreDelta < 0)
            ? 'caution'
            : score >= 65
              ? 'recommended'
              : 'caution'
  return {
    ...base,
    score: classification === 'insufficient_evidence' ? null : score,
    classification,
    neutralByPolicy,
    mustHave,
    criteria,
    contributions: unique,
    warnings,
    // Mansion, Trực and source-locked/day-rule gods; legacy rows stay unresolved (no authority).
    conflictAnalysis: analyzeEvidenceConflicts(unique, day.selectionContext),
    classicalResolution: {
      version: 'xieji-vol10-v2',
      items: resolveVol10(
        {
          monthJianBranch: day.selectionContext.MONTH_JIAN_BRANCH,
          dayStem: day.selectionContext.DAY_STEM,
          dayBranch: day.selectionContext.DAY_BRANCH,
          officerId: trucData.calculation.order[day.officer.index],
          presentGods: new Set(day.auditedGodIds),
          unknownGods: new Set(day.unknownGodIds),
        },
        [...new Set(roles.map((role) => role.activityId))],
      ).map((item) => {
        // Product rules standing for the same 凶 (and, after 從X論, the deciding one's).
        const productDelta = unique
          .filter(
            (row) =>
              row.activityId === item.activityId &&
              row.status === 'applied' &&
              (isVol10ChainRow(row, item) ||
                row.ruleId.startsWith(`xieji10:${item.via ?? item.entry}:`)),
          )
          .reduce((sum, row) => sum + row.appliedDelta, 0)
        const diverges =
          (productDelta < 0 &&
            (item.verdict === 'not_avoided' || item.verdict === 'no_annotation')) ||
          (productDelta >= 0 && item.verdict === 'avoid')
        return { ...item, productDelta, diverges }
      }),
    },
  }
}
