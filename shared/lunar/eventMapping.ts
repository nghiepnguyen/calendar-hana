import data from '../almanac-data/event-mapping.json'

export type EventSeverity = 'low' | 'medium' | 'high' | 'very_high'
export type EventCriterion =
  | 'calendar_validity'
  | 'hoang_dao'
  | 'good_hour'
  | 'event_fit'
  | 'truc'
  | 'lunar_lodge'
  | 'good_stars'
  | 'bad_stars'
  | 'age_clash'
  | 'age_harmony'
  | 'element_fit'
  | 'direction'
  | 'participant_alignment'
  | 'taboo_day'

export interface EventActivity {
  activityId: string
  role: 'primary' | 'supporting' | 'conditional'
  multiplier: number
  condition?: string
}
export interface EventInput {
  transportMode?: 'road' | 'water' | 'unknown'
  vehicleDeparture?: boolean
  moveIn?: boolean
  hour?: number
}
export interface EventProfile {
  severity: EventSeverity
  activities: EventActivity[]
  mustHave: EventCriterion[]
  criteria: EventCriterion[]
}

const profiles = data.events as Record<string, EventProfile>

export const EVENT_OPTIONS = [
  ['cut_hair', 'Cắt tóc'],
  ['receive_vehicle', 'Nhận xe'],
  ['buy_vehicle', 'Mua xe'],
  ['sign_contract', 'Ký hợp đồng'],
  ['buy_property', 'Mua nhà / đất'],
  ['property_handover', 'Nhận bàn giao nhà'],
  ['move_house', 'Chuyển nhà'],
  ['open_business', 'Khai trương'],
  ['groundbreaking', 'Động thổ'],
  ['wedding', 'Cưới hỏi'],
  ['start_journey', 'Xuất hành'],
] as const

export function getEventProfile(eventType: string): EventProfile | undefined {
  return profiles[eventType]
}

export function resolveEventActivities(eventType: string): string[] {
  return getEventProfile(eventType)?.activities.map((item) => item.activityId) ?? []
}

export function resolveEventActivityRoles(
  eventType: string,
  input: EventInput = {},
): EventActivity[] {
  return (getEventProfile(eventType)?.activities ?? []).filter(
    (item) =>
      item.role !== 'conditional' ||
      (item.condition === 'vehicle_departure' && input.vehicleDeparture === true) ||
      (item.condition === 'move_in' && input.moveIn === true) ||
      (item.condition === 'water_transport' && input.transportMode === 'water'),
  )
}
