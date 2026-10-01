import { parseSolarDate } from '../../lunar/julian'
import type { SolarDate } from '../../lunar/julian'
import { MAX_YEAR, MIN_YEAR, solarToLunar } from '../../lunar/lunar'
import { yearCanChi } from '../../lunar/canChi'
import type { AnnualContext } from './types'
import { createRuleRegistry, FENG_SHUI_RULES } from '../rules'
import type { RuleDefinition } from '../rules'

export const UNAVAILABLE_REASON_CODES = {
  pending: 'unverifiedRule',
  rejected: 'rejectedRule',
  missing: 'missingRule',
  scopeMismatch: 'scopeMismatch',
} as const

function parse(value: unknown): SolarDate | null {
  if (typeof value !== 'string') return null
  try {
    return parseSolarDate(value)
  } catch {
    return null
  }
}

/** Lunar context is independent of purpose, device timezone and the current clock. */
export function buildAnnualContext(
  input: { viewDate?: unknown; birthDate?: unknown },
  definitions: readonly RuleDefinition[] = FENG_SHUI_RULES,
): AnnualContext {
  if (input.viewDate === undefined || input.viewDate === '') {
    return {
      status: 'insufficientData',
      reasonCode: 'missingViewDate',
      reason: 'Chưa chọn ngày xem.',
    }
  }
  const view = parse(input.viewDate)
  if (!view)
    return {
      status: 'insufficientData',
      reasonCode: 'invalidViewDate',
      reason: 'Ngày xem không hợp lệ.',
    }
  if (input.birthDate === undefined || input.birthDate === '') {
    return {
      status: 'insufficientData',
      reasonCode: 'missingBirthDate',
      reason: 'Chưa nhập ngày sinh.',
    }
  }
  const birth = parse(input.birthDate)
  if (!birth)
    return {
      status: 'insufficientData',
      reasonCode: 'invalidBirthDate',
      reason: 'Ngày sinh không hợp lệ.',
    }
  if ([view.year, birth.year].some((year) => year < MIN_YEAR || year > MAX_YEAR)) {
    return {
      status: 'unsupported',
      reasonCode: 'dateOutOfRange',
      reason: 'Chỉ hỗ trợ ngày dương trong khoảng 1900–2100.',
    }
  }
  // Both values have been strictly parsed as zero-padded YYYY-MM-DD.
  if ((input.viewDate as string) < (input.birthDate as string)) {
    return {
      status: 'notApplicable',
      reasonCode: 'beforeBirth',
      reason: 'Ngày xem trước ngày sinh.',
    }
  }
  const readiness = createRuleRegistry(definitions).getReadiness('annual', ['annual.nominal-age'])
  if (readiness.status === 'blocked') {
    return {
      status: 'unsupported',
      reasonCode: UNAVAILABLE_REASON_CODES[readiness.unavailable[0].reason],
      reason: 'Quy tắc tuổi mụ chưa sẵn sàng để tính.',
    }
  }
  const birthLunarYear = solarToLunar(birth.day, birth.month, birth.year).year
  const viewLunarYear = solarToLunar(view.day, view.month, view.year).year
  return {
    status: 'applies',
    reasonCode: 'contextReady',
    reason: 'Tuổi mụ tính theo hai năm âm lịch Việt Nam, đổi năm vào Tết.',
    birthLunarYear,
    viewLunarYear,
    nominalAge: viewLunarYear - birthLunarYear + 1,
    birthYearChi: yearCanChi(birthLunarYear).chi,
    viewYearChi: yearCanChi(viewLunarYear).chi,
  }
}
