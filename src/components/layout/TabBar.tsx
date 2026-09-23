import type { CSSProperties } from 'react'
import { CalendarDot, Columns, List, Plus, SquaresFour, type Icon } from '@phosphor-icons/react'
import { VIEW_LABELS, VIEW_MODES, type ViewMode } from '../../calendar/range'
import { useUiStore } from '../../store/uiStore'
import styles from './TabBar.module.css'

const VIEW_ICONS: Record<ViewMode, Icon> = {
  day: CalendarDot,
  week: Columns,
  month: SquaresFour,
}

interface TabBarProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  onCreate: () => void
}

/** Thanh tab nổi dưới đáy màn hình điện thoại, kiểu kính của iOS. */
export function TabBar({ view, onViewChange, onCreate }: TabBarProps) {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const viewIndex = VIEW_MODES.indexOf(view)

  return (
    <nav className={styles.bar} aria-label="Điều hướng">
      <div className={styles.tabs}>
        <div
          className={styles.views}
          role="radiogroup"
          aria-label="Chế độ xem"
          style={{ '--active': viewIndex, '--count': VIEW_MODES.length } as CSSProperties}
        >
          {VIEW_MODES.map((mode) => {
            const ViewIcon = VIEW_ICONS[mode]
            const active = view === mode
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                className={styles.tab}
                onClick={() => onViewChange(mode)}
              >
                <ViewIcon size={24} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                <span>{VIEW_LABELS[mode]}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className={styles.tab}
          onClick={() => setSidebarOpen(true)}
          aria-label="Mở menu"
        >
          <List size={24} aria-hidden="true" />
          <span>Menu</span>
        </button>
      </div>
      <button type="button" className={styles.create} onClick={onCreate} aria-label="Tạo sự kiện">
        <Plus size={26} weight="bold" aria-hidden="true" />
      </button>
    </nav>
  )
}
