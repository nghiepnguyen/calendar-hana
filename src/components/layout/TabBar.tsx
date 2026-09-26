import { useRef, useState, type CSSProperties } from 'react'
import { CalendarDot, List, ListBullets, Plus, SquaresFour, type Icon } from '@phosphor-icons/react'
import { useAuth, type AuthUser } from '../../auth/authContext'
import { useElementWidth } from '../../hooks/useElementWidth'
import { useSettings } from '../../hooks/useRepositoryData'
import { useUiStore } from '../../store/uiStore'
import { iconSize, TEXT_SIZE_SCALE } from '../../styles/textSize'
import styles from './TabBar.module.css'

/** Các tab trên điện thoại. Xem Tuần quá chật trên màn hình nhỏ nên không có tab riêng. */
export type Tab = 'day' | 'month' | 'events'

const TABS: { tab: Tab; label: string; icon: Icon }[] = [
  { tab: 'day', label: 'Ngày', icon: CalendarDot },
  { tab: 'month', label: 'Tháng', icon: SquaresFour },
  { tab: 'events', label: 'Sự kiện', icon: ListBullets },
]

/** Mỗi tab hẹp hơn (px ở tỉ lệ 1) thì nhãn dài nhất ("Sự kiện") không còn vừa. */
const LABEL_MIN_WIDTH = 50

interface TabBarProps {
  /** Tab đang mở; null khi đang ở màn không có tab (vd. xem Tuần mở từ URL). */
  active: Tab | null
  onSelect: (tab: Tab) => void
  onCreate: () => void
}

/** Thanh tab nổi dưới đáy màn hình điện thoại, kiểu kính của iOS: Ngày, Tháng, Sự kiện, Menu. */
export function TabBar({ active, onSelect, onCreate }: TabBarProps) {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const { user } = useAuth()
  const activeIndex = TABS.findIndex((t) => t.tab === active)
  const count = TABS.length + 1

  // Chữ to trên màn hẹp: bỏ nhãn, chỉ còn icon (tên tab chuyển sang aria-label). Quyết định theo
  // chiều rộng cả thanh, không theo nhãn, để ẩn nhãn không làm kết quả đo đổi theo.
  const tabsRef = useRef<HTMLDivElement>(null)
  const scale = TEXT_SIZE_SCALE[useSettings()?.textSize ?? 'default']
  const width = useElementWidth(tabsRef)
  const iconOnly = width > 0 && (width - 8 * scale) / count < LABEL_MIN_WIDTH * scale

  return (
    <nav className={styles.bar} aria-label="Điều hướng">
      <div
        ref={tabsRef}
        className={`${styles.tabs} ${iconOnly ? styles.iconOnly : ''}`}
        data-active={activeIndex >= 0 ? '' : undefined}
        // Viên sáng chia đều cho các tab và nút Menu.
        style={{ '--active': activeIndex, '--count': count } as CSSProperties}
      >
        {TABS.map(({ tab, label, icon: TabIcon }) => {
          const current = tab === active
          return (
            <button
              key={tab}
              type="button"
              className={styles.tab}
              aria-current={current ? 'page' : undefined}
              aria-label={iconOnly ? label : undefined}
              onClick={() => onSelect(tab)}
            >
              <TabIcon
                size={iconSize(24)}
                weight={current ? 'fill' : 'regular'}
                aria-hidden="true"
              />
              {iconOnly ? null : <span>{label}</span>}
            </button>
          )
        })}
        <button
          type="button"
          className={styles.tab}
          onClick={() => setSidebarOpen(true)}
          aria-label="Mở menu"
        >
          {user ? <Avatar user={user} /> : <List size={iconSize(24)} aria-hidden="true" />}
          {iconOnly ? null : <span>Menu</span>}
        </button>
      </div>
      <button type="button" className={styles.create} onClick={onCreate} aria-label="Tạo sự kiện">
        <Plus size={iconSize(26)} weight="bold" aria-hidden="true" />
      </button>
    </nav>
  )
}

/** Đã đăng nhập: avatar Google thay cho icon Menu. Không có ảnh hoặc ảnh lỗi thì hiện chữ cái đầu. */
function Avatar({ user }: { user: AuthUser }) {
  const [broken, setBroken] = useState(false)
  const initial = (user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()
  return (
    <span className={styles.avatar} aria-hidden="true">
      {user.photoURL && !broken ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        initial
      )}
    </span>
  )
}
