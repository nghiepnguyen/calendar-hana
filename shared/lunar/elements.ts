// Ngũ hành của Can, Chi và quan hệ sinh khắc giữa Can và Chi của một ngày.
//
// Tên ngày theo quan hệ Can Chi (bảo / nghĩa / chế / phạt / chuyên nhật) theo cách ghi của licham.vn.

import type { CanChi } from './canChi'

export type NguHanh = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ'

/** Ngũ hành của 10 Can, theo thứ tự Giáp..Quý. */
const CAN_ELEMENTS: readonly NguHanh[] = [
  'Mộc',
  'Mộc',
  'Hỏa',
  'Hỏa',
  'Thổ',
  'Thổ',
  'Kim',
  'Kim',
  'Thủy',
  'Thủy',
]

/** Ngũ hành của 12 Chi, theo thứ tự Tý..Hợi. */
const CHI_ELEMENTS: readonly NguHanh[] = [
  'Thủy',
  'Thổ',
  'Mộc',
  'Mộc',
  'Thổ',
  'Hỏa',
  'Hỏa',
  'Thổ',
  'Kim',
  'Kim',
  'Thổ',
  'Thủy',
]

/** Hành được sinh ra: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. */
const GENERATES: Record<NguHanh, NguHanh> = {
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim',
  Kim: 'Thủy',
  Thủy: 'Mộc',
}

/** Hành bị khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc. */
const OVERCOMES: Record<NguHanh, NguHanh> = {
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim',
  Kim: 'Mộc',
}

/** Hành sinh ra `element` (mẹ sinh con): Thủy sinh Mộc, nên generatorOf('Mộc') = 'Thủy'. */
export function generatorOf(element: NguHanh): NguHanh {
  return (Object.keys(GENERATES) as NguHanh[]).find((from) => GENERATES[from] === element)!
}

export function canElement(can: number): NguHanh {
  return CAN_ELEMENTS[can]
}

export function chiElement(chi: number): NguHanh {
  return CHI_ELEMENTS[chi]
}

export type CanChiRelationKind =
  'canSinhChi' | 'chiSinhCan' | 'canKhacChi' | 'chiKhacCan' | 'dongHanh'

export interface CanChiRelation {
  kind: CanChiRelationKind
  canElement: NguHanh
  chiElement: NguHanh
  /** Ví dụ "bảo nhật". */
  dayName: string
  /** true = ngày cát, false = ngày hung. */
  isGood: boolean
  /** "cát", "cát trung bình" hoặc "hung". */
  rating: string
  /** Ví dụ "Can sinh Chi (Thủy sinh Mộc), là ngày cát (bảo nhật)." */
  text: string
}

const RELATIONS: Record<
  CanChiRelationKind,
  { label: string; verb: string; dayName: string; isGood: boolean; rating: string }
> = {
  canSinhChi: {
    label: 'Can sinh Chi',
    verb: 'sinh',
    dayName: 'bảo nhật',
    isGood: true,
    rating: 'cát',
  },
  chiSinhCan: {
    label: 'Chi sinh Can',
    verb: 'sinh',
    dayName: 'nghĩa nhật',
    isGood: true,
    rating: 'cát',
  },
  canKhacChi: {
    label: 'Can khắc Chi',
    verb: 'khắc',
    dayName: 'chế nhật',
    isGood: true,
    rating: 'cát trung bình',
  },
  chiKhacCan: {
    label: 'Chi khắc Can',
    verb: 'khắc',
    dayName: 'phạt nhật',
    isGood: false,
    rating: 'hung',
  },
  dongHanh: {
    label: 'Can Chi tương đồng',
    verb: '',
    dayName: 'chuyên nhật',
    isGood: true,
    rating: 'cát',
  },
}

/** Quan hệ ngũ hành giữa Can và Chi của một ngày. */
export function getCanChiRelation({ can, chi }: CanChi): CanChiRelation {
  const a = canElement(can)
  const b = chiElement(chi)
  let kind: CanChiRelationKind
  if (a === b) kind = 'dongHanh'
  else if (GENERATES[a] === b) kind = 'canSinhChi'
  else if (GENERATES[b] === a) kind = 'chiSinhCan'
  else if (OVERCOMES[a] === b) kind = 'canKhacChi'
  else kind = 'chiKhacCan'
  const r = RELATIONS[kind]
  // Hành đứng trước là hành chủ động: "Can sinh Chi (Thủy sinh Mộc)", "Chi khắc Can (Kim khắc Mộc)".
  const [first, second] = kind === 'chiSinhCan' || kind === 'chiKhacCan' ? [b, a] : [a, b]
  const detail = kind === 'dongHanh' ? `cùng ${a}` : `${first} ${r.verb} ${second}`
  return {
    kind,
    canElement: a,
    chiElement: b,
    dayName: r.dayName,
    isGood: r.isGood,
    rating: r.rating,
    text: `${r.label} (${detail}), là ngày ${r.rating} (${r.dayName}).`,
  }
}
