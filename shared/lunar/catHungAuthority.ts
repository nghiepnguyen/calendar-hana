import { getSolarMonth, SOLAR_TERM_METHOD } from './solarTerms'

export const CAT_HUNG_AUTHORITY_ID = 'cat-hung-authority-v1' as const
export const CAT_HUNG_MONTH_BASIS = 'MONTH_JIAN' as const

export const CAT_HUNG_MONTH_JIAN_BRANCHES = [
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
  '子',
  '丑',
] as const

export const CAT_HUNG_JIE = [
  '立春',
  '驚蟄',
  '清明',
  '立夏',
  '芒種',
  '小暑',
  '立秋',
  '白露',
  '寒露',
  '立冬',
  '大雪',
  '小寒',
] as const

export interface CatHungAuthorityRow {
  readonly month: number
  readonly monthJian: (typeof CAT_HUNG_MONTH_JIAN_BRANCHES)[number]
  readonly jie: (typeof CAT_HUNG_JIE)[number]
  /** Raw canonical token. 坤/乾/艮/巽 are deliberately not coerced to a day branch. */
  readonly tianDe: string
  /** null where the frozen source table does not assert a separate 天德合 token. */
  readonly tianDeHe: string | null
  readonly yueDe: string
  readonly yueDeHe: string
  readonly yuePo: string
  readonly jieSha: string
}

// Phase 4D partial source lock: 欽定協紀辨方書, 四庫全書本.
// Jian order is 寅..丑 and changes at the exact Jie instant. This table is intentionally
// independent from stars.data.ts and contains no activity effects, scoring or lunar-month fallback.
const ROWS: readonly CatHungAuthorityRow[] = [
  { month: 1, monthJian: '寅', jie: '立春', tianDe: '丁', tianDeHe: '壬', yueDe: '丙', yueDeHe: '辛', yuePo: '申', jieSha: '亥' },
  { month: 2, monthJian: '卯', jie: '驚蟄', tianDe: '坤', tianDeHe: null, yueDe: '甲', yueDeHe: '己', yuePo: '酉', jieSha: '申' },
  { month: 3, monthJian: '辰', jie: '清明', tianDe: '壬', tianDeHe: '丁', yueDe: '壬', yueDeHe: '丁', yuePo: '戌', jieSha: '巳' },
  { month: 4, monthJian: '巳', jie: '立夏', tianDe: '辛', tianDeHe: '丙', yueDe: '庚', yueDeHe: '乙', yuePo: '亥', jieSha: '寅' },
  { month: 5, monthJian: '午', jie: '芒種', tianDe: '乾', tianDeHe: null, yueDe: '丙', yueDeHe: '辛', yuePo: '子', jieSha: '亥' },
  { month: 6, monthJian: '未', jie: '小暑', tianDe: '甲', tianDeHe: '己', yueDe: '甲', yueDeHe: '己', yuePo: '丑', jieSha: '申' },
  { month: 7, monthJian: '申', jie: '立秋', tianDe: '癸', tianDeHe: '戊', yueDe: '壬', yueDeHe: '丁', yuePo: '寅', jieSha: '巳' },
  { month: 8, monthJian: '酉', jie: '白露', tianDe: '艮', tianDeHe: null, yueDe: '庚', yueDeHe: '乙', yuePo: '卯', jieSha: '寅' },
  { month: 9, monthJian: '戌', jie: '寒露', tianDe: '丙', tianDeHe: '辛', yueDe: '丙', yueDeHe: '辛', yuePo: '辰', jieSha: '亥' },
  { month: 10, monthJian: '亥', jie: '立冬', tianDe: '乙', tianDeHe: '庚', yueDe: '甲', yueDeHe: '己', yuePo: '巳', jieSha: '申' },
  { month: 11, monthJian: '子', jie: '大雪', tianDe: '巽', tianDeHe: null, yueDe: '壬', yueDeHe: '丁', yuePo: '午', jieSha: '巳' },
  { month: 12, monthJian: '丑', jie: '小寒', tianDe: '庚', tianDeHe: '乙', yueDe: '庚', yueDeHe: '乙', yuePo: '未', jieSha: '寅' },
]

function assertMonthJianBranch(monthJianBranch: number) {
  if (!Number.isInteger(monthJianBranch) || monthJianBranch < 0 || monthJianBranch > 11)
    throw new RangeError('Expected Month Jian branch 0..11')
}

/** Raw source-locked row. Month Jian branch uses project encoding 0=Tý ... 11=Hợi. */
export function getCatHungAuthorityByMonthJian(monthJianBranch: number): CatHungAuthorityRow {
  assertMonthJianBranch(monthJianBranch)
  // Project branch order 子丑寅...亥 -> source Jian row 寅卯...丑.
  return ROWS[(monthJianBranch + 10) % 12]!
}

/** Exact-instant authority path. T-1ms is old Jian; T and T+1ms are new Jian. */
export function getCatHungAuthorityAtInstant(dateTime: string, timezone: string) {
  const monthJianBranch = getSolarMonth(dateTime, timezone)
  return {
    authorityId: CAT_HUNG_AUTHORITY_ID,
    monthBasis: CAT_HUNG_MONTH_BASIS,
    monthJianBranch,
    row: getCatHungAuthorityByMonthJian(monthJianBranch),
    astronomyMethod: SOLAR_TERM_METHOD,
  }
}
