import { describe, expect, it } from 'vitest'
import { canonicalUrl } from './canonicalHost'

const loc = (hostname: string, pathname = '/day/2026-09-23', search = '', hash = '') => ({
  hostname,
  pathname,
  search,
  hash,
})

describe('canonicalUrl', () => {
  it('chuyển tên miền Firebase sang tên miền chính, giữ đường dẫn', () => {
    expect(
      canonicalUrl(
        loc('calendar-hana.web.app', '/week/2026-09-23', '?event=e1'),
        'lich.thanhnghiep.top',
      ),
    ).toBe('https://lich.thanhnghiep.top/week/2026-09-23?event=e1')
    expect(canonicalUrl(loc('calendar-hana.firebaseapp.com'), 'lich.thanhnghiep.top')).toBe(
      'https://lich.thanhnghiep.top/day/2026-09-23',
    )
  })

  it('không chuyển khi đã ở tên miền chính, localhost, trang /__/ hoặc chưa cấu hình', () => {
    expect(canonicalUrl(loc('lich.thanhnghiep.top'), 'lich.thanhnghiep.top')).toBeNull()
    expect(canonicalUrl(loc('localhost'), 'lich.thanhnghiep.top')).toBeNull()
    expect(
      canonicalUrl(
        loc('calendar-hana.firebaseapp.com', '/__/auth/handler'),
        'lich.thanhnghiep.top',
      ),
    ).toBeNull()
    expect(canonicalUrl(loc('calendar-hana.web.app'), '')).toBeNull()
  })
})
