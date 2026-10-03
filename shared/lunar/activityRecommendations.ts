import activitiesText from '../almanac-data/activities.json?raw'
import badGodsText from '../almanac-data/bad-gods.json?raw'
import goodGodsText from '../almanac-data/good-gods.json?raw'
import trucText from '../almanac-data/truc.json?raw'

export type ActivityStatus = 'recommended' | 'neutral' | 'avoid' | 'watch' | 'strong_avoid' | 'consider'
export interface ActivityRecommendation {
  activityId: string
  label: string
  group: string
  score: number
  status: ActivityStatus
  evidence: string[]
  generalScore: number
  personalModifier: number
  positiveMagnitude: number
  negativeMagnitude: number
  hasVeto: boolean
  conflictLevel: 'low' | 'high'
  sourceRefs: string[]
}
export interface ActivityAvoidance extends ActivityRecommendation {
  status: 'neutral' | 'watch' | 'avoid' | 'strong_avoid' | 'consider'
  negativeMagnitude: number
  positiveMagnitude: number
}

type Activity = { id: string; label: string; group: string }
type Truc = { id: string; label: string; activityRules: Rule[] }
type Rule = { activityId: string; level: string; weight: number }
type GoodGod = { id: string; label: string; tier: string; activityIds: string[] }
type BadGod = { id: string; label: string; tier: string; activityIds: string[] }
type MansionSource = { name: string; shouldDo: string; shouldAvoid: string }

const MANSION_TERMS: Record<string, string[]> = {
  worship: ['cúng', 'tế'],
  pray_blessing: ['cầu phúc'],
  pray_children: ['cầu tự'],
  wedding: ['cưới', 'gả'],
  engagement: ['dạm ngõ', 'ăn hỏi', 'nạp thái'],
  moving: ['dời nhà', 'nhập trạch'],
  bed_installation: ['đóng giường', 'lót giường', 'an giường'],
  opening: ['khai trương'],
  business: ['kinh doanh', 'mua bán'],
  contract: ['khế ước', 'hợp đồng'],
  transaction: ['giao dịch'],
  finance: ['cầu tài', 'cho vay', 'thu nợ'],
  travel: ['xuất hành', 'đi xa', 'du lịch', 'đi thuyền'],
  study: ['nhập học', 'thi cử'],
  medical: ['chữa bệnh', 'uống thuốc', 'bốc thuốc'],
  cleaning: ['dọn cỏ', 'dọn dẹp', 'tảo xá'],
  groundbreaking: ['động thổ', 'khởi công', 'khởi tạo', 'phá đất'],
  construction: ['xây cất', 'xây dựng', 'xây nhà', 'dựng nhà', 'tạo tác'],
  renovation: ['sửa chữa', 'sửa đắp'],
  beam_raising: ['đòn dông', 'thượng lương'],
  warehouse: ['nhập kho', 'mở kho'],
  planting: ['gieo trồng', 'gieo cấy', 'làm ruộng', 'trồng cây', 'làm ruộng'],
  livestock: ['gia súc', 'nuôi tằm', 'lấy giống'],
  burial: ['chôn cất', 'mồ mả', 'mai táng'],
  demolition: ['phá dỡ'],
}

function mansionActivityIds(text: string): Set<string> {
  const normalized = text.toLowerCase()
  return new Set(
    Object.entries(MANSION_TERMS)
      .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
      .map(([activityId]) => activityId),
  )
}

function mansionEvidence(input: MansionSource | undefined, activityId: string): { good: boolean; bad: boolean } {
  if (!input) return { good: false, bad: false }
  return {
    good: mansionActivityIds(input.shouldDo).has(activityId),
    bad: mansionActivityIds(input.shouldAvoid).has(activityId),
  }
}

function classify(score: number, positiveMagnitude: number, negativeMagnitude: number): ActivityStatus {
  if (positiveMagnitude >= 30 && negativeMagnitude >= 30) return 'consider'
  if (score <= 19) return 'strong_avoid'
  if (score <= 29) return 'avoid'
  if (score <= 44) return 'watch'
  if (score >= 65) return 'recommended'
  return 'neutral'
}

const activities = JSON.parse(activitiesText).items as Activity[]
const truc = JSON.parse(trucText).items as Truc[]
const goodGods = JSON.parse(goodGodsText).items as GoodGod[]
const badGods = JSON.parse(badGodsText).items as BadGod[]
const goodWeights: Record<string, number> = JSON.parse(goodGodsText).weights
const badWeights: Record<string, number> = JSON.parse(badGodsText).weights

export function getActivityAvoidances(input: {
  officerId: string
  mansion?: MansionSource
  presentGoodGods?: string[]
  presentBadGods?: string[]
  personalModifier?: number
}): ActivityAvoidance[] {
  const officer = truc.find((item) => item.id === input.officerId)
  const good = new Set(input.presentGoodGods ?? [])
  const bad = new Set(input.presentBadGods ?? [])

  return activities
    .map((activity) => {
      const mansion = mansionEvidence(input.mansion, activity.id)
      const mansionConflict = mansion.good && mansion.bad
      const officerWeight = input.mansion ? 0 : officer?.activityRules.find((rule) => rule.activityId === activity.id)?.weight ?? 0
      const positiveMagnitude =
        Math.max(officerWeight, 0) +
        goodGods.filter((god) => good.has(god.id) && god.activityIds.includes(activity.id)).reduce((sum, god) => sum + (goodWeights[god.tier] ?? 0), 0)
      const negativeMagnitude =
        (mansion.bad ? 25 : 0) + Math.abs(Math.min(officerWeight, 0)) +
        Math.abs(badGods.filter((god) => bad.has(god.id) && god.activityIds.includes(activity.id)).reduce((sum, god) => sum + (badWeights[god.tier] ?? 0), 0))
      const score = Math.max(0, Math.min(100, 50 - negativeMagnitude + positiveMagnitude))
      const status: ActivityAvoidance['status'] = mansionConflict || positiveMagnitude >= 30 && negativeMagnitude >= 30
        ? 'consider'
        : score <= 19
          ? 'strong_avoid'
          : score <= 29
            ? 'avoid'
            : negativeMagnitude > 0
              ? 'watch'
              : 'neutral'
      const conflictLevel: 'low' | 'high' =
        mansionConflict || (positiveMagnitude >= 30 && negativeMagnitude >= 30) ? 'high' : 'low'
      return {
        activityId: activity.id,
        label: activity.label,
        group: activity.group,
        score,
        status,
        negativeMagnitude,
        positiveMagnitude,
        evidence: [
          ...(mansion.bad ? [`Sao ${input.mansion?.name ?? ''}`] : officerWeight < 0 ? [`Trực ${officer?.label ?? ''}`] : []),
          ...badGods.filter((god) => bad.has(god.id) && god.activityIds.includes(activity.id)).map((god) => god.label),
        ],
        generalScore: score,
        personalModifier: input.personalModifier ?? 0,
        hasVeto: false,
        conflictLevel,
        sourceRefs: input.mansion ? [`mansion28:${input.mansion.name}`] : officerWeight !== 0 ? [`truc:${input.officerId}`] : [],
      }
    })
    .filter((item) => item.status !== 'neutral')
}

export function getActivityRecommendations(input: {
  officerId: string
  mansion?: MansionSource
  presentGoodGods?: string[]
  presentBadGods?: string[]
  personalModifier?: number
  /** Kept for API clarity; v1 intentionally ignores mansion nature for scoring. */
  mansionNature?: 'good' | 'bad'
}): ActivityRecommendation[] {
  const officer = truc.find((item) => item.id === input.officerId)
  const good = new Set(input.presentGoodGods ?? [])
  const bad = new Set(input.presentBadGods ?? [])

  return activities.map((activity) => {
    const mansion = mansionEvidence(input.mansion, activity.id)
    const officerWeight = input.mansion ? 0 : officer?.activityRules.find((rule) => rule.activityId === activity.id)?.weight ?? 0
    const mansionConflict = mansion.good && mansion.bad
    const mansionWeight = mansionConflict ? 0 : mansion.good ? 15 : mansion.bad ? -25 : 0
    const generalScore = Math.max(0, Math.min(100, 50 + officerWeight + mansionWeight +
      goodGods.filter((god) => good.has(god.id) && god.activityIds.includes(activity.id)).reduce((sum, god) => sum + (goodWeights[god.tier] ?? 0), 0) +
      badGods.filter((god) => bad.has(god.id) && god.activityIds.includes(activity.id)).reduce((sum, god) => sum + (badWeights[god.tier] ?? 0), 0)))
    const personalModifier = input.personalModifier ?? 0
    const score = Math.max(0, Math.min(100, generalScore + personalModifier))
    const positiveMagnitude = Math.max(officerWeight, 0) + (mansion.good ? 15 : 0)
    const negativeMagnitude = Math.abs(Math.min(officerWeight, 0)) + (mansion.bad ? 25 : 0)
    const evidence = [
      ...(input.mansion && (mansion.good || mansion.bad) ? [`Sao ${input.mansion.name}`] : officer?.activityRules.some((rule) => rule.activityId === activity.id) ? [`Trực ${officer.label}`] : []),
      ...goodGods.filter((god) => good.has(god.id) && god.activityIds.includes(activity.id)).map((god) => god.label),
      ...badGods.filter((god) => bad.has(god.id) && god.activityIds.includes(activity.id)).map((god) => god.label),
    ]
    return {
      activityId: activity.id,
      label: activity.label,
      group: activity.group,
      score,
      status: mansionConflict ? 'neutral' : classify(score, positiveMagnitude, negativeMagnitude),
      evidence,
      generalScore,
      personalModifier,
      positiveMagnitude,
      negativeMagnitude,
      hasVeto: false,
      conflictLevel: mansionConflict || positiveMagnitude >= 30 && negativeMagnitude >= 30 ? 'high' : 'low',
      sourceRefs: input.mansion ? [`mansion28:${input.mansion.name}`] : officerWeight !== 0 ? [`truc:${input.officerId}`] : [],
    }
  })
}
