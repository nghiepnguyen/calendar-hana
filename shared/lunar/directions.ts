// Hướng Hỷ Thần, Tài Thần và Phúc Thần, tra theo Can của ngày.
//
// Source policy is frozen in docs/audits/directions-provenance.md.
// - Hỷ Thần: 欽定協紀辨方書 卷七〈喜神〉, corroborated by 玉匣記〈喜神方位歌〉.
// - Tài Thần: project convention 玉匣記〈財神方位歌〉.
// - Phúc Thần: 玉匣記〈福神方位歌〉.
//
// Do not replace these tables by website majority vote. A change to another 財神 tradition is an
// explicit convention migration and requires a new authority/Golden version.

export interface TravelDirections {
  /** Ví dụ "Nam". */
  hyThan: string
  taiThan: string
  phucThan: string
}

/** Theo thứ tự Can Giáp..Quý: [Hỷ Thần, Tài Thần, Phúc Thần]. */
const DIRECTIONS: readonly (readonly [string, string, string])[] = [
  ['Đông Bắc', 'Đông Bắc', 'Đông Nam'],
  ['Tây Bắc', 'Đông Bắc', 'Đông Nam'],
  ['Tây Nam', 'Tây Nam', 'Đông'],
  ['Nam', 'Tây Nam', 'Đông'],
  ['Đông Nam', 'Bắc', 'Bắc'],
  ['Đông Bắc', 'Bắc', 'Nam'],
  ['Tây Bắc', 'Đông', 'Tây Nam'],
  ['Tây Nam', 'Đông', 'Tây Nam'],
  ['Nam', 'Nam', 'Tây Bắc'],
  ['Đông Nam', 'Nam', 'Tây'],
]

export function getTravelDirections(dayCan: number): TravelDirections {
  const [hyThan, taiThan, phucThan] = DIRECTIONS[dayCan]
  return { hyThan, taiThan, phucThan }
}
