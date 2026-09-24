import type { CSSProperties } from 'react'
import { CalendarDot, List, ListBullets, Plus, SquaresFour, type Icon } from '@phosphor-icons/react'
import { useUiStore } from '../../store/uiStore'
import styles from './TabBar.module.css'

/** Các tab trên điện thoại. Xem Tuần quá chật trên màn hình nhỏ nên không có tab riêng. */
export type Tab = 'day' | 'month' | 'events'

const TABS: { tab: Tab; label: string; icon: Icon }[] = [
  { tab: 'day', label: 'Ngày', icon: CalendarDot },
  { tab: 'month', label: 'Tháng', icon: SquaresFour },
  { tab: 'events', label: 'Sự kiện', icon: ListBullets },
]

interface TabBarProps {
  /** Tab đang mở; null khi đang ở màn không có tab (vd. xem Tuần mở từ URL). */
  active: Tab | null
  onSelect: (tab: Tab) => void
  onCreate: () => void
}

/** Thanh tab nổi dưới đáy màn hình điện thoại, kiểu kính của iOS: Ngày, Tháng, Sự kiện, Menu. */
export function TabBar({ active, onSelect, onCreate }: TabBarProps) {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const activeIndex = TABS.findIndex((t) => t.tab === active)

  return (
    <nav className={styles.bar} aria-label="Điều hướng">
      <div
        className={styles.tabs}
        data-active={activeIndex >= 0 ? '' : undefined}
        // Viên sáng chia đều cho các tab và nút Menu.
        style={{ '--active': activeIndex, '--count': TABS.length + 1 } as CSSProperties}
      >
        {TABS.map(({ tab, label, icon: TabIcon }) => {
          const current = tab === active
          return (
            <button
              key={tab}
              type="button"
              className={styles.tab}
              aria-current={current ? 'page' : undefined}
              onClick={() => onSelect(tab)}
            >
              <TabIcon size={24} weight={current ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
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
