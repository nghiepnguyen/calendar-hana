import { Plus, X } from '@phosphor-icons/react'
import { MAX_REMINDERS, type Reminder } from '@shared/types'
import {
  ALL_DAY_PRESETS,
  reminderLabel,
  splitOffset,
  TIMED_PRESETS,
  UNIT_LABELS,
  UNIT_MINUTES,
  type ReminderUnit,
} from './reminderOptions'
import styles from './EventForm.module.css'

interface ReminderFieldProps {
  reminders: Reminder[]
  allDay: boolean
  allDayReminderTime: string
  /** Đã đăng nhập Google: dùng được email và thông báo khi đóng app. */
  signedIn: boolean
  onChange: (reminders: Reminder[]) => void
  /** Gọi khi người dùng thêm nhắc hẹn thông báo (để xin quyền thông báo). */
  onNotificationAdded?: () => void
  error?: string
}

const CUSTOM = 'custom'

export function ReminderField({
  reminders,
  allDay,
  allDayReminderTime,
  signedIn,
  onChange,
  onNotificationAdded,
  error,
}: ReminderFieldProps) {
  const presets = allDay ? ALL_DAY_PRESETS : TIMED_PRESETS

  const update = (index: number, patch: Partial<Reminder>) => {
    const next = reminders.map((r, i) => (i === index ? { ...r, ...patch } : r))
    onChange(next)
    if (patch.channel === 'notification') onNotificationAdded?.()
  }

  const add = () => {
    const used = new Set(reminders.map((r) => r.offsetMinutes))
    const offset = (allDay ? [0, 24 * 60] : [15, 60, 0]).find((o) => !used.has(o)) ?? presets[0]
    onChange([...reminders, { offsetMinutes: offset, channel: 'notification' }])
    onNotificationAdded?.()
  }

  const hasNotification = reminders.some((r) => r.channel === 'notification')

  return (
    <fieldset className={styles.fieldset}>
      <legend className="field-label">Nhắc hẹn</legend>
      {reminders.length === 0 ? <p className="field-hint">Chưa có nhắc hẹn.</p> : null}
      <ul className={styles.reminders}>
        {reminders.map((reminder, index) => {
          const isPreset = presets.includes(reminder.offsetMinutes)
          const { value, unit } = splitOffset(reminder.offsetMinutes)
          const n = index + 1
          return (
            <li key={index} className={styles.reminder}>
              <select
                className="input"
                aria-label={`Thời điểm nhắc ${n}`}
                value={isPreset ? String(reminder.offsetMinutes) : CUSTOM}
                onChange={(e) => {
                  if (e.target.value === CUSTOM) {
                    update(index, { offsetMinutes: allDay ? 2 * 24 * 60 : 10 })
                  } else {
                    update(index, { offsetMinutes: Number(e.target.value) })
                  }
                }}
              >
                {presets.map((p) => (
                  <option key={p} value={p}>
                    {reminderLabel(p, allDay, allDayReminderTime)}
                  </option>
                ))}
                <option value={CUSTOM}>Tùy chỉnh…</option>
              </select>
              {!isPreset ? (
                <span className={styles.custom}>
                  <input
                    type="number"
                    className={`input ${styles.countInput}`}
                    aria-label={`Số lượng nhắc ${n}`}
                    min={1}
                    max={999}
                    value={value}
                    onChange={(e) =>
                      update(index, {
                        offsetMinutes:
                          Math.max(1, Number(e.target.value) || 1) * UNIT_MINUTES[unit],
                      })
                    }
                  />
                  <select
                    className="input"
                    aria-label={`Đơn vị nhắc ${n}`}
                    value={unit}
                    onChange={(e) =>
                      update(index, {
                        offsetMinutes: value * UNIT_MINUTES[e.target.value as ReminderUnit],
                      })
                    }
                  >
                    {(Object.keys(UNIT_LABELS) as ReminderUnit[]).map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u]} trước
                      </option>
                    ))}
                  </select>
                </span>
              ) : null}
              <select
                className="input"
                aria-label={`Kênh nhắc ${n}`}
                value={reminder.channel}
                onChange={(e) => update(index, { channel: e.target.value as Reminder['channel'] })}
              >
                <option value="notification">Thông báo</option>
                <option value="email" disabled={!signedIn}>
                  Email{signedIn ? '' : ' (cần đăng nhập)'}
                </option>
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                aria-label={`Xóa nhắc hẹn ${n}`}
                onClick={() => onChange(reminders.filter((_, i) => i !== index))}
              >
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      {reminders.length < MAX_REMINDERS ? (
        <button type="button" className={`btn ${styles.addReminder}`} onClick={add}>
          <Plus size={16} weight="bold" aria-hidden="true" /> Thêm nhắc hẹn
        </button>
      ) : (
        <p className="field-hint">Tối đa {MAX_REMINDERS} nhắc hẹn.</p>
      )}
      {!signedIn ? (
        <p className="field-hint">
          {hasNotification ? 'Thông báo chỉ hiện khi app đang mở. ' : ''}
          Đăng nhập Google để dùng nhắc hẹn qua email.
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
