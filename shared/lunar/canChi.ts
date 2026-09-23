// Can Chi (Thiên Can + Địa Chi) của năm, tháng, ngày, giờ.

import type { LunarDate } from '../types'

export const CAN = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const
export const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const

export interface CanChi {
  /** Chỉ số Can 0..9 (0 = Giáp). */
  can: number
  /** Chỉ số Chi 0..11 (0 = Tý). */
  chi: number
  /** Ví dụ "Bính Ngọ". */
  name: string
}

function makeCanChi(can: number, chi: number): CanChi {
  const c = ((can % 10) + 10) % 10
  const h = ((chi % 12) + 12) % 12
  return { can: c, chi: h, name: `${CAN[c]} ${CHI[h]}` }
}

/** Can Chi của năm âm lịch. Ví dụ 2026 → Bính Ngọ. */
export function yearCanChi(lunarYear: number): CanChi {
  return makeCanChi(lunarYear + 6, lunarYear + 8)
}

/**
 * Can Chi của tháng âm lịch. Tháng Giêng luôn là tháng Dần.
 * Tháng nhuận dùng chung Can Chi với tháng thường cùng số (theo cách ghi của lịch Việt Nam phổ biến).
 */
export function monthCanChi(lunar: Pick<LunarDate, 'month' | 'year'>): CanChi {
  return makeCanChi(lunar.year * 12 + lunar.month + 3, lunar.month + 1)
}

/** Can Chi của ngày, tính từ số ngày Julius. Ví dụ 1/1/2000 → Mậu Ngọ. */
export function dayCanChi(jd: number): CanChi {
  return makeCanChi(jd + 9, jd + 1)
}

/** Can của giờ Tý (giờ đầu tiên) trong ngày jd. Giờ thứ i trong ngày có Can = (kết quả + i). */
export function firstHourCan(jd: number): number {
  return ((jd - 1) * 2) % 10
}

/** Can Chi của giờ thứ chiIndex (0 = Tý ... 11 = Hợi) trong ngày jd. */
export function hourCanChi(jd: number, chiIndex: number): CanChi {
  return makeCanChi(firstHourCan(jd) + chiIndex, chiIndex)
}
