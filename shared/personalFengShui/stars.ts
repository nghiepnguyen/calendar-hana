import { CAN } from '../lunar/canChi'
import { createRuleRegistry, FENG_SHUI_RULES, type RuleDefinition } from './rules'

interface NumericCanChi {
  readonly can: number
  readonly chi: number
}

export interface PersonalStarsInput {
  readonly birthYear: NumericCanChi
  readonly viewedDay: NumericCanChi
  readonly lunarMonth: number
}

const DEFERRED_RULE_IDS = [
  'personal.thai-tue',
  'personal.tue-pha',
  'personal.tam-sat',
  'personal.sat-chu',
] as const

const STEM_CLASHES = new Set(['0:6', '6:0', '1:7', '7:1', '2:8', '8:2', '3:9', '9:3'])

function isSexagenary(value: unknown): value is NumericCanChi {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const pair = value as Record<string, unknown>
  return (
    Number.isInteger(pair.can) &&
    Number.isInteger(pair.chi) &&
    (pair.can as number) >= 0 &&
    (pair.can as number) < 10 &&
    (pair.chi as number) >= 0 &&
    (pair.chi as number) < 12 &&
    (pair.can as number) % 2 === (pair.chi as number) % 2
  )
}

export function assessPersonalStars(
  input: unknown,
  definitions: readonly RuleDefinition[] = FENG_SHUI_RULES,
) {
  const raw =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {}
  if (raw.birthYear === undefined)
    return {
      status: 'insufficientData' as const,
      reasonCode: 'missingBirthYear' as const,
      reason: 'Chưa có Can Chi năm sinh.',
    }
  if (!isSexagenary(raw.birthYear))
    return {
      status: 'insufficientData' as const,
      reasonCode: 'invalidBirthYear' as const,
      reason: 'Can Chi năm sinh không hợp lệ trong vòng 60 Hoa Giáp.',
    }
  if (raw.viewedDay === undefined)
    return {
      status: 'insufficientData' as const,
      reasonCode: 'missingViewedDay' as const,
      reason: 'Chưa có Can Chi ngày xem.',
    }
  if (!isSexagenary(raw.viewedDay))
    return {
      status: 'insufficientData' as const,
      reasonCode: 'invalidViewedDay' as const,
      reason: 'Can Chi ngày xem không hợp lệ trong vòng 60 Hoa Giáp.',
    }
  if (raw.lunarMonth === undefined)
    return {
      status: 'insufficientData' as const,
      reasonCode: 'missingLunarMonth' as const,
      reason: 'Chưa có tháng âm lịch.',
    }
  if (
    !Number.isInteger(raw.lunarMonth) ||
    (raw.lunarMonth as number) < 1 ||
    (raw.lunarMonth as number) > 12
  )
    return {
      status: 'insufficientData' as const,
      reasonCode: 'invalidLunarMonth' as const,
      reason: 'Tháng âm lịch phải nằm trong khoảng 1–12.',
    }

  const registry = createRuleRegistry(definitions)
  const readiness = registry.getReadiness('personalDay', ['personal.can-xung'])
  if (readiness.status === 'blocked') {
    const reason = readiness.unavailable[0]
    return {
      status: 'unsupported' as const,
      reasonCode:
        reason.reason === 'missing'
          ? ('missingRule' as const)
          : reason.reason === 'scopeMismatch'
            ? ('scopeMismatch' as const)
            : reason.reason === 'rejected'
              ? ('rejectedRule' as const)
              : ('unverifiedRule' as const),
      reason: `Quy tắc ${reason.id} chưa sẵn sàng để tính.`,
    }
  }

  const rule = readiness.rules[0]
  const birthYear = raw.birthYear
  const viewedDay = raw.viewedDay
  const hit = STEM_CLASHES.has(`${birthYear.can}:${viewedDay.can}`)
  const birthCan = CAN[birthYear.can]
  const dayCan = CAN[viewedDay.can]
  const byId = new Map(definitions.map((definition) => [definition.id, definition]))
  return {
    status: 'ready' as const,
    stemClash: {
      ruleId: rule.id,
      version: rule.version,
      sourceIds: rule.sourceIds,
      hit,
      affectsDaySummary: false as const,
      operands: { birthYearCan: birthYear.can, viewedDayCan: viewedDay.can },
      reason: hit
        ? `Can ngày ${dayCan} xung với Can tuổi ${birthCan} theo bảng bốn cặp đã chọn.`
        : `Can ngày ${dayCan} và Can tuổi ${birthCan} không thuộc bốn cặp Can xung đã chọn.`,
    },
    deferred: DEFERRED_RULE_IDS.map((ruleId) => {
      const definition = byId.get(ruleId)
      return {
        ruleId,
        version: definition?.version ?? null,
        verificationStatus: definition?.verificationStatus ?? null,
        status: 'unsupported' as const,
        reason: definition?.reason ?? 'Quy tắc chưa có trong registry.',
      }
    }),
  }
}
