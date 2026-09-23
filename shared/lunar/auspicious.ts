// Ngày hoàng đạo / hắc đạo, giờ hoàng đạo và các ngày kỵ cơ bản.
//
// Nguồn tham chiếu: phép "Thập nhị Hoàng đạo" (12 vị thần trực ngày/giờ) như trong các cuốn
// lịch vạn niên phổ biến ở Việt Nam. Ngày hoàng đạo tính theo tháng âm lịch (không theo tháng
// tiết khí), vì phần lớn lịch treo tường Việt Nam tính như vậy. Tháng nhuận dùng quy tắc của
// tháng thường cùng số. Nếu đổi nguồn (PRD mục 9, câu hỏi 1), chỉ cần sửa file này.

import { CHI } from './canChi'

/** 12 vị thần theo thứ tự luân phiên, bắt đầu từ Thanh Long. */
export const TWELVE_GODS = [
  { name: 'Thanh Long', good: true },
  { name: 'Minh Đường', good: true },
  { name: 'Thiên Hình', good: false },
  { name: 'Chu Tước', good: false },
  { name: 'Kim Quỹ', good: true },
  { name: 'Kim Đường', good: true },
  { name: 'Bạch Hổ', good: false },
  { name: 'Ngọc Đường', good: true },
  { name: 'Thiên Lao', good: false },
  { name: 'Huyền Vũ', good: false },
  { name: 'Tư Mệnh', good: true },
  { name: 'Câu Trận', good: false },
] as const

export interface DayGod {
  name: string
  /** true = ngày hoàng đạo, false = ngày hắc đạo. */
  isHoangDao: boolean
}

/**
 * Vị thần trực ngày, dựa vào tháng âm và Chi của ngày.
 * Thanh Long khởi ở: tháng 1, 7 → Tý; 2, 8 → Dần; 3, 9 → Thìn; 4, 10 → Ngọ; 5, 11 → Thân; 6, 12 → Tuất.
 */
export function getDayGod(lunarMonth: number, dayChi: number): DayGod {
  const startChi = ((lunarMonth - 1) % 6) * 2
  const god = TWELVE_GODS[(dayChi - startChi + 12) % 12]
  return { name: god.name, isHoangDao: god.good }
}

export interface AuspiciousHour {
  chi: number
  /** Ví dụ "Tý". */
  name: string
  /** Giờ bắt đầu (0..23), ví dụ Tý là 23. */
  startHour: number
  /** Giờ kết thúc, ví dụ Tý là 1. */
  endHour: number
  /** Ví dụ "Tý (23h–1h)". */
  label: string
  god: string
}

function hourRange(chi: number): { startHour: number; endHour: number } {
  const startHour = (23 + chi * 2) % 24
  return { startHour, endHour: (startHour + 2) % 24 }
}

/**
 * 6 giờ hoàng đạo trong ngày, dựa vào Chi của ngày.
 * Thanh Long của giờ khởi ở: ngày Tý, Ngọ → giờ Thân; Sửu, Mùi → Tuất; Dần, Thân → Tý;
 * Mão, Dậu → Dần; Thìn, Tuất → Thìn; Tỵ, Hợi → Ngọ.
 */
export function getAuspiciousHours(dayChi: number): AuspiciousHour[] {
  const startChi = (8 + (dayChi % 6) * 2) % 12
  const hours: AuspiciousHour[] = []
  for (let chi = 0; chi < 12; chi++) {
    const god = TWELVE_GODS[(chi - startChi + 12) % 12]
    if (!god.good) continue
    const { startHour, endHour } = hourRange(chi)
    hours.push({
      chi,
      name: CHI[chi],
      startHour,
      endHour,
      label: `${CHI[chi]} (${startHour}h-${endHour}h)`,
      god: god.name,
    })
  }
  return hours
}

export interface BadDay {
  name: string
  description: string
}

const TAM_NUONG_DAYS = new Set([3, 7, 13, 18, 22, 27])
const NGUYET_KY_DAYS = new Set([5, 14, 23])

/** Các ngày kỵ theo ngày âm: Tam Nương, Nguyệt Kỵ. */
export function getBadDays(lunarDay: number): BadDay[] {
  const result: BadDay[] = []
  if (TAM_NUONG_DAYS.has(lunarDay)) {
    result.push({
      name: 'Tam Nương',
      description: 'Kỵ khởi công, cưới hỏi, xuất hành, khai trương.',
    })
  }
  if (NGUYET_KY_DAYS.has(lunarDay)) {
    result.push({
      name: 'Nguyệt Kỵ',
      description: 'Kỵ đi xa, làm việc lớn.',
    })
  }
  return result
}
