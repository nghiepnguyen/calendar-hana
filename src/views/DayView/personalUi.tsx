import { useId, useState, type ReactNode } from 'react'
import { CaretDown, Info } from '@phosphor-icons/react'
import { iconSize } from '../../styles/textSize'
import styles from './PersonalFengShuiPanel.module.css'

/** Nút tròn nhỏ mở hộp giải thích "vì sao ra kết quả này". */
export function InfoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.infoButton}
      aria-label={`Giải thích ${label}`}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <Info size={iconSize(15)} weight="bold" aria-hidden="true" />
    </button>
  )
}

/**
 * Khối chỉ thu gọn khi panel hẹp (container query): lộ dòng tóm tắt và nút mở.
 * Trên màn rộng luôn mở và ẩn nút. Nội dung vẫn nằm trong DOM khi thu gọn.
 */
export function Collapsible({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className={styles.collapse} data-open={open}>
      <button
        type="button"
        className={styles.collapseToggle}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.collapseSummary}>{summary}</span>
        <span className={styles.collapseAction}>
          {open ? 'Thu gọn' : 'Xem chi tiết'}
          <CaretDown size={iconSize(14)} weight="bold" aria-hidden="true" />
        </span>
      </button>
      <div id={id} className={styles.collapseBody}>
        {children}
      </div>
    </div>
  )
}
