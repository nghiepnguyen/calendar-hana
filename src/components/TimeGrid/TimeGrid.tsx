import { useEffect, useMemo, useRef, type CSSProperties, type MouseEvent } from 'react'
import type { Occurrence } from '@shared/recurrence/recurrence'
import { minutesToTime } from '@shared/time'
import type { SolarDateString, TimeString } from '@shared/types'
import { formatAccessibleDate } from '@shared/format'
import { groupByDate } from '../../hooks/useEventsInRange'
import { useNow } from '../../hooks/useNow'
import { EventChip } from '../EventChip/EventChip'
import { layoutTimedEvents } from './layout'
import styles from './TimeGrid.module.css'

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const SLOT_MINUTES = 30

interface TimeGridProps {
  days: SolarDateString[]
  occurrences: Occurrence[]
  colorOf: (categoryId: string) => string
  onOpenEvent: (occurrence: Occurrence) => void
  onCreate: (date: SolarDateString, startTime?: TimeString) => void
}

/** Lưới 24 giờ cho một (xem Ngày) hoặc nhiều ngày (xem Tuần). */
export function TimeGrid({ days, occurrences, colorOf, onOpenEvent, onCreate }: TimeGridProps) {
  const { today, minutes: nowMinutes } = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const byDate = useMemo(() => groupByDate(occurrences), [occurrences])
  const hasAllDay = occurrences.some((o) => o.event.allDay)

  // Khi mở, cuộn tới 1 tiếng trước giờ hiện tại (hoặc 7h nếu không xem hôm nay).
  // Chỉ cuộn khi đổi ngày đang xem, không cuộn lại mỗi phút.
  const daysKey = days.join(',')
  const showsToday = days.includes(today)
  const nowRef = useRef(nowMinutes)
  useEffect(() => {
    nowRef.current = nowMinutes
  })
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const hour = showsToday ? Math.max(0, Math.floor(nowRef.current / 60) - 1) : 7
    const hourHeight = parseFloat(getComputedStyle(el).getPropertyValue('--hour-height')) || 48
    el.scrollTop = hour * hourHeight
  }, [daysKey, showsToday])

  const handleColumnClick = (date: SolarDateString) => (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientY - rect.top) / rect.height
    const minutes = Math.floor((ratio * 24 * 60) / SLOT_MINUTES) * SLOT_MINUTES
    onCreate(date, minutesToTime(minutes))
  }

  return (
    <div className={styles.wrapper} style={{ '--day-count': days.length } as CSSProperties}>
      {hasAllDay ? (
        <div className={styles.allDayRow}>
          <div className={styles.gutterLabel}>Cả ngày</div>
          {days.map((date) => (
            <div key={date} className={styles.allDayCell}>
              {(byDate.get(date) ?? [])
                .filter((o) => o.event.allDay)
                .map((o) => (
                  <EventChip
                    key={`${o.eventId}:${o.occurrenceKey}`}
                    occurrence={o}
                    color={colorOf(o.event.categoryId)}
                    onOpen={onOpenEvent}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.grid}>
          <div className={styles.gutter} aria-hidden="true">
            {HOURS.map((h) => (
              <div key={h} className={styles.hourLabel}>
                {h === 0 ? '' : `${h}:00`}
              </div>
            ))}
          </div>
          {days.map((date) => {
            const timed = (byDate.get(date) ?? []).filter((o) => !o.event.allDay)
            const positioned = layoutTimedEvents(timed)
            return (
              <div
                key={date}
                className={`${styles.column} ${date === today ? styles.todayColumn : ''}`}
                onClick={handleColumnClick(date)}
                role="group"
                aria-label={formatAccessibleDate(date)}
              >
                {HOURS.map((h) => (
                  <div key={h} className={styles.hourSlot} />
                ))}
                {positioned.map((p) => {
                  const width = 100 / p.columns
                  return (
                    <EventChip
                      key={`${p.occurrence.eventId}:${p.occurrence.occurrenceKey}`}
                      occurrence={p.occurrence}
                      color={colorOf(p.occurrence.event.categoryId)}
                      onOpen={onOpenEvent}
                      variant="block"
                      style={{
                        top: `calc(${p.startMinutes / 60} * var(--hour-height))`,
                        height: `calc(${(p.endMinutes - p.startMinutes) / 60} * var(--hour-height) - 2px)`,
                        left: `calc(${p.column * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                      }}
                    />
                  )
                })}
                {date === today ? (
                  <div
                    className={styles.nowLine}
                    style={{ top: `calc(${nowMinutes / 60} * var(--hour-height))` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
