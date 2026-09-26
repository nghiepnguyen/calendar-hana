import { Coins, Heart } from '@phosphor-icons/react'
import { iconSize } from '../../styles/textSize'
import styles from './AlmanacPanel.module.css'

/** Góc (độ, 0 = Bắc, theo chiều kim đồng hồ) của 8 hướng. */
const ANGLES: Record<string, number> = {
  Bắc: 0,
  'Đông Bắc': 45,
  Đông: 90,
  'Đông Nam': 135,
  Nam: 180,
  'Tây Nam': 225,
  Tây: 270,
  'Tây Bắc': 315,
}

const SIZE = 132
const C = SIZE / 2

/** Vị trí ghim theo tỉ lệ cỡ chữ, khớp với khung la bàn (calc(132px * var(--ui-scale))). */
const scaled = (px: number) => `calc(${px}px * var(--ui-scale))`

function point(direction: string, radius: number) {
  const a = ((ANGLES[direction] ?? 0) * Math.PI) / 180
  return { x: C + radius * Math.sin(a), y: C - radius * Math.cos(a) }
}

interface CompassProps {
  hyThan: string
  taiThan: string
}

/** La bàn nhỏ đánh dấu hướng Hỷ Thần và Tài Thần (Bắc ở trên). */
export function Compass({ hyThan, taiThan }: CompassProps) {
  const same = hyThan === taiThan
  // Hai thần cùng hướng thì đặt lệch bán kính để không chồng lên nhau.
  const hy = point(hyThan, same ? 20 : 32)
  const tai = point(taiThan, 32)

  return (
    <div className={styles.compass} aria-hidden="true">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.compassDial}>
        <circle cx={C} cy={C} r={C - 2} className={styles.compassRing} />
        <circle cx={C} cy={C} r={C - 28} className={styles.compassInner} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * 22.5 * Math.PI) / 180
          const major = i % 4 === 0
          const r1 = C - 4
          const r2 = C - (major ? 12 : 8)
          return (
            <line
              key={i}
              x1={C + r1 * Math.sin(a)}
              y1={C - r1 * Math.cos(a)}
              x2={C + r2 * Math.sin(a)}
              y2={C - r2 * Math.cos(a)}
              className={major ? styles.tickMajor : styles.tick}
            />
          )
        })}
        {(['B', 'Đ', 'N', 'T'] as const).map((label, i) => {
          const a = (i * 90 * Math.PI) / 180
          return (
            <text
              key={label}
              x={C + (C - 19) * Math.sin(a)}
              y={C - (C - 19) * Math.cos(a)}
              className={styles.compassLabel}
              dominantBaseline="central"
              textAnchor="middle"
            >
              {label}
            </text>
          )
        })}
        <line x1={C} y1={C} x2={hy.x} y2={hy.y} className={styles.needleHy} />
        <line x1={C} y1={C} x2={tai.x} y2={tai.y} className={styles.needleTai} />
        <circle cx={C} cy={C} r={3.5} className={styles.compassHub} />
      </svg>
      <span
        className={`${styles.compassPin} ${styles.pinHy}`}
        style={{ left: scaled(hy.x), top: scaled(hy.y) }}
      >
        <Heart size={iconSize(13)} weight="fill" />
      </span>
      <span
        className={`${styles.compassPin} ${styles.pinTai}`}
        style={{ left: scaled(tai.x), top: scaled(tai.y) }}
      >
        <Coins size={iconSize(13)} weight="fill" />
      </span>
    </div>
  )
}
