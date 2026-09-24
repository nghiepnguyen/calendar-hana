import { useId, useState } from 'react'
import { getLeapMonth, getLunarMonthLength, MAX_YEAR, MIN_YEAR, yearCanChi } from '@shared/lunar'
import type { LunarDate } from '@shared/types'
import styles from './DatePicker.module.css'

interface LunarDateInputProps {
  value: LunarDate
  onChange: (value: LunarDate) => void
  /** Hiện lỗi dưới ô chọn (ví dụ từ form). */
  invalid?: boolean
}

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)

function isSupportedYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR
}

/** Chọn ngày / tháng (có tháng nhuận) / năm âm lịch. */
export function LunarDateInput({ value, onChange, invalid }: LunarDateInputProps) {
  const id = useId()
  // Chữ đang gõ trong ô Năm. Năm dở dang (2, 20, 202…) chỉ nằm ở đây, chưa đổi value;
  // nếu gắn thẳng ô với value thì mỗi lần xoá/gõ dở ô lại nhảy về năm cũ.
  const [yearText, setYearText] = useState(String(value.year))
  const [shownYear, setShownYear] = useState(value.year)
  if (value.year !== shownYear) {
    // Năm đổi từ ngoài (đổi Dương → Âm, chọn ngày khác): hiện năm mới.
    setShownYear(value.year)
    setYearText(String(value.year))
  }
  const yearInvalid = !isSupportedYear(Number(yearText))
  const leapMonth =
    value.year >= MIN_YEAR && value.year <= MAX_YEAR ? getLeapMonth(value.year) : null
  const monthLength =
    value.year >= MIN_YEAR && value.year <= MAX_YEAR
      ? getLunarMonthLength(value.month, value.year, value.isLeap)
      : null

  const months: { month: number; isLeap: boolean; label: string }[] = []
  for (let m = 1; m <= 12; m++) {
    months.push({ month: m, isLeap: false, label: `Tháng ${m}` })
    if (leapMonth === m) months.push({ month: m, isLeap: true, label: `Tháng ${m} nhuận` })
  }

  const update = (patch: Partial<LunarDate>) => {
    const next = { ...value, ...patch }
    // Đổi sang năm không có tháng nhuận này thì bỏ cờ nhuận.
    if (next.isLeap && getLeapMonth(next.year) !== next.month) next.isLeap = false
    onChange(next)
  }

  return (
    <div className={styles.lunarInput}>
      <div className={styles.lunarField}>
        <label className="field-label" htmlFor={`${id}-day`}>
          Ngày
        </label>
        <select
          id={`${id}-day`}
          className="input"
          value={value.day}
          aria-invalid={invalid || (monthLength !== null && value.day > monthLength)}
          onChange={(e) => update({ day: Number(e.target.value) })}
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.lunarField}>
        <label className="field-label" htmlFor={`${id}-month`}>
          Tháng
        </label>
        <select
          id={`${id}-month`}
          className="input"
          value={`${value.month}${value.isLeap ? 'L' : ''}`}
          onChange={(e) => {
            const raw = e.target.value
            update({ month: Number(raw.replace('L', '')), isLeap: raw.endsWith('L') })
          }}
        >
          {months.map((m) => (
            <option
              key={`${m.month}${m.isLeap ? 'L' : ''}`}
              value={`${m.month}${m.isLeap ? 'L' : ''}`}
            >
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.lunarField}>
        <label className="field-label" htmlFor={`${id}-year`}>
          Năm
        </label>
        <input
          id={`${id}-year`}
          className="input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={yearText}
          aria-invalid={yearInvalid}
          aria-describedby={yearInvalid ? `${id}-year-error` : undefined}
          onChange={(e) => {
            const text = e.target.value.replace(/\D/g, '')
            setYearText(text)
            const year = Number(text)
            if (isSupportedYear(year)) {
              setShownYear(year)
              update({ year })
            }
          }}
          // Rời ô khi năm chưa hợp lệ thì trả về năm đang dùng.
          onBlur={() => setYearText(String(value.year))}
        />
      </div>
      <span className={styles.lunarYearName}>
        {value.year >= MIN_YEAR && value.year <= MAX_YEAR ? yearCanChi(value.year).name : ''}
      </span>
      {yearInvalid ? (
        <p id={`${id}-year-error`} className="field-error">
          Năm từ {MIN_YEAR} đến {MAX_YEAR}.
        </p>
      ) : null}
      {monthLength !== null && value.day > monthLength ? (
        <p className="field-error" role="alert">
          Tháng này chỉ có {monthLength} ngày.
        </p>
      ) : null}
    </div>
  )
}
