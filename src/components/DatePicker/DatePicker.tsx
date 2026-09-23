import { useEffect, useRef, useState } from 'react'
import { formatLunar, formatSolar } from '@shared/format'
import { lunarToSolar, parseSolarDate, solarToLunar, toSolarDateString } from '@shared/lunar'
import type { LunarDate, SolarDateString } from '@shared/types'
import { LunarDateInput } from './LunarDateInput'
import styles from './DatePicker.module.css'

interface DatePickerProps {
  value: SolarDateString
  onSelect: (date: SolarDateString) => void
  onClose: () => void
}

function toLunar(date: SolarDateString): LunarDate {
  const { day, month, year } = parseSolarDate(date)
  return solarToLunar(day, month, year)
}

/** Bảng chọn nhanh một ngày theo dương lịch hoặc âm lịch, luôn hiện ngày quy đổi. */
export function DatePicker({ value, onSelect, onClose }: DatePickerProps) {
  const [tab, setTab] = useState<'solar' | 'lunar'>('solar')
  const [solar, setSolar] = useState(value)
  const [lunar, setLunar] = useState<LunarDate>(() => toLunar(value))
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [onClose])

  const lunarAsSolar = (() => {
    const result = lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.isLeap)
    return result ? toSolarDateString(result) : null
  })()
  const solarValid = (() => {
    try {
      parseSolarDate(solar)
      return true
    } catch {
      return false
    }
  })()

  const target = tab === 'solar' ? (solarValid ? solar : null) : lunarAsSolar

  return (
    <div className={styles.panel} ref={panelRef} role="dialog" aria-label="Chọn ngày">
      <div className={styles.tabs} role="tablist">
        {(['solar', 'lunar'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
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
}
