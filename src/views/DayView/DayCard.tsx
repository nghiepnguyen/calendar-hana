import { WEEKDAY_NAMES } from '@shared/format'
import { getDayInfo } from '@shared/lunar'
import type { SolarDateString } from '@shared/types'
import styles from './DayCard.module.css'

interface DayCardProps {
  date: SolarDateString
  isToday: boolean
  showHolidays: boolean
  showAuspicious: boolean
}

/** Thẻ ngày kiểu lịch bloc: ngày dương to, ngày âm, Can Chi, hoàng đạo, giờ tốt. */
export function DayCard({ date, isToday, showHolidays, showAuspicious }: DayCardProps) {
  const info = getDayInfo(date)
  const { solar, lunar, canChi, dayGod } = info
  const isSunday = info.weekday === 0
  const holidays = showHolidays ? info.holidays : []
  const isRed = isSunday || holidays.some((h) => h.isPublicHoliday)

  return (
    <section className={styles.card} aria-label="Thông tin ngày">
      <div className={styles.solar}>
        <div className={styles.monthLine}>
          Tháng {solar.month} năm {solar.year}
          {isToday ? <span className={styles.todayBadge}>Hôm nay</span> : null}
        </div>
        <div className={`${styles.bigDay} ${isRed ? styles.red : ''}`}>{solar.day}</div>
        <div className={`${styles.weekday} ${isRed ? styles.red : ''}`}>
          {WEEKDAY_NAMES[info.weekday]}
        </div>
      </div>

      <div className={styles.lunar}>
        <div className={styles.lunarMain}>
          <span className={styles.lunarDay}>{lunar.day}</span>
          <span className={styles.lunarMeta}>
            <span>
              Tháng {lunar.month}
              {lunar.isLeap ? ' nhuận' : ''} âm lịch
            </span>
            <span className={styles.muted}>Năm {canChi.year.name}</span>
          </span>
        </div>
        <dl className={styles.canChi}>
          <div>
            <dt>Ngày</dt>
            <dd>{canChi.day.name}</dd>
          </div>
          <div>
            <dt>Tháng</dt>
            <dd>{canChi.month.name}</dd>
          </div>
          <div>
            <dt>Năm</dt>
            <dd>{canChi.year.name}</dd>
          </div>
        </dl>

        {holidays.length > 0 || info.solarTerm.startsToday ? (
          <ul className={styles.tags}>
            {holidays.map((h) => (
              <li key={h.name} className={`${styles.tag} ${styles.holiday}`}>
                {h.name}
              </li>
            ))}
            {info.solarTerm.startsToday ? (
              <li className={styles.tag}>Tiết {info.solarTerm.name}</li>
            ) : null}
          </ul>
        ) : null}

        {showAuspicious ? (
          <div className={styles.auspicious}>
            <p className={styles.dayGod}>
              <span className={dayGod.isHoangDao ? styles.good : styles.bad}>
                {dayGod.isHoangDao ? 'Ngày hoàng đạo' : 'Ngày hắc đạo'}
              </span>{' '}
              <span className={styles.muted}>({dayGod.name})</span>
              {info.badDays.map((d) => (
                <span key={d.name} className={styles.badDay} title={d.description}>
                  · Ngày {d.name}
                </span>
              ))}
            </p>
            <p className={styles.hoursTitle}>Giờ hoàng đạo</p>
            <ul className={styles.hours}>
              {info.auspiciousHours.map((h) => (
                <li key={h.chi}>
                  <strong>{h.name}</strong>{' '}
                  <span className={styles.muted}>
                    {h.startHour}h–{h.endHour}h
                  </span>
                </li>
              ))}
            </ul>
            {!info.solarTerm.startsToday ? (
              <p className={styles.muted}>Tiết khí: {info.solarTerm.name}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
