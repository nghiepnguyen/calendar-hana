import { Plus } from '@phosphor-icons/react'
import styles from './CreateFab.module.css'

/** Nút tạo sự kiện nổi ở góc phải dưới (máy tính; điện thoại dùng nút trên thanh tab). */
export function CreateFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.fab}
      onClick={onClick}
      aria-label="Tạo sự kiện"
      title="Tạo sự kiện (N)"
    >
      <Plus size={26} weight="bold" aria-hidden="true" />
    </button>
  )
}
