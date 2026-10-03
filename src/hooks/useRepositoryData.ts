import { useEffect, useState } from 'react'
import type { CalendarEvent, Category, Settings } from '@shared/types'
import { track } from '../analytics'
import { useRepository } from '../data/repositoryContext'
import type { CalendarRepository } from '../data/repository'

/** Danh sách sự kiện gốc (chưa tính lần lặp), tự cập nhật. undefined = đang tải. */
export function useEvents(): CalendarEvent[] | undefined {
  const repository = useRepository()
  const [events, setEvents] = useState<CalendarEvent[]>()
  useEffect(() => repository.watchEvents(setEvents), [repository])
  return events
}

/** Danh sách danh mục theo thứ tự, tự cập nhật. undefined = đang tải. */
export function useCategories(): Category[] | undefined {
  const repository = useRepository()
  const [categories, setCategories] = useState<Category[]>()
  useEffect(() => repository.watchCategories(setCategories), [repository])
  return categories
}

/** Cài đặt hiện tại, tự cập nhật. undefined = đang tải. */
export function useSettings(): Settings | undefined {
  const repository = useRepository()
  const [saved, setSaved] = useState<{ repository: CalendarRepository; settings: Settings }>()
  useEffect(
    () => repository.watchSettings((settings) => setSaved({ repository, settings })),
    [repository],
  )
  // Switching accounts must not expose the previous profile while the next snapshot loads.
  return saved?.repository === repository ? saved.settings : undefined
}

/** Quá thời gian này mà cài đặt chưa tải xong thì coi như treo (thường do IndexedDB trên iOS). */
export const SETTINGS_SLOW_MS = 8000

export interface SettingsStatus {
  settings: Settings | undefined
  /** Đọc cài đặt báo lỗi. */
  error: boolean
  /** Đã chờ quá SETTINGS_SLOW_MS mà chưa có cài đặt. */
  slow: boolean
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const { code, name } = error as { code?: unknown; name?: unknown }
    if (typeof code === 'string') return code
    if (typeof name === 'string') return name
  }
  return 'unknown'
}

/**
 * Như useSettings, kèm trạng thái lỗi / chờ quá lâu để màn hình cần cài đặt không kẹt mãi ở
 * "Đang tải". Gửi sự kiện analytics khi chậm, khi lỗi và khi tải được sau lúc chậm.
 */
export function useSettingsStatus(): SettingsStatus {
  const repository = useRepository()
  type State = {
    repository: CalendarRepository
    settings?: Settings
    error: boolean
    slow: boolean
  }
  const [state, setState] = useState<State>({ repository, error: false, slow: false })

  useEffect(() => {
    const startedAt = Date.now()
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
    const base = { repository: repository.kind, standalone }
    let loaded = false
    let slow = false
    const patch = (next: Partial<State>) =>
      setState((s) =>
        s.repository === repository
          ? { ...s, ...next }
          : { repository, error: false, slow: false, ...next },
      )
    const timer = setTimeout(() => {
      slow = true
      patch({ slow: true })
      track('settings_load_slow', { ...base, waited_ms: SETTINGS_SLOW_MS })
    }, SETTINGS_SLOW_MS)
    const stop = repository.watchSettings(
      (settings) => {
        clearTimeout(timer)
        if (!loaded && slow)
          track('settings_load_recovered', { ...base, elapsed_ms: Date.now() - startedAt })
        loaded = true
        patch({ settings, error: false, slow: false })
      },
      (error) => {
        clearTimeout(timer)
        track('settings_load_error', { ...base, code: errorCode(error), loaded })
        patch({ error: true })
      },
    )
    return () => {
      clearTimeout(timer)
      stop()
    }
  }, [repository])

  // Đổi tài khoản: không hiện trạng thái của repository cũ.
  if (state.repository !== repository) return { settings: undefined, error: false, slow: false }
  return { settings: state.settings, error: state.error, slow: state.slow }
}
