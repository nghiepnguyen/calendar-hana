import { formatLunar, formatSolar } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import { dayOfWeek } from '@shared/lunar/julian'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Category } from '@shared/types'
import { EventRow } from './EventRow'
import { selectionKey } from './listFormat'
import type { DayGroupData } from './groupList'
import styles from './EventListPage.module.css'

interface DayGroupProps {
  day: DayGroupData
  colorOf: (categoryId: string) => string
  getCategory: (id: string) => Category | undefined
  selecting: boolean
  selectedKeys: ReadonlySet<string>
  onOpen: (occurrence: Occurrence) => void
  onToggle: (occurrence: Occurrence) => void
}

/** Tiêu đề ngày (dương + âm) và các sự kiện của ngày đó. */
export function DayGroup({
  day,
  colorOf,
  getCategory,
  selecting,
  selectedKeys,
  onOpen,
  onToggle,
}: DayGroupProps) {
  const { date, isToday, isPast, occurrences } = day
  const lunar = getDayInfo(date).lunar
  const classes = [
    styles.day,
    isToday ? styles.today : '',
    isPast ? styles.past : '',
    dayOfWeek(date) === 0 ? styles.sunday : '',
  ]

  return (
    <li className={classes.join(' ')} data-date={date}>
      <h3 className={styles.dayHead}>
        <span className={styles.solar}>
          {formatSolar(date)}
          {isToday ? <span className={styles.todayBadge}>Hôm nay</span> : null}
        </span>
        <span className={styles.lunar}>{formatLunar(lunar)}</span>
      </h3>
      {occurrences.length === 0 ? (
        <p className={styles.noEvents}>Không có sự kiện</p>
      ) : (
        <ul className={styles.rows}>
          {occurrences.map((occurrence) => {
            const key = selectionKey(occurrence)
            return (
              <li key={key}>
                <EventRow
                  occurrence={occurrence}
                  color={colorOf(occurrence.event.categoryId)}
                  categoryName={getCategory(occurrence.event.categoryId)?.name}
                  selecting={selecting}
                  selected={selectedKeys.has(key)}
                  onOpen={onOpen}
                  onToggle={onToggle}
                />
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
