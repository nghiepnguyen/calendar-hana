import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import {
  Bell,
  CaretLeft,
  CloudArrowUp,
  DeviceMobile,
  Keyboard,
  SlidersHorizontal,
  Tag,
  UserCircle,
  type Icon,
} from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Settings, ThemePreference } from '@shared/types'
import { track } from '../../analytics'
import { useRepository } from '../../data/repositoryContext'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { useSettings } from '../../hooks/useRepositoryData'
import { AccountSection } from './AccountSection'
import { CategoryManager } from './CategoryManager'
import { DataSection } from './DataSection'
import { InstallSection } from './InstallSection'
import { NotificationSection } from './NotificationSection'
import { ShortcutSection } from './ShortcutSection'
import { TextSizeSection } from './TextSizeSection'
import { LegalLinks } from '../../components/LegalLinks/LegalLinks'
import { Toggle } from './Toggle'
import { iconSize } from '../../styles/textSize'
import styles from './SettingsPage.module.css'

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Theo hệ thống' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
]

function GeneralSection({ settings, save }: SectionProps) {
  return (
    <>
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
        label="Hiện ngày hoàng đạo và lịch vạn niên"
        hint="Ngày hoàng đạo / hắc đạo, ngày kỵ, sao tốt xấu, giờ tốt, hướng xuất hành"
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
      <TextSizeSection settings={settings} save={save} />
    </>
  )
}

function ReminderSection({ settings, save }: SectionProps) {
  return (
    <>
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
    </>
  )
}

export interface SectionProps {
  settings: Settings
  save: (patch: Partial<Omit<Settings, 'updatedAt'>>) => void
}

interface Tab {
  /** Cũng là #hash trên URL, ví dụ /settings#categories. */
  id: string
  /** Tên ngắn trên thanh tab. */
  label: string
  /** Tiêu đề trong nội dung. */
  title: string
  icon: Icon
  render: (props: SectionProps) => ReactNode
  /** Chỉ hiện trên máy tính. */
  desktopOnly?: boolean
  /** #hash của mục con trong tab, ví dụ #text-size: mở tab này rồi cuộn tới mục đó. */
  anchors?: string[]
}

// Hay dùng xếp trước. Id giữ nguyên để các link cũ (#notifications, #account…) vẫn đúng tab.
const TABS: Tab[] = [
  {
    id: 'general',
    label: 'Hiển thị',
    title: 'Hiển thị',
    icon: SlidersHorizontal,
    render: (props) => <GeneralSection {...props} />,
    // Cỡ chữ từng là tab riêng: link cũ /settings#text-size vẫn mở đúng chỗ.
    anchors: ['text-size'],
  },
  {
    id: 'notifications',
    label: 'Nhắc hẹn',
    title: 'Nhắc hẹn',
    icon: Bell,
    render: (props) => <ReminderSection {...props} />,
  },
  {
    id: 'categories',
    label: 'Danh mục',
    title: 'Danh mục',
    icon: Tag,
    render: () => <CategoryManager />,
  },
  {
    id: 'account',
    label: 'Tài khoản',
    title: 'Tài khoản',
    icon: UserCircle,
    render: () => <AccountSection />,
  },
  {
    id: 'data',
    label: 'Sao lưu',
    title: 'Sao lưu dữ liệu',
    icon: CloudArrowUp,
    render: () => <DataSection />,
  },
  {
    id: 'install',
    label: 'Cài app',
    title: 'Cài app',
    icon: DeviceMobile,
    render: () => <InstallSection />,
  },
  {
    id: 'shortcuts',
    label: 'Phím tắt',
    title: 'Phím tắt',
    icon: Keyboard,
    render: () => <ShortcutSection />,
    // Điện thoại không có bàn phím vật lý nên ẩn.
    desktopOnly: true,
  },
]

export function SettingsPage({ children }: { children?: ReactNode }) {
  const repository = useRepository()
  const settings = useSettings()
  const location = useLocation()
  const navigate = useNavigate()
  const compact = useIsCompact()
  const tabList = useRef<HTMLDivElement>(null)

  const tabs = compact ? TABS.filter((t) => !t.desktopOnly) : TABS
  const hash = location.hash.slice(1)
  const active = tabs.find((t) => t.id === hash || t.anchors?.includes(hash)) ?? tabs[0]
  const anchor = active.anchors?.includes(hash) ? hash : null
  const loaded = settings !== undefined

  // Trên điện thoại thanh tab cuộn ngang: giữ tab đang chọn trong tầm nhìn.
  useEffect(() => {
    tabList.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [active.id, settings])

  // Mở bằng #mục-con: cuộn tới mục đó khi nội dung đã hiện (cần settings tải xong).
  useEffect(() => {
    if (anchor && loaded) document.getElementById(anchor)?.scrollIntoView?.({ block: 'start' })
  }, [anchor, loaded])

  const select = (tab: Tab, focus = false) => {
    navigate({ hash: tab.id }, { replace: true })
    if (focus) document.getElementById(`settings-tab-${tab.id}`)?.focus()
    window.scrollTo?.({ top: 0 })
  }

  // Phím mũi tên chuyển tab (ngang trên điện thoại, dọc trên máy tính), Home/End về đầu/cuối.
  const onKeyDown = (e: KeyboardEvent) => {
    const index = tabs.indexOf(active)
    const next = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    select(tabs[(next + tabs.length) % tabs.length], true)
  }

  const save = (patch: Partial<Omit<Settings, 'updatedAt'>>) => {
    for (const [setting, value] of Object.entries(patch)) {
      if (['string', 'number', 'boolean'].includes(typeof value))
        track('change_setting', { setting, value: value as string | number | boolean })
    }
    void repository.saveSettings(patch)
  }

  return (
    <div className={styles.page}>
      <header className={`glass ${styles.header}`}>
        <Link to="/" className={`btn btn-ghost ${styles.back}`} aria-label="Quay lại lịch">
          <CaretLeft size={iconSize(18)} weight="bold" aria-hidden="true" />
          Lịch
        </Link>
        <h1>Cài đặt</h1>
      </header>

      {!settings ? (
        <p className={styles.loading}>Đang tải…</p>
      ) : (
        <div className={styles.layout}>
          <div
            ref={tabList}
            className={`glass ${styles.tabs}`}
            role="tablist"
            aria-label="Mục cài đặt"
            aria-orientation={compact ? 'horizontal' : 'vertical'}
            onKeyDown={onKeyDown}
          >
            {tabs.map((tab) => {
              const selected = tab === active
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  className={styles.tab}
                  aria-selected={selected}
                  aria-controls="settings-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab)}
                >
                  <TabIcon
                    size={iconSize(18)}
                    weight={selected ? 'fill' : 'regular'}
                    aria-hidden="true"
                  />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <main
            className={styles.main}
            id="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${active.id}`}
          >
            <section
              key={active.id}
              className={`glass ${styles.section}`}
              id={active.id}
              aria-labelledby={`settings-${active.id}`}
            >
              <h2 id={`settings-${active.id}`}>{active.title}</h2>
              {active.render({ settings, save })}
            </section>
            {children}
          </main>
        </div>
      )}
      <footer className={styles.footer}>
        <LegalLinks />
      </footer>
    </div>
  )
}
