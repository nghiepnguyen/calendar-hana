import { parseSolarDate } from './lunar/julian'
import { todayInVietnam } from './time'
import type { BirthPlace, Settings } from './types'

export function isValidBirthDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return parseSolarDate(value).year > 0 && value <= todayInVietnam()
  } catch {
    return false
  }
}

export function isValidBirthTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isValidBirthPlace(value: unknown): value is BirthPlace {
  if (!value || typeof value !== 'object') return false
  const place = value as Partial<BirthPlace>
  return (
    place.countryCode === 'VN' &&
    typeof place.label === 'string' &&
    place.label.trim().length > 0 &&
    typeof place.latitude === 'number' &&
    Number.isFinite(place.latitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    typeof place.longitude === 'number' &&
    Number.isFinite(place.longitude) &&
    place.longitude >= -180 &&
    place.longitude <= 180 &&
    ['bundledGazetteer', 'userSelected', 'userEntered'].includes(place.coordinateSource ?? '') &&
    (place.coordinateAccuracyKm === null ||
      (typeof place.coordinateAccuracyKm === 'number' && place.coordinateAccuracyKm >= 0))
  )
}

export const BIRTH_METADATA_KEYS = [
  'birthTime',
  'birthTimePrecision',
  'birthTimeUncertaintyMinutes',
  'birthPlace',
  'birthTimezoneId',
  'birthTimezoneSource',
  'birthConfirmedOffsetMinutes',
  'birthZiPolicy',
] as const

export function withBirthDeletion(
  current: Settings,
  patch: Partial<Omit<Settings, 'updatedAt'>>,
): Settings {
  const next = { ...current, ...patch }
  if (patch.birthDate === null) {
    for (const key of BIRTH_METADATA_KEYS) next[key] = null as never
  }
  return next
}
