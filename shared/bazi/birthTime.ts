import { parseSolarDate } from '../lunar/julian'
import type { BirthTimezoneId } from './types'

export const TZDB_VERSION = '2026d'

interface NormalizeInput {
  civilDate: string
  wallTime: string | null
  timezoneId: BirthTimezoneId
  confirmedOffsetMinutes?: number | null
}

export interface NormalizedCandidate {
  instantUtc: string
  offsetMinutes: number
  source: 'tzdb' | 'userConfirmed'
}

export interface BirthTimeNormalization {
  status: 'ready' | 'ambiguous' | 'missingTime' | 'invalid' | 'needsOffsetConfirmation'
  tzdbVersion: typeof TZDB_VERSION
  candidates: readonly NormalizedCandidate[]
  reason?: string
}

function candidate(
  date: string,
  time: string,
  offsetMinutes: number,
  source: NormalizedCandidate['source'],
) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return {
    instantUtc: new Date(
      Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000,
    ).toISOString(),
    offsetMinutes,
    source,
  }
}

export function normalizeBirthTime(input: NormalizeInput): BirthTimeNormalization {
  const base: Pick<BirthTimeNormalization, 'tzdbVersion' | 'candidates'> = {
    tzdbVersion: TZDB_VERSION,
    candidates: [],
  }
  if (!input.wallTime) return { ...base, status: 'missingTime', reason: 'Chưa có giờ sinh.' }
  try {
    parseSolarDate(input.civilDate)
  } catch {
    return { ...base, status: 'invalid', reason: 'Ngày sinh không hợp lệ.' }
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.wallTime))
    return { ...base, status: 'invalid', reason: 'Giờ sinh không hợp lệ.' }
  const year = Number(input.civilDate.slice(0, 4))
  if (year < 1900 || year > 2100)
    return { ...base, status: 'invalid', reason: 'Năm sinh ngoài phạm vi 1900–2100.' }
  if (year < 1970) {
    if (input.confirmedOffsetMinutes === null || input.confirmedOffsetMinutes === undefined)
      return {
        ...base,
        status: 'needsOffsetConfirmation',
        reason: 'Cần xác nhận độ lệch UTC cho dữ liệu trước 1970.',
      }
    if (
      !Number.isInteger(input.confirmedOffsetMinutes) ||
      Math.abs(input.confirmedOffsetMinutes) > 840
    )
      return { ...base, status: 'invalid', reason: 'Độ lệch UTC không hợp lệ.' }
    return {
      ...base,
      status: 'ready',
      candidates: [
        candidate(input.civilDate, input.wallTime, input.confirmedOffsetMinutes, 'userConfirmed'),
      ],
    }
  }
  if (
    input.timezoneId === 'Asia/Ho_Chi_Minh' &&
    input.civilDate === '1975-06-12' &&
    input.wallTime >= '23:00'
  ) {
    return {
      ...base,
      status: 'ambiguous',
      reason: 'Giờ địa phương lặp lại khi miền Nam chuyển từ UTC+8 về UTC+7.',
      candidates: [
        candidate(input.civilDate, input.wallTime, 480, 'tzdb'),
        candidate(input.civilDate, input.wallTime, 420, 'tzdb'),
      ],
    }
  }
  const offset =
    input.timezoneId === 'Asia/Ho_Chi_Minh' && input.civilDate < '1975-06-13' ? 480 : 420
  return {
    ...base,
    status: 'ready',
    candidates: [candidate(input.civilDate, input.wallTime, offset, 'tzdb')],
  }
}
