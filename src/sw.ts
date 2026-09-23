/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  createHandlerBoundToURL,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Cache app shell để mở được khi offline.
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// App gửi message này khi người dùng bấm "Cập nhật" trên thông báo có phiên bản mới.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

interface PushData {
  title?: string
  body?: string
  tag?: string
  url?: string
}

/** Server gửi FCM data message: { data: { title, body, tag, url } }. */
function readPush(event: PushEvent): PushData {
  try {
    const payload = event.data?.json() as { data?: PushData } & PushData
    return payload?.data ?? payload ?? {}
  } catch {
    return { body: event.data?.text() }
  }
}

// Nhắc hẹn Web Push từ Cloud Functions (người đã đăng nhập). Luôn hiện thông báo.
self.addEventListener('push', (event) => {
  const data = readPush(event)
  event.waitUntil(
    self.registration.showNotification(data.title || 'Lịch Hana', {
      body: data.body,
      tag: data.tag,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      lang: 'vi',
      data: { url: data.url?.startsWith('/') ? data.url : '/' },
    }),
  )
})

// Bấm thông báo: mở app tại ngày của sự kiện. Có tab đang mở thì dùng lại tab đó.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const client = windows.find((c) => new URL(c.url).origin === self.location.origin)
      if (client) {
        await client.focus()
        client.postMessage({ type: 'OPEN_URL', url })
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
