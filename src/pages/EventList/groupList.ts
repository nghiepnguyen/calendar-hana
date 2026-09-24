import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import type { DayGroupData } from '../../components/EventList/DayGroup'
import type { DateRange } from './listRange'

export interface MonthGroupData {
  /** "2026-09", dùng làm key. */
  key: string
  year: number
  month: number
  days: DayGroupData[]
}

/**
 * Gom các lần diễn ra (đã sắp xếp) theo tháng rồi theo ngày. Chỉ giữ ngày có sự kiện,
 * trừ hôm nay: nếu hôm nay nằm trong range thì luôn có nhóm (có thể rỗng) đúng vị trí.
 */
export function groupByMonthAndDay(
  occurrences: readonly Occurrence[],
  today: SolarDateString,
  range?: DateRange,
): MonthGroupData[] {
  const byDate = new Map<SolarDateString, Occurrence[]>()
  for (const occurrence of occurrences) {
    const list = byDate.get(occurrence.date)
    if (list) list.push(occurrence)
    else byDate.set(occurrence.date, [occurrence])
  }
  if (range && today >= range.start && today <= range.end && !byDate.has(today)) {
    byDate.set(today, [])
  }

  const months: MonthGroupData[] = []
  for (const date of [...byDate.keys()].sort()) {
    const key = date.slice(0, 7)
    let month = months.at(-1)
    if (!month || month.key !== key) {
      month = { key, year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), days: [] }
      months.push(month)
    }
    month.days.push({
      date,
      isToday: date === today,
      isPast: date < today,
      occurrences: byDate.get(date)!,
    })
  }
  return months
}

export interface YearGroupData {
  year: number
  months: MonthGroupData[]
}

/** Gom các tháng (đã sắp xếp) theo năm dương lịch. */
export function groupByYear(months: readonly MonthGroupData[]): YearGroupData[] {
  const years: YearGroupData[] = []
  for (const month of months) {
    const last = years.at(-1)
    if (last?.year === month.year) last.months.push(month)
    else years.push({ year: month.year, months: [month] })
  }
  return years
}
