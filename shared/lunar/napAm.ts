// Nạp âm của 60 Hoa Giáp: mỗi cặp Can Chi liền nhau (Giáp Tý – Ất Sửu...) chung một nạp âm.
//
// Tên theo cách ghi phổ biến (xemngay.com, lichviet.me); licham.vn ghi "Kim Bạc Kim" thay cho
// "Kim Bạch Kim".

import type { CanChi } from './canChi'
import type { NguHanh } from './elements'

/** 30 nạp âm theo thứ tự 60 Hoa Giáp, bắt đầu từ Giáp Tý – Ất Sửu. */
export const NAP_AM = [
  'Hải Trung Kim',
  'Lư Trung Hỏa',
  'Đại Lâm Mộc',
  'Lộ Bàng Thổ',
  'Kiếm Phong Kim',
  'Sơn Đầu Hỏa',
  'Giản Hạ Thủy',
  'Thành Đầu Thổ',
  'Bạch Lạp Kim',
  'Dương Liễu Mộc',
  'Tuyền Trung Thủy',
  'Ốc Thượng Thổ',
  'Tích Lịch Hỏa',
  'Tùng Bách Mộc',
  'Trường Lưu Thủy',
  'Sa Trung Kim',
  'Sơn Hạ Hỏa',
  'Bình Địa Mộc',
  'Bích Thượng Thổ',
  'Kim Bạch Kim',
  'Phú Đăng Hỏa',
  'Thiên Hà Thủy',
  'Đại Trạch Thổ',
  'Thoa Chủy Kim',
  'Tang Đố Mộc',
  'Đại Khê Thủy',
  'Sa Trung Thổ',
  'Thiên Thượng Hỏa',
  'Thạch Lựu Mộc',
  'Đại Hải Thủy',
] as const

/** Vị trí 0..59 của một Can Chi trong vòng 60 Hoa Giáp (0 = Giáp Tý). */
export function sexagenaryIndex({ can, chi }: Pick<CanChi, 'can' | 'chi'>): number {
  return (((6 * can - 5 * chi) % 60) + 60) % 60
}

export interface NapAm {
  /** Ví dụ "Kim Bạch Kim". */
  name: string
  /** Hành của nạp âm (chữ cuối trong tên). */
  element: NguHanh
}

export function getNapAm(canChi: Pick<CanChi, 'can' | 'chi'>): NapAm {
  const name = NAP_AM[Math.floor(sexagenaryIndex(canChi) / 2)]
  return { name, element: name.split(' ').at(-1) as NguHanh }
}
