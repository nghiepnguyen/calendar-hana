// Ngày lễ Việt Nam theo dương lịch và âm lịch (PRD mục 17).

import type { LunarDate } from '../types'
import type { SolarDate } from './julian'
import { getLunarMonthLength } from './lunar'

export interface Holiday {
  name: string
  calendar: 'solar' | 'lunar'
  /** true = ngày nghỉ lễ chính thức (hiển thị màu đỏ). */
  isPublicHoliday: boolean
}

interface HolidayRule {
  day: number
  month: number
  name: string
  isPublicHoliday?: boolean
}

export const SOLAR_HOLIDAYS: HolidayRule[] = [
  { day: 1, month: 1, name: 'Tết Dương lịch', isPublicHoliday: true },
  { day: 14, month: 2, name: 'Lễ Tình nhân' },
  { day: 27, month: 2, name: 'Ngày Thầy thuốc Việt Nam' },
  { day: 8, month: 3, name: 'Quốc tế Phụ nữ' },
  { day: 26, month: 3, name: 'Ngày thành lập Đoàn TNCS Hồ Chí Minh' },
  { day: 30, month: 4, name: 'Ngày Giải phóng miền Nam', isPublicHoliday: true },
  { day: 1, month: 5, name: 'Quốc tế Lao động', isPublicHoliday: true },
  { day: 19, month: 5, name: 'Ngày sinh Chủ tịch Hồ Chí Minh' },
  { day: 1, month: 6, name: 'Quốc tế Thiếu nhi' },
  { day: 28, month: 6, name: 'Ngày Gia đình Việt Nam' },
  { day: 27, month: 7, name: 'Ngày Thương binh Liệt sĩ' },
  { day: 19, month: 8, name: 'Ngày Cách mạng tháng Tám' },
  { day: 2, month: 9, name: 'Quốc khánh', isPublicHoliday: true },
  { day: 10, month: 10, name: 'Ngày Giải phóng Thủ đô' },
  { day: 20, month: 10, name: 'Ngày Phụ nữ Việt Nam' },
  { day: 20, month: 11, name: 'Ngày Nhà giáo Việt Nam' },
  { day: 22, month: 12, name: 'Ngày thành lập Quân đội Nhân dân' },
  { day: 24, month: 12, name: 'Lễ Giáng sinh' },
]

export const LUNAR_HOLIDAYS: HolidayRule[] = [
  { day: 1, month: 1, name: 'Tết Nguyên Đán', isPublicHoliday: true },
  { day: 2, month: 1, name: 'Mùng 2 Tết', isPublicHoliday: true },
  { day: 3, month: 1, name: 'Mùng 3 Tết', isPublicHoliday: true },
  { day: 15, month: 1, name: 'Tết Nguyên Tiêu (Rằm tháng Giêng)' },
  { day: 3, month: 3, name: 'Tết Hàn thực' },
  { day: 10, month: 3, name: 'Giỗ Tổ Hùng Vương', isPublicHoliday: true },
  { day: 15, month: 4, name: 'Lễ Phật Đản' },
  { day: 5, month: 5, name: 'Tết Đoan Ngọ' },
  { day: 15, month: 7, name: 'Lễ Vu Lan' },
  { day: 15, month: 8, name: 'Tết Trung Thu' },
  { day: 23, month: 12, name: 'Ông Công ông Táo' },
]

/** Ngày lễ của một ngày, biết cả ngày dương và ngày âm tương ứng. */
export function getHolidays(solar: SolarDate, lunar: LunarDate): Holiday[] {
  const result: Holiday[] = []
  for (const rule of SOLAR_HOLIDAYS) {
    if (rule.day === solar.day && rule.month === solar.month) {
      result.push({ name: rule.name, calendar: 'solar', isPublicHoliday: !!rule.isPublicHoliday })
    }
  }
  // Ngày lễ âm lịch không tính trong tháng nhuận.
  if (!lunar.isLeap) {
    for (const rule of LUNAR_HOLIDAYS) {
      if (rule.day === lunar.day && rule.month === lunar.month) {
        result.push({ name: rule.name, calendar: 'lunar', isPublicHoliday: !!rule.isPublicHoliday })
      }
    }
    // Giao thừa: ngày cuối tháng Chạp (29 hoặc 30).
    if (lunar.month === 12 && lunar.day === getLunarMonthLength(12, lunar.year, false)) {
      result.push({ name: 'Giao thừa', calendar: 'lunar', isPublicHoliday: true })
    }
  }
  return result
}
