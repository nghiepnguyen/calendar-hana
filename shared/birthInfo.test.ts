import { describe, expect, it } from 'vitest'
import { isValidBirthDate, isValidBirthTime } from './birthInfo'

describe('thông tin ngày sinh', () => {
  it('ngày sinh đầy đủ và đúng ngày thực tế, không ở tương lai', () => {
    expect(isValidBirthDate('2000-02-29')).toBe(true)
    for (const date of ['2001-02-29', '0000-01-01', '9999-01-01', '2000-2-29', null]) {
      expect(isValidBirthDate(date)).toBe(false)
    }
  })
  it('giờ sinh ở định dạng 24 giờ, kể cả nửa đêm', () => {
    expect(isValidBirthTime('00:00')).toBe(true)
    expect(isValidBirthTime('23:59')).toBe(true)
    for (const time of ['24:00', '12:60', '7:30', null]) expect(isValidBirthTime(time)).toBe(false)
  })
})
