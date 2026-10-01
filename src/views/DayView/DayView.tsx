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
          <p className={styles.empty}>Chưa có sự kiện nào trong ngày. Bấm nút + để tạo.</p>
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
        <PersonalFengShuiPanel date={date} settings={settings} />
      ) : null}
      {settings.showAuspicious ? <AlmanacPanel date={date} isToday={date === today} /> : null}
    </div>
  )
}
