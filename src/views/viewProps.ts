import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Category, Settings, SolarDateString } from '@shared/types'

/** Props chung cho 3 chế độ xem. */
export interface CalendarViewProps {
  date: SolarDateString
  today: SolarDateString
  days: SolarDateString[]
  occurrences: Occurrence[]
  settings: Settings
  colorOf: (categoryId: string) => string
  getCategory: (id: string) => Category | undefined
  onOpenDay: (date: SolarDateString) => void
  onOpenEvent: (occurrence: Occurrence) => void
  /** Bấm vào ô ngày trống ở xem Tháng: tạo sự kiện cả ngày. */
  onCreate: (date: SolarDateString) => void
}
