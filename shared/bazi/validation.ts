import { parseSolarDate } from '../lunar/julian'
import type { BaziProfileInput, BirthPlace } from './types'

export interface BaziValidationResult {
  valid: boolean
  errors: readonly string[]
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

export function validateBaziProfile(input: BaziProfileInput): BaziValidationResult {
  const errors: string[] = []
  if (!input.birthDate) errors.push('missingBirthDate')
  else {
    try {
      const { year } = parseSolarDate(input.birthDate)
      if (year < 1900 || year > 2100) errors.push('unsupportedBirthYear')
    } catch {
      errors.push('invalidBirthDate')
    }
  }
  if (!input.birthTime) errors.push('missingBirthTime')
  else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) errors.push('invalidBirthTime')
  if (!input.birthPlace) errors.push('missingBirthPlace')
  else if (!isValidBirthPlace(input.birthPlace)) errors.push('invalidBirthPlace')
  if (!['Asia/Ho_Chi_Minh', 'Asia/Bangkok'].includes(input.birthTimezoneId ?? ''))
    errors.push('invalidTimezone')
  if (!['bundledMapping', 'userConfirmed'].includes(input.birthTimezoneSource ?? ''))
    errors.push('invalidTimezoneSource')
  if (!['exact', 'estimated', 'unknown'].includes(input.birthTimePrecision ?? ''))
    errors.push('invalidPrecision')
  if (input.birthTimePrecision === 'estimated') {
    if (
      !Number.isFinite(input.birthTimeUncertaintyMinutes) ||
      (input.birthTimeUncertaintyMinutes ?? 0) <= 0
    )
      errors.push('invalidUncertainty')
  }
  if (input.birthTimePrecision === 'unknown') errors.push('unknownBirthTime')
  if (!['splitZi', 'dayStartsAt23'].includes(input.birthZiPolicy ?? ''))
    errors.push('invalidZiPolicy')
  if (
    input.birthConfirmedOffsetMinutes !== null &&
    input.birthConfirmedOffsetMinutes !== undefined &&
    (!Number.isInteger(input.birthConfirmedOffsetMinutes) ||
      Math.abs(input.birthConfirmedOffsetMinutes) > 14 * 60)
  )
    errors.push('invalidConfirmedOffset')
  return { valid: errors.length === 0, errors }
}
