import { registerSW } from 'virtual:pwa-register'

/** Đăng ký service worker (offline + thông báo). Chỉ có ở bản build; khi chạy dev thì bỏ qua. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  registerSW({ immediate: true })
}
