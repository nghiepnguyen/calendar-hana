import { describe, expect, it } from 'vitest'
import {
  createTrackpadAccumulator,
  directionOf,
  isEdgeStart,
  isSwipeCommitted,
  lockDirection,
  rubberBand,
  TRACKPAD_IDLE_MS,
  velocityOf,
} from './swipe'

/** Điểm cách gốc 20px theo góc (độ) so với trục ngang. */
function atAngle(degrees: number): [number, number] {
  const rad = (degrees * Math.PI) / 180
  return [20 * Math.cos(rad), 20 * Math.sin(rad)]
}

describe('lockDirection', () => {
  it('chưa đi quá 10px thì chưa quyết định', () => {
    expect(lockDirection(6, 6)).toBeNull()
    expect(lockDirection(-9, 0)).toBeNull()
  })

  it('nghiêng dưới 45° là ngang, từ 45° trở lên là dọc', () => {
    expect(lockDirection(...atAngle(0))).toBe('horizontal')
    expect(lockDirection(...atAngle(30))).toBe('horizontal')
    expect(lockDirection(15, 15)).toBe('vertical')
    expect(lockDirection(...atAngle(60))).toBe('vertical')
    expect(lockDirection(...atAngle(90))).toBe('vertical')
    expect(lockDirection(-20, 5)).toBe('horizontal')
  })
})

describe('velocityOf', () => {
  it('ít hơn 2 mẫu thì bằng 0', () => {
    expect(velocityOf([])).toBe(0)
    expect(velocityOf([{ x: 0, t: 0 }])).toBe(0)
  })

  it('chỉ tính các mẫu trong 100ms cuối', () => {
    const samples = [
      { x: 0, t: 0 },
      { x: 10, t: 200 },
      { x: 60, t: 300 },
    ]
    expect(velocityOf(samples)).toBeCloseTo(0.5)
  })
})

describe('isSwipeCommitted', () => {
  const width = 400

  it('vuốt đủ 25% chiều rộng thì sang trang', () => {
    expect(isSwipeCommitted({ dx: -100, velocity: 0, width })).toBe(true)
    expect(isSwipeCommitted({ dx: 100, velocity: 0, width })).toBe(true)
    expect(isSwipeCommitted({ dx: -99, velocity: 0, width })).toBe(false)
  })

  it('vuốt nhanh đủ 40px thì sang trang, thiếu quãng thì không', () => {
    expect(isSwipeCommitted({ dx: -40, velocity: -0.5, width })).toBe(true)
    expect(isSwipeCommitted({ dx: -39, velocity: -0.8, width })).toBe(false)
    expect(isSwipeCommitted({ dx: -60, velocity: -0.3, width })).toBe(false)
  })

  it('kéo ra rồi kéo ngược lại lúc thả thì hủy, dù đã đủ xa', () => {
    expect(isSwipeCommitted({ dx: -200, velocity: 0.4, width })).toBe(false)
    expect(isSwipeCommitted({ dx: 200, velocity: -0.4, width })).toBe(false)
  })

  it('đi ngược rất chậm (tay run) vẫn tính', () => {
    expect(isSwipeCommitted({ dx: -200, velocity: 0.05, width })).toBe(true)
  })

  it('không di chuyển thì không sang', () => {
    expect(isSwipeCommitted({ dx: 0, velocity: 0, width })).toBe(false)
  })
})

describe('directionOf và rubberBand', () => {
  it('ngón tay sang trái là trang sau', () => {
    expect(directionOf(-50)).toBe('next')
    expect(directionOf(50)).toBe('prev')
  })

  it('kéo cao su nhích 1/3 quãng', () => {
    expect(rubberBand(90)).toBe(30)
    expect(rubberBand(-90)).toBe(-30)
  })
})

describe('isEdgeStart', () => {
  it('chặn 24px sát hai mép trong trình duyệt', () => {
    expect(isEdgeStart(10, 400, false)).toBe(true)
    expect(isEdgeStart(390, 400, false)).toBe(true)
    expect(isEdgeStart(24, 400, false)).toBe(false)
    expect(isEdgeStart(200, 400, false)).toBe(false)
  })

  it('app đã cài thì không chặn mép', () => {
    expect(isEdgeStart(0, 400, true)).toBe(false)
    expect(isEdgeStart(399, 400, true)).toBe(false)
  })
})

describe('createTrackpadAccumulator', () => {
  /** Đẩy một chuỗi sự kiện cách nhau 16ms, trả các hướng nhận được. */
  function run(
    acc: ReturnType<typeof createTrackpadAccumulator>,
    deltas: number[],
    start = 0,
    deltaY = 0,
    zoom = false,
  ) {
    return deltas
      .map((dx, i) => acc.push(dx, deltaY, start + i * 16, zoom))
      .filter((d) => d !== null)
  }

  it('một cú vuốt kèm quán tính chỉ sang một trang', () => {
    const acc = createTrackpadAccumulator()
    expect(run(acc, [20, 30, 40, 40, 30, 20, 10, 5, 2, 1])).toEqual(['next'])
  })

  it('deltaX âm là trang trước', () => {
    const acc = createTrackpadAccumulator()
    expect(run(acc, [-50, -50])).toEqual(['prev'])
  })

  it('nghỉ đủ lâu thì cú vuốt mới sang được trang nữa', () => {
    const acc = createTrackpadAccumulator()
    expect(run(acc, [50, 50])).toEqual(['next'])
    expect(run(acc, [50, 50], 16 + TRACKPAD_IDLE_MS)).toEqual(['next'])
  })

  it('cú vuốt nhỏ bị bỏ dở thì không cộng dồn sang cú sau', () => {
    const acc = createTrackpadAccumulator()
    expect(run(acc, [30, 30])).toEqual([])
    expect(run(acc, [30], 16 + TRACKPAD_IDLE_MS)).toEqual([])
  })

  it('bỏ qua cuộn dọc và phóng to', () => {
    const acc = createTrackpadAccumulator()
    expect(run(acc, [50, 50, 50], 0, 100)).toEqual([])
    expect(run(acc, [50, 50, 50], 1000, 0, true)).toEqual([])
  })
})
