import { describe, expect, it } from 'vitest'
import { calculateSaoHan } from './saoHan'

describe('Sao chiếu mệnh và Hạn tuổi', () => {
  it('tính đúng ví dụ Nam 1990 xem năm 2026', () => {
    expect(calculateSaoHan(37, 'male')).toMatchObject({
      sao: 'La Hầu',
      han: 'Địa Võng',
      saoRemainder: 1,
      hanRemainder: 5,
    })
  })

  it('tính đúng ví dụ Nữ 1995 xem năm 2026', () => {
    expect(calculateSaoHan(32, 'female')).toMatchObject({
      sao: 'Thổ Tú',
      han: 'Toán Tận',
      saoRemainder: 5,
      hanRemainder: 0,
    })
  })

  it('dùng Thái Âm cho Nam mạng dư 8 theo tài liệu đã xác nhận', () => {
    expect(calculateSaoHan(44, 'male').sao).toBe('Thái Âm')
  })

  it.each([0, -1, 1.5])('từ chối tuổi mụ không hợp lệ: %s', (age) => {
    expect(() => calculateSaoHan(age, 'male')).toThrow(RangeError)
  })
})
