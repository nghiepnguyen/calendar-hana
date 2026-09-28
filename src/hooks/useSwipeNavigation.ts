import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  createTrackpadAccumulator,
  directionOf,
  isEdgeStart,
  isSwipeCommitted,
  lockDirection,
  rubberBand,
  SLIDE_MS,
  SNAP_BACK_MS,
  velocityOf,
  type SwipeDirection,
  type VelocitySample,
} from '../calendar/swipe'
import { useMediaQuery } from './useMediaQuery'

export type SwipeInput = 'touch' | 'trackpad'

export interface SwipeNavigationOptions {
  /** Vùng nhận vuốt (khung cuộn <main>). */
  containerRef: RefObject<HTMLElement | null>
  /** Phần tử được dịch ngang theo ngón tay. */
  contentRef: RefObject<HTMLElement | null>
  canPrev: boolean
  canNext: boolean
  /** false khi có bảng che vùng lịch (tìm kiếm...). Hộp thoại aria-modal thì hook tự kiểm. */
  enabled: boolean
  onNavigate: (direction: SwipeDirection, input: SwipeInput) => void
}

interface Gesture {
  pointerId: number
  startX: number
  startY: number
  width: number
  samples: VelocitySample[]
  phase: 'pending' | 'swiping' | 'ignored'
}

const EDITABLE =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-no-swipe]'

function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null
}

/** Chạm trúng phần tử tự cuộn ngang được: để phần tử đó cuộn, không đổi trang. */
function insideHorizontalScroller(target: Element, container: Element): boolean {
  for (let el: Element | null = target; el && el !== container; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el)
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
      return true
    }
  }
  return false
}

const translate = (x: number | string) =>
  `translate3d(${typeof x === 'number' ? `${x}px` : x}, 0, 0)`

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Vuốt ngang trên vùng lịch (ngón tay, bút) hoặc vuốt 2 ngón trên trackpad để sang trang
 * trước/sau. Trong lúc kéo chỉ ghi transform thẳng vào style, không render lại React.
 * Trả số lần đã đổi trang bằng vuốt, để gợi ý vuốt biết người dùng đã biết vuốt.
 */
export function useSwipeNavigation(options: SwipeNavigationOptions): { swipeCount: number } {
  const [swipeCount, setSwipeCount] = useState(0)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const standalone = useMediaQuery('(display-mode: standalone)')

  const latest = useRef({ ...options, reducedMotion, standalone })
  useEffect(() => {
    latest.current = { ...options, reducedMotion, standalone }
  })

  const { containerRef, contentRef } = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let gesture: Gesture | null = null
    const pointers = new Set<number>()
    let frame = 0
    let suppressClick = false
    let animation: Animation | null = null
    // Đang chạy hiệu ứng mà người dùng chạm tiếp: chạy nốt ngay, không chờ.
    let fastForward = false
    let busy = false
    const trackpad = createTrackpadAccumulator()

    const content = () => contentRef.current

    const setOffset = (x: number | string | null) => {
      const el = content()
      if (!el) return
      el.style.transform = x === null ? '' : translate(x)
      if (x === null) delete el.dataset.swiping
      else el.dataset.swiping = ''
    }

    const scheduleOffset = (x: number) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setOffset(x))
    }

    const slide = async (from: number | string, to: number | string, duration: number) => {
      const el = content()
      if (!el || fastForward || duration === 0 || typeof el.animate !== 'function') {
        setOffset(to)
        return
      }
      el.dataset.swiping = ''
      const anim = el.animate([{ transform: translate(from) }, { transform: translate(to) }], {
        duration,
        easing: 'ease-out',
        fill: 'forwards',
      })
      animation = anim
      try {
        await anim.finished
      } catch {
        // Bị hủy: vẫn đặt vị trí cuối bên dưới.
      }
      setOffset(to)
      anim.cancel()
      if (animation === anim) animation = null
    }

    const navigate = (direction: SwipeDirection, input: SwipeInput) => {
      latest.current.onNavigate(direction, input)
      setSwipeCount((n) => n + 1)
    }

    /** Trang cũ trượt ra (nếu có), đổi trang, trang mới trượt vào từ phía đối diện. */
    const commit = async (direction: SwipeDirection, input: SwipeInput, from: number | null) => {
      if (latest.current.reducedMotion) {
        setOffset(null)
        navigate(direction, input)
        return
      }
      busy = true
      const out = direction === 'next' ? '-100%' : '100%'
      const enter = direction === 'next' ? '100%' : '-100%'
      if (from !== null) await slide(from, out, SLIDE_MS)
      navigate(direction, input)
      setOffset(enter)
      // Chờ React vẽ trang mới rồi mới cho trượt vào.
      if (!fastForward) await nextFrame()
      await slide(enter, 0, SLIDE_MS)
      setOffset(null)
      busy = false
      fastForward = false
    }

    const snapBack = async (from: number) => {
      busy = true
      await slide(from, 0, latest.current.reducedMotion ? 0 : SNAP_BACK_MS)
      setOffset(null)
      busy = false
      fastForward = false
    }

    const release = (pointerId: number) => {
      try {
        if (container.hasPointerCapture?.(pointerId)) container.releasePointerCapture(pointerId)
      } catch {
        // Trình duyệt đã tự thả.
      }
    }

    /** Hủy cú vuốt đang dở, bật nội dung về chỗ cũ. */
    const abort = () => {
      if (!gesture) return
      cancelAnimationFrame(frame)
      if (gesture.phase === 'swiping') {
        suppressClick = true
        release(gesture.pointerId)
        const last = gesture.samples[gesture.samples.length - 1]
        void snapBack(last ? last.x - gesture.startX : 0)
      }
      gesture.phase = 'ignored'
    }

    const allowed = (direction: SwipeDirection) =>
      direction === 'next' ? latest.current.canNext : latest.current.canPrev

    const shouldIgnoreStart = (e: PointerEvent): boolean => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return true
      if (!e.isPrimary) return true
      if (!latest.current.enabled || isDialogOpen()) return true
      if (isEdgeStart(e.clientX, window.innerWidth, latest.current.standalone)) return true
      const target = e.target
      if (!(target instanceof Element)) return true
      if (target.closest(EDITABLE)) return true
      return insideHorizontalScroller(target, container)
    }

    const onPointerDown = (e: PointerEvent) => {
      // Ngón đầu tiên của một lần chạm: xóa các ngón cũ có thể đã nhấc ra ngoài vùng lịch.
      if (e.isPrimary) pointers.clear()
      pointers.add(e.pointerId)
      if (pointers.size > 1) {
        // Ngón thứ hai (pinch): bỏ cú vuốt.
        abort()
        return
      }
      suppressClick = false
      if (busy) {
        fastForward = true
        animation?.finish()
      }
      if (shouldIgnoreStart(e)) {
        gesture = null
        return
      }
      gesture = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        width: container.getBoundingClientRect().width || window.innerWidth,
        samples: [{ x: e.clientX, t: e.timeStamp }],
        phase: 'pending',
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!gesture || e.pointerId !== gesture.pointerId || gesture.phase === 'ignored') return
      const dx = e.clientX - gesture.startX
      const dy = e.clientY - gesture.startY
      if (gesture.phase === 'pending') {
        const lock = lockDirection(dx, dy)
        if (lock === null) return
        if (lock === 'vertical') {
          gesture.phase = 'ignored'
          return
        }
        gesture.phase = 'swiping'
        try {
          container.setPointerCapture?.(e.pointerId)
        } catch {
          // Không capture được thì vẫn nhận sự kiện khi ngón tay còn trong vùng lịch.
        }
      }
      gesture.samples.push({ x: e.clientX, t: e.timeStamp })
      if (gesture.samples.length > 20) gesture.samples.shift()
      if (latest.current.reducedMotion) return
      scheduleOffset(allowed(directionOf(dx)) ? dx : rubberBand(dx))
    }

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (!gesture || e.pointerId !== gesture.pointerId) return
      const current = gesture
      gesture = null
      if (current.phase !== 'swiping') return
      cancelAnimationFrame(frame)
      release(current.pointerId)
      suppressClick = true
      const dx = e.clientX - current.startX
      current.samples.push({ x: e.clientX, t: e.timeStamp })
      const direction = directionOf(dx)
      const committed = isSwipeCommitted({
        dx,
        velocity: velocityOf(current.samples),
        width: current.width,
      })
      const shown = allowed(direction) ? dx : rubberBand(dx)
      if (committed && allowed(direction))
        void commit(direction, 'touch', latest.current.reducedMotion ? null : shown)
      else void snapBack(latest.current.reducedMotion ? 0 : shown)
    }

    const onPointerCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (!gesture || e.pointerId !== gesture.pointerId) return
      abort()
      gesture = null
    }

    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      e.preventDefault()
      e.stopPropagation()
    }

    const onWheel = (e: WheelEvent) => {
      if (!latest.current.enabled || isDialogOpen()) return
      const direction = trackpad.push(e.deltaX, e.deltaY, e.timeStamp, e.ctrlKey || e.metaKey)
      if (!direction || !allowed(direction) || busy) return
      void commit(direction, 'trackpad', null)
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointercancel', onPointerCancel)
    container.addEventListener('click', onClick, { capture: true })
    container.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerCancel)
      container.removeEventListener('click', onClick, { capture: true })
      container.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(frame)
      animation?.cancel()
      setOffset(null)
    }
  }, [containerRef, contentRef])

  return { swipeCount }
}
