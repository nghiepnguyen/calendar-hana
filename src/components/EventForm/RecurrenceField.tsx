import { useId } from 'react'
import { WEEKDAY_SHORT, WEEKDAY_NAMES } from '@shared/format'
import { dayOfWeek } from '@shared/lunar'
import { describeRecurrence } from '@shared/recurrence/describe'
import { draftSolarDate, draftToInput, REPEAT_OPTIONS, type EventDraft } from './draft'
import styles from './EventForm.module.css'

interface RecurrenceFieldProps {
  draft: EventDraft
  onChange: (patch: Partial<EventDraft>) => void
  error?: string
}

/** Thứ Hai → Chủ nhật. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function RecurrenceField({ draft, onChange, error }: RecurrenceFieldProps) {
  const id = useId()
  const options = REPEAT_OPTIONS[draft.calendarType]
  const solarDate = draftSolarDate(draft)
  const weekdays =
    draft.byWeekday.length > 0 ? draft.byWeekday : solarDate ? [dayOfWeek(solarDate)] : []

  let summary: string | null = null
  if (draft.repeat !== 'none' && solarDate) {
    try {
      summary = describeRecurrence(draftToInput(draft))
    } catch {
      summary = null
    }
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className="field-label">Lặp lại</legend>
      <select
        id={`${id}-repeat`}
        className="input"
        aria-label="Kiểu lặp"
        value={draft.repeat}
        onChange={(e) => onChange({ repeat: e.target.value as EventDraft['repeat'] })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {draft.repeat === 'weekly' ? (
        <div className={styles.weekdays} role="group" aria-label="Lặp vào các thứ">
          {WEEK_ORDER.map((d) => {
            const checked = weekdays.includes(d)
            return (
              <label key={d} className={`${styles.weekday} ${checked ? styles.weekdayOn : ''}`}>
                <input
                  type="checkbox"
                  className="visually-hidden"
                  checked={checked}
                  aria-label={WEEKDAY_NAMES[d]}
                  onChange={() => {
                    const next = checked ? weekdays.filter((x) => x !== d) : [...weekdays, d]
                    // Luôn giữ ít nhất một thứ.
                    if (next.length > 0) onChange({ byWeekday: next })
                  }}
                />
                <span aria-hidden="true">{WEEKDAY_SHORT[d]}</span>
              </label>
            )
          })}
        </div>
      ) : null}

      {draft.repeat !== 'none' ? (
        <div className={styles.repeatEnd}>
          <label className={styles.radio}>
            <input
              type="radio"
              name={`${id}-end`}
              checked={draft.repeatEnd === 'never'}
              onChange={() => onChange({ repeatEnd: 'never' })}
            />
            Không bao giờ kết thúc
          </label>
          <div className={styles.radio}>
            <label className={styles.radio}>
              <input
                type="radio"
                name={`${id}-end`}
                checked={draft.repeatEnd === 'until'}
                onChange={() => onChange({ repeatEnd: 'until' })}
              />
              Đến ngày
            </label>
            <input
              type="date"
              className={`input ${styles.inlineInput}`}
              aria-label="Lặp đến ngày"
              value={draft.until}
              min={solarDate ?? undefined}
              max="2100-12-31"
              disabled={draft.repeatEnd !== 'until'}
              onChange={(e) => onChange({ until: e.target.value })}
            />
          </div>
          <div className={styles.radio}>
            <label className={styles.radio}>
              <input
                type="radio"
                name={`${id}-end`}
                checked={draft.repeatEnd === 'count'}
                onChange={() => onChange({ repeatEnd: 'count' })}
              />
              Sau
            </label>
            <input
              type="number"
              className={`input ${styles.countInput}`}
              aria-label="Số lần lặp"
              min={1}
              max={999}
              value={draft.count}
              disabled={draft.repeatEnd !== 'count'}
              onChange={(e) => onChange({ count: Math.max(1, Number(e.target.value) || 1) })}
            />
            <span aria-hidden="true">lần</span>
          </div>
        </div>
      ) : null}

      {summary ? <p className="field-hint">{summary}</p> : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
