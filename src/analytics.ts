// Google Analytics 4 (gtag.js). Chỉ bật ở bản build chạy trên domain thật: dev, vite preview
// trên localhost và Playwright (navigator.webdriver) không gửi dữ liệu.
// Lượt xem trang do GA4 tự ghi (Enhanced measurement > Page changes based on browser history
// events), nên đổi route trong SPA vẫn được tính mà không cần gửi page_view thủ công.
// Không gửi nội dung người dùng nhập (tiêu đề, ghi chú, từ khoá tìm kiếm).

const MEASUREMENT_ID = 'G-Z41N9B2YFE'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

function enabled(): boolean {
  if (!import.meta.env.PROD || typeof window === 'undefined') return false
  if (navigator.webdriver) return false
  const host = window.location.hostname
  return host !== 'localhost' && host !== '127.0.0.1'
}

export function initAnalytics(): void {
  if (!enabled() || window.gtag) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js cần đúng đối tượng arguments, không phải mảng.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export type AnalyticsParams = Record<string, string | number | boolean | undefined>

/** Gửi một sự kiện. Không làm gì khi analytics tắt, và không bao giờ ném lỗi. */
export function track(name: string, params?: AnalyticsParams): void {
  try {
    window.gtag?.('event', name, params)
  } catch {
    // Analytics không được làm hỏng thao tác của người dùng.
  }
}
