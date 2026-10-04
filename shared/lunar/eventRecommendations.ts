import type { SolarDateString } from '../types'
import { getAlmanac } from './almanac'
import { getActivityAvoidances } from './activityRecommendations'
import { addDays } from './julian'
import { resolveEventActivities } from './eventMapping'

const OFFICER_IDS = ['kien', 'tru', 'man', 'binh', 'dinh', 'chap', 'pha', 'nguy', 'thanh', 'thu', 'khai', 'be'] as const

function eventDayIsGood(date: SolarDateString, eventType: string): boolean {
  const allowed = new Set(resolveEventActivities(eventType))
  const almanac = getAlmanac(date)
  const recommendations = almanac.activityRecommendations.filter(
    (item) => item.status === 'recommended' && allowed.has(item.activityId),
  )
  const avoidances = getActivityAvoidances({
    officerId: OFFICER_IDS[almanac.officer.index],
    mansion: almanac.mansion,
  }).filter((item) => allowed.has(item.activityId))
  return recommendations.length > 0 && !avoidances.some(
    (item) => item.status === 'avoid' || item.status === 'strong_avoid' || item.status === 'watch' || item.status === 'consider',
  )
}

export function findNextGoodEventDate(date: SolarDateString, eventType: string, limit = 30): SolarDateString | null {
  for (let offset = 1; offset <= limit; offset += 1) {
    const candidate = addDays(date, offset)
    if (eventDayIsGood(candidate, eventType)) return candidate
  }
  return null
}
