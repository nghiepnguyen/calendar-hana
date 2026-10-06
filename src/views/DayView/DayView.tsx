import { EventRows } from '../../components/EventList/EventRows'
import type { CalendarViewProps } from '../viewProps'
import { AlmanacPanel } from './AlmanacPanel'
import { DayCard } from './DayCard'
import { PersonalFengShuiPanel } from './PersonalFengShuiPanel'
import styles from './DayView.module.css'

export function DayView({
  date,
  today,
  occurrences,
  settings,
  colorOf,
  getCategory,
  onOpenEvent,
  onCreate,
}: CalendarViewProps) {
  return (
    <div className={styles.view}>
      <DayCard
        date={date}
        isToday={date === today}
        showHolidays={settings.showHolidays}
        showAuspicious={settings.showAuspicious}
      />
      <section className={`glass ${styles.events}`} aria-label="Sự kiện trong ngày">
        {occurrences.length === 0 ? (
          <div className={styles.empty}>
            <p>Chưa có sự kiện nào trong ngày.</p>
            <button type="button" className="btn" onClick={() => onCreate(date)}>
              + Tạo sự kiện
            </button>
          </div>
        ) : (
          <EventRows
            occurrences={occurrences}
            colorOf={colorOf}
            getCategory={getCategory}
            onOpen={onOpenEvent}
          />
        )}
      </section>
      {settings.showPersonalFengShui !== false ? (
        <PersonalFengShuiPanel date={date} settings={settings} occurrences={occurrences} />
      ) : null}
      {settings.showAuspicious ? <AlmanacPanel date={date} isToday={date === today} /> : null}
    </div>
  )
}
