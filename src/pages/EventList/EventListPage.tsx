import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CaretLeft, MagnifyingGlass } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { formatMonthTitleParts } from '@shared/format'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import { useAuth } from '../../auth/authContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DayGroup } from '../../components/EventList/DayGroup'
import { selectionKey } from '../../components/EventList/listFormat'
import { CreateFab } from '../../components/CreateFab/CreateFab'
import { EventDialogs } from '../../components/EventDialogs'
import { Sidebar } from '../../components/layout/Sidebar'
import { SearchPanel } from '../../components/SearchPanel/SearchPanel'
import { TabBar } from '../../components/layout/TabBar'
import { matchesQuery, queryWords } from '../../components/SearchPanel/search'
import { Toast } from '../../components/Toast/Toast'
import { createDefaultSettings } from '../../data/defaultCategories'
import { deleteEventOccurrences, type OccurrenceSelection } from '../../data/eventActions'
import { useRepository } from '../../data/repositoryContext'
import { calendarPath } from '../../hooks/useCalendarRoute'
import { useCategoryMap } from '../../hooks/useCategoryMap'
import { useEventsInRange } from '../../hooks/useEventsInRange'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useIsCompact } from '../../hooks/useMediaQuery'
import { useNow } from '../../hooks/useNow'
import { useEvents, useSettings } from '../../hooks/useRepositoryData'
import { useUiStore } from '../../store/uiStore'
import { CategoryChips } from './CategoryChips'
import { groupByMonthAndDay, groupByYear } from './groupList'
import {
  defaultRange,
  extendAfter,
  extendBefore,
  isAtEnd,
  isAtStart,
  SEARCH_MORE_MONTHS,
  type DateRange,
} from './listRange'
import { loadPosition, savePosition } from './savedPosition'
import { SelectionBar } from './SelectionBar'
import { useInfiniteRange } from './useInfiniteRange'
import { iconSize } from '../../styles/textSize'
import styles from './EventListPage.module.css'

const FALLBACK_SETTINGS = createDefaultSettings('')

interface Selected extends OccurrenceSelection {
  isRecurring: boolean
}

/** Nhóm ngày đầu tiên còn nhìn thấy dưới header (dùng để lưu và giữ vị trí). */
function findAnchorDate(header: HTMLElement | null): SolarDateString | null {
  const top = (header?.getBoundingClientRect().bottom ?? 0) + 48
  for (const el of document.querySelectorAll<HTMLElement>('[data-date]')) {
    if (el.getBoundingClientRect().bottom > top) return el.dataset.date ?? null
  }
  return null
}

/** Cuộn tới nhóm ngày `date`, hoặc nhóm gần nhất sau nó (nhóm cuối nếu không có). */
function scrollToDate(date: SolarDateString): boolean {
  const days = [...document.querySelectorAll<HTMLElement>('[data-date]')]
  if (days.length === 0) return false
  const target = days.find((el) => (el.dataset.date ?? '') >= date) ?? days[days.length - 1]
  target.scrollIntoView?.({ block: 'start' })
  return true
}

export function EventListPage() {
  const repository = useRepository()
  const settings = useSettings() ?? FALLBACK_SETTINGS
  const { user } = useAuth()
  const { today } = useNow()
  const { categories, colorOf, get: getCategory } = useCategoryMap()
  const openDetail = useUiStore((s) => s.openDetail)
  const openCreate = useUiStore((s) => s.openCreate)
  const compact = useIsCompact()
  const navigate = useNavigate()
  const searchOpen = useUiStore((s) => s.searchOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)

  const [saved] = useState(loadPosition)
  const [range, setRange] = useState<DateRange>(() =>
    saved ? { start: saved.start, end: saved.end } : defaultRange(today),
  )
  // Ngày cần cuộn tới khi danh sách render lại (mở trang, Hôm nay, đổi bộ lọc).
  const pendingScroll = useRef<SolarDateString | null>(saved?.anchorDate ?? today)
  const [scrollRequest, setScrollRequest] = useState(0)
  // true sau khi đã cuộn tới vị trí ban đầu: lúc đó mới tự tải thêm và lưu vị trí.
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(() => new Set())
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlyMap<string, Selected>>(() => new Map())
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useKeyboardShortcuts(
    { n: () => openCreate({ date: today }), '?': () => navigate('/settings#shortcuts') },
    !selecting,
  )

  const headerRef = useRef<HTMLElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef(range)
  useEffect(() => {
    rangeRef.current = range
  }, [range])

  const events = useEvents()
  const occurrences = useEventsInRange(range.start, range.end)
  const deferredQuery = useDeferredValue(query)
  const words = useMemo(() => queryWords(deferredQuery), [deferredQuery])
  const filtering = words.length > 0 || hiddenIds.size > 0

  const visible = useMemo(
    () =>
      (occurrences ?? []).filter(
        (o) => !hiddenIds.has(o.event.categoryId) && matchesQuery(o.event, words),
      ),
    [occurrences, hiddenIds, words],
  )
  // Đang lọc thì không chèn nhóm "hôm nay" rỗng.
  const months = useMemo(
    () => groupByMonthAndDay(visible, today, filtering ? undefined : range),
    [visible, today, filtering, range],
  )
  const years = useMemo(() => groupByYear(months), [months])

  useInfiniteRange({ range, setRange, topRef, bottomRef, enabled: ready })

  // Cuộn tới ngày đích khi dữ liệu đã có trên màn hình.
  useLayoutEffect(() => {
    if (occurrences === undefined) return
    const target = pendingScroll.current
    if (target) {
      pendingScroll.current = null
      scrollToDate(target)
    }
    if (ready) return
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [occurrences, months, scrollRequest, ready])

  // Lưu vị trí khi cuộn và khi rời trang. Chỉ lưu vị trí, không lưu bộ lọc hay lựa chọn.
  useEffect(() => {
    if (!ready) return
    const save = () => {
      const anchorDate = findAnchorDate(headerRef.current)
      const { start, end } = rangeRef.current
      if (anchorDate && anchorDate >= start && anchorDate <= end) {
        savePosition({ anchorDate, start, end })
      }
    }
    let timer: number | undefined
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(save, 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
      save()
    }
  }, [ready])

  /** Đổi bộ lọc mà vẫn đứng quanh ngày đang xem. */
  const keepPosition = () => {
    const anchor = findAnchorDate(headerRef.current)
    if (anchor) pendingScroll.current = anchor
  }

  const goToday = () => {
    if (today < range.start || today > range.end) setRange(defaultRange(today))
    pendingScroll.current = today
    setScrollRequest((n) => n + 1)
  }

  const toggleCategory = (id: string) => {
    keepPosition()
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelected = useCallback((occurrence: Occurrence) => {
    setSelected((prev) => {
      const next = new Map(prev)
      const key = selectionKey(occurrence)
      if (next.has(key)) next.delete(key)
      else
        next.set(key, {
          eventId: occurrence.eventId,
          occurrenceKey: occurrence.occurrenceKey,
          isRecurring: occurrence.isRecurring,
        })
      return next
    })
  }, [])

  const selectAll = () => {
    setSelected(
      new Map(
        visible.map((o) => [
          selectionKey(o),
          { eventId: o.eventId, occurrenceKey: o.occurrenceKey, isRecurring: o.isRecurring },
        ]),
      ),
    )
  }

  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Map())
    setError(null)
  }

  const confirmDelete = async () => {
    setConfirming(false)
    setDeleting(true)
    setError(null)
    try {
      const { deleted, failed } = await deleteEventOccurrences(repository, [...selected.values()])
      if (failed.length === 0) {
        stopSelecting()
        setToast(`Đã xoá ${deleted} sự kiện`)
      } else {
        const failedKeys = new Set(failed.map(selectionKey))
        setSelected(new Map([...selected].filter(([key]) => failedKeys.has(key))))
        setError(
          `Không xoá được ${failed.length} sự kiện. Kiểm tra kết nối rồi bấm Xoá để thử lại.`,
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  const selectedKeys = useMemo(() => new Set(selected.keys()), [selected])
  const hasRecurringSelected = [...selected.values()].some((s) => s.isRecurring)
  const allHidden = categories.length > 0 && categories.every((c) => hiddenIds.has(c.id))
  const clearToast = useCallback(() => setToast(null), [])

  return (
    <div
      className={[styles.page, selecting ? styles.selecting : '', compact ? styles.withTabBar : '']
        .filter(Boolean)
        .join(' ')}
    >
      <header ref={headerRef} className={`glass ${styles.header}`}>
        <Link to="/" className={`btn btn-ghost ${styles.back}`} aria-label="Quay lại lịch">
          <CaretLeft size={iconSize(18)} weight="bold" aria-hidden="true" />
          <span className={styles.backText}>Lịch</span>
        </Link>
        <h1>Danh sách sự kiện</h1>
        <div className={styles.headerActions}>
          <button type="button" className="btn" onClick={goToday}>
            Hôm nay
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${styles.selectButton}`}
            onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
          >
            {selecting ? 'Xong' : 'Chọn'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.filters}>
          <label className={styles.search}>
            <MagnifyingGlass size={iconSize(18)} aria-hidden="true" className={styles.searchIcon} />
            <input
              className="input"
              type="search"
              value={query}
              placeholder="Tìm theo tiêu đề, ghi chú, địa điểm"
              aria-label="Tìm sự kiện trong danh sách"
              onChange={(e) => {
                keepPosition()
                setQuery(e.target.value)
              }}
            />
          </label>
          <CategoryChips categories={categories} hiddenIds={hiddenIds} onToggle={toggleCategory} />
          <div aria-live="polite" className={styles.status}>
            {words.length > 0 ? `${visible.length} kết quả` : ''}
          </div>
        </div>

        {allHidden ? (
          <div className={styles.notice}>
            <p>Đang ẩn tất cả danh mục</p>
            <button type="button" className="btn" onClick={() => setHiddenIds(new Set())}>
              Hiện tất cả
            </button>
          </div>
        ) : null}

        {!allHidden && words.length > 0 && visible.length === 0 ? (
          <div className={styles.notice}>
            <p>Không tìm thấy trong khoảng đã tải</p>
            <button
              type="button"
              className="btn"
              onClick={() =>
                setRange(extendAfter(extendBefore(range, SEARCH_MORE_MONTHS), SEARCH_MORE_MONTHS))
              }
              disabled={isAtStart(range) && isAtEnd(range)}
            >
              Tìm xa hơn
            </button>
          </div>
        ) : null}

        {occurrences === undefined ? (
          <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải">
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonDay} />
            ))}
          </div>
        ) : events?.length === 0 ? (
          <div className={styles.notice}>
            <p>Chưa có sự kiện nào</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openCreate({ date: today })}
            >
              Tạo sự kiện
            </button>
          </div>
        ) : null}

        <div ref={topRef} className={styles.sentinel}>
          {isAtStart(range) ? 'Đã hết sự kiện' : null}
        </div>

        {occurrences !== undefined ? (
          <div className={styles.years}>
            {years.map(({ year, months }) => (
              <section key={year} className={styles.year} aria-labelledby={`y-${year}`}>
                <h2 id={`y-${year}`} className={styles.yearHead}>
                  {year}
                </h2>
                {months.map((month) => {
                  const title = formatMonthTitleParts(month.month, month.year)
                  return (
                    <section key={month.key} className={styles.month} aria-label={title.solar}>
                      <h3 className={styles.monthHead}>
                        <span>{title.solar}</span>
                        <span className={styles.monthLunar}>{title.lunar}</span>
                      </h3>
                      <ul className={styles.days}>
                        {month.days.map((day) => (
                          <DayGroup
                            key={day.date}
                            day={day}
                            colorOf={colorOf}
                            getCategory={getCategory}
                            selecting={selecting}
                            selectedKeys={selectedKeys}
                            onOpen={openDetail}
                            onToggle={toggleSelected}
                          />
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </section>
            ))}
          </div>
        ) : null}

        <div ref={bottomRef} className={styles.sentinel}>
          {isAtEnd(range) ? 'Đã hết sự kiện' : null}
        </div>
      </main>

      {/* Điện thoại: thanh tab như trang lịch; đang chọn thì nhường chỗ cho thanh chọn. */}
      {compact ? (
        <Sidebar
          date={today}
          today={today}
          settings={settings}
          compact
          onSelectDate={(d) => navigate(calendarPath('day', d))}
        />
      ) : null}
      {compact && !selecting ? (
        <TabBar
          active="events"
          onSelect={(tab) => tab !== 'events' && navigate(calendarPath(tab, today))}
          onCreate={() => openCreate({ date: today })}
        />
      ) : null}
      {/* Máy tính: nút + ở góc như trang lịch; đang chọn thì nhường chỗ cho thanh chọn. */}
      {!compact && !selecting ? <CreateFab onClick={() => openCreate({ date: today })} /> : null}

      {/* Ẩn khi hỏi xác nhận: sheet xác nhận trên điện thoại nằm đè đúng chỗ thanh này. */}
      {selecting && !confirming ? (
        <>
          {error ? (
            <p className={`glass ${styles.error}`} role="alert">
              {error}
            </p>
          ) : null}
          <SelectionBar
            count={selected.size}
            deleting={deleting}
            onSelectAll={selectAll}
            onDelete={() => setConfirming(true)}
          />
        </>
      ) : null}

      {confirming ? (
        <ConfirmDialog
          title={`Xoá ${selected.size} sự kiện?`}
          confirmLabel="Xoá"
          danger
          onConfirm={() => void confirmDelete()}
          onCancel={() => setConfirming(false)}
        >
          <p>Không thể hoàn tác.</p>
          {hasRecurringSelected ? (
            <p>Với sự kiện lặp lại, chỉ xoá các lần đã chọn; các lần khác vẫn giữ.</p>
          ) : null}
        </ConfirmDialog>
      ) : null}

      {toast ? <Toast message={toast} onDone={clearToast} /> : null}
      <EventDialogs settings={settings} signedIn={!!user} />
      {/* Mở từ nút tìm kiếm trong Menu. */}
      {searchOpen ? (
        <SearchPanel
          today={today}
          onClose={() => setSearchOpen(false)}
          onSelect={(d) => {
            setSearchOpen(false)
            navigate(calendarPath('day', d))
          }}
        />
      ) : null}
    </div>
  )
}
