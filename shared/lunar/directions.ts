// Hướng xuất hành: Hỷ Thần và Tài Thần, tra theo Can của ngày.
//
// Nguồn đối chiếu: licham.vn (mục "Hướng xuất hành"), đối chiếu 2025–2026. Hướng ghi ngắn ("Nam"
// thay cho "Chính Nam" của licham.vn) như xemngay.com và lichviet.me.

export interface TravelDirections {
  /** Ví dụ "Nam". */
  hyThan: string
  taiThan: string
}

/** Theo thứ tự Can Giáp..Quý: [Hỷ Thần, Tài Thần]. */
const DIRECTIONS: readonly (readonly [string, string])[] = [
  ['Đông Bắc', 'Đông Nam'],
  ['Tây Bắc', 'Đông Nam'],
  ['Tây Nam', 'Đông'],
  ['Nam', 'Đông'],
  // licham.vn ghi Tài Thần ngày Mậu là Nam; xemngay.com, lichviet.me, thoigian.com.vn đều ghi Bắc.
  ['Đông Nam', 'Bắc'],
  ['Đông Bắc', 'Nam'],
  ['Tây Bắc', 'Tây Nam'],
  ['Tây Nam', 'Tây Nam'],
  ['Nam', 'Tây'],
  ['Đông Nam', 'Tây'],
]

export function getTravelDirections(dayCan: number): TravelDirections {
  const [hyThan, taiThan] = DIRECTIONS[dayCan]
  return { hyThan, taiThan }
}
