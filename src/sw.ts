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
// Trừ các trang dành riêng của Firebase Hosting (/__/auth/handler dùng khi đăng nhập):
// trả app shell cho chúng thì popup đăng nhập hiện app thay vì trang Google.
// Trừ cả đường dẫn có đuôi file (/sitemap.xml, /robots.txt): mở trực tiếp thì lấy file thật,
// không thì app nhận đường dẫn lạ và chuyển về trang chủ.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/__\//, /\/[^/]+\.[a-z0-9]+$/i],
  }),
)

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
    self.registration.showNotification(data.title || 'Lịch Việt', {
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
