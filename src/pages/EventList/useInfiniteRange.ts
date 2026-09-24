import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { extendAfter, extendBefore, isAtEnd, isAtStart, type DateRange } from './listRange'

/** Số lần tự tải thêm liên tiếp khi người dùng chưa cuộn (tránh tải mãi khi ít sự kiện). */
const MAX_AUTO_LOADS = 4

interface Options {
  range: DateRange
  setRange: (range: DateRange) => void
  topRef: RefObject<HTMLElement | null>
  bottomRef: RefObject<HTMLElement | null>
  /** false cho tới khi đã cuộn tới vị trí ban đầu, để không tải thêm lúc trang còn ở đầu. */
  enabled: boolean
}

/**
 * Cuộn vô hạn hai chiều trên cửa sổ: mốc đầu/cuối lọt vào màn hình thì mở rộng khoảng ngày.
 * Chèn thêm phía trên thì cuộn thêm đúng phần vừa chèn để phần đang xem không bị đẩy xuống.
 */
export function useInfiniteRange({ range, setRange, topRef, bottomRef, enabled }: Options) {
  // Chiều cao trang trước khi chèn thêm phía trên.
  const prepend = useRef<number | null>(null)
  const autoLoads = useRef(0)

  useEffect(() => {
    const reset = () => {
      autoLoads.current = 0
    }
    window.addEventListener('scroll', reset, { passive: true })
    return () => window.removeEventListener('scroll', reset)
  }, [])

  // Tạo lại observer sau mỗi lần đổi khoảng: nếu mốc vẫn còn trong màn hình thì tải tiếp.
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || autoLoads.current >= MAX_AUTO_LOADS) continue
          if (entry.target === topRef.current && !isAtStart(range)) {
            autoLoads.current++
            prepend.current = document.documentElement.scrollHeight
            setRange(extendBefore(range))
            return
          }
          if (entry.target === bottomRef.current && !isAtEnd(range)) {
            autoLoads.current++
            setRange(extendAfter(range))
            return
          }
        }
      },
      { rootMargin: '600px 0px' },
    )
    if (topRef.current) observer.observe(topRef.current)
    if (bottomRef.current) observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [enabled, range, setRange, topRef, bottomRef])

  useLayoutEffect(() => {
    const height = prepend.current
    if (height === null) return
    prepend.current = null
    const added = document.documentElement.scrollHeight - height
    // Cuộn tương đối, không về scrollY lúc bắt đầu tải: người dùng có thể đã cuộn tiếp
    // trong lúc đó, quay về vị trí cũ sẽ giật trang ngược lại.
    if (added > 0) window.scrollBy(0, added)
  }, [range])
}
