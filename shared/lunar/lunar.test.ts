import { describe, expect, it } from 'vitest'
import { jdFromDate, jdToDate } from './julian'
import {
  getLeapMonth,
  getLunarMonthLength,
  lunarToSolar,
  MAX_YEAR,
  MIN_YEAR,
  solarToLunar,
} from './lunar'

describe('solarToLunar', () => {
  // Nguồn: lịch Tết Nguyên Đán Việt Nam (UTC+7).
  const tetDates: [number, number, number][] = [
    [2020, 1, 25],
    [2021, 2, 12],
    [2022, 2, 1],
    [2023, 1, 22],
    [2024, 2, 10],
    [2025, 1, 29],
    [2026, 2, 17],
    [2027, 2, 6],
    [2028, 1, 26],
    [2029, 2, 13],
    // Sóc lúc 23h07 ngày 2/2/2030 giờ Việt Nam (Trung Quốc: 3/2).
    [2030, 2, 2],
  ]

  it.each(tetDates)('Tết năm %i là ngày %i/%i dương lịch', (year, month, day) => {
    expect(solarToLunar(day, month, year)).toEqual({ day: 1, month: 1, year, isLeap: false })
  })

  it('ngày trước Tết là ngày cuối tháng Chạp năm trước', () => {
    const giaoThua = solarToLunar(16, 2, 2026)
    expect(giaoThua).toMatchObject({ month: 12, year: 2025, isLeap: false })
    expect(giaoThua.day === 29 || giaoThua.day === 30).toBe(true)
  })

  it('dùng múi giờ UTC+7: Tết 1985 và 2007 khác lịch Trung Quốc', () => {
    // Trung Quốc: 20/2/1985 và 18/2/2007.
    expect(solarToLunar(21, 1, 1985)).toEqual({ day: 1, month: 1, year: 1985, isLeap: false })
    expect(solarToLunar(17, 2, 2007)).toEqual({ day: 1, month: 1, year: 2007, isLeap: false })
  })

  it('ngày lịch sử và ngày đã biết', () => {
    expect(solarToLunar(2, 9, 1945)).toEqual({ day: 26, month: 7, year: 1945, isLeap: false })
    expect(solarToLunar(23, 9, 2026)).toEqual({ day: 13, month: 8, year: 2026, isLeap: false })
    // Trung Thu 2026.
    expect(solarToLunar(25, 9, 2026)).toEqual({ day: 15, month: 8, year: 2026, isLeap: false })
  })

  it('nhận ra tháng nhuận', () => {
    // 2020 nhuận tháng 4: 1/4 nhuận là 23/5/2020.
    expect(solarToLunar(23, 5, 2020)).toEqual({ day: 1, month: 4, year: 2020, isLeap: true })
    // 2025 nhuận tháng 6: 1/6 nhuận là 25/7/2025.
    expect(solarToLunar(25, 7, 2025)).toEqual({ day: 1, month: 6, year: 2025, isLeap: true })
  })

  it('báo lỗi khi năm ngoài khoảng hỗ trợ', () => {
    expect(() => solarToLunar(1, 1, 1800)).toThrow(RangeError)
    expect(() => solarToLunar(1, 1, 2300)).toThrow(RangeError)
  })
})

describe('getLeapMonth', () => {
  it.each([
    [2012, 4],
    [2014, 9],
    [2017, 6],
    [2020, 4],
    [2023, 2],
    [2025, 6],
    [2028, 5],
  ])('năm %i nhuận tháng %i', (year, month) => {
    expect(getLeapMonth(year)).toBe(month)
  })

  it.each([2021, 2022, 2024, 2026, 2027])('năm %i không có tháng nhuận', (year) => {
    expect(getLeapMonth(year)).toBeNull()
  })
})

describe('lunarToSolar', () => {
  it('đổi ngày âm thường và tháng nhuận', () => {
    expect(lunarToSolar(1, 1, 2026)).toEqual({ day: 17, month: 2, year: 2026 })
    expect(lunarToSolar(15, 8, 2026)).toEqual({ day: 25, month: 9, year: 2026 })
    expect(lunarToSolar(1, 4, 2020, true)).toEqual({ day: 23, month: 5, year: 2020 })
  })

  it('trả null cho tháng nhuận không tồn tại', () => {
    expect(lunarToSolar(1, 4, 2021, true)).toBeNull()
    expect(lunarToSolar(1, 5, 2020, true)).toBeNull()
  })

  it('trả null cho ngày 30 ở tháng thiếu và ngày không hợp lệ', () => {
    let foundShortMonth = false
    for (let month = 1; month <= 12; month++) {
      if (getLunarMonthLength(month, 2026) === 29) {
        expect(lunarToSolar(30, month, 2026)).toBeNull()
        foundShortMonth = true
      }
    }
    expect(foundShortMonth).toBe(true)
    expect(lunarToSolar(0, 1, 2026)).toBeNull()
    expect(lunarToSolar(31, 1, 2026)).toBeNull()
    expect(lunarToSolar(1, 13, 2026)).toBeNull()
  })

  it('độ dài tháng âm là 29 hoặc 30, năm có 353–355 hoặc 383–385 ngày', () => {
    for (let year = 2000; year <= 2050; year++) {
      const leap = getLeapMonth(year)
      let total = 0
      for (let month = 1; month <= 12; month++) {
        const length = getLunarMonthLength(month, year)
        expect([29, 30]).toContain(length)
        total += length!
        if (leap === month) total += getLunarMonthLength(month, year, true)!
      }
      if (leap) expect(total).toBeGreaterThanOrEqual(383)
      else expect(total).toBeGreaterThanOrEqual(353)
      expect(total).toBeLessThanOrEqual(leap ? 385 : 355)
    }
  })
})

describe(`chuyển đổi 2 chiều ${MIN_YEAR}–${MAX_YEAR}`, () => {
  it('dương → âm → dương ra đúng ngày ban đầu và ngày âm liên tục', () => {
    const start = jdFromDate(1, 1, MIN_YEAR)
    const end = jdFromDate(31, 12, MAX_YEAR)
    let previous = solarToLunar(1, 1, MIN_YEAR)
    for (let jd = start; jd <= end; jd++) {
      const solar = jdToDate(jd)
      const lunar = solarToLunar(solar.day, solar.month, solar.year)
      const back = lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.isLeap)
      if (
        !back ||
        back.day !== solar.day ||
        back.month !== solar.month ||
        back.year !== solar.year
      ) {
        throw new Error(
          `Sai ở ${solar.day}/${solar.month}/${solar.year}: âm ${JSON.stringify(lunar)} → ${JSON.stringify(back)}`,
        )
      }
      if (jd > start) {
        const continues = lunar.day === previous.day + 1
        const newMonth = lunar.day === 1 && (previous.day === 29 || previous.day === 30)
        if (!continues && !newMonth) {
          throw new Error(`Ngày âm không liên tục ở ${solar.day}/${solar.month}/${solar.year}`)
        }
      }
      previous = lunar
    }
  })
})
