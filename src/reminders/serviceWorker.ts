import { registerSW } from 'virtual:pwa-register'
import { useAppUpdateStore } from '../store/appUpdateStore'

const HOUR = 3600_000

/** Đăng ký service worker (offline + thông báo). Chỉ có ở bản build; khi chạy dev thì bỏ qua. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () =>
      useAppUpdateStore.setState({ needRefresh: true, update: () => void updateSW(true) }),
    onOfflineReady: () => useAppUpdateStore.setState({ offlineReady: true }),
    // App thường mở cả ngày: kiểm tra bản mới mỗi giờ.
    onRegisteredSW: (_url, registration) => {
      if (registration) setInterval(() => void registration.update().catch(() => {}), HOUR)
    },
  })
}
