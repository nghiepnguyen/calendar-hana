import { useId } from 'react'
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

/** Chọn ngày / tháng (có tháng nhuận) / năm âm lịch. */
export function LunarDateInput({ value, onChange, invalid }: LunarDateInputProps) {
  const id = useId()
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
      <label className={styles.lunarField}>
        <span className="field-label">Ngày</span>
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
      </label>
      <label className={styles.lunarField}>
        <span className="field-label">Tháng</span>
        <select
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
      </label>
      <label className={styles.lunarField}>
        <span className="field-label">Năm</span>
        <input
          className="input"
          type="number"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={value.year}
          onChange={(e) => {
            const year = Number(e.target.value)
            if (Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR) update({ year })
          }}
        />
      </label>
      <span className={styles.lunarYearName}>
        {value.year >= MIN_YEAR && value.year <= MAX_YEAR ? yearCanChi(value.year).name : ''}
      </span>
      {monthLength !== null && value.day > monthLength ? (
        <p className="field-error" role="alert">
          Tháng này chỉ có {monthLength} ngày.
        </p>
      ) : null}
    </div>
  )
}
