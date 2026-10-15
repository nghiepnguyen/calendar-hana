import { registerSW } from 'virtual:pwa-register'
import { useAppUpdateStore } from '../store/appUpdateStore'
import { checkForUpdate } from './updateCheck'

const HOUR = 3600_000

/** Đăng ký service worker (offline + thông báo). Chỉ có ở bản build; khi chạy dev thì bỏ qua. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () =>
      useAppUpdateStore.setState({
        needRefresh: true,
        update: () => {
          // Plugin gửi SKIP_WAITING, chờ service worker mới nắm trang rồi tải lại đúng một lần.
          void updateSW(true)
          // Không thấy controllerchange (service worker mới hỏng): vẫn tải lại, chạy bản đang có.
          setTimeout(() => location.reload(), 10_000)
        },
      }),
    onOfflineReady: () => useAppUpdateStore.setState({ offlineReady: true }),
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      const check = () => void checkForUpdate(registration)
      check()
      // PWA trên iPhone nằm nền rất lâu rồi mở lại, không tải lại trang: kiểm tra mỗi lần quay lại.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      // App thường mở cả ngày: kiểm tra bản mới mỗi giờ.
      setInterval(check, HOUR)
    },
  })
}
