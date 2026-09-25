// Tuổi xung khắc với ngày và với tháng.

import type { CanChi } from './canChi'
import { CLASHES } from './clashes.data'
import { sexagenaryIndex } from './napAm'

/** Các tuổi (Can Chi) xung với ngày có Can Chi này. Ví dụ ngày Nhâm Dần → Canh Thân, Bính Thân, Bính Dần. */
export function getDayClashes(dayCanChi: Pick<CanChi, 'can' | 'chi'>): readonly string[] {
  return CLASHES[sexagenaryIndex(dayCanChi)]
}

/** Các tuổi xung với tháng có Can Chi này (cùng bảng với xung ngày). */
export function getMonthClashes(monthCanChi: Pick<CanChi, 'can' | 'chi'>): readonly string[] {
  return CLASHES[sexagenaryIndex(monthCanChi)]
}
