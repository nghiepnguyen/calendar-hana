import { useState, type FormEvent } from 'react'
import { isValidBirthDate, isValidBirthTime } from '@shared/birthInfo'
import { todayInVietnam } from '@shared/time'
import type { Settings } from '@shared/types'
import { authErrorMessage } from '../../auth/authContext'
import { useRepository } from '../../data/repositoryContext'
import styles from './SettingsPage.module.css'

interface Draft {
  day: string
  month: string
  year: string
  time: string
}

function fromSettings(settings: Settings): Draft {
  const [year = '', month = '', day = ''] = (settings.birthDate ?? '').split('-')
  return { day, month, year, time: settings.birthTime ?? '' }
}

export function BirthInfoForm({ settings, signedIn }: { settings: Settings; signedIn: boolean }) {
  const repository = useRepository()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const values = draft ?? fromSettings(settings)

  const change = (key: keyof Draft, value: string) => {
    setDraft({ ...values, [key]: value })
    setError(null)
    setMessage(null)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const { day, month, year, time } = values
    const hasDate = !!(day || month || year)
    const date = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    if (hasDate && (!day || !month || !year)) {
      setError('Vui lòng nhập đủ ngày, tháng và năm sinh.')
      return
    }
    if (hasDate && date > todayInVietnam()) {
      setError('Ngày sinh không được sau hôm nay.')
      return
    }
    if (hasDate && !isValidBirthDate(date)) {
      setError('Ngày sinh không hợp lệ. Vui lòng kiểm tra ngày, tháng và năm.')
      return
    }
    if (time && (!hasDate || !isValidBirthTime(time))) {
      setError(
        hasDate ? 'Giờ sinh không hợp lệ.' : 'Vui lòng nhập ngày sinh trước khi thêm giờ sinh.',
      )
      return
    }
    setBusy(true)
    try {
      await repository.saveSettings({ birthDate: hasDate ? date : null, birthTime: time || null })
      setMessage('Đã lưu thông tin ngày sinh.')
      setDraft(null)
    } catch {
      setError('Không lưu được thông tin ngày sinh. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const importGoogle = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const { fetchGoogleBirthday } = await import('../../auth/authService')
      const birthday = await fetchGoogleBirthday()
      setDraft({
        ...values,
        day: String(birthday.day),
        month: String(birthday.month),
        year: birthday.year ? String(birthday.year) : '',
      })
      setMessage(
        birthday.year
          ? 'Đã lấy ngày sinh từ Google. Kiểm tra thông tin rồi bấm Lưu thông tin.'
          : 'Google chưa cung cấp năm sinh. Hãy nhập thêm năm sinh rồi bấm Lưu thông tin.',
      )
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.birthInfo} onSubmit={save} noValidate>
      <h3>Thông tin ngày sinh</h3>
      <p className="field-hint">
        Nhập ngày sinh theo dương lịch. Có thể bỏ trống nếu chưa muốn cung cấp.
      </p>
      <fieldset disabled={busy} className={styles.birthFields}>
        <legend className="visually-hidden">Ngày tháng năm sinh</legend>
        <div className={styles.birthDate}>
          {(
            [
              ['day', 'Ngày sinh', 31, 'Ngày'],
              ['month', 'Tháng sinh', 12, 'Tháng'],
              ['year', 'Năm sinh', Number(todayInVietnam().slice(0, 4)), 'Năm'],
            ] as const
          ).map(([key, label, max, placeholder]) => (
            <label className="field" key={key}>
              <span className="field-label">{label}</span>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                aria-label={label}
                placeholder={placeholder}
                value={values[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <label className="field">
          <span className="field-label">Giờ sinh (tùy chọn)</span>
          <input
            className="input"
            type="time"
            aria-label="Giờ sinh (tùy chọn)"
            value={values.time}
            onChange={(e) => change('time', e.target.value)}
          />
          <span className="field-hint">
            Giờ địa phương tại nơi sinh, định dạng 24 giờ. Nếu không biết, để trống.
          </span>
        </label>
        {signedIn ? (
          <>
            <button type="button" className="btn" onClick={() => void importGoogle()}>
              Lấy ngày sinh từ Google
            </button>
            <p className="field-hint">Google sẽ hỏi quyền đọc ngày sinh. Giờ sinh cần nhập tay.</p>
          </>
        ) : null}
        <div className={styles.buttons}>
          <button type="submit" className="btn btn-primary">
            {busy ? 'Đang xử lý…' : 'Lưu thông tin'}
          </button>
          {values.day || values.month || values.year || values.time ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDraft({ day: '', month: '', year: '', time: '' })
                setError(null)
                setMessage('Đã xóa trên form. Bấm Lưu thông tin để xác nhận.')
              }}
            >
              Xóa thông tin ngày sinh
            </button>
          ) : null}
        </div>
      </fieldset>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="field-hint" role="status">
          {message}
        </p>
      ) : null}
      <p className="field-hint">
        {repository.kind === 'cloud'
          ? 'Thông tin được lưu trong tài khoản và đồng bộ giữa các thiết bị.'
          : 'Thông tin được lưu trên máy này.'}
      </p>
    </form>
  )
}
