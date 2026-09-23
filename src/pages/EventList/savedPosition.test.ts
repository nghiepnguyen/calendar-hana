import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPosition, savePosition } from './savedPosition'

const POSITION = { anchorDate: '2026-10-05', start: '2026-06-01', end: '2027-03-31' }

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('savedPosition', () => {
  it('ghi rồi đọc lại', () => {
    savePosition(POSITION)
    expect(loadPosition()).toEqual(POSITION)
  })

  it('chưa lưu hoặc dữ liệu hỏng thì trả về null', () => {
    expect(loadPosition()).toBeNull()
    sessionStorage.setItem('event-list:position', '{hỏng')
    expect(loadPosition()).toBeNull()
    sessionStorage.setItem('event-list:position', JSON.stringify({ ...POSITION, start: '1/6' }))
    expect(loadPosition()).toBeNull()
    sessionStorage.setItem(
      'event-list:position',
      JSON.stringify({ ...POSITION, anchorDate: '2027-05-01' }),
    )
    expect(loadPosition()).toBeNull()
  })

  it('sessionStorage lỗi thì bỏ qua', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => savePosition(POSITION)).not.toThrow()
    expect(loadPosition()).toBeNull()
  })
})
