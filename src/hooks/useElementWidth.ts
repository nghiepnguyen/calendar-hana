import { useEffect, useState, type RefObject } from 'react'

/**
 * Chiều rộng thật (px) của phần tử, cập nhật khi đổi cỡ bằng ResizeObserver.
 * 0 = chưa đo được (lần vẽ đầu, hoặc jsdom không có ResizeObserver).
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}
