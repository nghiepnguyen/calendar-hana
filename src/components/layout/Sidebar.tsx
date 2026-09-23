import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Settings, SolarDateString } from '@shared/types'
import { useRepository } from '../../data/repositoryContext'
import { useCategoryMap } from '../../hooks/useCategoryMap'
import { useUiStore } from '../../store/uiStore'
import { MiniMonth } from '../MiniMonth/MiniMonth'
import styles from './Sidebar.module.css'

interface SidebarProps {
  date: SolarDateString
  today: SolarDateString
  settings: Settings
  onSelectDate: (date: SolarDateString) => void
}

export function Sidebar({ date, today, settings, onSelectDate }: SidebarProps) {
  const repository = useRepository()
  const { categories } = useCategoryMap()
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const openCreate = useUiStore((s) => s.openCreate)
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
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-label="Menu lịch">
        <button
          type="button"
          className={`btn btn-primary ${styles.create}`}
          onClick={() => {
            setOpen(false)
            openCreate({ date })
          }}
        >
          <span aria-hidden="true">+</span> Tạo sự kiện
        </button>

        <MiniMonth
          selected={date}
          today={today}
          weekStartsOn={settings.weekStartsOn}
          onSelect={(d) => {
            setOpen(false)
            onSelectDate(d)
          }}
        />

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Danh mục</h2>
            <Link to="/settings#categories" className={styles.manage}>
              Quản lý
            </Link>
          </div>
          <ul className={styles.categories}>
            {categories.map((category) => (
              <li key={category.id}>
                <label className={styles.category}>
                  <input
                    type="checkbox"
                    checked={!hidden.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    style={{ accentColor: category.color }}
                  />
                  <span className={styles.swatch} style={{ background: category.color }} />
                  <span>{category.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}
