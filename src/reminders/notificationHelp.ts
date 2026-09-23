// Hướng dẫn bật thông báo theo trình duyệt và hệ điều hành đang dùng.

export type Platform = 'ios' | 'android' | 'mac' | 'windows' | 'other'
export type Browser = 'chrome' | 'edge' | 'firefox' | 'safari' | 'other'

export interface NotificationHelp {
  platform: Platform
  /** Bỏ chặn thông báo cho trang này trong trình duyệt. */
  browserSteps: string[]
  /** Cho phép trình duyệt hiện thông báo trong cài đặt hệ điều hành. */
  systemSteps: string[]
}

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  // iPad đời mới báo là Macintosh nhưng có màn hình cảm ứng.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'mac'
  if (/Windows/.test(userAgent)) return 'windows'
  return 'other'
}

export function detectBrowser(userAgent: string): Browser {
  if (/Edg\//.test(userAgent)) return 'edge'
  if (/Firefox\/|FxiOS/.test(userAgent)) return 'firefox'
  if (/Chrome\/|CriOS/.test(userAgent)) return 'chrome'
  if (/Safari\//.test(userAgent)) return 'safari'
  return 'other'
}

const BROWSER_NAMES: Record<Browser, string> = {
  chrome: 'Google Chrome',
  edge: 'Microsoft Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  other: 'trình duyệt',
}

function browserSteps(browser: Browser, platform: Platform): string[] {
  if (platform === 'ios') {
    return [
      'Trên iPhone/iPad, thông báo chỉ hoạt động khi app được thêm vào Màn hình chính: trong Safari bấm nút Chia sẻ → Thêm vào Màn hình chính.',
      'Mở app từ biểu tượng trên Màn hình chính rồi bật lại thông báo.',
    ]
  }
  if (platform === 'android' && browser === 'chrome') {
    return [
      'Bấm biểu tượng bên trái thanh địa chỉ → Quyền (Permissions) → Thông báo → Cho phép.',
      'Tải lại trang.',
    ]
  }
  switch (browser) {
    case 'safari':
      return [
        'Mở menu Safari → Cài đặt (Settings) → Trang web (Websites) → Thông báo (Notifications).',
        'Tìm trang này trong danh sách và chọn Cho phép (Allow).',
        'Tải lại trang.',
      ]
    case 'firefox':
      return [
        'Bấm biểu tượng ổ khóa bên trái thanh địa chỉ.',
        'Ở mục Gửi thông báo, bấm dấu × để bỏ chặn.',
        'Tải lại trang rồi bấm Bật thông báo.',
      ]
    default:
      return [
        'Bấm biểu tượng bên trái thanh địa chỉ (ổ khóa hoặc hai thanh trượt).',
        'Ở mục Thông báo, chọn Cho phép.',
        'Tải lại trang.',
      ]
  }
}

function systemSteps(browser: Browser, platform: Platform): string[] {
  const name = BROWSER_NAMES[browser]
  switch (platform) {
    case 'mac':
      return [
        `Mở Cài đặt hệ thống (System Settings) → Thông báo (Notifications) → ${name}, bật Cho phép thông báo.`,
        'Tắt chế độ Tập trung / Không làm phiền (Focus) nếu đang bật.',
      ]
    case 'windows':
      return [
        `Mở Settings → System → Notifications, bật Notifications và bật cho ${name}.`,
        'Tắt Do not disturb / Focus assist nếu đang bật.',
      ]
    case 'android':
      return [
        `Mở Cài đặt → Ứng dụng → ${name} → Thông báo, bật cho phép.`,
        'Tắt chế độ Không làm phiền nếu đang bật.',
      ]
    case 'ios':
      return ['Mở Cài đặt → Thông báo → Lịch Việt, bật Cho phép thông báo.']
    default:
      return [`Kiểm tra cài đặt thông báo của hệ điều hành cho ${name}.`]
  }
}

export function notificationHelp(userAgent: string, maxTouchPoints = 0): NotificationHelp {
  const platform = detectPlatform(userAgent, maxTouchPoints)
  const browser = detectBrowser(userAgent)
  return {
    platform,
    browserSteps: browserSteps(browser, platform),
    systemSteps: systemSteps(browser, platform),
  }
}
