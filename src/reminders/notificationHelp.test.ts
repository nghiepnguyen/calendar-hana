import { describe, expect, it } from 'vitest'
import { detectBrowser, detectPlatform, notificationHelp } from './notificationHelp'

const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const WIN_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'

describe('notificationHelp', () => {
  it('nhận ra trình duyệt và hệ điều hành', () => {
    expect([detectPlatform(MAC_CHROME), detectBrowser(MAC_CHROME)]).toEqual(['mac', 'chrome'])
    expect([detectPlatform(MAC_SAFARI), detectBrowser(MAC_SAFARI)]).toEqual(['mac', 'safari'])
    expect([detectPlatform(WIN_EDGE), detectBrowser(WIN_EDGE)]).toEqual(['windows', 'edge'])
    expect(detectPlatform(ANDROID_CHROME)).toBe('android')
    expect(detectPlatform(IPHONE)).toBe('ios')
    expect(detectBrowser(FIREFOX)).toBe('firefox')
  })

  it('iPad báo là Macintosh nhưng có cảm ứng', () => {
    expect(detectPlatform(MAC_SAFARI, 5)).toBe('ios')
  })

  it('Chrome trên Mac: hướng dẫn cài đặt hệ thống có tên trình duyệt', () => {
    const help = notificationHelp(MAC_CHROME)
    expect(help.browserSteps.join(' ')).toContain('thanh địa chỉ')
    expect(help.systemSteps[0]).toContain('Google Chrome')
    expect(help.systemSteps.join(' ')).toContain('Focus')
  })

  it('iPhone: hướng dẫn thêm vào Màn hình chính', () => {
    expect(notificationHelp(IPHONE).browserSteps[0]).toContain('Màn hình chính')
  })

  it('Safari trên Mac: bật trong Cài đặt Safari', () => {
    expect(notificationHelp(MAC_SAFARI).browserSteps[0]).toContain('Safari')
  })
})
