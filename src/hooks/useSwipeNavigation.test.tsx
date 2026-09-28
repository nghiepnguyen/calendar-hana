import { act, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSwipeNavigation, type SwipeNavigationOptions } from './useSwipeNavigation'

type Props = Partial<Omit<SwipeNavigationOptions, 'containerRef' | 'contentRef'>> & {
  onChildClick?: () => void
}

function Harness({ onChildClick, ...props }: Props) {
  const containerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { swipeCount } = useSwipeNavigation({
    containerRef,
    contentRef,
    canPrev: true,
    canNext: true,
    enabled: true,
    onNavigate: () => {},
    ...props,
  })
  return (
    <main ref={containerRef} data-testid="main">
      <div ref={contentRef} data-testid="content">
        <button type="button" onClick={onChildClick}>
          Ô ngày
        </button>
        <input aria-label="Ô nhập" />
        <div data-no-swipe data-testid="no-swipe">
          Thanh trượt
        </div>
        <output data-testid="count">{swipeCount}</output>
      </div>
    </main>
  )
}

let clock = 0

/** Gửi pointer event có thời điểm tăng dần (jsdom không cho đặt timeStamp qua init). */
function pointer(
  target: Element,
  type: string,
  {
    x,
    y = 300,
    id = 1,
    pointerType = 'touch',
    isPrimary = true,
    dt = 16,
  }: {
    x: number
    y?: number
    id?: number
    pointerType?: string
    isPrimary?: boolean
    dt?: number
  },
) {
  clock += dt
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: id,
    pointerType,
    isPrimary,
  })
  Object.defineProperty(event, 'timeStamp', { value: clock })
  act(() => {
    target.dispatchEvent(event)
  })
}

/** Vuốt từ startX sang startX + dx qua nhiều bước, mỗi bước 16ms. */
function swipe(
  target: Element,
  dx: number,
  opts: { startX?: number; dy?: number; pointerType?: string; steps?: number } = {},
) {
  const { startX = 500, dy = 0, pointerType = 'touch', steps = 5 } = opts
  pointer(target, 'pointerdown', { x: startX, pointerType })
  for (let i = 1; i <= steps; i++) {
    pointer(target, 'pointermove', {
      x: startX + (dx * i) / steps,
      y: 300 + (dy * i) / steps,
      pointerType,
    })
  }
  pointer(target, 'pointerup', { x: startX + dx, y: 300 + dy, pointerType })
}

function wheel(target: Element, deltaX: number, deltaY = 0, ctrlKey = false) {
  clock += 16
  const event = new WheelEvent('wheel', { bubbles: true, deltaX, deltaY, ctrlKey })
  Object.defineProperty(event, 'timeStamp', { value: clock })
  act(() => {
    target.dispatchEvent(event)
  })
}

function mockMatchMedia(matching: string[]) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: matching.includes(query),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

beforeEach(() => {
  clock = 0
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 400,
  } as DOMRect)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useSwipeNavigation — màn cảm ứng', () => {
  it('vuốt trái sang trang sau, vuốt phải về trang trước', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    const button = screen.getByRole('button')

    swipe(button, -150)
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('next', 'touch'))

    swipe(button, 150)
    await waitFor(() => expect(onNavigate).toHaveBeenLastCalledWith('prev', 'touch'))
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'))
  })

  it('vuốt ngắn và chậm thì bật về, không đổi trang', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -50, { steps: 10 })
    // Bước cuối 16ms đi 5px: 0.3px/ms, dưới ngưỡng vuốt nhanh.
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('kéo dọc là cuộn, không đổi trang', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -150, { dy: 200 })
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('bỏ qua chuột', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -200, { pointerType: 'mouse' })
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('bút cũng vuốt được', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -200, { pointerType: 'pen' })
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('next', 'touch'))
  })

  it('bắt đầu sát mép thì nhường trình duyệt, trừ khi chạy như app đã cài', async () => {
    const onNavigate = vi.fn()
    const { unmount } = render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), 200, { startX: 10 })
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
    unmount()

    mockMatchMedia(['(display-mode: standalone)'])
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), 200, { startX: 10 })
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('prev', 'touch'))
  })

  it('bỏ qua ô nhập và phần tử data-no-swipe', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('textbox'), -200)
    swipe(screen.getByTestId('no-swipe'), -200)
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('không đổi trang khi có hộp thoại mở hoặc bị tắt', async () => {
    const onNavigate = vi.fn()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)
    const { rerender } = render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -200)
    dialog.remove()
    rerender(<Harness onNavigate={onNavigate} enabled={false} />)
    swipe(screen.getByRole('button'), -200)
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('ngón thứ hai chạm giữa chừng thì hủy', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    const button = screen.getByRole('button')
    pointer(button, 'pointerdown', { x: 500 })
    pointer(button, 'pointermove', { x: 450 })
    pointer(button, 'pointerdown', { x: 200, id: 2, isPrimary: false })
    pointer(button, 'pointermove', { x: 300 })
    pointer(button, 'pointerup', { x: 300 })
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('pointercancel thì hủy', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    const button = screen.getByRole('button')
    pointer(button, 'pointerdown', { x: 500 })
    pointer(button, 'pointermove', { x: 300 })
    pointer(button, 'pointercancel', { x: 300 })
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('không còn trang sau thì vuốt trái không đổi trang', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} canNext={false} />)
    swipe(screen.getByRole('button'), -300)
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('chặn click ngay sau khi vuốt, tap bình thường vẫn bấm được', async () => {
    const onChildClick = vi.fn()
    render(<Harness onChildClick={onChildClick} />)
    const button = screen.getByRole('button')

    swipe(button, -200)
    act(() => button.click())
    expect(onChildClick).not.toHaveBeenCalled()

    pointer(button, 'pointerdown', { x: 500 })
    pointer(button, 'pointermove', { x: 504 })
    pointer(button, 'pointerup', { x: 504 })
    act(() => button.click())
    expect(onChildClick).toHaveBeenCalledTimes(1)
  })

  it('giảm chuyển động: đổi trang ngay, không dịch nội dung', () => {
    mockMatchMedia(['(prefers-reduced-motion: reduce)'])
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    swipe(screen.getByRole('button'), -200)
    expect(onNavigate).toHaveBeenCalledWith('next', 'touch')
    expect(screen.getByTestId('content').style.transform).toBe('')
  })
})

describe('useSwipeNavigation — trackpad', () => {
  it('một chuỗi wheel ngang chỉ sang một trang', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    const main = screen.getByTestId('main')
    for (let i = 0; i < 10; i++) wheel(main, 30)
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1))
    expect(onNavigate).toHaveBeenCalledWith('next', 'trackpad')
  })

  it('bỏ qua wheel dọc và wheel khi giữ Ctrl (phóng to)', async () => {
    const onNavigate = vi.fn()
    render(<Harness onNavigate={onNavigate} />)
    const main = screen.getByTestId('main')
    for (let i = 0; i < 5; i++) wheel(main, 30, 100)
    for (let i = 0; i < 5; i++) wheel(main, 30, 0, true)
    await act(async () => {})
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
