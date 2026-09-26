import styles from './SettingsPage.module.css'

/** Một dòng cài đặt có công tắc bật/tắt luôn nằm bên phải, cùng hàng với chữ. */
export function Toggle({
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
    <label className={`${styles.toggleRow} ${styles.switchRow}`}>
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
