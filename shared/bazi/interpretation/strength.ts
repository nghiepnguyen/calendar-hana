import { CAN, CHI } from '../../lunar/canChi'
import { canElement, chiElement, generatorOf, type NguHanh } from '../../lunar/elements'
import { ELEMENT_ORDER, dayMasterOf, type FourPillars } from './dayMaster'

export const STRENGTH_METHOD_VERSION = 'weighted-v1.0.0'

/**
 * Trọng số vị trí (spec 5.2, sửa ở PRD bazi-interpretation 6.4a): Chi tháng lấy 35 trong khoảng
 * 30–40 để bảy vị trí cộng đúng 100. Can ngày là Nhật Nguyên nên không có trọng số.
 */
export const POSITION_WEIGHTS = Object.freeze({
  'month.chi': 35,
  'day.chi': 15,
  'month.can': 12,
  'hour.can': 12,
  'hour.chi': 10,
  'year.chi': 10,
  'year.can': 6,
} as const)

export const STRENGTH_THRESHOLD = 50

type Position = keyof typeof POSITION_WEIGHTS

const POSITION_ORDER: readonly Position[] = [
  'year.can',
  'year.chi',
  'month.can',
  'month.chi',
  'day.chi',
  'hour.can',
  'hour.chi',
]

/**
 * Vượng/suy theo điểm trọng số (bản đơn giản): nhóm trợ lực = cùng hành Nhật Nguyên (Tỷ/Kiếp)
 * và hành sinh Nhật Nguyên (Ấn). Điểm ≥ 50 là Thân Vượng, còn lại Thân Nhược.
 * Chỉ dùng hành chính của Chi; không xét tàng can, hợp/xung và không dùng để chọn Dụng thần.
 */
export function assessStrength(pillars: FourPillars) {
  const dayMaster = dayMasterOf(pillars)
  const supportElements: readonly NguHanh[] = [dayMaster.element, generatorOf(dayMaster.element)]
  const contributions = POSITION_ORDER.map((position) => {
    const [pillarKey, part] = position.split('.') as [keyof FourPillars, 'can' | 'chi']
    const index = pillars[pillarKey][part]
    const element = part === 'can' ? canElement(index) : chiElement(index)
    return {
      position,
      name: part === 'can' ? CAN[index] : CHI[index],
      element,
      weight: POSITION_WEIGHTS[position],
      supports: supportElements.includes(element),
    }
  })
  const weightedScores = Object.fromEntries(ELEMENT_ORDER.map((el) => [el, 0])) as Record<
    NguHanh,
    number
  >
  for (const c of contributions) weightedScores[c.element] += c.weight
  const score = contributions.filter((c) => c.supports).reduce((sum, c) => sum + c.weight, 0)
  return {
    method: STRENGTH_METHOD_VERSION,
    supportElements,
    score,
    threshold: STRENGTH_THRESHOLD,
    strength: score >= STRENGTH_THRESHOLD ? ('Thân Vượng' as const) : ('Thân Nhược' as const),
    weightedScores,
    contributions,
  }
}
