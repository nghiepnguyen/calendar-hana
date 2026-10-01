import type { TamTaiValue } from './types'

// Birth-group remainder mod 4 => ordered affected branches. CHI indices from canChi.ts.
const CYCLES = [
  [2, 3, 4],
  [11, 0, 1],
  [8, 9, 10],
  [5, 6, 7],
] as const

/** Returns cycle position only; it does not rank severity or recommend an action. */
export function calculateTamTai(birthYearChi: number, viewYearChi: number): TamTaiValue {
  if ([birthYearChi, viewYearChi].some((chi) => !Number.isInteger(chi) || chi < 0 || chi > 11)) {
    throw new RangeError('Tam Tai requires integer Chi indices within 0–11')
  }
  const cycle: readonly number[] = CYCLES[birthYearChi % 4]
  const index = cycle.indexOf(viewYearChi)
  return index < 0 ? { hit: false, stage: null } : { hit: true, stage: (index + 1) as 1 | 2 | 3 }
}
