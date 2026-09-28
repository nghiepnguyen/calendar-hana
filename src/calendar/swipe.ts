// Nhận diện cử chỉ vuốt ngang để sang trang lịch trước/sau. Chỉ gồm hàm thuần, không đụng DOM.

/** Ngón tay đi quá quãng này (px) mới quyết định là vuốt ngang hay cuộn dọc. */
export const LOCK_DISTANCE = 10
/** Vùng sát mép màn hình (px) nhường cho cử chỉ "vuốt từ mép để quay lại" của trình duyệt. */
export const EDGE_GUARD = 24
/** Vuốt quá tỉ lệ này của chiều rộng vùng lịch là sang trang. */
export const DISTANCE_RATIO = 0.25
/** Vuốt nhanh vẫn phải đi được quãng tối thiểu này (px). */
export const MIN_FLING_DISTANCE = 40
/** Vận tốc (px/ms) tính là vuốt nhanh. */
export const FLING_VELOCITY = 0.5
/** Tính vận tốc trên các mẫu trong khoảng thời gian cuối này (ms). */
export const VELOCITY_WINDOW_MS = 100
/** Lúc thả tay mà ngón tay còn đi ngược chiều nhanh hơn mức này (px/ms) thì coi là hủy. */
const REVERSE_VELOCITY = 0.1
/** Tổng deltaX của trackpad (px) để sang một trang. */
export const TRACKPAD_THRESHOLD = 80
/** Trackpad đứng yên chừng này (ms) thì coi là hết cú vuốt, kể cả quán tính. */
export const TRACKPAD_IDLE_MS = 300
/** Thời gian mỗi bước trượt ra / trượt vào (ms). */
export const SLIDE_MS = 150
/** Thời gian bật về chỗ cũ (ms). */
export const SNAP_BACK_MS = 200

export type SwipeDirection = 'next' | 'prev'

export interface VelocitySample {
  x: number
  t: number
}

/** Chưa đủ xa thì null. Góc đúng 45° tính là dọc, để ưu tiên cuộn. */
export function lockDirection(dx: number, dy: number): 'horizontal' | 'vertical' | null {
  if (Math.hypot(dx, dy) < LOCK_DISTANCE) return null
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
}

/** Vận tốc ngang (px/ms) trên các mẫu trong VELOCITY_WINDOW_MS cuối. */
export function velocityOf(samples: readonly VelocitySample[]): number {
  if (samples.length < 2) return 0
  const last = samples[samples.length - 1]
  const recent = samples.filter((s) => last.t - s.t <= VELOCITY_WINDOW_MS)
  const first = recent[0]
  const dt = last.t - first.t
  return dt > 0 ? (last.x - first.x) / dt : 0
}

/** Thả tay thì có sang trang không: đủ xa, hoặc đủ nhanh; kéo ngược lại thì không. */
export function isSwipeCommitted({
  dx,
  velocity,
  width,
}: {
  dx: number
  velocity: number
  width: number
}): boolean {
  if (dx === 0) return false
  if (Math.sign(velocity) === -Math.sign(dx) && Math.abs(velocity) > REVERSE_VELOCITY) return false
  const distance = Math.abs(dx)
  if (distance >= width * DISTANCE_RATIO) return true
  return Math.abs(velocity) >= FLING_VELOCITY && distance >= MIN_FLING_DISTANCE
}

/** Ngón tay đi sang trái (dx < 0) là trang sau. */
export function directionOf(dx: number): SwipeDirection {
  return dx < 0 ? 'next' : 'prev'
}

/** Không còn trang để đi: nội dung chỉ nhích 1/3 quãng ngón tay. */
export function rubberBand(dx: number): number {
  return dx / 3
}

/** Cú chạm bắt đầu sát mép màn hình. App đã cài (standalone) không có cử chỉ mép nên không chặn. */
export function isEdgeStart(clientX: number, viewportWidth: number, standalone: boolean): boolean {
  if (standalone) return false
  return clientX < EDGE_GUARD || clientX > viewportWidth - EDGE_GUARD
}

export interface TrackpadAccumulator {
  /** Trả hướng khi đủ quãng để sang trang, còn lại null. */
  push(deltaX: number, deltaY: number, time: number, zoom: boolean): SwipeDirection | null
}

/**
 * Cộng dồn sự kiện wheel ngang của trackpad. Một cú vuốt chỉ sang một trang: sang xong thì
 * bỏ qua mọi sự kiện (quán tính) cho tới khi trackpad đứng yên TRACKPAD_IDLE_MS.
 */
export function createTrackpadAccumulator(): TrackpadAccumulator {
  let total = 0
  let locked = false
  let lastTime = -Infinity

  return {
    push(deltaX, deltaY, time, zoom) {
      if (zoom || Math.abs(deltaX) <= Math.abs(deltaY)) return null
      const idle = time - lastTime >= TRACKPAD_IDLE_MS
      lastTime = time
      if (idle) {
        locked = false
        total = 0
      }
      if (locked) return null
      total += deltaX
      if (Math.abs(total) <= TRACKPAD_THRESHOLD) return null
      const direction: SwipeDirection = total > 0 ? 'next' : 'prev'
      total = 0
      locked = true
      return direction
    },
  }
}
