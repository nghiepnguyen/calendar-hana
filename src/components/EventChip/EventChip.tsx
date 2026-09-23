import type { CSSProperties } from 'react'
import { MoonStars, Repeat } from '@phosphor-icons/react'
import { formatTime } from '@shared/format'
import type { Occurrence } from '@shared/recurrence/recurrence'
import styles from './EventChip.module.css'

interface EventChipProps {
  occurrence: Occurrence
  color: string
  onOpen: (occurrence: Occurrence) => void
  /** 'block': khối trong lưới giờ; 'inline': dòng trong ô tháng / cả ngày. */
  variant?: 'block' | 'inline'
  style?: CSSProperties
  /** Chỉ hiện chấm màu (ô tháng trên điện thoại). */
  compact?: boolean
}

export function EventChip({
  occurrence,
  color,
  onOpen,
  variant = 'inline',
  style,
  compact,
}: EventChipProps) {
  const { event } = occurrence
  const time = !event.allDay && event.startTime ? formatTime(event.startTime) : null
  const timeRange =
    !event.allDay && event.startTime && event.endTime
      ? `${formatTime(event.startTime)}-${formatTime(event.endTime)}`
      : time
  const isLunar = event.calendarType === 'lunar' || event.recurrence?.calendar === 'lunar'
  const label = [event.title, timeRange ?? 'Cả ngày', isLunar ? 'âm lịch' : null]
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      className={`${styles.chip} ${styles[variant]} ${compact ? styles.compact : ''}`}
      style={{ ...style, '--event-color': color } as CSSProperties}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(occurrence)
      }}
      aria-label={label}
      title={label}
    >
      {compact ? null : (
        <>
          {variant === 'inline' && time ? <span className={styles.time}>{time}</span> : null}
          <span className={styles.title}>{event.title}</span>
          {variant === 'block' && timeRange ? (
            <span className={styles.range}>{timeRange}</span>
          ) : null}
          <span className={styles.icons} aria-hidden="true">
            {isLunar ? <MoonStars size={12} weight="bold" /> : null}
            {occurrence.isRecurring ? <Repeat size={12} weight="bold" /> : null}
          </span>
        </>
      )}
    </button>
  )
}
