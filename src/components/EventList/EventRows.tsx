import type { Occurrence } from '@shared/recurrence/recurrence'
import type { Category } from '@shared/types'
import { EventRow } from './EventRow'
import { selectionKey } from './listFormat'
import styles from './EventList.module.css'

interface EventRowsProps {
  occurrences: readonly Occurrence[]
  colorOf: (categoryId: string) => string
  getCategory: (id: string) => Category | undefined
  selecting?: boolean
  selectedKeys?: ReadonlySet<string>
  onOpen: (occurrence: Occurrence) => void
  onToggle?: (occurrence: Occurrence) => void
}

/** Các dòng sự kiện của một ngày, ngăn bằng đường kẻ mảnh. */
export function EventRows({
  occurrences,
  colorOf,
  getCategory,
  selecting = false,
  selectedKeys,
  onOpen,
  onToggle,
}: EventRowsProps) {
  return (
    <ul className={styles.rows}>
      {occurrences.map((occurrence) => {
        const key = selectionKey(occurrence)
        return (
          <li key={key}>
            <EventRow
              occurrence={occurrence}
              color={colorOf(occurrence.event.categoryId)}
              categoryName={getCategory(occurrence.event.categoryId)?.name}
              selecting={selecting}
              selected={selectedKeys?.has(key) ?? false}
              onOpen={onOpen}
              onToggle={onToggle}
            />
          </li>
        )
      })}
    </ul>
  )
}
