import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useElementWidth } from './useElementWidth'

let callback: ResizeObserverCallback | undefined
const disconnect = vi.fn()

class FakeResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    callback = cb
  }
  observe() {}
  unobserve() {}
  disconnect = disconnect
}

function Probe() {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  return <div ref={ref}>{width}</div>
}

function resize(width: number) {
  act(() => callback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver))
}

afterEach(() => {
  vi.unstubAllGlobals()
  callback = undefined
})

describe('useElementWidth', () => {
  it('trả 0 khi không có ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const { container } = render(<Probe />)
    expect(container.textContent).toBe('0')
  })

  it('cập nhật theo kích thước đo được và ngắt khi unmount', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const { container, unmount } = render(<Probe />)
    resize(320)
    expect(container.textContent).toBe('320')
    resize(180)
    expect(container.textContent).toBe('180')
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
