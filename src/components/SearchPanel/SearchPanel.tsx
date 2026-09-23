import { useMemo, useState } from 'react'
import { formatLunar, formatSolar } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import type { SolarDateString } from '@shared/types'
import { useCategoryMap } from '../../hooks/useCategoryMap'
import { useEvents } from '../../hooks/useRepositoryData'
import { Modal } from '../Modal/Modal'
import { searchEvents } from './search'
import styles from './SearchPanel.module.css'

interface SearchPanelProps {
  today: SolarDateString
  onSelect: (date: SolarDateString) => void
  onClose: () => void
}

export function SearchPanel({ today, onSelect, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const events = useEvents()
  const { colorOf } = useCategoryMap()
  const results = useMemo(
    () => (events ? searchEvents(events, query, today) : []),
    [events, query, today],
  )

  return (
    <Modal title="Tìm kiếm sự kiện" onClose={onClose}>
      <div className={styles.panel}>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="Nhập tiêu đề hoặc ghi chú, ví dụ: giỗ"
          aria-label="Từ khóa tìm kiếm"
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.trim() ? (
          <p className="field-hint" aria-live="polite">
            {results.length === 0 ? 'Không tìm thấy sự kiện nào.' : `${results.length} kết quả`}
          </p>
        ) : null}
        <ul className={styles.results}>
          {results.map(({ event, date, isPast }) => (
            <li key={event.id}>
              <button type="button" className={styles.result} onClick={() => onSelect(date)}>
                <span
                  className={styles.swatch}
                  style={{ background: colorOf(event.categoryId) }}
                  aria-hidden="true"
                />
                <span className={styles.text}>
                  <span className={styles.title}>{event.title}</span>
                  <span className={styles.meta}>
                    {isPast ? 'Đã qua · ' : event.recurrence ? 'Lần tới · ' : ''}
                    {formatSolar(date)} · {formatLunar(getDayInfo(date).lunar)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
