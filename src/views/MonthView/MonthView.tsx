import { useMemo } from 'react'
import { Plus } from '@phosphor-icons/react'
import { formatAccessibleDate, formatLunarShort, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo, parseSolarDate } from '@shared/lunar'
import { EventChip } from '../../components/EventChip/EventChip'
import { groupByDate } from '../../hooks/useEventsInRange'
import type { CalendarViewProps } from '../viewProps'
import styles from './MonthView.module.css'

const MAX_VISIBLE = 3

export function MonthView({
  date,
  days,
  today,
  occurrences,
  settings,
  colorOf,
  onOpenDay,
  onOpenEvent,
  onCreate,
}: CalendarViewProps) {
  const currentMonth = parseSolarDate(date).month
  const byDate = useMemo(() => groupByDate(occurrences), [occurrences])
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (i + settings.weekStartsOn) % 7)

  return (
    <div className={`glass ${styles.view}`}>
      <div className={styles.weekdays} aria-hidden="true">
        {weekdayOrder.map((d) => (
          <div key={d} className={d === 0 ? styles.red : undefined}>
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        {days.map((day) => {
          const info = getDayInfo(day)
          const holidays = settings.showHolidays ? info.holidays : []
          const isRed = info.weekday === 0 || holidays.some((h) => h.isPublicHoliday)
          const items = byDate.get(day) ?? []
          const hidden = items.length - MAX_VISIBLE
          const outside = info.solar.month !== currentMonth
          const lunarLabel = info.lunar.day === 1 ? formatLunarShort(info.lunar) : info.lunar.day
          return (
            <div
              key={day}
              className={`${styles.cell} ${outside ? styles.outside : ''} ${day === today ? styles.today : ''}`}
              onClick={() => onOpenDay(day)}
            >
              <div className={styles.cellHead}>
                <button
                  type="button"
                  className={`${styles.solarDay} ${isRed ? styles.red : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDay(day)
                  }}
                  aria-label={`${formatAccessibleDate(day)}${holidays.length ? `, ${holidays.map((h) => h.name).join(', ')}` : ''}${items.length ? `, ${items.length} sự kiện` : ''}`}
                  aria-current={day === today ? 'date' : undefined}
                >
                  {info.solar.day}
                </button>
                {settings.showAuspicious && info.dayGod.isHoangDao ? (
                  <span className={styles.goodDot} title="Ngày hoàng đạo" aria-hidden="true" />
                ) : null}
                <span
                  className={`${styles.lunarDay} ${info.lunar.day === 1 ? styles.lunarFirst : ''}`}
                  aria-hidden="true"
                >
                  {lunarLabel}
                </span>
              </div>
              {holidays[0] ? (
                <div className={styles.holiday} title={holidays.map((h) => h.name).join(', ')}>
                  {holidays[0].name}
                </div>
              ) : null}
              <div className={styles.events}>
                {items.slice(0, MAX_VISIBLE).map((o) => (
                  <EventChip
                    key={`${o.eventId}:${o.occurrenceKey}`}
                    occurrence={o}
                    color={colorOf(o.event.categoryId)}
                    onOpen={onOpenEvent}
                  />
                ))}
                {hidden > 0 ? <span className={styles.more}>+{hidden}</span> : null}
              </div>
              <div className={styles.dots} aria-hidden="true">
                {items.slice(0, 4).map((o) => (
                  <span
                    key={`${o.eventId}:${o.occurrenceKey}`}
                    className={styles.dot}
                    style={{ background: colorOf(o.event.categoryId) }}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.add}
                onClick={(e) => {
                  e.stopPropagation()
                  onCreate(day)
                }}
                aria-label={`Tạo sự kiện ngày ${formatAccessibleDate(day)}`}
              >
                <Plus size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
