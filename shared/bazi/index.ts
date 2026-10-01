import { normalizeBirthTime } from './birthTime'
import { calculatePillars } from './pillars'
import { calculateTrueSolarTime } from './solarTime'
import { BAZI_VERSIONS, type BaziProfileInput } from './types'
import { validateBaziProfile } from './validation'

export function calculateBazi(input: BaziProfileInput) {
  const validation = validateBaziProfile(input)
  if (!validation.valid)
    return {
      status: 'insufficientData' as const,
      errors: validation.errors,
      reason: 'Cần đủ ngày, giờ và nơi sinh hợp lệ để lập Tứ Trụ.',
      versions: BAZI_VERSIONS,
    }
  const normalized = normalizeBirthTime({
    civilDate: input.birthDate!,
    wallTime: input.birthTime!,
    timezoneId: input.birthTimezoneId!,
    confirmedOffsetMinutes: input.birthConfirmedOffsetMinutes,
  })
  if (!['ready', 'ambiguous'].includes(normalized.status))
    return {
      status: 'insufficientData' as const,
      errors: [normalized.status],
      reason: normalized.reason ?? 'Không chuẩn hóa được giờ sinh.',
      versions: BAZI_VERSIONS,
    }
  const uncertainty =
    input.birthTimePrecision === 'estimated' ? input.birthTimeUncertaintyMinutes! : 0
  const instants = new Set<string>()
  for (const candidate of normalized.candidates) {
    for (const delta of uncertainty > 0 ? [-uncertainty, 0, uncertainty] : [0]) {
      instants.add(new Date(Date.parse(candidate.instantUtc) + delta * 60_000).toISOString())
    }
  }
  const candidates = [...instants].map((instantUtc) => {
    const normalizedCandidate = normalized.candidates.reduce((closest, current) =>
      Math.abs(Date.parse(current.instantUtc) - Date.parse(instantUtc)) <
      Math.abs(Date.parse(closest.instantUtc) - Date.parse(instantUtc))
        ? current
        : closest,
    )
    const solarTime = calculateTrueSolarTime(
      instantUtc,
      input.birthPlace!.longitude,
      normalizedCandidate.offsetMinutes,
      input.birthPlace!.latitude,
    )
    return {
      instantUtc,
      offsetMinutes: normalizedCandidate.offsetMinutes,
      solarTime,
      ...calculatePillars(instantUtc, solarTime.tstDateTime, input.birthZiPolicy!),
    }
  })
  const unique = candidates.filter(
    (candidate, index, all) =>
      all.findIndex(
        (other) =>
          JSON.stringify(other.pillars) === JSON.stringify(candidate.pillars) &&
          other.zi.dayPillarDate === candidate.zi.dayPillarDate,
      ) === index,
  )
  return {
    status: unique.length === 1 ? ('ready' as const) : ('ambiguous' as const),
    candidates: unique.slice(0, 8),
    versions: BAZI_VERSIONS,
    inputUncertaintyMinutes: uncertainty,
    reason:
      unique.length === 1
        ? undefined
        : 'Khoảng giờ hoặc offset đi qua ranh giới, nên có nhiều lá số ứng viên.',
  }
}

export type { BaziProfileInput, BirthPlace, ZiPolicy } from './types'
