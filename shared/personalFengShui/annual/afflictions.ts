import { dayCanChi, yearCanChi } from '../../lunar/canChi'
import { parseSolarDate, solarStringToJd } from '../../lunar/julian'
import { MAX_YEAR, MIN_YEAR, solarToLunar } from '../../lunar/lunar'

export type ThaiTueKind = 'truc' | 'xung' | 'hinh' | 'hai' | 'pha'

const LUC_XUNG = [
  [0, 6],
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 10],
  [5, 11],
] as const
const LUC_HAI = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
  [8, 11],
  [9, 10],
] as const
const LUC_PHA = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [7, 10],
] as const
const TAM_HINH = [
  [2, 5, 8],
  [1, 10, 7],
  [0, 3],
] as const
const TU_HINH = [4, 6, 9, 11] as const
const TAM_SAT = [
  { birthGroup: [8, 0, 4], blockedYears: [5, 6, 7] },
  { birthGroup: [2, 6, 10], blockedYears: [11, 0, 1] },
  { birthGroup: [5, 9, 1], blockedYears: [2, 3, 4] },
  { birthGroup: [11, 3, 7], blockedYears: [8, 9, 10] },
] as const

export const SAT_CHU_AM = Object.freeze([5, 0, 7, 3, 8, 10, 11, 1, 6, 9, 2, 4])
export const SAT_CHU_DUONG = Object.freeze([0, 1, 1, 10, 4, 4, 1, 4, 1, 4, 7, 4])

function isBranch(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < 12
}

function hasPair(groups: readonly (readonly number[])[], a: number, b: number): boolean {
  return a !== b && groups.some((group) => group.includes(a) && group.includes(b))
}

export function assessAnnualAfflictions(birthYearChi: number, viewYearChi: number) {
  if (!isBranch(birthYearChi) || !isBranch(viewYearChi)) {
    throw new RangeError('Địa chi phải là số nguyên từ 0 đến 11.')
  }
  const xung = hasPair(LUC_XUNG, birthYearChi, viewYearChi)
  const thaiTue: ThaiTueKind[] = []
  if (birthYearChi === viewYearChi) thaiTue.push('truc')
  if (xung) thaiTue.push('xung')
  if (
    (birthYearChi !== viewYearChi && hasPair(TAM_HINH, birthYearChi, viewYearChi)) ||
    (birthYearChi === viewYearChi && TU_HINH.includes(birthYearChi as 4 | 6 | 9 | 11))
  ) {
    thaiTue.push('hinh')
  }
  if (hasPair(LUC_HAI, birthYearChi, viewYearChi)) thaiTue.push('hai')
  if (hasPair(LUC_PHA, birthYearChi, viewYearChi)) thaiTue.push('pha')

  const group = TAM_SAT.find(({ birthGroup }) => birthGroup.some((chi) => chi === birthYearChi))!
  return {
    thaiTue,
    tuePha: xung,
    tamSat: {
      hit: group.blockedYears.some((chi) => chi === viewYearChi),
      birthGroup: [...group.birthGroup],
      blockedYears: [...group.blockedYears],
    },
  }
}

export function evaluateSatChu(lunarMonth: number, dayBranch: number) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError('Tháng âm lịch phải là số nguyên từ 1 đến 12.')
  }
  if (!isBranch(dayBranch)) throw new RangeError('Địa chi phải là số nguyên từ 0 đến 11.')
  const amBranch = SAT_CHU_AM[lunarMonth - 1]
  const duongBranch = SAT_CHU_DUONG[lunarMonth - 1]
  return {
    lunarMonth,
    dayBranch,
    am: dayBranch === amBranch,
    duong: dayBranch === duongBranch,
    amBranch,
    duongBranch,
  }
}

export function assessPersonalAnnualAfflictions(birthDate: string, viewDate: string) {
  try {
    const birth = parseSolarDate(birthDate)
    const view = parseSolarDate(viewDate)
    if ([birth.year, view.year].some((year) => year < MIN_YEAR || year > MAX_YEAR)) {
      return { status: 'unsupported' as const, reason: 'Ngày nằm ngoài khoảng 1900–2100.' }
    }
    if (viewDate < birthDate) {
      return { status: 'notApplicable' as const, reason: 'Ngày xem trước ngày sinh.' }
    }
    const birthLunar = solarToLunar(birth.day, birth.month, birth.year)
    const viewLunar = solarToLunar(view.day, view.month, view.year)
    const birthYearChi = yearCanChi(birthLunar.year).chi
    const viewYearChi = yearCanChi(viewLunar.year).chi
    const dayBranch = dayCanChi(solarStringToJd(viewDate)).chi
    return {
      status: 'ready' as const,
      birthLunarYear: birthLunar.year,
      viewLunarYear: viewLunar.year,
      birthYearChi,
      viewYearChi,
      ...assessAnnualAfflictions(birthYearChi, viewYearChi),
      satChu: evaluateSatChu(viewLunar.month, dayBranch),
    }
  } catch {
    return { status: 'invalid' as const, reason: 'Ngày sinh hoặc ngày xem không hợp lệ.' }
  }
}
