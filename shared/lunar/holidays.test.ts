import { describe, expect, it } from 'vitest'
import { getHolidays } from './holidays'
import { solarToLunar } from './lunar'

function holidayNames(day: number, month: number, year: number): string[] {
  return getHolidays({ day, month, year }, solarToLunar(day, month, year)).map((h) => h.name)
}

describe('getHolidays', () => {
  it('Tết Nguyên Đán 2026 là 17/2/2026, Giao thừa là 16/2/2026', () => {
    expect(holidayNames(17, 2, 2026)).toEqual(['Tết Nguyên Đán'])
    expect(holidayNames(16, 2, 2026)).toEqual(['Giao thừa'])
    expect(holidayNames(18, 2, 2026)).toEqual(['Mùng 2 Tết'])
  })

  it('ngày lễ âm lịch khác trong năm 2026', () => {
    expect(holidayNames(26, 4, 2026)).toEqual(['Giỗ Tổ Hùng Vương'])
    expect(holidayNames(25, 9, 2026)).toEqual(['Tết Trung Thu'])
  })

  it('ngày lễ dương lịch', () => {
    expect(holidayNames(2, 9, 2026)).toEqual(['Quốc khánh'])
    const [reunification] = getHolidays(
      { day: 30, month: 4, year: 2026 },
      solarToLunar(30, 4, 2026),
    )
    expect(reunification).toEqual({
      name: 'Ngày Giải phóng miền Nam',
      calendar: 'solar',
      isPublicHoliday: true,
    })
    expect(holidayNames(3, 9, 2026)).toEqual([])
  })

  it('không tính ngày lễ âm lịch trong tháng nhuận', () => {
    // 2020 nhuận tháng 4: 15/4 thường là 7/5/2020, 15/4 nhuận là 6/6/2020.
    expect(holidayNames(7, 5, 2020)).toContain('Lễ Phật Đản')
    expect(holidayNames(6, 6, 2020)).toEqual([])
  })

  it('Giao thừa là ngày cuối tháng Chạp, dù tháng đủ hay thiếu', () => {
    // Tháng Chạp Kỷ Hợi đủ 30 ngày: Giao thừa 24/1/2020 là 30 Tết.
    expect(solarToLunar(24, 1, 2020)).toMatchObject({ day: 30, month: 12 })
    expect(holidayNames(24, 1, 2020)).toEqual(['Giao thừa'])
    // Tháng Chạp Giáp Thìn thiếu: Giao thừa 28/1/2025 là 29 Tết, năm đó không có 30 Tết.
    expect(solarToLunar(28, 1, 2025)).toMatchObject({ day: 29, month: 12, year: 2024 })
    expect(holidayNames(28, 1, 2025)).toEqual(['Giao thừa'])
    expect(holidayNames(27, 1, 2025)).toEqual([])
  })
})
