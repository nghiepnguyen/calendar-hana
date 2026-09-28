import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import { track } from '../analytics'
import { useAuth } from '../auth/authContext'
import { viewRange } from '../calendar/range'
import { CreateFab } from '../components/CreateFab/CreateFab'
import { EventDialogs } from '../components/EventDialogs'
import { AppHeader } from '../components/layout/AppHeader'
import { SearchPanel } from '../components/SearchPanel/SearchPanel'
import { SwipeHint } from '../components/SwipeHint/SwipeHint'
import { Sidebar } from '../components/layout/Sidebar'
import { TabBar } from '../components/layout/TabBar'
import { createDefaultSettings } from '../data/defaultCategories'
import { useCalendarRoute } from '../hooks/useCalendarRoute'
import { useCategoryMap } from '../hooks/useCategoryMap'
import { useCalendarHead } from '../hooks/usePageHead'
import { useEventsInRange } from '../hooks/useEventsInRange'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useIsCompact } from '../hooks/useMediaQuery'
import { useNow } from '../hooks/useNow'
import { useOpenOccurrenceFromUrl } from '../hooks/useOpenOccurrenceFromUrl'
import { useSettings } from '../hooks/useRepositoryData'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'
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
  const { colorOf, get: getCategory } = useCategoryMap()
  const { user } = useAuth()
  const openDetail = useUiStore((s) => s.openDetail)
  const openCreate = useUiStore((s) => s.openCreate)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const searchOpen = useUiStore((s) => s.searchOpen)
  const compact = useIsCompact()
  const navigate = useNavigate()
  useCalendarHead(view, date, useLocation().pathname === '/')

  const range = useMemo(
    () => viewRange(view, date, settings.weekStartsOn),
    [view, date, settings.weekStartsOn],
  )
  const occurrences = useEventsInRange(range.start, range.end, settings.hiddenCategoryIds)
  useOpenOccurrenceFromUrl(date)

  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { swipeCount } = useSwipeNavigation({
    containerRef: mainRef,
    contentRef,
    canPrev: route.canPrev,
    canNext: route.canNext,
    enabled: !searchOpen,
    onNavigate: (direction, input) => {
      track('swipe_navigate', { view, direction, input })
      if (direction === 'next') route.goNext()
      else route.goPrev()
    },
  })

  // Sang ngày khác (bằng bất kỳ cách nào) thì xem từ đầu; chỉ đổi chế độ xem thì giữ chỗ đang đọc.
  const shownDate = useRef(date)
  useEffect(() => {
    if (shownDate.current === date) return
    shownDate.current = date
    mainRef.current?.scrollTo?.({ top: 0, behavior: 'instant' })
  }, [date])

  // Đổi phím tắt thì sửa cả hướng dẫn ở Settings/ShortcutSection.
  useKeyboardShortcuts({
    t: route.goToday,
    d: () => route.setView('day'),
    w: () => route.setView('week'),
    m: () => route.setView('month'),
    n: () => openCreate({ date }),
    '/': () => setSearchOpen(true),
    '?': () => navigate('/settings#shortcuts'),
    ArrowLeft: () => {
      if (!route.canPrev) return
      track('nav_button', { view, direction: 'prev', input: 'keyboard' })
      route.goPrev()
    },
    ArrowRight: () => {
      if (!route.canNext) return
      track('nav_button', { view, direction: 'next', input: 'keyboard' })
      route.goNext()
    },
  })

  const View = VIEWS[view]
  const viewProps: CalendarViewProps = {
    date,
    today,
    days: range.days,
    occurrences: occurrences ?? [],
    settings,
    colorOf,
    getCategory,
    onOpenDay: route.openDay,
    onOpenEvent: (o: Occurrence) => openDetail(o),
    onCreate: (d: SolarDateString) => openCreate({ date: d, allDay: true }),
  }

  return (
    <div className={styles.page}>
      <AppHeader
        view={view}
        date={date}
        weekStartsOn={settings.weekStartsOn}
        onToday={route.goToday}
        canPrev={route.canPrev}
        canNext={route.canNext}
        onPrev={route.goPrev}
        onNext={route.goNext}
        onViewChange={route.setView}
        onDateChange={route.setDate}
      />
      <div className={styles.body}>
        <Sidebar
          date={date}
          today={today}
          settings={settings}
          compact={compact}
          onSelectDate={route.setDate}
        />
        <main
          ref={mainRef}
          className={styles.main}
          aria-busy={occurrences === undefined}
          tabIndex={-1}
        >
          <div ref={contentRef} className={styles.swipeContent}>
            <View {...viewProps} />
          </div>
        </main>
      </div>
      {compact ? (
        <TabBar
          active={view === 'week' ? null : view}
          onSelect={(tab) => (tab === 'events' ? navigate('/events') : route.setView(tab))}
          onCreate={() => openCreate({ date })}
        />
      ) : (
        <CreateFab onClick={() => openCreate({ date })} />
      )}
      <SwipeHint view={view} swipeCount={swipeCount} blocked={searchOpen} />
      <EventDialogs settings={settings} signedIn={!!user} />
      {searchOpen ? (
        <SearchPanel
          today={today}
          onClose={() => setSearchOpen(false)}
          onSelect={(d) => {
            setSearchOpen(false)
            route.openDay(d)
          }}
        />
      ) : null}
    </div>
  )
}
