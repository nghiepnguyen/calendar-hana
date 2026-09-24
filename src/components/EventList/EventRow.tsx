import type { CSSProperties } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { formatAccessibleDate } from '@shared/format'
import type { Occurrence } from '@shared/recurrence/recurrence'
import { timeLabel } from './listFormat'
import styles from './EventList.module.css'

interface EventRowProps {
  occurrence: Occurrence
  color: string
  categoryName?: string
  selecting?: boolean
  selected?: boolean
  onOpen: (occurrence: Occurrence) => void
  onToggle?: (occurrence: Occurrence) => void
}

/** Một lần diễn ra trong danh sách. Ở chế độ chọn, cả dòng là ô chọn. */
export function EventRow({
  occurrence,
  color,
  categoryName,
  selecting = false,
  selected = false,
  onOpen,
  onToggle,
}: EventRowProps) {
  const { event } = occurrence
  const time = timeLabel(event)
  const label = [
    event.title,
    time,
    formatAccessibleDate(occurrence.date),
    occurrence.isRecurring ? 'lặp lại' : '',
  ]
    .filter(Boolean)
    .join(', ')

  const content = (
    <>
      <span className={styles.swatch} style={{ '--swatch': color } as CSSProperties} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{event.title}</span>
        <span className={styles.rowMeta}>
          <span>{time}</span>
          {categoryName ? <span>{categoryName}</span> : null}
          {event.calendarType === 'lunar' ? <span className={styles.lunarTag}>Âm lịch</span> : null}
        </span>
        {event.location ? <span className={styles.rowLocation}>{event.location}</span> : null}
      </span>
      {occurrence.isRecurring ? (
        <ArrowsClockwise size={16} className={styles.repeat} aria-hidden="true" />
      ) : null}
    </>
  )

  if (selecting) {
    return (
      <label className={`${styles.row} ${selected ? styles.rowSelected : ''}`}>
        <input
          type="checkbox"
          className="check"
          checked={selected}
          onChange={() => onToggle?.(occurrence)}
          aria-label={label}
        />
        {content}
      </label>
    )
  }

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onOpen(occurrence)}
      aria-label={label}
    >
      {content}
    </button>
  )
}
