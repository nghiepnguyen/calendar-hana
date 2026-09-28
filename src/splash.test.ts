import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideSplash } from './splash'

describe('hideSplash', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('mờ dần rồi gỡ splash khỏi DOM', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="splash"></div>'
    hideSplash()
    expect(document.getElementById('splash')).toHaveClass('splash-hide')
    vi.advanceTimersByTime(400)
    expect(document.getElementById('splash')).toBeNull()
  })

  it('không lỗi khi không có splash', () => {
    expect(() => hideSplash()).not.toThrow()
  })
})
