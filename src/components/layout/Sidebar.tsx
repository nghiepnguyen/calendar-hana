import { useEffect, type CSSProperties } from 'react'
import {
  CaretRight,
  GearSix,
  ListBullets,
  MagnifyingGlass,
  UserCircle,
  X,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { Settings, SolarDateString } from '@shared/types'
import { useAuth } from '../../auth/authContext'
import { useRepository } from '../../data/repositoryContext'
import { useCategoryMap } from '../../hooks/useCategoryMap'
import { useUiStore } from '../../store/uiStore'
import { MiniMonth } from '../MiniMonth/MiniMonth'
import { iconSize } from '../../styles/textSize'
import styles from './Sidebar.module.css'

interface SidebarProps {
  date: SolarDateString
  today: SolarDateString
  settings: Settings
  /** Điện thoại: hiện dạng sheet từ đáy, kèm lối vào Cài đặt và tài khoản (thay cho header). */
  compact?: boolean
  onSelectDate: (date: SolarDateString) => void
}

export function Sidebar({ date, today, settings, compact, onSelectDate }: SidebarProps) {
  const repository = useRepository()
  const { categories } = useCategoryMap()
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const { available: authAvailable, user } = useAuth()
  const hidden = new Set(settings.hiddenCategoryIds)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const toggleCategory = (id: string) => {
    const next = hidden.has(id)
      ? settings.hiddenCategoryIds.filter((x) => x !== id)
      : [...settings.hiddenCategoryIds, id]
    void repository.saveSettings({ hiddenCategoryIds: next })
  }

  return (
    <>
      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}
      <aside
        className={`glass ${styles.sidebar} ${open ? styles.open : ''}`}
        aria-label="Menu lịch"
      >
        {compact ? (
          <>
            <div className={styles.sheetHead}>
              <h2>Menu</h2>
              <button
                type="button"
                className={`btn btn-icon ${styles.close}`}
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={iconSize(16)} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className={styles.search}
              onClick={() => {
                setOpen(false)
                setSearchOpen(true)
              }}
            >
              <MagnifyingGlass size={iconSize(18)} weight="bold" aria-hidden="true" />
              Tìm kiếm sự kiện
            </button>
          </>
        ) : (
          // Tạo sự kiện bằng nút + ở góc màn hình; điện thoại vào danh sách bằng tab Sự kiện.
          <Link to="/events" className={styles.listLink} onClick={() => setOpen(false)}>
            <ListBullets size={iconSize(20)} weight="bold" aria-hidden="true" />
            Danh sách sự kiện
          </Link>
        )}

        {/* Điện thoại chọn ngày qua bộ chọn trên header, dành chỗ trong menu cho chức năng khác. */}
        {compact ? null : (
          <MiniMonth
            selected={date}
            today={today}
            weekStartsOn={settings.weekStartsOn}
            onSelect={(d) => {
              setOpen(false)
              onSelectDate(d)
            }}
          />
        )}

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Danh mục</h2>
            <Link
              to="/settings#categories"
              className={styles.manage}
              onClick={() => setOpen(false)}
            >
              Quản lý
            </Link>
          </div>
          <ul className={styles.categories}>
            {categories.map((category) => (
              <li key={category.id}>
                <label className={styles.category}>
                  <input
                    type="checkbox"
                    className="check"
                    checked={!hidden.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    style={{ '--check-color': category.color } as CSSProperties}
                  />
                  <span>{category.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {compact ? (
          <ul className={styles.links}>
            {user || authAvailable ? (
              <li>
                <Link to="/settings#account" className={styles.link} onClick={() => setOpen(false)}>
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      width={28}
                      height={28}
                      referrerPolicy="no-referrer"
                      className={styles.avatar}
                    />
                  ) : (
                    <UserCircle
                      size={iconSize(28)}
                      aria-hidden="true"
                      className={styles.linkIcon}
                    />
                  )}
                  <span className={styles.linkText}>
                    {user ? (user.displayName ?? user.email ?? 'Tài khoản') : 'Đăng nhập'}
                    {user?.email && user.displayName ? (
                      <span className={styles.linkHint}>{user.email}</span>
                    ) : null}
                  </span>
                  <CaretRight
                    size={iconSize(16)}
                    weight="bold"
                    aria-hidden="true"
                    className={styles.chevron}
                  />
                </Link>
              </li>
            ) : null}
            <li>
              <Link to="/settings" className={styles.link} onClick={() => setOpen(false)}>
                <GearSix size={iconSize(28)} aria-hidden="true" className={styles.linkIcon} />
                <span className={styles.linkText}>Cài đặt</span>
                <CaretRight
                  size={iconSize(16)}
                  weight="bold"
                  aria-hidden="true"
                  className={styles.chevron}
                />
              </Link>
            </li>
          </ul>
        ) : null}
      </aside>
    </>
  )
}
