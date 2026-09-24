import { formatLunar, formatLunarShort, formatSolar, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import { dayOfWeek } from '@shared/lunar/julian'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Category, SolarDateString } from '@shared/types'
import { EventRows } from './EventRows'
import styles from './EventList.module.css'

export interface DayGroupData {
  date: SolarDateString
  isToday: boolean
  isPast: boolean
  occurrences: Occurrence[]
}

interface DayGroupProps {
  day: DayGroupData
  colorOf: (categoryId: string) => string
  getCategory: (id: string) => Category | undefined
  selecting?: boolean
  selectedKeys?: ReadonlySet<string>
  onOpen: (occurrence: Occurrence) => void
  onToggle?: (occurrence: Occurrence) => void
}

/** Một hàng ngày (trong thẻ tháng của trang Danh sách, hoặc xem Tuần): ô ngày (thứ, dương to, âm nhỏ bên dưới) và các sự kiện bên cạnh. */
export function DayGroup({
  day,
  colorOf,
  getCategory,
  selecting = false,
  selectedKeys,
  onOpen,
  onToggle,
}: DayGroupProps) {
  const { date, isToday, isPast, occurrences } = day
  const lunar = getDayInfo(date).lunar
  const weekday = dayOfWeek(date)
  const classes = [
    styles.day,
    isToday ? styles.today : '',
    isPast ? styles.past : '',
    weekday === 0 ? styles.sunday : '',
  ]

  return (
    <li className={classes.join(' ')} data-date={date}>
      <h4 className={styles.dateCell}>
        <span className="visually-hidden">
          {formatSolar(date)}, {formatLunar(lunar)}
          {isToday ? ', hôm nay' : ''}
        </span>
        <span className={styles.weekday} aria-hidden="true">
          {WEEKDAY_SHORT[weekday]}
        </span>
        <span className={styles.solar} aria-hidden="true">
          {Number(date.slice(8))}
        </span>
        <span
          className={`${styles.lunar} ${lunar.day === 1 ? styles.lunarFirst : ''}`}
          aria-hidden="true"
        >
          {formatLunarShort(lunar)}
        </span>
      </h4>
      {occurrences.length === 0 ? (
        <p className={styles.noEvents}>Không có sự kiện</p>
      ) : (
        <EventRows
          occurrences={occurrences}
          colorOf={colorOf}
          getCategory={getCategory}
          selecting={selecting}
          selectedKeys={selectedKeys}
          onOpen={onOpen}
          onToggle={onToggle}
        />
      )}
    </li>
  )
}
