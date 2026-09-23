import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { parseSolarDate } from '@shared/lunar/julian'
import { todayInVietnam } from '@shared/time'
import type { SolarDateString } from '@shared/types'
import { isViewMode, shiftDate, type ViewMode } from '../calendar/range'

function isValidDate(value: string | undefined): value is SolarDateString {
  if (!value) return false
  try {
    const { year } = parseSolarDate(value)
    return year >= 1900 && year <= 2100
  } catch {
    return false
  }
}

export function calendarPath(view: ViewMode, date: SolarDateString): string {
  return `/${view}/${date}`
}

/**
 * Chế độ xem và ngày đang xem lấy từ URL (/day/2026-09-23), để refresh không mất trạng thái.
 * URL sai thì dùng mặc định: xem Ngày, hôm nay.
 */
export function useCalendarRoute() {
  const params = useParams<{ view?: string; date?: string }>()
  const navigate = useNavigate()
  const view: ViewMode = isViewMode(params.view) ? params.view : 'day'
  const date: SolarDateString = isValidDate(params.date) ? params.date : todayInVietnam()

  const go = useCallback(
    (nextView: ViewMode, nextDate: SolarDateString) => navigate(calendarPath(nextView, nextDate)),
    [navigate],
  )

  return {
    view,
    date,
    setView: useCallback((next: ViewMode) => go(next, date), [go, date]),
    setDate: useCallback((next: SolarDateString) => go(view, next), [go, view]),
    openDay: useCallback((next: SolarDateString) => go('day', next), [go]),
    goToday: useCallback(() => go(view, todayInVietnam()), [go, view]),
    goPrev: useCallback(() => go(view, shiftDate(view, date, -1)), [go, view, date]),
    goNext: useCallback(() => go(view, shiftDate(view, date, 1)), [go, view, date]),
  }
}
