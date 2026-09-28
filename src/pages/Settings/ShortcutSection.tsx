import styles from './SettingsPage.module.css'

interface Shortcut {
  keys: string[]
  label: string
}

// Giữ khớp với useKeyboardShortcuts ở CalendarPage và EventListPage.
const GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Lịch',
    shortcuts: [
      { keys: ['T'], label: 'Về hôm nay' },
      { keys: ['←', '→'], label: 'Ngày, tuần hoặc tháng trước / sau' },
      { keys: ['D'], label: 'Xem Ngày' },
      { keys: ['W'], label: 'Xem Tuần' },
      { keys: ['M'], label: 'Xem Tháng' },
      { keys: ['/'], label: 'Tìm kiếm sự kiện' },
    ],
  },
  {
    title: 'Lịch và Danh sách sự kiện',
    shortcuts: [
      { keys: ['N'], label: 'Tạo sự kiện' },
      { keys: ['?'], label: 'Mở hướng dẫn phím tắt này' },
    ],
  },
  {
    title: 'Hộp thoại',
    shortcuts: [
      { keys: ['Esc'], label: 'Đóng hộp thoại, bảng tìm kiếm hoặc menu' },
      { keys: ['Tab'], label: 'Chuyển giữa các ô và nút' },
    ],
  },
]

/** Hướng dẫn phím tắt cho máy tính có bàn phím. */
export function ShortcutSection() {
  return (
    <div className={styles.shortcuts}>
      <p className="field-hint">
        Trên máy tính, có thể dùng bàn phím để điều khiển nhanh. Phím tắt không có tác dụng khi đang
        gõ trong ô nhập.
      </p>
      <p className="field-hint">
        Vuốt ngang trên lịch (hoặc vuốt 2 ngón trên trackpad) để sang ngày, tuần hoặc tháng trước
        hoặc sau.
      </p>
      {GROUPS.map((group) => (
        <div key={group.title} className={styles.shortcutGroup}>
          <h3>{group.title}</h3>
          <ul>
            {group.shortcuts.map((shortcut) => (
              <li key={shortcut.label}>
                <span>{shortcut.label}</span>
                <span className={styles.keys}>
                  {shortcut.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
