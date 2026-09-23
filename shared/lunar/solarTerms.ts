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
