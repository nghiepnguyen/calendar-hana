import styles from './EventListPage.module.css'

interface SelectionBarProps {
  count: number
  deleting: boolean
  onSelectAll: () => void
  onDelete: () => void
}

/** Thanh công cụ nổi ở đáy khi đang chọn nhiều. */
export function SelectionBar({ count, deleting, onSelectAll, onDelete }: SelectionBarProps) {
  return (
    <div className={`glass ${styles.selectionBar}`} role="toolbar" aria-label="Thao tác đã chọn">
      <button type="button" className="btn btn-ghost" onClick={onSelectAll}>
        Chọn tất cả
      </button>
      <span className={styles.selectionCount} aria-live="polite">
        Đã chọn {count}
      </span>
      <button
        type="button"
        className="btn btn-danger"
        onClick={onDelete}
        disabled={count === 0 || deleting}
      >
        {deleting ? 'Đang xoá…' : 'Xoá'}
      </button>
    </div>
  )
}
