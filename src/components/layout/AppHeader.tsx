import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMonthTitle, formatSolar } from '@shared/format'
import { parseSolarDate } from '@shared/lunar'
import type { SolarDateString } from '@shared/types'
import { VIEW_LABELS, VIEW_MODES, weekDays, type ViewMode } from '../../calendar/range'
import { useUiStore } from '../../store/uiStore'
import { DatePicker } from '../DatePicker/DatePicker'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  view: ViewMode
  date: SolarDateString
  weekStartsOn: 0 | 1
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  onViewChange: (view: ViewMode) => void
  onDateChange: (date: SolarDateString) => void
}

/** Tiêu đề chính và phần phụ (phần âm lịch của xem Tháng). */
function viewTitle(
  view: ViewMode,
  date: SolarDateString,
  weekStartsOn: 0 | 1,
): { main: string; sub?: string } {
  if (view === 'day') return { main: formatSolar(date) }
  if (view === 'month') {
    const { month, year } = parseSolarDate(date)
    const [main, sub] = formatMonthTitle(month, year).split(' — ')
    return { main, sub }
  }
  const days = weekDays(date, weekStartsOn)
  const first = parseSolarDate(days[0])
  const last = parseSolarDate(days[6])
  if (first.year !== last.year) {
    return {
      main: `${first.day}/${first.month}/${first.year} – ${last.day}/${last.month}/${last.year}`,
    }
  }
  if (first.month !== last.month) {
    return { main: `${first.day}/${first.month} – ${last.day}/${last.month}/${last.year}` }
  }
  return { main: `${first.day}–${last.day}/${last.month}/${last.year}` }
}

const PREV_LABEL: Record<ViewMode, string> = {
  day: 'Ngày trước',
  week: 'Tuần trước',
  month: 'Tháng trước',
}
const NEXT_LABEL: Record<ViewMode, string> = {
  day: 'Ngày sau',
  week: 'Tuần sau',
  month: 'Tháng sau',
}

export function AppHeader({
  view,
  date,
  weekStartsOn,
  onToday,
  onPrev,
  onNext,
  onViewChange,
  onDateChange,
}: AppHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const title = viewTitle(view, date, weekStartsOn)

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={`btn btn-ghost btn-icon ${styles.menu}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      <Link to="/" className={styles.brand} aria-label="Lịch Hana, về hôm nay">
        <img src="/favicon.svg" alt="" width="26" height="26" />
        <span>Lịch Hana</span>
      </Link>

      <div className={styles.nav}>
        <button type="button" className="btn" onClick={onToday} title="Hôm nay (T)">
          Hôm nay
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={onPrev}
          aria-label={PREV_LABEL[view]}
          title={`${PREV_LABEL[view]} (←)`}
        >
          ‹
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={onNext}
          aria-label={NEXT_LABEL[view]}
          title={`${NEXT_LABEL[view]} (→)`}
        >
          ›
        </button>
        <div className={styles.titleWrap}>
          <button
            type="button"
            className={styles.title}
            onClick={() => setPickerOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            title="Chọn ngày"
          >
            <h1>
              {title.main}
              {title.sub ? (
                <span className={styles.titleSub}>
                  <span className={styles.titleSep}> — </span>
                  {title.sub}
                </span>
              ) : null}
            </h1>
            <span aria-hidden="true" className={styles.caret}>
              ▾
            </span>
          </button>
          {pickerOpen ? (
            <DatePicker
              value={date}
              onClose={() => setPickerOpen(false)}
              onSelect={(next) => {
                setPickerOpen(false)
                onDateChange(next)
              }}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.views} role="radiogroup" aria-label="Chế độ xem">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={view === mode}
              className={`${styles.viewButton} ${view === mode ? styles.viewActive : ''}`}
              onClick={() => onViewChange(mode)}
              title={`${VIEW_LABELS[mode]} (${mode === 'day' ? 'D' : mode === 'week' ? 'W' : 'M'})`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setSearchOpen(true)}
          aria-label="Tìm kiếm sự kiện"
          title="Tìm kiếm (/)"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <Link
          to="/settings"
          className="btn btn-ghost btn-icon"
          aria-label="Cài đặt"
          title="Cài đặt"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M10 1.8v2.4M10 15.8v2.4M1.8 10h2.4M15.8 10h2.4M4.2 4.2l1.7 1.7M14.1 14.1l1.7 1.7M4.2 15.8l1.7-1.7M14.1 5.9l1.7-1.7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  )
}
