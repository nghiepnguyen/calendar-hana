import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { useEvents, useSettings } from '../hooks/useRepositoryData'
import { LocalScheduler } from './localScheduler'
import { OPEN_URL_EVENT, showReminderNotification, useNotificationStore } from './notifications'

/**
 * Chạy nền cho nhắc hẹn:
 * - Đã đăng nhập và đăng ký được Web Push: server gửi thông báo, app không tự đặt lịch.
 * - Ngược lại: đặt lịch thông báo trong trình duyệt khi app đang mở.
 * - Bấm thông báo: mở app tại lần diễn ra của sự kiện.
 */
export function ReminderService() {
  const { user } = useAuth()
  const permission = useNotificationStore((s) => s.permission)
  const refreshPermission = useNotificationStore((s) => s.refresh)
  const events = useEvents()
  const settings = useSettings()
  const navigate = useNavigate()
  const [pushUid, setPushUid] = useState<string | null>(null)
  const uid = user?.uid ?? null

  // Đăng ký Web Push khi đã đăng nhập và đã cấp quyền.
  useEffect(() => {
    if (!uid || permission !== 'granted') return
    let cancelled = false
    import('./pushRegistration')
      .then(({ registerPushToken }) => registerPushToken(uid))
      .then((token) => !cancelled && setPushUid(token ? uid : null))
      .catch((error) => console.warn('Không đăng ký được Web Push', error))
    return () => {
      cancelled = true
    }
  }, [uid, permission])

  const useLocal = permission === 'granted' && (!uid || pushUid !== uid)
  const schedulerRef = useRef<LocalScheduler | null>(null)

  useEffect(() => {
    if (!useLocal) return
    const scheduler = new LocalScheduler({
      show: (instance) => {
        showReminderNotification(instance).catch((error) =>
          console.warn('Không hiện được thông báo', error),
        )
      },
    })
    schedulerRef.current = scheduler
    const onVisible = () => {
      refreshPermission()
      if (document.visibilityState === 'visible') scheduler.reschedule()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      scheduler.dispose()
      schedulerRef.current = null
    }
  }, [useLocal, refreshPermission])

  const allDayReminderTime = settings?.allDayReminderTime
  useEffect(() => {
    if (events && allDayReminderTime) schedulerRef.current?.update(events, allDayReminderTime)
  }, [events, allDayReminderTime, useLocal])

  // Bấm thông báo: service worker gửi message, hoặc thông báo không qua service worker.
  useEffect(() => {
    const open = (url: unknown) => {
      if (typeof url === 'string' && url.startsWith('/')) navigate(url)
    }
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'OPEN_URL') open(e.data.url)
    }
    const onOpen = (e: Event) => open((e as CustomEvent).detail)
    navigator.serviceWorker?.addEventListener('message', onMessage)
    window.addEventListener(OPEN_URL_EVENT, onOpen)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage)
      window.removeEventListener(OPEN_URL_EVENT, onOpen)
    }
  }, [navigate])

  return null
}
