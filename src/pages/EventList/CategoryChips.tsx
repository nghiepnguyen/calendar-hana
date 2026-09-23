import type { CSSProperties } from 'react'
import type { Category } from '@shared/types'
import styles from './EventListPage.module.css'

interface CategoryChipsProps {
  categories: readonly Category[]
  hiddenIds: ReadonlySet<string>
  onToggle: (id: string) => void
}

/** Lọc danh mục chỉ cho trang Danh sách (không lưu vào cài đặt). */
export function CategoryChips({ categories, hiddenIds, onToggle }: CategoryChipsProps) {
  return (
    <div className={styles.chips} role="group" aria-label="Lọc theo danh mục">
      {categories.map((category) => {
        const on = !hiddenIds.has(category.id)
        return (
          <button
            key={category.id}
            type="button"
            className={styles.chip}
            aria-pressed={on}
            onClick={() => onToggle(category.id)}
            style={{ '--swatch': category.color } as CSSProperties}
          >
            <span className={styles.chipDot} aria-hidden="true" />
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
