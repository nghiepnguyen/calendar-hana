import { CAN, CHI } from '../../lunar/canChi'
import { canElement, chiElement, type NguHanh } from '../../lunar/elements'

/** Version độc lập của từng lớp giải nghĩa; đổi cách tính phải tăng version tương ứng. */
export const INTERPRETATION_VERSIONS = Object.freeze({
  dayMaster: '1.0.0',
  elementCount: '1.0.0',
})

export const ELEMENT_ORDER: readonly NguHanh[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']

type PillarKey = 'year' | 'month' | 'day' | 'hour'
type Pillar = { can: number; chi: number }
export type FourPillars = Record<PillarKey, Pillar>

const PILLAR_ORDER: readonly PillarKey[] = ['year', 'month', 'day', 'hour']

function assertStem(can: number) {
  if (!Number.isInteger(can) || can < 0 || can > 9) throw new RangeError(`Invalid stem ${can}`)
}

function assertBranch(chi: number) {
  if (!Number.isInteger(chi) || chi < 0 || chi > 11) throw new RangeError(`Invalid branch ${chi}`)
}

/**
 * Nhật Nguyên (Nhật chủ): Thiên can của trụ Ngày. Chỉ số Can chẵn là Dương, lẻ là Âm.
 * Không dùng nạp âm hay Can của trụ khác (PRD bazi-interpretation 6.1).
 */
export function dayMasterOf(pillars: FourPillars) {
  const { can } = pillars.day
  assertStem(can)
  return {
    can,
    name: CAN[can],
    element: canElement(can),
    polarity: can % 2 === 0 ? ('Dương' as const) : ('Âm' as const),
    sourcePillar: 'day' as const,
    version: INTERPRETATION_VERSIONS.dayMaster,
  }
}

/**
 * Thống kê ngũ hành của 8 chữ: 4 Can lộ và hành chính của 4 Chi (spec 5.1).
 * Chỉ là số đếm mô tả; không phải điểm vượng suy và không dùng để chọn Dụng thần.
 */
export function elementDistribution(pillars: FourPillars) {
  const positions = new Map<NguHanh, { pillar: PillarKey; part: 'can' | 'chi'; name: string }[]>(
    ELEMENT_ORDER.map((element) => [element, []]),
  )
  for (const key of PILLAR_ORDER) {
    const { can, chi } = pillars[key]
    assertStem(can)
    assertBranch(chi)
    positions.get(canElement(can))!.push({ pillar: key, part: 'can', name: CAN[can] })
    positions.get(chiElement(chi))!.push({ pillar: key, part: 'chi', name: CHI[chi] })
  }
  const total = PILLAR_ORDER.length * 2
  return {
    total,
    version: INTERPRETATION_VERSIONS.elementCount,
    entries: ELEMENT_ORDER.map((element) => {
      const list = positions.get(element)!
      return {
        element,
        count: list.length,
        percentage: Math.round((list.length / total) * 1000) / 10,
        positions: list,
      }
    }),
  }
}
