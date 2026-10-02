import { canElement, generatedBy, overcomeBy } from '../../lunar/elements'

export const TEN_GOD_VERSION = '1.0.0'

export type TenGod =
  | 'Tỷ Kiên'
  | 'Kiếp Tài'
  | 'Thực Thần'
  | 'Thương Quan'
  | 'Thiên Tài'
  | 'Chính Tài'
  | 'Thất Sát'
  | 'Chính Quan'
  | 'Thiên Ấn'
  | 'Chính Ấn'

/** Quan hệ hành đọc từ Nhật Nguyên tới Can đang xét. */
export type TenGodRelation = 'same' | 'generates' | 'controls' | 'controlledBy' | 'generatedBy'

const NAMES: Record<TenGodRelation, readonly [TenGod, TenGod]> = {
  same: ['Tỷ Kiên', 'Kiếp Tài'],
  generates: ['Thực Thần', 'Thương Quan'],
  controls: ['Thiên Tài', 'Chính Tài'],
  controlledBy: ['Thất Sát', 'Chính Quan'],
  generatedBy: ['Thiên Ấn', 'Chính Ấn'],
}

function assertStem(can: number) {
  if (!Number.isInteger(can) || can < 0 || can > 9) throw new RangeError(`Invalid stem ${can}`)
}

/**
 * Thập thần của `other` so với Nhật Nguyên `dayMaster` (PRD bazi-interpretation 6.2).
 * Cùng âm dương lấy tên thứ nhất (Tỷ Kiên, Thực Thần, Thiên Tài, Thất Sát, Thiên Ấn).
 * Chỉ mô tả quan hệ; không gắn tốt/xấu.
 */
export function tenGodOf(dayMaster: number, other: number) {
  assertStem(dayMaster)
  assertStem(other)
  const me = canElement(dayMaster)
  const it = canElement(other)
  const relation: TenGodRelation =
    me === it
      ? 'same'
      : generatedBy(me) === it
        ? 'generates'
        : overcomeBy(me) === it
          ? 'controls'
          : overcomeBy(it) === me
            ? 'controlledBy'
            : 'generatedBy'
  const samePolarity = dayMaster % 2 === other % 2
  return {
    name: NAMES[relation][samePolarity ? 0 : 1],
    relation,
    samePolarity,
    version: TEN_GOD_VERSION,
  }
}
