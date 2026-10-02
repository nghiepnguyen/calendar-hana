import { CAN } from '../../lunar/canChi'
import type { TenGod } from './tenGods'
import { tenGodOf } from './tenGods'

type ChartLike =
  | { status: 'insufficientData' }
  | { status: 'ready' | 'ambiguous'; candidates: readonly { pillars: { day: { can: number } } }[] }

/**
 * Thập thần của Can ngày đang xem so với Nhật Nguyên (PRD bazi-interpretation mục 8).
 * Chỉ mô tả quan hệ, không đổi lá số hay kết luận ngày. Các lá số ứng viên khác Nhật Nguyên
 * thì trả `ambiguous`, không tự chọn.
 */
export function viewedDayTenGod(
  chart: ChartLike,
  viewedDayCan: number,
):
  | { status: 'ready'; dayMaster: string; viewedStem: string; tenGod: TenGod }
  | { status: 'ambiguous'; viewedStem: string }
  | { status: 'insufficientData' } {
  if (chart.status === 'insufficientData' || chart.candidates.length === 0)
    return { status: 'insufficientData' }
  const masters = new Set(chart.candidates.map((c) => c.pillars.day.can))
  if (masters.size > 1) return { status: 'ambiguous', viewedStem: CAN[viewedDayCan] }
  const [dayMaster] = masters
  return {
    status: 'ready',
    dayMaster: CAN[dayMaster],
    viewedStem: CAN[viewedDayCan],
    tenGod: tenGodOf(dayMaster, viewedDayCan).name,
  }
}
