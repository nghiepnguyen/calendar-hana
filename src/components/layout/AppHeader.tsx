import { useRef, useState, type CSSProperties } from 'react'
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  GearSix,
  List,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { formatMonthTitleParts, formatSolar } from '@shared/format'
import { parseSolarDate } from '@shared/lunar'
import type { SolarDateString } from '@shared/types'
import { VIEW_LABELS, VIEW_MODES, weekDays, type ViewMode } from '../../calendar/range'
import { useUiStore } from '../../store/uiStore'
import { useAuth } from '../../auth/authContext'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { DatePicker } from '../DatePicker/DatePicker'
import { SyncStatus } from './SyncStatus'
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
    const { solar, lunar } = formatMonthTitleParts(month, year)
    return { main: solar, sub: lunar }
  }
  const days = weekDays(date, weekStartsOn)
  const first = parseSolarDate(days[0])
  const last = parseSolarDate(days[6])
  if (first.year !== last.year) {
    return {
      main: `${first.day}/${first.month}/${first.year} - ${last.day}/${last.month}/${last.year}`,
    }
  }
  if (first.month !== last.month) {
    return { main: `${first.day}/${first.month} - ${last.day}/${last.month}/${last.year}` }
  }
  return { main: `${first.day}-${last.day}/${last.month}/${last.year}` }
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
  const titleRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const title = viewTitle(view, date, weekStartsOn)
  const { available: authAvailable, user } = useAuth()
  const compact = useIsCompact()

  const viewIndex = VIEW_MODES.indexOf(view)

  const todayButton = (
    <button
      type="button"
      className={`btn ${compact ? styles.today : ''}`}
      onClick={onToday}
      title="Hôm nay (T)"
    >
      Hôm nay
    </button>
  )
  const arrows = (
    <div className={styles.arrows}>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={onPrev}
        aria-label={PREV_LABEL[view]}
        title={`${PREV_LABEL[view]} (←)`}
      >
        <CaretLeft size={18} weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={onNext}
        aria-label={NEXT_LABEL[view]}
        title={`${NEXT_LABEL[view]} (→)`}
      >
        <CaretRight size={18} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
  const titlePicker = (
    <div className={styles.titleWrap}>
      <button
        ref={titleRef}
        type="button"
        className={styles.title}
        onClick={() => setPickerOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        title="Chọn ngày"
      >
        <h1>
          <span className={styles.titleMain}>{title.main}</span>
          {title.sub ? <span className={styles.titleSub}>{title.sub}</span> : null}
        </h1>
        <CaretDown size={14} weight="bold" className={styles.caret} aria-hidden="true" />
      </button>
      {pickerOpen ? (
        <DatePicker
          value={date}
          anchorRef={titleRef}
          boundsRef={headerRef}
          onClose={() => setPickerOpen(false)}
          onSelect={(next) => {
            setPickerOpen(false)
            onDateChange(next)
          }}
        />
      ) : null}
    </div>
  )

  // Điện thoại: chế độ xem, tìm kiếm, menu nằm ở thanh tab dưới đáy (TabBar).
  if (compact) {
    return (
      <header ref={headerRef} className={`glass ${styles.header} ${styles.compact}`}>
        {titlePicker}
        <SyncStatus />
        <div className={styles.compactNav}>
          {todayButton}
          {arrows}
        </div>
      </header>
    )
  }

  return (
    <header ref={headerRef} className={`glass ${styles.header}`}>
      <button
        type="button"
        className={`btn btn-ghost btn-icon ${styles.menu}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Mở menu"
      >
        <List size={20} weight="bold" aria-hidden="true" />
      </button>

      <Link to="/" className={styles.brand} aria-label="Lịch Việt, về hôm nay">
        <img src="/logo.png" alt="" width="32" height="32" />
        <span>Lịch Việt</span>
      </Link>

      <div className={styles.nav}>
        {todayButton}
        {arrows}
        {titlePicker}
      </div>

      <div className={styles.right}>
        <SyncStatus />
        <div
          className={`segmented ${styles.views}`}
          role="radiogroup"
          aria-label="Chế độ xem"
          style={{ '--active': viewIndex, '--count': VIEW_MODES.length } as CSSProperties}
        >
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={view === mode}
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
          <MagnifyingGlass size={19} weight="bold" aria-hidden="true" />
        </button>
        <Link
          to="/settings"
          className="btn btn-ghost btn-icon"
          aria-label="Cài đặt"
          title="Cài đặt"
        >
          <GearSix size={19} weight="bold" aria-hidden="true" />
        </Link>
        {user ? (
          <Link
            to="/settings#account"
            className={styles.avatarLink}
            aria-label={`Tài khoản ${user.email ?? ''}`}
            title={user.email ?? 'Tài khoản'}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" width={30} height={30} referrerPolicy="no-referrer" />
            ) : (
              <span aria-hidden="true">
                {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        ) : authAvailable ? (
          <Link to="/settings#account" className={`btn ${styles.signIn}`}>
            Đăng nhập
          </Link>
        ) : null}
      </div>
    </header>
  )
}
