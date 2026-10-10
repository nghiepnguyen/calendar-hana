import tables from '../almanac-data/xieji-god-tables.json'

/**
 * 協紀 day rules (xieji-god-definitions.json, runtime copy xieji-god-tables.json) for the 35 catalog gods that have no audited presence
 * source: 21 never present today, 14 bridged from lunar-month legacy tables. Month basis is Month
 * Jian, as 協紀 defines them. Production uses it only for LEGACY_LUNAR_GOD_IDS (policy
 * legacyGodsMonthJian); the 21 dormant gods stay diagnostics-only (docs/audits/dormant-legacy-gods.md).
 */
export const XIEJI_GOD_PRESENCE_VERSION = 'xieji-god-presence-v1'

/** Catalog gods whose legacy day-table rows equal the 協紀 rule but were read on the lunar month. */
export const LEGACY_LUNAR_GOD_IDS: readonly string[] = [
  'thien_xa',
  'nguyet_an',
  'dan_nhat',
  'tam_hop',
  'thien_hy',
  'luc_hop',
  'ngu_phu',
  'giai_than',
  'phuc_sinh',
  'thanh_tam',
  'ich_hau',
  'tuc_the',
  'nguyet_hinh',
  'thien_lai',
]

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

export interface XiejiGodCondition {
  operand: 'MONTH_JIAN_BRANCH' | 'DAY_STEM' | 'DAY_BRANCH'
  equals: number
}

/** Catalog ids present on a day with this Month Jian and day pillar, with the operands that matched. */
export function getXiejiGodPresence(
  monthJianBranch: number,
  dayStem: number,
  dayBranch: number,
): Record<string, XiejiGodCondition[]> {
  if (
    ![monthJianBranch, dayBranch].every((n) => Number.isInteger(n) && n >= 0 && n < 12) ||
    !(Number.isInteger(dayStem) && dayStem >= 0 && dayStem < 10)
  )
    throw new RangeError('Expected Month Jian 0..11, day stem 0..9, day branch 0..11')
  const month = String(((monthJianBranch + 10) % 12) + 1)
  const stem = STEMS[dayStem]!
  const branch = BRANCHES[dayBranch]!
  const out: Record<string, XiejiGodCondition[]> = {}
  for (const item of tables.items) {
    const values = (item.table as Record<string, string[]>)[month]!
    const monthBound = item.monthBound
    for (const value of values) {
      const conditions: XiejiGodCondition[] | undefined =
        value.length === 2
          ? value === stem + branch
            ? [
                { operand: 'DAY_STEM', equals: dayStem },
                { operand: 'DAY_BRANCH', equals: dayBranch },
              ]
            : undefined
          : STEMS.includes(value)
            ? value === stem
              ? [{ operand: 'DAY_STEM', equals: dayStem }]
              : undefined
            : value === branch
              ? [{ operand: 'DAY_BRANCH', equals: dayBranch }]
              : undefined
      if (!conditions) continue
      out[item.id] = monthBound
        ? [{ operand: 'MONTH_JIAN_BRANCH', equals: monthJianBranch }, ...conditions]
        : conditions
      break
    }
  }
  return out
}
