import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import type { Settings, ThemePreference } from '@shared/types'
import { useRepository } from '../../data/repositoryContext'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { useSettings } from '../../hooks/useRepositoryData'
import { AccountSection } from './AccountSection'
import { CategoryManager } from './CategoryManager'
import { DataSection } from './DataSection'
import { NotificationSection } from './NotificationSection'
import { ShortcutSection } from './ShortcutSection'
import styles from './SettingsPage.module.css'

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Theo hệ thống' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
]

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={styles.toggleRow}>
      <span>
        <span className={styles.rowLabel}>{label}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

export function SettingsPage({ children }: { children?: ReactNode }) {
  const repository = useRepository()
  const settings = useSettings()
  const location = useLocation()
  const compact = useIsCompact()

  // Mở /settings#categories thì cuộn tới phần danh mục.
  useEffect(() => {
    if (!settings || !location.hash) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView?.()
  }, [settings, location.hash])

  const save = (patch: Partial<Omit<Settings, 'updatedAt'>>) => void repository.saveSettings(patch)

  return (
    <div className={styles.page}>
      <header className={`glass ${styles.header}`}>
        <Link to="/" className={`btn btn-ghost ${styles.back}`} aria-label="Quay lại lịch">
          <CaretLeft size={18} weight="bold" aria-hidden="true" />
          Lịch
        </Link>
        <h1>Cài đặt</h1>
      </header>

      {!settings ? (
        <p className={styles.loading}>Đang tải…</p>
      ) : (
        <main className={styles.main}>
          <section className={`glass ${styles.section}`} aria-labelledby="settings-general">
            <h2 id="settings-general">Hiển thị</h2>
            <label className={styles.toggleRow}>
              <span className={styles.rowLabel}>Tuần bắt đầu từ</span>
              <select
                className={`input ${styles.select}`}
                value={settings.weekStartsOn}
                onChange={(e) => save({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
              >
                <option value={1}>Thứ Hai</option>
                <option value={0}>Chủ nhật</option>
              </select>
            </label>
            <Toggle
              label="Hiện ngày lễ"
              hint="Tết, Giỗ Tổ, Trung Thu, Quốc khánh…"
              checked={settings.showHolidays}
              onChange={(showHolidays) => save({ showHolidays })}
            />
            <Toggle
              label="Hiện thông tin hoàng đạo"
              hint="Ngày hoàng đạo / hắc đạo, giờ tốt, ngày kỵ"
              checked={settings.showAuspicious}
              onChange={(showAuspicious) => save({ showAuspicious })}
            />
            <div className={styles.toggleRow}>
              <span className={styles.rowLabel} id="theme-label">
                Giao diện
              </span>
              <div
                className="segmented"
                role="radiogroup"
                aria-labelledby="theme-label"
                style={
                  {
                    '--active': THEMES.findIndex((t) => t.value === settings.theme),
                    '--count': THEMES.length,
                  } as CSSProperties
                }
              >
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === t.value}
                    onClick={() => save({ theme: t.value })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`glass ${styles.section}`}
            id="notifications"
            aria-labelledby="settings-reminders"
          >
            <h2 id="settings-reminders">Nhắc hẹn</h2>
            <NotificationSection />
            <label className={styles.toggleRow}>
              <span>
                <span className={styles.rowLabel}>Giờ nhắc cho sự kiện cả ngày</span>
                <span className="field-hint">Ví dụ: nhắc “Trước 1 ngày” sẽ gửi lúc giờ này.</span>
              </span>
              <input
                type="time"
                className={`input ${styles.select}`}
                value={settings.allDayReminderTime}
                onChange={(e) => e.target.value && save({ allDayReminderTime: e.target.value })}
              />
            </label>
          </section>

          <section
            className={`glass ${styles.section}`}
            id="categories"
            aria-labelledby="settings-categories"
          >
            <h2 id="settings-categories">Danh mục</h2>
            <CategoryManager />
          </section>

          {/* Điện thoại không có bàn phím vật lý nên ẩn. */}
          {compact ? null : (
            <section
              className={`glass ${styles.section}`}
              id="shortcuts"
              aria-labelledby="settings-shortcuts"
            >
              <h2 id="settings-shortcuts">Phím tắt</h2>
              <ShortcutSection />
            </section>
          )}

          <section
            className={`glass ${styles.section}`}
            id="account"
            aria-labelledby="settings-account"
          >
            <h2 id="settings-account">Tài khoản</h2>
            <AccountSection />
          </section>

          <section className={`glass ${styles.section}`} id="data" aria-labelledby="settings-data">
            <h2 id="settings-data">Sao lưu dữ liệu</h2>
            <DataSection />
          </section>

          {children}
        </main>
      )}
    </div>
  )
}
