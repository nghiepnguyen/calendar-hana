import { useId, useState, type CSSProperties, type FormEvent } from 'react'
import { formatLunar, formatSolar } from '@shared/format'
import { MAX_YEAR, MIN_YEAR, parseSolarDate, solarToLunar } from '@shared/lunar'
import { EVENT_NOTE_MAX, EVENT_TITLE_MAX, type Category } from '@shared/types'
import { validateEvent, type EventErrors } from '@shared/validation'
import { useNotificationStore } from '../../reminders/notifications'
import { LunarDateInput } from '../DatePicker/LunarDateInput'
import { Modal } from '../Modal/Modal'
import {
  changeStartTime,
  draftSolarDate,
  draftToInput,
  setAllDay,
  switchCalendar,
  type EventDraft,
} from './draft'
import { RecurrenceField } from './RecurrenceField'
import { ReminderField } from './ReminderField'
import styles from './EventForm.module.css'

export type EventFormMode = 'create' | 'all' | 'single' | 'following'

const TITLES: Record<EventFormMode, string> = {
  create: 'Tạo sự kiện',
  all: 'Sửa sự kiện',
  single: 'Sửa lần này',
  following: 'Sửa lần này và các lần sau',
}

interface EventFormProps {
  mode: EventFormMode
  initialDraft: EventDraft
  categories: Category[]
  allDayReminderTime: string
  signedIn: boolean
  onSave: (draft: EventDraft) => Promise<void>
  onCancel: () => void
}

export function EventForm({
  mode,
  initialDraft,
  categories,
  allDayReminderTime,
  signedIn,
  onSave,
  onCancel,
}: EventFormProps) {
  const id = useId()
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<EventErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isSingle = mode === 'single'
  const permission = useNotificationStore((s) => s.permission)
  const requestPermission = useNotificationStore((s) => s.request)

  const update = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const solarDate = draftSolarDate(draft)
  const converted = (() => {
    if (!solarDate) return null
    if (draft.calendarType === 'lunar') return `Tức ${formatSolar(solarDate)} dương lịch`
    const { day, month, year } = parseSolarDate(solarDate)
    // Đang gõ năm dở (0001, 0019…): chưa quy đổi được, đợi gõ xong.
    if (year < MIN_YEAR || year > MAX_YEAR) return null
    return `Tức ngày ${formatLunar(solarToLunar(day, month, year))}`
  })()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateEvent(draftToInput(draft))
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Đưa focus tới ô lỗi đầu tiên.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-form="${id}"] [aria-invalid="true"]`)?.focus(),
      )
      return
    }
    // Nhắc hẹn thêm sẵn chưa qua bước xin quyền: xin lúc bấm Lưu (cần thao tác của người dùng).
    if (permission === 'default' && draft.reminders.some((r) => r.channel === 'notification')) {
      void requestPermission()
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(draft)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không lưu được sự kiện.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={TITLES[mode]}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" form={`${id}-form`} className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </>
      }
    >
      <form id={`${id}-form`} data-form={id} className={styles.form} onSubmit={submit} noValidate>
        {!isSingle ? (
          <div
            className={`segmented ${styles.calendarSwitch}`}
            role="radiogroup"
            aria-label="Loại lịch"
            style={
              { '--active': draft.calendarType === 'solar' ? 0 : 1, '--count': 2 } as CSSProperties
            }
          >
            {(['solar', 'lunar'] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={draft.calendarType === type}
                onClick={() => setDraft((d) => switchCalendar(d, type))}
              >
                {type === 'solar' ? 'Dương lịch' : 'Âm lịch'}
              </button>
            ))}
          </div>
        ) : null}

        <div className="field">
          <label className="field-label" htmlFor={`${id}-title`}>
            Tiêu đề
          </label>
          <input
            id={`${id}-title`}
            className="input"
            value={draft.title}
            maxLength={EVENT_TITLE_MAX + 50}
            placeholder="Ví dụ: Giỗ ông nội"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? `${id}-title-error` : undefined}
            onChange={(e) => update({ title: e.target.value })}
          />
          {errors.title ? (
            <span id={`${id}-title-error`} className="field-error">
              {errors.title}
            </span>
          ) : null}
        </div>

        <div className="field">
          {draft.calendarType === 'lunar' && !isSingle ? (
            <>
              <span className="field-label">Ngày âm lịch</span>
              <LunarDateInput
                value={draft.lunarDate}
                onChange={(lunarDate) => update({ lunarDate })}
                invalid={!!errors.date}
              />
            </>
          ) : (
            <label className="field">
              <span className="field-label">Ngày</span>
              <input
                className="input"
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={draft.solarDate}
                aria-invalid={!!errors.date}
                onChange={(e) => update({ solarDate: e.target.value })}
              />
            </label>
          )}
          {converted ? (
            <span className={styles.converted} aria-live="polite">
              {converted}
            </span>
          ) : null}
          {errors.date ? <span className="field-error">{errors.date}</span> : null}
        </div>

        <div className={styles.timeRow}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={draft.allDay}
              onChange={(e) => setDraft((d) => setAllDay(d, e.target.checked))}
            />
            Cả ngày
          </label>
          {!draft.allDay ? (
            <div className={styles.times}>
              <label className="field">
                <span className="field-label">Bắt đầu</span>
                <input
                  className="input"
                  type="time"
                  value={draft.startTime}
                  aria-invalid={!!errors.time}
                  onChange={(e) =>
                    e.target.value && setDraft((d) => changeStartTime(d, e.target.value))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Kết thúc</span>
                <input
                  className="input"
                  type="time"
                  value={draft.endTime}
                  aria-invalid={!!errors.time}
                  onChange={(e) => update({ endTime: e.target.value })}
                />
              </label>
            </div>
          ) : null}
        </div>
        {errors.time ? <span className="field-error">{errors.time}</span> : null}

        <label className="field">
          <span className="field-label">Danh mục</span>
          <span className={styles.categorySelect}>
            <span
              className={styles.categorySwatch}
              style={{ background: categories.find((c) => c.id === draft.categoryId)?.color }}
              aria-hidden="true"
            />
            <select
              className="input"
              value={draft.categoryId}
              aria-invalid={!!errors.categoryId}
              onChange={(e) => update({ categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </span>
        </label>

        {!isSingle ? (
          <RecurrenceField draft={draft} onChange={update} error={errors.recurrence} />
        ) : null}

        <ReminderField
          reminders={draft.reminders}
          allDay={draft.allDay}
          allDayReminderTime={allDayReminderTime}
          signedIn={signedIn}
          onChange={(reminders) => update({ reminders })}
          error={errors.reminders}
        />

        <div className="field">
          <label className="field-label" htmlFor={`${id}-location`}>
            Địa điểm
          </label>
          <input
            id={`${id}-location`}
            className="input"
            value={draft.location}
            placeholder="Không bắt buộc"
            aria-invalid={!!errors.location}
            onChange={(e) => update({ location: e.target.value })}
          />
          {errors.location ? <span className="field-error">{errors.location}</span> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor={`${id}-note`}>
            Ghi chú
          </label>
          <textarea
            id={`${id}-note`}
            className="input"
            rows={3}
            value={draft.note}
            placeholder="Không bắt buộc"
            aria-invalid={!!errors.note}
            aria-describedby={`${id}-note-count`}
            onChange={(e) => update({ note: e.target.value })}
          />
          <span id={`${id}-note-count`} className="field-hint">
            {draft.note.length}/{EVENT_NOTE_MAX} ký tự
          </span>
          {errors.note ? <span className="field-error">{errors.note}</span> : null}
        </div>

        {saveError ? (
          <p className="field-error" role="alert">
            {saveError}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
