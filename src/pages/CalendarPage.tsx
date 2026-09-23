import { useMemo } from 'react'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString, TimeString } from '@shared/types'
import { viewRange } from '../calendar/range'
import { AppHeader } from '../components/layout/AppHeader'
import { Sidebar } from '../components/layout/Sidebar'
import { createDefaultSettings } from '../data/defaultCategories'
import { useCalendarRoute } from '../hooks/useCalendarRoute'
import { useCategoryMap } from '../hooks/useCategoryMap'
import { useEventsInRange } from '../hooks/useEventsInRange'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNow } from '../hooks/useNow'
import { useSettings } from '../hooks/useRepositoryData'
import { useUiStore } from '../store/uiStore'
import { DayView } from '../views/DayView/DayView'
import { MonthView } from '../views/MonthView/MonthView'
import type { CalendarViewProps } from '../views/viewProps'
import { WeekView } from '../views/WeekView/WeekView'
import styles from './CalendarPage.module.css'

const FALLBACK_SETTINGS = createDefaultSettings('')

const VIEWS = { day: DayView, week: WeekView, month: MonthView }

export function CalendarPage() {
  const route = useCalendarRoute()
  const { view, date } = route
  const settings = useSettings() ?? FALLBACK_SETTINGS
  const { today } = useNow()
  const { colorOf } = useCategoryMap()
  const openDetail = useUiStore((s) => s.openDetail)
  const openCreate = useUiStore((s) => s.openCreate)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)

  const range = useMemo(
    () => viewRange(view, date, settings.weekStartsOn),
    [view, date, settings.weekStartsOn],
  )
  const occurrences = useEventsInRange(range.start, range.end, settings.hiddenCategoryIds)

  useKeyboardShortcuts({
    t: route.goToday,
    d: () => route.setView('day'),
    w: () => route.setView('week'),
    m: () => route.setView('month'),
    n: () => openCreate({ date }),
    '/': () => setSearchOpen(true),
    ArrowLeft: route.goPrev,
    ArrowRight: route.goNext,
  })

  const onCreate = (d: SolarDateString, startTime?: TimeString) =>
    openCreate(startTime ? { date: d, startTime, allDay: false } : { date: d })

  const View = VIEWS[view]
  const viewProps: CalendarViewProps = {
    date,
    today,
    days: range.days,
    occurrences: occurrences ?? [],
    settings,
    colorOf,
    onOpenDay: route.openDay,
    onOpenEvent: (o: Occurrence) => openDetail(o),
    onCreate,
  }

  return (
    <div className={styles.page}>
      <AppHeader
        view={view}
        date={date}
        weekStartsOn={settings.weekStartsOn}
        onToday={route.goToday}
        onPrev={route.goPrev}
        onNext={route.goNext}
        onViewChange={route.setView}
        onDateChange={route.setDate}
      />
      <div className={styles.body}>
        <Sidebar date={date} today={today} settings={settings} onSelectDate={route.setDate} />
        <main className={styles.main} aria-busy={occurrences === undefined}>
          <View {...viewProps} />
        </main>
      </div>
      <button
        type="button"
        className={styles.fab}
        onClick={() => openCreate({ date })}
        aria-label="Tạo sự kiện"
        title="Tạo sự kiện (N)"
      >
        +
      </button>
    </div>
  )
}
