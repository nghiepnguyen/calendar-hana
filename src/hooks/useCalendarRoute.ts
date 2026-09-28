import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { todayInVietnam } from '@shared/time'
import type { SolarDateString } from '@shared/types'
import { canShift, isSupportedDate, isViewMode, shiftDate, type ViewMode } from '../calendar/range'

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
  const date: SolarDateString = isSupportedDate(params.date) ? params.date : todayInVietnam()

  // Ở mép khoảng năm hỗ trợ thì đứng yên: URL năm 1899/2101 bị coi là sai và nhảy về hôm nay.
  const canPrev = canShift(view, date, -1)
  const canNext = canShift(view, date, 1)

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
    canPrev,
    canNext,
    goPrev: useCallback(() => {
      if (canPrev) go(view, shiftDate(view, date, -1))
    }, [go, view, date, canPrev]),
    goNext: useCallback(() => {
      if (canNext) go(view, shiftDate(view, date, 1))
    }, [go, view, date, canNext]),
  }
}
