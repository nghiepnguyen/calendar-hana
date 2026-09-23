// Quyền thông báo của trình duyệt và hiện thông báo nhắc hẹn.

import { create } from 'zustand'
import { formatReminderMessage } from '@shared/format'
import { occurrencePath, reminderTag } from '@shared/reminders/links'
import type { ReminderInstance } from '@shared/reminders/nextReminder'
import { todayInVietnam } from '@shared/time'

/** Sự kiện trên window khi người dùng bấm thông báo không qua service worker. */
export const OPEN_URL_EVENT = 'calendar-hana:open'

export type PermissionState = NotificationPermission | 'unsupported'

function readPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

interface NotificationState {
  permission: PermissionState
  /** Xin quyền nếu chưa hỏi. Trả về quyền sau khi hỏi. */
  request: () => Promise<PermissionState>
  refresh: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  permission: readPermission(),
  request: async () => {
    let permission = readPermission()
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission()
      } catch {
        permission = readPermission()
      }
    }
    set({ permission })
    return permission
  },
  refresh: () => set({ permission: readPermission() }),
}))

/** Nội dung và dữ liệu đi kèm một thông báo nhắc hẹn (dùng chung với Web Push từ server). */
export function reminderNotification(instance: ReminderInstance, now: Date = new Date()) {
  const { title, body } = formatReminderMessage(instance.event, instance.date, todayInVietnam(now))
  return {
    title,
    options: {
      body,
      tag: reminderTag(instance.eventId, instance.occurrenceKey, instance.reminder.offsetMinutes),
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      lang: 'vi',
      data: { url: occurrencePath(instance.date, instance.eventId, instance.occurrenceKey) },
    } satisfies NotificationOptions,
  }
}

/** Hiện thông báo qua service worker (hoạt động cả trên Android), không có thì dùng Notification. */
export async function showReminderNotification(instance: ReminderInstance): Promise<void> {
  if (readPermission() !== 'granted') return
  const { title, options } = reminderNotification(instance)
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await registration.showNotification(title, options)
    return
  }
  const notification = new Notification(title, options)
  notification.onclick = () => {
    window.focus()
    window.dispatchEvent(new CustomEvent(OPEN_URL_EVENT, { detail: options.data.url }))
    notification.close()
  }
}

/** Hiện một thông báo thử để người dùng kiểm tra hệ điều hành có chặn hay không. */
export async function showTestNotification(): Promise<boolean> {
  if (readPermission() !== 'granted') return false
  const title = 'Lịch Việt'
  const options = {
    body: 'Thông báo đang hoạt động. Bạn sẽ nhận nhắc hẹn như thế này.',
    tag: 'calendar-hana:test',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    lang: 'vi',
    data: { url: '/settings#notifications' },
  } satisfies NotificationOptions
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) await registration.showNotification(title, options)
  else new Notification(title, options)
  return true
}
