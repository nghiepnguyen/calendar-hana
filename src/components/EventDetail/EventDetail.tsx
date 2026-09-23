import { formatLunarWithYear, formatSolar, formatTime } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import { describeRecurrence } from '@shared/recurrence/describe'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Category, CalendarEvent } from '@shared/types'
import { Modal } from '../Modal/Modal'
import { channelLabel, reminderLabel } from '../EventForm/reminderOptions'
import styles from './EventDetail.module.css'

interface EventDetailProps {
  occurrence: Occurrence
  /** Sự kiện gốc (để mô tả quy tắc lặp). */
  baseEvent: CalendarEvent | undefined
  category: Category | undefined
  allDayReminderTime: string
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function EventDetail({
  occurrence,
  baseEvent,
  category,
  allDayReminderTime,
  onEdit,
  onDelete,
  onClose,
}: EventDetailProps) {
  const { event, date } = occurrence
  const info = getDayInfo(date)
  const time = event.allDay
    ? 'Cả ngày'
    : `${formatTime(event.startTime ?? '00:00')}${event.endTime ? `–${formatTime(event.endTime)}` : ''}`

  return (
    <Modal
      title={
        <span className={styles.title}>
          <span
            className={styles.swatch}
            style={{ background: category?.color ?? '#475569' }}
            aria-hidden="true"
          />
          {event.title}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Xóa
          </button>
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Sửa
          </button>
        </>
      }
    >
      <dl className={styles.list}>
        <div>
          <dt>Ngày</dt>
          <dd>
            {formatSolar(date)}
            <span className={styles.sub}>{formatLunarWithYear(info.lunar)}</span>
          </dd>
        </div>
        <div>
          <dt>Giờ</dt>
          <dd>{time}</dd>
        </div>
        {occurrence.isRecurring && baseEvent ? (
          <div>
            <dt>Lặp lại</dt>
            <dd>
              {describeRecurrence(baseEvent)}
              {occurrence.isException ? (
                <span className={styles.sub}>Lần này đã được sửa riêng.</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Danh mục</dt>
          <dd>{category?.name ?? 'Khác'}</dd>
        </div>
        {event.reminders.length > 0 ? (
          <div>
            <dt>Nhắc hẹn</dt>
            <dd>
              <ul className={styles.reminders}>
                {event.reminders.map((r, i) => (
                  <li key={i}>
                    {reminderLabel(r.offsetMinutes, event.allDay, allDayReminderTime)} ·{' '}
                    {channelLabel(r.channel)}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        {event.location ? (
          <div>
            <dt>Địa điểm</dt>
            <dd>{event.location}</dd>
          </div>
        ) : null}
        {event.note ? (
          <div>
            <dt>Ghi chú</dt>
            <dd className={styles.note}>{event.note}</dd>
          </div>
        ) : null}
      </dl>
    </Modal>
  )
}
