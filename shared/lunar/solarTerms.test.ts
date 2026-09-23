import { describe, expect, it } from 'vitest'
import { jdFromDate } from './julian'
import { getSolarTerm } from './solarTerms'

describe('getSolarTerm', () => {
  // Ngày bắt đầu tiết khí năm 2026 theo giờ Việt Nam.
  it.each([
    [4, 2, 'Lập xuân'],
    [20, 3, 'Xuân phân'],
    [21, 6, 'Hạ chí'],
    [23, 9, 'Thu phân'],
    [22, 12, 'Đông chí'],
  ])('%i/%i/2026 bắt đầu tiết %s', (day, month, name) => {
    const jd = jdFromDate(day, month, 2026)
    expect(getSolarTerm(jd)).toMatchObject({ name, startsToday: true })
    // Ngày hôm trước vẫn thuộc tiết khí cũ.
    const previous = getSolarTerm(jd - 1)
    expect(previous.name).not.toBe(name)
    expect(previous.startsToday).toBe(false)
    // Ngày hôm sau vẫn là tiết khí này nhưng không phải ngày bắt đầu.
    expect(getSolarTerm(jd + 1)).toMatchObject({ name, startsToday: false })
  })

  it('mỗi năm có đúng 24 ngày bắt đầu tiết khí', () => {
    let count = 0
    for (let jd = jdFromDate(1, 1, 2026); jd <= jdFromDate(31, 12, 2026); jd++) {
      if (getSolarTerm(jd).startsToday) count++
    }
    expect(count).toBe(24)
  })
})
