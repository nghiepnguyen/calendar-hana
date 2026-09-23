import { TimeGrid } from '../../components/TimeGrid/TimeGrid'
import type { CalendarViewProps } from '../viewProps'
import { DayCard } from './DayCard'
import styles from './DayView.module.css'

export function DayView({
  date,
  today,
  occurrences,
  settings,
  colorOf,
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
      {occurrences.length === 0 ? (
        <p className={styles.empty}>
          Chưa có sự kiện nào trong ngày. Bấm vào khung giờ hoặc nút + để tạo.
        </p>
      ) : null}
      <TimeGrid
        days={[date]}
        occurrences={occurrences}
        colorOf={colorOf}
        onOpenEvent={onOpenEvent}
        onCreate={onCreate}
      />
    </div>
  )
}
