import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { formatAccessibleDate, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo, parseSolarDate } from '@shared/lunar'
import type { SolarDateString } from '@shared/types'
import { addMonths, monthGridDays } from '../../calendar/range'
import styles from './MiniMonth.module.css'

interface MiniMonthProps {
  selected: SolarDateString
  today: SolarDateString
  weekStartsOn: 0 | 1
  onSelect: (date: SolarDateString) => void
}

/** Lịch tháng nhỏ ở sidebar, có ngày âm, để chọn nhanh ngày. */
export function MiniMonth({ selected, today, weekStartsOn, onSelect }: MiniMonthProps) {
  const [cursor, setCursor] = useState(selected)
  const [lastSelected, setLastSelected] = useState(selected)
  // Khi ngày đang xem đổi từ bên ngoài, đưa lịch nhỏ về tháng đó.
  if (selected !== lastSelected) {
    setLastSelected(selected)
    setCursor(selected)
  }
  const { month, year } = parseSolarDate(cursor)
  const days = monthGridDays(cursor, weekStartsOn)
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7)

  return (
    <div className={styles.mini}>
      <div className={styles.head}>
        <span className={styles.title}>
          Tháng {month}/{year}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setCursor(addMonths(cursor, -1))}
          aria-label="Tháng trước"
        >
          <CaretLeft size={16} weight="bold" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Tháng sau"
        >
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className={styles.grid}>
        {weekdayOrder.map((d) => (
          <span key={d} className={styles.weekday} aria-hidden="true">
            {WEEKDAY_SHORT[d]}
          </span>
        ))}
        {days.map((day) => {
          const info = getDayInfo(day)
          const classes = [
            styles.day,
            info.solar.month !== month ? styles.outside : '',
            day === today ? styles.today : '',
            day === selected ? styles.selected : '',
            info.weekday === 0 ? styles.sunday : '',
          ].join(' ')
          return (
            <button
              key={day}
              type="button"
              className={classes}
              onClick={() => onSelect(day)}
              aria-label={formatAccessibleDate(day)}
              aria-current={day === today ? 'date' : undefined}
              aria-pressed={day === selected}
            >
              <span className={styles.solar}>{info.solar.day}</span>
              <span className={styles.lunar}>
                {info.lunar.day === 1 ? `${info.lunar.day}/${info.lunar.month}` : info.lunar.day}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
