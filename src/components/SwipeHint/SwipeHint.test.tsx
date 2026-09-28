import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { track } from '../../analytics'
import { HINT_DELAY_MS, HINT_DURATION_MS, SWIPE_HINT_STORAGE_KEY, SwipeHint } from './SwipeHint'

vi.mock('../../analytics', () => ({ track: vi.fn() }))

function mockTouch(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: coarse && query === '(pointer: coarse)',
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.removeItem(SWIPE_HINT_STORAGE_KEY)
  mockTouch(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.mocked(track).mockClear()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SwipeHint', () => {
  it('hiện sau 1 giây trên máy cảm ứng và ghi nhớ ngay khi hiện', () => {
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS - 1)
    expect(screen.queryByRole('status')).toBeNull()
    advance(1)
    expect(screen.getByRole('status')).toHaveTextContent('Vuốt ngang để sang ngày khác')
    expect(localStorage.getItem(SWIPE_HINT_STORAGE_KEY)).toBe('1')
  })

  it('chữ đổi theo chế độ xem', () => {
    render(<SwipeHint view="month" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    expect(screen.getByRole('status')).toHaveTextContent('sang tháng khác')
  })

  it('không hiện khi đã thấy, khi không phải màn cảm ứng, hoặc khi không đọc được lưu trữ', () => {
    localStorage.setItem(SWIPE_HINT_STORAGE_KEY, '1')
    const first = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()
    first.unmount()

    localStorage.removeItem(SWIPE_HINT_STORAGE_KEY)
    mockTouch(false)
    const second = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()
    second.unmount()

    mockTouch(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('chờ hộp thoại đóng và bảng tìm kiếm đóng rồi mới hiện', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)
    const { rerender } = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()

    dialog.remove()
    rerender(<SwipeHint view="day" swipeCount={0} blocked />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()

    rerender(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('bấm × thì ẩn và gửi reason close một lần', () => {
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    const close = screen.getByRole('button', { name: 'Đóng gợi ý' })
    fireEvent.click(close)
    fireEvent.click(close)
    advance(300)
    expect(screen.queryByRole('status')).toBeNull()
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('swipe_hint_dismissed', { reason: 'close' })
  })

  it('tự ẩn sau 8 giây', () => {
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    advance(HINT_DURATION_MS)
    advance(300)
    expect(screen.queryByRole('status')).toBeNull()
    expect(track).toHaveBeenCalledWith('swipe_hint_dismissed', { reason: 'timeout' })
  })

  it('vuốt thành công thì ẩn với reason swipe', () => {
    const { rerender } = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    rerender(<SwipeHint view="day" swipeCount={1} blocked={false} />)
    advance(300)
    expect(screen.queryByRole('status')).toBeNull()
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('swipe_hint_dismissed', { reason: 'swipe' })
  })

  it('đã tự vuốt trước khi kịp gợi ý thì không hiện, không gửi analytics', () => {
    const { rerender } = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS / 2)
    rerender(<SwipeHint view="day" swipeCount={1} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()
    expect(track).not.toHaveBeenCalled()
  })

  it('mở lại sau khi đã hiện thì không hiện nữa', () => {
    const first = render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    first.unmount()
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS * 3)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('không lấy focus khi hiện', () => {
    render(<SwipeHint view="day" swipeCount={0} blocked={false} />)
    advance(HINT_DELAY_MS)
    expect(document.activeElement).toBe(document.body)
  })
})
