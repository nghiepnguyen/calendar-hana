import { Sparkle, WarningCircle } from '@phosphor-icons/react'
import type { Star } from '@shared/lunar'
import { iconSize } from '../../styles/textSize'
import styles from './AlmanacPanel.module.css'

interface StarChipsProps {
  title: string
  /** Nhóm sao tốt (xanh lá) hay sao xấu (đỏ). */
  good: boolean
  stars: Star[]
  onOpen: (star: Star) => void
}

/** Một nhóm sao (tốt hoặc xấu): mỗi sao là một chip bấm để xem giải thích. */
export function StarChips({ title, good, stars, onOpen }: StarChipsProps) {
  const GroupIcon = good ? Sparkle : WarningCircle
  return (
    <div className={`${styles.starGroup} ${good ? styles.starGroupGood : styles.starGroupBad}`}>
      <h4 className={styles.starTitle}>
        <GroupIcon size={iconSize(15)} weight="duotone" aria-hidden="true" />
        {title} ({stars.length})
      </h4>
      {stars.length === 0 ? (
        <p className={styles.none}>Không có</p>
      ) : (
        <ul className={styles.chips}>
          {stars.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                className={`${styles.chip} ${s.isGood ? styles.chipGood : styles.chipBad}`}
                aria-haspopup="dialog"
                onClick={() => onOpen(s)}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
