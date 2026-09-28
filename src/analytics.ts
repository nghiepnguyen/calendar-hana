// Google Analytics 4 (gtag.js) và PostHog. Chỉ bật ở bản build chạy trên domain thật: dev,
// vite preview trên localhost và Playwright (navigator.webdriver) không gửi dữ liệu.
// Lượt xem trang do GA4 tự ghi (Enhanced measurement > Page changes based on browser history
// events) và PostHog tự ghi ($pageview theo history), nên đổi route trong SPA vẫn được tính.
// Không gửi nội dung người dùng nhập (tiêu đề, ghi chú, từ khoá tìm kiếm): PostHog tắt
// autocapture và session recording vì hai tính năng này có thể thu chữ trên màn hình.

import type { PostHog } from 'posthog-js'

const MEASUREMENT_ID = 'G-Z41N9B2YFE'
const POSTHOG_KEY = 'phc_xeu6phPrrMAJYpURvcx7rcizNehSqQ4GNyB845q8Mj4Z'
const POSTHOG_HOST = 'https://us.i.posthog.com'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

/** posthog-js được tải động để không làm nặng lần mở app đầu tiên. */
let posthog: Promise<PostHog | undefined> | undefined

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

  posthog = import('posthog-js')
    .then(({ default: ph }) => {
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'identified_only',
        autocapture: false,
        disable_session_recording: true,
      })
      return ph
    })
    .catch((error) => {
      console.warn('Không tải được PostHog', error)
      return undefined
    })
}

/** Chạy một thao tác PostHog khi đã tải xong. Không làm gì khi analytics tắt. */
function withPosthog(action: (ph: PostHog) => void): void {
  void posthog?.then((ph) => {
    try {
      if (ph) action(ph)
    } catch {
      // Analytics không được làm hỏng thao tác của người dùng.
    }
  })
}

export type AnalyticsParams = Record<string, string | number | boolean | undefined>

/** Gửi một sự kiện. Không làm gì khi analytics tắt, và không bao giờ ném lỗi. */
export function track(name: string, params?: AnalyticsParams): void {
  try {
    window.gtag?.('event', name, params)
  } catch {
    // Analytics không được làm hỏng thao tác của người dùng.
  }
  withPosthog((ph) => ph.capture(name, params))
}

/** Gắn các sự kiện sau với tài khoản (chỉ uid, không gửi email hay tên). null = đã đăng xuất. */
export function identifyUser(uid: string | null): void {
  withPosthog((ph) => {
    if (uid) {
      if (ph.get_distinct_id() !== uid) ph.identify(uid)
    } else if (ph.get_property('$user_state') === 'identified') {
      ph.reset()
    }
  })
}
