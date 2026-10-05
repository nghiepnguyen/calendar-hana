import type { SolarDateString } from '../types'
import { addDays, parseSolarDate } from './julian'
import { evaluateEventDay } from './eventEvaluation'
import type { EventInput } from './eventMapping'

/** Alternative dates must pass the exact same input and classification gates as the current day. */
export function findNextGoodEventDate(
  date: SolarDateString,
  eventType: string,
  limit = 30,
  input: EventInput = {},
): SolarDateString | null {
  try {
    parseSolarDate(date)
  } catch {
    return null
  }
  for (let offset = 1; offset <= limit; offset += 1) {
    const candidate = addDays(date, offset)
    if (evaluateEventDay(candidate, eventType, input).classification === 'recommended')
      return candidate
  }
  return null
}
