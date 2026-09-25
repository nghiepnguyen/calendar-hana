import { describe, expect, it } from 'vitest'
import { jdFromDate, solarStringToJd } from './julian'
import { getSolarTerm, solarTermMonthChi } from './solarTerms'

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

describe('solarTermMonthChi', () => {
  it('tiết giao lúc nào trong ngày thì ngày đó đã sang tháng mới', () => {
    // Lập xuân 2026 giao khoảng 3h sáng 4/2; Bạch lộ 2026 giao khoảng 21h45 ngày 7/9.
    expect(solarTermMonthChi(solarStringToJd('2026-02-03'))).toBe(1) // Sửu
    expect(solarTermMonthChi(solarStringToJd('2026-02-04'))).toBe(2) // Dần
    expect(solarTermMonthChi(solarStringToJd('2026-09-06'))).toBe(8) // Thân
    expect(solarTermMonthChi(solarStringToJd('2026-09-07'))).toBe(9) // Dậu
    expect(solarTermMonthChi(solarStringToJd('2026-12-31'))).toBe(0) // Tý (sau Đại tuyết)
  })
})
