import { Moon, Sun } from '@phosphor-icons/react'
import type { DayHour } from '@shared/lunar'
import { useNow } from '../../hooks/useNow'
import styles from './AlmanacPanel.module.css'
import { hourIndexAt } from './hourIndex'

interface HourGridProps {
  hours: DayHour[]
  isToday: boolean
}

/** Lưới 12 giờ trong ngày: giờ tốt màu xanh lá, giờ xấu màu xám, đánh dấu giờ hiện tại. */
export function HourGrid({ hours, isToday }: HourGridProps) {
  const { minutes } = useNow()
  const current = isToday ? hourIndexAt(minutes) : -1

  return (
    <>
      <ul className={styles.hourGrid}>
        {hours.map((h) => {
          const isNow = h.chi === current
          const label = [
            `Giờ ${h.name}, ${h.startHour} giờ đến ${h.endHour} giờ`,
            h.canChi.name,
            h.god,
            h.isGood ? 'giờ tốt' : 'giờ xấu',
            isNow ? 'bây giờ' : null,
          ]
            .filter(Boolean)
            .join(', ')
          const HourIcon = h.isGood ? Sun : Moon
          return (
            <li
              key={h.chi}
              className={`${styles.hour} ${h.isGood ? styles.hourGood : styles.hourBad} ${
                isNow ? styles.hourNow : ''
              }`}
              aria-label={label}
              aria-current={isNow ? 'time' : undefined}
            >
              <span className={styles.hourTop} aria-hidden="true">
                <span className={styles.hourName}>{h.name}</span>
                <HourIcon
                  size={15}
                  weight={h.isGood ? 'duotone' : 'light'}
                  className={styles.hourIcon}
                />
              </span>
              <span className={styles.hourRange} aria-hidden="true">
                {h.startHour}h–{h.endHour}h
              </span>
              <span className={styles.hourSub} aria-hidden="true">
                {h.canChi.name}
              </span>
              <span className={styles.hourSub} aria-hidden="true">
                {h.god}
              </span>
              {isNow ? (
                <span className={styles.nowBadge} aria-hidden="true">
                  Bây giờ
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
      <p className={styles.hourLegend} aria-hidden="true">
        <span>
          <Sun size={13} weight="duotone" className={styles.legendGood} /> Giờ hoàng đạo (tốt)
        </span>
        <span>
          <Moon size={13} weight="light" /> Giờ hắc đạo
        </span>
      </p>
    </>
  )
}
