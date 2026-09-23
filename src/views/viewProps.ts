import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Settings, SolarDateString, TimeString } from '@shared/types'

/** Props chung cho 3 chế độ xem. */
export interface CalendarViewProps {
  date: SolarDateString
  today: SolarDateString
  days: SolarDateString[]
  occurrences: Occurrence[]
  settings: Settings
  colorOf: (categoryId: string) => string
  onOpenDay: (date: SolarDateString) => void
  onOpenEvent: (occurrence: Occurrence) => void
  onCreate: (date: SolarDateString, startTime?: TimeString) => void
}
