import type mappingData from '../almanac-data/event-mapping.json'

type EventMapping = typeof mappingData

// Before 10/10/2026 open_business also listed business (Mở hàng, same 開市 heading as opening)
// at ×0.5. Historical migrations and observed release witnesses predate that fix and pin it.
// Takes the original mapping so it can be used inside a vi.mock factory of that JSON.
export function legacyOpenBusinessMapping(mapping: EventMapping): { default: EventMapping } {
  const current = mapping.events.open_business
  return {
    default: {
      ...mapping,
      events: {
        ...mapping.events,
        open_business: {
          ...current,
          activities: [
            current.activities[0]!,
            { activityId: 'business', role: 'supporting', multiplier: 0.5 },
            ...current.activities.slice(1),
          ],
        },
      },
    },
  }
}
