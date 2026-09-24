import { formatAccessibleDate, formatLunarShort, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import { TimeGrid } from '../../components/TimeGrid/TimeGrid'
import type { CalendarViewProps } from '../viewProps'
import styles from './WeekView.module.css'

export function WeekView({
  days,
  today,
  occurrences,
  settings,
  colorOf,
  onOpenDay,
  onOpenEvent,
  onCreate,
}: CalendarViewProps) {
  return (
    <div className={styles.view}>
      <div className={styles.inner}>
        <div className={`glass ${styles.header}`}>
          <div className={styles.gutter} />
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
        <TimeGrid
          days={days}
          occurrences={occurrences}
          colorOf={colorOf}
          onOpenEvent={onOpenEvent}
          onCreate={onCreate}
        />
      </div>
    </div>
  )
}
