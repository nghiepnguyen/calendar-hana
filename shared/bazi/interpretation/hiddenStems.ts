import { CAN } from '../../lunar/canChi'
import { tenGodOf, type TenGod } from './tenGods'

export const HIDDEN_STEM_VERSION = '1.0.0'

export type HiddenStemRank = 'main' | 'middle' | 'residual'

/** Tàng can theo thứ tự bản khí, trung khí, dư khí (PRD bazi-interpretation 6.3). Chỉ số Can 0–9. */
const TABLE: readonly (readonly number[])[] = [
  [9], // Tý: Quý
  [5, 9, 7], // Sửu: Kỷ, Quý, Tân
  [0, 2, 4], // Dần: Giáp, Bính, Mậu
  [1], // Mão: Ất
  [4, 1, 9], // Thìn: Mậu, Ất, Quý
  [2, 4, 6], // Tỵ: Bính, Mậu, Canh
  [3, 5], // Ngọ: Đinh, Kỷ
  [5, 3, 1], // Mùi: Kỷ, Đinh, Ất
  [6, 8, 4], // Thân: Canh, Nhâm, Mậu
  [7], // Dậu: Tân
  [4, 7, 3], // Tuất: Mậu, Tân, Đinh
  [8, 0], // Hợi: Nhâm, Giáp
]

const RANKS: readonly HiddenStemRank[] = ['main', 'middle', 'residual']

/** Tàng can của một Chi kèm Thập thần so với Nhật Nguyên. Không gán tỷ trọng. */
export function hiddenStemsOf(
  chi: number,
  dayMaster: number,
): { can: number; name: string; rank: HiddenStemRank; tenGod: TenGod }[] {
  if (!Number.isInteger(chi) || chi < 0 || chi > 11) throw new RangeError(`Invalid branch ${chi}`)
  return TABLE[chi].map((can, i) => ({
    can,
    name: CAN[can],
    rank: RANKS[i],
    tenGod: tenGodOf(dayMaster, can).name,
  }))
}
