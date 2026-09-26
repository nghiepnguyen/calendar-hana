import { useMemo, useRef } from 'react'
import { MoonStars, Plus } from '@phosphor-icons/react'
import { formatAccessibleDate, formatLunarShort, WEEKDAY_SHORT } from '@shared/format'
import { getDayInfo, parseSolarDate } from '@shared/lunar'
import { EventChip } from '../../components/EventChip/EventChip'
import { eventLabel, isLunarEvent } from '../../components/EventChip/eventLabel'
import { useElementWidth } from '../../hooks/useElementWidth'
import { groupByDate } from '../../hooks/useEventsInRange'
import type { CalendarViewProps } from '../viewProps'
import { iconSize, TEXT_SIZE_SCALE } from '../../styles/textSize'
import styles from './MonthView.module.css'

const MAX_VISIBLE = 3
/** Cỡ chữ mặc định: điện thoại hiện tối đa 4 chấm màu (CSS @media), không có "+N". */
const MAX_DOTS = 4
/** Ô hẹp hơn (px ở tỉ lệ 1) thì chip có chữ không còn đọc được tên sự kiện. */
const CHIP_MIN_WIDTH = 72
/** Mỗi chấm/icon chiếm (px ở tỉ lệ 1), gồm khoảng cách. */
const MARKER_SLOT = 12
const MARKER_ROWS = 2

export function MonthView({
  date,
  days,
  today,
  occurrences,
  settings,
  colorOf,
  onOpenDay,
  onOpenEvent,
  onCreate,
}: CalendarViewProps) {
  const currentMonth = parseSolarDate(date).month
  const byDate = useMemo(() => groupByDate(occurrences), [occurrences])
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (i + settings.weekStartsOn) % 7)

  // Cỡ chữ Lớn / Rất lớn: đo ô thật để chọn chip có chữ hay chỉ chấm/icon, thay cho @media.
  // Chưa đo được (lần vẽ đầu) thì để CSS @media quyết định như cỡ mặc định.
  const gridRef = useRef<HTMLDivElement>(null)
  const scale = TEXT_SIZE_SCALE[settings.textSize] ?? 1
  const cellWidth = useElementWidth(gridRef) / 7
  const measured = scale > 1 && cellWidth > 0
  const markers = measured && cellWidth < CHIP_MIN_WIDTH * scale
  const markerCapacity = Math.max(
    2,
    Math.floor((cellWidth - 4 * scale) / (MARKER_SLOT * scale)) * MARKER_ROWS,
  )
  const gridMode = measured ? (markers ? styles.markersMode : styles.chipsMode) : ''

  return (
    <div className={`glass ${styles.view}`}>
      <div className={styles.weekdays} aria-hidden="true">
        {weekdayOrder.map((d) => (
          <div key={d} className={d === 0 ? styles.red : undefined}>
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
      </div>
      <div ref={gridRef} className={`${styles.grid} ${gridMode}`}>
        {days.map((day) => {
          const info = getDayInfo(day)
          const holidays = settings.showHolidays ? info.holidays : []
          const isRed = info.weekday === 0 || holidays.some((h) => h.isPublicHoliday)
          const items = byDate.get(day) ?? []
          const hidden = items.length - MAX_VISIBLE
          const outside = info.solar.month !== currentMonth
          const lunarLabel = info.lunar.day === 1 ? formatLunarShort(info.lunar) : info.lunar.day
          return (
            <div
              key={day}
              className={`${styles.cell} ${outside ? styles.outside : ''} ${day === today ? styles.today : ''}`}
              onClick={() => onOpenDay(day)}
            >
              <div className={styles.cellHead}>
                <button
                  type="button"
                  className={`${styles.solarDay} ${isRed ? styles.red : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDay(day)
                  }}
                  aria-label={`${formatAccessibleDate(day)}${holidays.length ? `, ${holidays.map((h) => h.name).join(', ')}` : ''}${items.length ? `, ${items.length} sự kiện` : ''}`}
                  aria-current={day === today ? 'date' : undefined}
                >
                  {info.solar.day}
                </button>
                {settings.showAuspicious && info.dayGod.isHoangDao ? (
                  <span className={styles.goodDot} title="Ngày hoàng đạo" aria-hidden="true" />
                ) : null}
                <span
                  className={`${styles.lunarDay} ${info.lunar.day === 1 ? styles.lunarFirst : ''}`}
                  aria-hidden="true"
                >
                  {lunarLabel}
                </span>
              </div>
              {holidays[0] ? (
                <div className={styles.holiday} title={holidays.map((h) => h.name).join(', ')}>
                  {holidays[0].name}
                </div>
              ) : null}
              {markers ? null : (
                <div className={styles.events}>
                  {items.slice(0, MAX_VISIBLE).map((o) => (
                    <EventChip
                      key={`${o.eventId}:${o.occurrenceKey}`}
                      occurrence={o}
                      color={colorOf(o.event.categoryId)}
                      onOpen={onOpenEvent}
                    />
                  ))}
                  {hidden > 0 ? <span className={styles.more}>+{hidden}</span> : null}
                </div>
              )}
              {markers ? (
                <EventMarkers items={items} capacity={markerCapacity} colorOf={colorOf} />
              ) : (
                <div className={styles.dots} aria-hidden="true">
                  {items.slice(0, MAX_DOTS).map((o) => (
                    <span
                      key={`${o.eventId}:${o.occurrenceKey}`}
                      className={styles.dot}
                      style={{ background: colorOf(o.event.categoryId) }}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                className={styles.add}
                onClick={(e) => {
                  e.stopPropagation()
                  onCreate(day)
                }}
                aria-label={`Tạo sự kiện ngày ${formatAccessibleDate(day)}`}
              >
                <Plus size={iconSize(14)} weight="bold" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Ô ngày hẹp khi chữ to: mỗi sự kiện là một chấm màu danh mục (sự kiện âm lịch: icon mặt trăng),
 * có tên đọc được; không đủ chỗ thì chấm cuối nhường cho "+N". Bấm vào ô để mở ngày.
 */
function EventMarkers({
  items,
  capacity,
  colorOf,
}: {
  items: CalendarViewProps['occurrences']
  capacity: number
  colorOf: CalendarViewProps['colorOf']
}) {
  const shown = items.length > capacity ? items.slice(0, capacity - 1) : items
  const rest = items.length - shown.length
  return (
    <div className={styles.dots}>
      {shown.map((o) => {
        const label = eventLabel(o)
        return (
          <span
            key={`${o.eventId}:${o.occurrenceKey}`}
            className={styles.marker}
            style={{ color: colorOf(o.event.categoryId) }}
            role="img"
            aria-label={label}
            title={label}
          >
            {isLunarEvent(o) ? (
              <MoonStars size={iconSize(11)} weight="fill" aria-hidden="true" />
            ) : (
              <span className={styles.markerDot} />
            )}
          </span>
        )
      })}
      {rest > 0 ? (
        <span className={styles.markerMore} aria-label={`và ${rest} sự kiện khác`}>
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
