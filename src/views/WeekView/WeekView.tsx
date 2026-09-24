import { formatAccessibleDate, formatLunarShort, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import { DayGroup } from '../../components/EventList/DayGroup'
import type { CalendarViewProps } from '../viewProps'
import styles from './WeekView.module.css'

export function WeekView({
  days,
  today,
  occurrences,
  settings,
  colorOf,
  getCategory,
  onOpenDay,
  onOpenEvent,
}: CalendarViewProps) {
  const byDate = new Map<SolarDateString, Occurrence[]>()
  for (const occurrence of occurrences) {
    const list = byDate.get(occurrence.date)
    if (list) list.push(occurrence)
    else byDate.set(occurrence.date, [occurrence])
  }

  return (
    <div className={styles.view}>
      <div className={`glass ${styles.header}`}>
        {days.map((date) => {
          const info = getDayInfo(date)
          const holidays = settings.showHolidays ? info.holidays : []
          const isRed = info.weekday === 0 || holidays.some((h) => h.isPublicHoliday)
          const isFirstLunarDay = info.lunar.day === 1
          return (
            <button
              key={date}
              type="button"
              className={`${styles.dayHead} ${date === today ? styles.today : ''}`}
              onClick={() => onOpenDay(date)}
              aria-label={`${formatAccessibleDate(date)}. Mở xem ngày`}
              aria-current={date === today ? 'date' : undefined}
            >
              <span className={`${styles.weekday} ${isRed ? styles.red : ''}`}>
                {WEEKDAY_SHORT[info.weekday]}
              </span>
              <span className={`${styles.solarDay} ${isRed ? styles.red : ''}`}>
                {info.solar.day}
              </span>
              <span className={`${styles.lunarDay} ${isFirstLunarDay ? styles.lunarFirst : ''}`}>
                {isFirstLunarDay ? formatLunarShort(info.lunar) : info.lunar.day}
              </span>
              {holidays[0] ? (
                <span className={styles.holiday} title={holidays.map((h) => h.name).join(', ')}>
                  {holidays[0].name}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <ul className={`glass ${styles.days}`} aria-label="Sự kiện trong tuần">
        {days.map((date) => (
          <DayGroup
            key={date}
            day={{
              date,
              isToday: date === today,
              isPast: date < today,
              occurrences: byDate.get(date) ?? [],
            }}
            colorOf={colorOf}
            getCategory={getCategory}
            onOpen={onOpenEvent}
          />
        ))}
      </ul>
    </div>
  )
}
