import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  place: '' | 'hanoi' | 'hcm'
  precision: 'exact' | 'estimated' | 'unknown'
  uncertainty: string
  historicalOffset: '' | '420' | '480'
  ziPolicy: 'splitZi' | 'dayStartsAt23'
}

const PLACES = {
  hanoi: {
    countryCode: 'VN' as const,
    subdivisionCode: 'VN-HN',
    label: 'Hà Nội',
    latitude: 21.03,
    longitude: 105.85,
    coordinateSource: 'bundledGazetteer' as const,
    coordinateAccuracyKm: 10,
    timezoneId: 'Asia/Bangkok' as const,
  },
  hcm: {
    countryCode: 'VN' as const,
    subdivisionCode: 'VN-SG',
    label: 'TP. Hồ Chí Minh',
    latitude: 10.76,
    longitude: 106.66,
    coordinateSource: 'bundledGazetteer' as const,
    coordinateAccuracyKm: 10,
    timezoneId: 'Asia/Ho_Chi_Minh' as const,
  },
}

function fromSettings(settings: Settings): Draft {
  const [year = '', month = '', day = ''] = (settings.birthDate ?? '').split('-')
  const place =
    settings.birthPlace?.subdivisionCode === 'VN-HN'
      ? 'hanoi'
      : settings.birthPlace?.subdivisionCode === 'VN-SG'
        ? 'hcm'
        : ''
  return {
    day,
    month,
    year,
    time: settings.birthTime ?? '',
    place,
    precision: settings.birthTimePrecision ?? 'exact',
    uncertainty: String(settings.birthTimeUncertaintyMinutes ?? 15),
    historicalOffset:
      settings.birthConfirmedOffsetMinutes === 420
        ? '420'
        : settings.birthConfirmedOffsetMinutes === 480
          ? '480'
          : '',
    ziPolicy: settings.birthZiPolicy ?? 'splitZi',
  }
}

export function BirthInfoForm({
  settings,
  signedIn,
  focusBirth = false,
}: {
  settings: Settings
  signedIn: boolean
  focusBirth?: boolean
}) {
  const dateInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusBirth) {
      dateInput.current?.focus()
      dateInput.current?.scrollIntoView?.({ block: 'center' })
    }
  }, [focusBirth])
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
    const { day, month, year, time, place, precision, uncertainty, historicalOffset, ziPolicy } =
      values
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
    const uncertaintyMinutes = precision === 'estimated' ? Number(uncertainty) : 0
    if (
      time &&
      precision === 'estimated' &&
      (!Number.isInteger(uncertaintyMinutes) || uncertaintyMinutes <= 0 || uncertaintyMinutes > 720)
    ) {
      setError('Khoảng ước lượng phải từ 1 đến 720 phút.')
      return
    }
    const selectedPlace = place ? PLACES[place] : null
    setBusy(true)
    try {
      await repository.saveSettings({
        birthDate: hasDate ? date : null,
        birthTime: time || null,
        birthTimePrecision: time ? precision : null,
        birthTimeUncertaintyMinutes: time ? uncertaintyMinutes : null,
        birthPlace: selectedPlace
          ? {
              countryCode: selectedPlace.countryCode,
              subdivisionCode: selectedPlace.subdivisionCode,
              label: selectedPlace.label,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
              coordinateSource: selectedPlace.coordinateSource,
              coordinateAccuracyKm: selectedPlace.coordinateAccuracyKm,
            }
          : null,
        birthTimezoneId: selectedPlace?.timezoneId ?? null,
        birthTimezoneSource: historicalOffset
          ? 'userConfirmed'
          : selectedPlace
            ? 'bundledMapping'
            : null,
        birthConfirmedOffsetMinutes: historicalOffset ? Number(historicalOffset) : null,
        birthZiPolicy: time ? ziPolicy : null,
      })
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
    <form id="birth-info" className={styles.birthInfo} onSubmit={save} noValidate>
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
                ref={key === 'day' ? dateInput : undefined}
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
        <label className="field">
          <span className="field-label">Nơi sinh (để lập Tứ Trụ)</span>
          <select
            className="input"
            aria-label="Nơi sinh"
            value={values.place}
            onChange={(e) => change('place', e.target.value)}
          >
            <option value="">Chưa chọn</option>
            <option value="hanoi">Hà Nội / miền Bắc</option>
            <option value="hcm">TP. Hồ Chí Minh / miền Nam</option>
          </select>
          <span className="field-hint">Không dùng vị trí hiện tại của thiết bị.</span>
        </label>
        <label className="field">
          <span className="field-label">Độ chắc chắn của giờ sinh</span>
          <select
            className="input"
            aria-label="Độ chắc chắn của giờ sinh"
            value={values.precision}
            onChange={(e) => change('precision', e.target.value)}
          >
            <option value="exact">Chính xác</option>
            <option value="estimated">Ước lượng</option>
            <option value="unknown">Không biết giờ</option>
          </select>
        </label>
        {values.precision === 'estimated' ? (
          <label className="field">
            <span className="field-label">Sai số ước lượng (phút)</span>
            <input
              className="input"
              type="number"
              min={1}
              max={720}
              value={values.uncertainty}
              onChange={(e) => change('uncertainty', e.target.value)}
            />
          </label>
        ) : null}
        {Number(values.year) > 0 && Number(values.year) < 1970 ? (
          <label className="field">
            <span className="field-label">Xác nhận múi giờ lịch sử</span>
            <select
              className="input"
              aria-label="Xác nhận múi giờ lịch sử"
              value={values.historicalOffset}
              onChange={(e) => change('historicalOffset', e.target.value)}
            >
              <option value="">Chưa xác nhận</option>
              <option value="420">UTC+7</option>
              <option value="480">UTC+8</option>
            </select>
          </label>
        ) : null}
        <label className="field">
          <span className="field-label">Quy ước giờ Tý</span>
          <select
            className="input"
            aria-label="Quy ước giờ Tý"
            value={values.ziPolicy}
            onChange={(e) => change('ziPolicy', e.target.value)}
          >
            <option value="splitZi">Tách Dạ Tý / Chính Tý</option>
            <option value="dayStartsAt23">Đổi ngày từ 23:00</option>
          </select>
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
                setDraft({
                  day: '',
                  month: '',
                  year: '',
                  time: '',
                  place: '',
                  precision: 'exact',
                  uncertainty: '15',
                  historicalOffset: '',
                  ziPolicy: 'splitZi',
                })
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
