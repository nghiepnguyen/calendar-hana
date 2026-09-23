import type { SolarDateString } from '@shared/types'
import type { DateRange } from './listRange'

/** Vị trí đang xem của trang Danh sách, giữ trong phiên (sessionStorage). */
export interface SavedPosition extends DateRange {
  /** Nhóm ngày đang nằm ở đầu màn hình. */
  anchorDate: SolarDateString
}

const KEY = 'event-list:position'
const DATE = /^\d{4}-\d{2}-\d{2}$/

function isDate(value: unknown): value is SolarDateString {
  return typeof value === 'string' && DATE.test(value)
}

export function loadPosition(): SavedPosition | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { anchorDate, start, end } = JSON.parse(raw) as Partial<SavedPosition>
    if (!isDate(anchorDate) || !isDate(start) || !isDate(end)) return null
    if (start > anchorDate || anchorDate > end) return null
    return { anchorDate, start, end }
  } catch {
    return null
  }
}

export function savePosition(position: SavedPosition): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(position))
  } catch {
    // Không lưu được (chế độ riêng tư, bị chặn): lần sau mở lại từ hôm nay.
  }
}
