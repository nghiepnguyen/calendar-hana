import { createRuleRegistry, FENG_SHUI_RULES } from '../rules'
import type { RuleDefinition } from '../rules'
import { buildAnnualContext, UNAVAILABLE_REASON_CODES } from './context'
import { calculateKimLau } from './kimLau'
import { calculateHoangOc } from './hoangOc'
import { calculateTamTai } from './tamTai'
import type {
  AnnualAssessment,
  AnnualPurpose,
  AnnualRole,
  AnnualRuleId,
  AnnualResultFor,
  AnnualValueMap,
  ReadyAnnualContext,
} from './types'

export type {
  AnnualInput,
  AnnualAssessment,
  AnnualContext,
  AnnualPurpose,
  AnnualRole,
  AnnualRuleResult,
  KimLauValue,
  HoangOcValue,
  TamTaiValue,
} from './types'

const PURPOSES: readonly AnnualPurpose[] = [
  'general',
  'wedding',
  'construction',
  'business',
  'carPurchase',
  'housePurchase',
  'repair',
  'moveIn',
  'ritual',
]
const ROLES: readonly AnnualRole[] = ['self', 'bride', 'owner', 'principal', 'other', 'unspecified']
const SUPPORTED_PURPOSES: readonly AnnualPurpose[] = [
  'general',
  'wedding',
  'construction',
  'business',
]
const SPECIAL_ROLES: Partial<Record<AnnualPurpose, AnnualRole>> = {
  wedding: 'bride',
  construction: 'owner',
  business: 'principal',
}
const CALCULATORS: { [K in AnnualRuleId]: (context: ReadyAnnualContext) => AnnualValueMap[K] } = {
  'annual.kim-lau': (context) => calculateKimLau(context.nominalAge),
  'annual.hoang-oc': (context) => calculateHoangOc(context.nominalAge),
  'annual.tam-tai': (context) => calculateTamTai(context.birthYearChi, context.viewYearChi),
}

function enumValue<T extends string>(value: unknown, options: readonly T[]): T | null {
  return options.find((option) => option === value) ?? null
}

/** Pure, stateless evaluation. Invalid user data never becomes a no-hit verdict. */
export function assessAnnualFengShui(
  input: unknown,
  definitions: readonly RuleDefinition[] = FENG_SHUI_RULES,
): AnnualAssessment {
  const raw =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {}
  const purpose = enumValue(raw.purpose, PURPOSES)
  const role = enumValue(raw.role, ROLES)
  const registry = createRuleRegistry(definitions)
  const context = buildAnnualContext(
    { viewDate: raw.viewDate, birthDate: raw.birthDate },
    definitions,
  )
  const byId = new Map(definitions.map((rule) => [rule.id, rule]))

  function evaluate<K extends AnnualRuleId>(id: K): AnnualResultFor<K> {
    const definition = byId.get(id)
    const requiredIds = ['annual.nominal-age', 'annual.application-policy', id]
    const metadata = {
      ruleId: id,
      ruleVersion: definition?.version ?? null,
      scope: 'annual' as const,
      verificationStatus: definition?.verificationStatus ?? null,
      sourceIds: [...(definition?.sourceIds ?? [])],
      requiredRules: requiredIds.map((requiredId) => {
        const rule = byId.get(requiredId)
        return {
          id: requiredId,
          version: rule?.version ?? null,
          scope: rule?.scope ?? null,
          verificationStatus: rule?.verificationStatus ?? null,
          sourceIds: [...(rule?.sourceIds ?? [])],
          reason: rule?.reason ?? null,
        }
      }),
      operands: {} as Record<string, number>,
    }
    if (!purpose || !role)
      return {
        ...metadata,
        status: 'unsupported',
        reasonCode: 'unknownContext',
        reason: 'Mục đích hoặc vai trò không hợp lệ.',
      }
    if (!SUPPORTED_PURPOSES.includes(purpose))
      return {
        ...metadata,
        status: 'unsupported',
        reasonCode: 'purposeUnsupported',
        reason: 'Chưa hỗ trợ mục đích này.',
      }
    const targetRole = SPECIAL_ROLES[purpose]
    const isSpecialRole = role === 'bride' || role === 'owner' || role === 'principal'
    if ((purpose === 'general' && role !== 'self') || (isSpecialRole && role !== targetRole)) {
      return {
        ...metadata,
        status: 'unsupported',
        reasonCode: 'roleMismatch',
        reason: 'Vai trò không phù hợp mục đích đã chọn.',
      }
    }
    const excluded =
      id === 'annual.hoang-oc'
        ? purpose !== 'construction'
        : id === 'annual.kim-lau'
          ? purpose === 'general' || purpose === 'business'
          : false
    if (excluded)
      return {
        ...metadata,
        status: 'notApplicable',
        reasonCode: 'purposeExcluded',
        reason: 'Không xét cho mục đích này.',
      }
    const needsTargetRole =
      purpose === 'construction' ||
      (purpose === 'business' && id === 'annual.tam-tai') ||
      (purpose === 'wedding' && id === 'annual.kim-lau')
    if (needsTargetRole && role !== targetRole) {
      return {
        ...metadata,
        status: 'insufficientData',
        reasonCode: 'targetRoleRequired',
        reason: 'Cần xác nhận vai trò của chính hồ sơ này; chưa có hồ sơ của người khác.',
      }
    }
    if (context.status !== 'applies')
      return {
        ...metadata,
        status: context.status,
        reasonCode: context.reasonCode,
        reason: context.reason,
      }
    metadata.operands = {
      birthLunarYear: context.birthLunarYear,
      viewLunarYear: context.viewLunarYear,
      nominalAge: context.nominalAge,
      birthYearChi: context.birthYearChi,
      viewYearChi: context.viewYearChi,
    }
    if (id === 'annual.hoang-oc' && (context.nominalAge < 10 || context.nominalAge > 69)) {
      return {
        ...metadata,
        status: 'unsupported',
        reasonCode: 'ageOutOfRange',
        reason: 'Hoang Ốc chỉ hỗ trợ tuổi mụ 10–69.',
      }
    }
    const readiness = registry.getReadiness('annual', requiredIds)
    if (readiness.status === 'blocked') {
      const unavailable = readiness.unavailable[0]
      return {
        ...metadata,
        status: 'unsupported',
        reasonCode: UNAVAILABLE_REASON_CODES[unavailable.reason],
        reason: `Quy tắc ${unavailable.id} chưa sẵn sàng để tính.`,
      }
    }
    const value = CALCULATORS[id](context)
    if ('remainder' in value) {
      metadata.operands.remainder = value.remainder
    } else if ('palace' in value) {
      Object.assign(metadata.operands, {
        decade: value.decade,
        units: value.units,
        palace: value.palace,
      })
    }
    const reason =
      id === 'annual.kim-lau'
        ? `Tuổi mụ ${context.nominalAge}; chia 9 dư ${metadata.operands.remainder}.`
        : id === 'annual.hoang-oc'
          ? `Tuổi mụ ${context.nominalAge}; khởi tại mốc chục và đếm tới cung ${metadata.operands.palace}.`
          : `Chu kỳ Tam Tai của hồ sơ bản thân; chỉ thể hiện vị trí trong chu kỳ.${purpose === 'wedding' ? ' Chưa xét người còn lại.' : ''}`
    return { ...metadata, status: 'applies', reasonCode: 'calculated', reason, value }
  }

  return {
    specVersion: '1.0.0',
    purpose,
    role,
    context,
    results: [evaluate('annual.kim-lau'), evaluate('annual.hoang-oc'), evaluate('annual.tam-tai')],
  }
}
