import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { formatLunar, formatSolar } from '@shared/format'
import {
  lunarToSolar,
  MAX_YEAR,
  MIN_YEAR,
  parseSolarDate,
  solarToLunar,
  toSolarDateString,
} from '@shared/lunar'
import type { LunarDate, SolarDateString } from '@shared/types'
import { COMPACT_QUERY } from '../../hooks/useMediaQuery'
import { LunarDateInput } from './LunarDateInput'
import styles from './DatePicker.module.css'

interface DatePickerProps {
  value: SolarDateString
  onSelect: (date: SolarDateString) => void
  onClose: () => void
  /**
   * Nút mở bảng. Có thì bảng được portal ra body và định vị cố định dưới nút, vì
   * backdrop-filter lồng trong phần tử kính khác (header) không làm mờ được trang phía sau.
   */
  anchorRef?: RefObject<HTMLElement | null>
  /** Trên màn hẹp, bảng trải rộng bằng phần tử này (header) và nằm ngay dưới nó. */
  boundsRef?: RefObject<HTMLElement | null>
}

const VIEWPORT_GUTTER = 16
const ANCHOR_GAP = 6

interface PanelPosition {
  left: number
  top: number
  width?: number
}

/** Tâm ngang và mép trên của bảng, giữ bảng nằm trọn trong màn hình. */
function anchorPosition(
  anchor: HTMLElement,
  bounds: HTMLElement | null | undefined,
  panelWidth: number,
): PanelPosition {
  if (bounds && window.matchMedia(COMPACT_QUERY).matches) {
    const rect = bounds.getBoundingClientRect()
    return { left: rect.left + rect.width / 2, top: rect.bottom + ANCHOR_GAP, width: rect.width }
  }
  const rect = anchor.getBoundingClientRect()
  const half = panelWidth / 2
  const center = rect.left + rect.width / 2
  const min = VIEWPORT_GUTTER + half
  const max = window.innerWidth - VIEWPORT_GUTTER - half
  return { left: Math.max(min, Math.min(center, max)), top: rect.bottom + ANCHOR_GAP }
}

function toLunar(date: SolarDateString): LunarDate {
  const { day, month, year } = parseSolarDate(date)
  return solarToLunar(day, month, year)
}

/** Bảng chọn nhanh một ngày theo dương lịch hoặc âm lịch, luôn hiện ngày quy đổi. */
export function DatePicker({ value, onSelect, onClose, anchorRef, boundsRef }: DatePickerProps) {
  const [tab, setTab] = useState<'solar' | 'lunar'>('solar')
  const [solar, setSolar] = useState(value)
  const [lunar, setLunar] = useState<LunarDate>(() => toLunar(value))
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PanelPosition | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef?.current
    if (!anchor) return
    const update = () => {
      setPosition(anchorPosition(anchor, boundsRef?.current, panelRef.current?.offsetWidth ?? 0))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorRef, boundsRef])

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      // Bấm lại nút mở thì để nút tự đóng bảng, tránh đóng rồi mở lại ngay.
      if (anchorRef?.current?.contains(target)) return
      if (panelRef.current && !panelRef.current.contains(target)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [onClose, anchorRef])

  const lunarAsSolar = (() => {
    const result = lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.isLeap)
    return result ? toSolarDateString(result) : null
  })()
  const solarValid = (() => {
    try {
      // Đang gõ năm dở (0002, 0020…): ô date vẫn trả ngày hợp lệ nhưng chưa quy đổi được.
      const { year } = parseSolarDate(solar)
      return year >= MIN_YEAR && year <= MAX_YEAR
    } catch {
      return false
    }
  })()

  const target = tab === 'solar' ? (solarValid ? solar : null) : lunarAsSolar

  const panel = (
    <div
      className={`glass ${styles.panel} ${anchorRef ? styles.floating : ''}`}
      ref={panelRef}
      role="dialog"
      aria-label="Chọn ngày"
      style={anchorRef ? (position ? position : { visibility: 'hidden' }) : undefined}
    >
      <div
        className="segmented"
        role="tablist"
        style={{ '--active': tab === 'solar' ? 0 : 1, '--count': 2 } as CSSProperties}
      >
        {(['solar', 'lunar'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              // Giữ ngày đang chọn khi đổi tab.
              if (t === 'lunar' && solarValid) setLunar(toLunar(solar))
              if (t === 'solar' && lunarAsSolar) setSolar(lunarAsSolar)
              setTab(t)
            }}
          >
            {t === 'solar' ? 'Dương lịch' : 'Âm lịch'}
          </button>
        ))}
      </div>

      {tab === 'solar' ? (
        <label className="field">
          <span className="field-label">Ngày dương lịch</span>
          <input
            className="input"
            type="date"
            min="1900-01-01"
            max="2100-12-31"
            value={solar}
            onChange={(e) => setSolar(e.target.value)}
          />
        </label>
      ) : (
        <LunarDateInput value={lunar} onChange={setLunar} />
      )}

      <p className={styles.converted} aria-live="polite">
        {target
          ? tab === 'solar'
            ? `Tức ngày ${formatLunar(toLunar(target))}`
            : `Tức ${formatSolar(target)}`
          : 'Ngày không hợp lệ'}
      </p>

      <div className={styles.actions}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Hủy
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!target}
          onClick={() => target && onSelect(target)}
        >
          Đến ngày này
        </button>
      </div>
    </div>
  )

  return anchorRef ? createPortal(panel, document.body) : panel
}
