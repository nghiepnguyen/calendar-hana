import { parseSolarDate } from './lunar/julian'
import { todayInVietnam } from './time'

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
