import type mappingData from '../almanac-data/event-mapping.json'

type EventMapping = typeof mappingData
type EventId = keyof EventMapping['events']

// Supporting activities removed on 10/10/2026 because they map the same 協紀 用事 heading as the
// event's primary activity and carry no evidence of their own, so they counted it twice:
// business (開市, as opening), transaction (立券交易, as contract) and construction (興造動土,
// as groundbreaking). Historical migrations and observed release witnesses predate the fix and
// pin the old mapping. Helpers take the original mapping so they work inside a vi.mock factory.
const KAISHI: [EventId, string][] = [['open_business', 'business']]
const SAME_HEADING: [EventId, string][] = [
  ['sign_contract', 'transaction'],
  ['groundbreaking', 'construction'],
]

function restore(mapping: EventMapping, items: [EventId, string][]): { default: EventMapping } {
  const events = { ...mapping.events }
  for (const [event, activityId] of items) {
    const current = events[event]
    events[event] = {
      ...current,
      activities: [
        current.activities[0]!,
        { activityId, role: 'supporting', multiplier: 0.5 },
        ...current.activities.slice(1),
      ],
    } as never
  }
  return { default: { ...mapping, events } }
}

export const legacyOpenBusinessMapping = (mapping: EventMapping) => restore(mapping, KAISHI)
export const legacySameHeadingMapping = (mapping: EventMapping) => restore(mapping, SAME_HEADING)
/** Mapping before any 10/10/2026 duplicate-heading removal. */
export const preDedupEventMapping = (mapping: EventMapping) =>
  restore(mapping, [...KAISHI, ...SAME_HEADING])
