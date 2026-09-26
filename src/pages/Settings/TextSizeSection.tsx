import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowCounterClockwise, Plus } from '@phosphor-icons/react'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { TextSize } from '@shared/types'
import { EventChip } from '../../components/EventChip/EventChip'
import { iconSize, TEXT_SIZE_LABEL, TEXT_SIZES } from '../../styles/textSize'
import monthStyles from '../../views/MonthView/MonthView.module.css'
import type { SectionProps } from './SettingsPage'
import { Toggle } from './Toggle'
import styles from './TextSizeSection.module.css'

/** Sự kiện mẫu cho ô xem trước; không lưu, không bấm được. */
const SAMPLE: Occurrence = {
  eventId: 'preview',
  occurrenceKey: '2026-09-26',
  date: '2026-09-26',
  index: 0,
  isRecurring: true,
  isException: false,
  event: {
    id: 'preview',
    title: 'Giỗ ông nội',
    calendarType: 'lunar',
    date: { day: 15, month: 8, year: 2026, isLeap: false },
    allDay: true,
    categoryId: 'memorial',
    recurrence: { freq: 'yearly', calendar: 'lunar' },
    reminders: [],
    createdAt: '',
    updatedAt: '',
  },
}

const noop = () => {}

export function TextSizeSection({ settings, save }: SectionProps) {
  const options = useRef<(HTMLButtonElement | null)[]>([])
  const active = TEXT_SIZES.indexOf(settings.textSize)
  const changed = settings.textSize !== 'default' || settings.boldText

  const select = (size: TextSize) => {
    if (size !== settings.textSize) save({ textSize: size })
  }

  // Phím mũi tên chuyển mức (kiểu radio group), Home/End về đầu/cuối.
  const onKeyDown = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next: number
    if (e.key in step) next = Math.min(TEXT_SIZES.length - 1, Math.max(0, active + step[e.key]))
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TEXT_SIZES.length - 1
    else return
    e.preventDefault()
    select(TEXT_SIZES[next])
    options.current[next]?.focus()
  }

  return (
    <div className={styles.group}>
      <h3 id="text-size" className={styles.heading}>
        Cỡ chữ
      </h3>
      <figure className={styles.preview}>
        <figcaption className={styles.previewLabel}>Xem trước</figcaption>
        {/* Chỉ để nhìn: inert chặn bấm và focus, aria-hidden cho trình duyệt chưa có inert. */}
        <div className={styles.previewBody} inert aria-hidden="true">
          <div className={`${monthStyles.cell} ${styles.previewCell}`}>
            <div className={monthStyles.cellHead}>
              <span className={monthStyles.solarDay}>26</span>
              <span className={monthStyles.lunarDay}>15/8</span>
            </div>
            <div className={styles.previewEvents}>
              <EventChip occurrence={SAMPLE} color="#7c3aed" onOpen={noop} />
            </div>
          </div>
          <div className={styles.previewText}>
            <p>Rằm tháng Tám, Tết Trung Thu. Nhắc trước 1 ngày lúc 08:00.</p>
            <span className="btn btn-primary">
              <Plus size={iconSize(16)} weight="bold" aria-hidden="true" />
              Tạo sự kiện
            </span>
          </div>
        </div>
      </figure>

      <div className={styles.row}>
        <div
          className={`segmented ${styles.sizes}`}
          role="radiogroup"
          aria-labelledby="text-size"
          onKeyDown={onKeyDown}
          style={{ '--active': active, '--count': TEXT_SIZES.length } as CSSProperties}
        >
          {TEXT_SIZES.map((size, i) => (
            <button
              key={size}
              ref={(el) => {
                options.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={settings.textSize === size}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(size)}
            >
              <span className={styles.sample} data-size={size} aria-hidden="true">
                A
              </span>
              {TEXT_SIZE_LABEL[size]}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="Chữ đậm hơn"
        hint="Làm chữ dày hơn để dễ đọc trên nền kính mờ."
        checked={settings.boldText}
        onChange={(boldText) => save({ boldText })}
      />

      {changed ? (
        <div className={styles.reset}>
          <button
            type="button"
            className="btn"
            onClick={() => save({ textSize: 'default', boldText: false })}
          >
            <ArrowCounterClockwise size={iconSize(16)} weight="bold" aria-hidden="true" />
            Đặt lại mặc định
          </button>
        </div>
      ) : null}
    </div>
  )
}
