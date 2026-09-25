// 24 tiết khí, mỗi tiết khí ứng với 15° kinh độ Mặt Trời.

import { sunLongitude, TIME_ZONE_OFFSET } from './lunar'

/** Tên tiết khí theo thứ tự kinh độ Mặt Trời 0°, 15°, 30°... (0° = Xuân phân). */
export const SOLAR_TERMS = [
  'Xuân phân',
  'Thanh minh',
  'Cốc vũ',
  'Lập hạ',
  'Tiểu mãn',
  'Mang chủng',
  'Hạ chí',
  'Tiểu thử',
  'Đại thử',
  'Lập thu',
  'Xử thử',
  'Bạch lộ',
  'Thu phân',
  'Hàn lộ',
  'Sương giáng',
  'Lập đông',
  'Tiểu tuyết',
  'Đại tuyết',
  'Đông chí',
  'Tiểu hàn',
  'Đại hàn',
  'Lập xuân',
  'Vũ thủy',
  'Kinh trập',
] as const

/** Chỉ số tiết khí (0..23) lúc 0h giờ Việt Nam của ngày jd. */
function termIndexAtStartOfDay(jd: number): number {
  return Math.floor((sunLongitude(jd - 0.5 - TIME_ZONE_OFFSET / 24) / Math.PI) * 12)
}

export interface SolarTermInfo {
  /** Chỉ số tiết khí đang diễn ra (0..23). */
  index: number
  name: string
  /** true nếu tiết khí này bắt đầu trong ngày jd. */
  startsToday: boolean
}

/** Tiết khí đang diễn ra trong ngày jd (tính theo cuối ngày, giờ Việt Nam). */
export function getSolarTerm(jd: number): SolarTermInfo {
  const atStart = termIndexAtStartOfDay(jd)
  const atEnd = termIndexAtStartOfDay(jd + 1)
  return { index: atEnd, name: SOLAR_TERMS[atEnd], startsToday: atStart !== atEnd }
}

/**
 * Chi của tháng tiết khí chứa ngày jd. Tháng Dần bắt đầu từ Lập xuân, tháng Mão từ Kinh trập,
 * rồi cứ hai tiết khí sang một tháng. Tiết giao lúc nào trong ngày thì ngày đó đã thuộc tháng mới
 * (cùng cách tính với getSolarTerm). Cách này khớp thoigian.com.vn ở cả 24 ngày bắt đầu tiết
 * 2025–2026; licham.vn và xemngay.com dùng bảng tiết riêng nên có ngày lệch một ngày.
 */
export function solarTermMonthChi(jd: number): number {
  const { index } = getSolarTerm(jd)
  // Lập xuân có chỉ số 21: đếm số tháng tiết khí từ Lập xuân rồi cộng Chi Dần (2).
  return ((Math.floor((index - 21 + 24) / 2) % 12) + 2) % 12
}
