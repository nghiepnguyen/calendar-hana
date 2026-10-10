import goodGods from '../almanac-data/good-gods.json'
import badGods from '../almanac-data/bad-gods.json'
import type { Star } from './stars'

/** Only exact reviewed names bridge day-star data and the scoring catalog; no inferred aliases. */
export function resolvePresentGods(stars: { good: readonly Star[]; bad: readonly Star[] }) {
  const normalize = (name: string) => name.normalize('NFC').trim().toLowerCase()
  const resolve = (rows: readonly Star[], catalog: typeof goodGods.items | typeof badGods.items) =>
    rows.flatMap((star) =>
      catalog.filter((god) => normalize(god.label) === normalize(star.name)).map((god) => god.id),
    )
  const presentGoodGods = resolve(stars.good, goodGods.items)
  const presentBadGods = resolve(stars.bad, badGods.items)
  const unknown = [
    ...stars.good.filter(
      (star) => !goodGods.items.some((god) => normalize(god.label) === normalize(star.name)),
    ),
    ...stars.bad.filter(
      (star) => !badGods.items.some((god) => normalize(god.label) === normalize(star.name)),
    ),
  ]
  return {
    presentGoodGods,
    presentBadGods,
    warnings: unknown.length
      ? [`Chưa có mapping chấm điểm cho các sao: ${unknown.map((star) => star.name).join(', ')}.`]
      : [],
  }
}

interface DayRule {
  dayCan?: number[]
  dayChi?: number[]
  lunarDay?: number[]
  /** 土王用事: the 18 civil days before each 四立 (thoVuongDungSu.ts). */
  thoVuongDungSu?: boolean
}
type RuleDay = { can: number; chi: number; lunarDay: number; thoVuongDungSu?: boolean }

/**
 * Catalog entries defined by the day itself rather than by the Ngọc Hạp star table (Trừ Thần =
 * 申酉 days, Đinh days, Nhân Thần lunar days 12/15). Rules live in the catalog JSON with sources.
 */
export function resolveDayRuleGods(day: RuleDay) {
  const matches = (rule: DayRule | undefined) =>
    Boolean(
      rule &&
      (rule.dayCan?.includes(day.can) ||
        rule.dayChi?.includes(day.chi) ||
        rule.lunarDay?.includes(day.lunarDay) ||
        (rule.thoVuongDungSu && day.thoVuongDungSu)),
    )
  const pick = (items: readonly { id: string; rule?: DayRule }[]) =>
    items.filter((god) => matches(god.rule)).map((god) => god.id)
  return { presentGoodGods: pick(goodGods.items), presentBadGods: pick(badGods.items) }
}

/** Explicit operands for day-rule gods, for evidence diagnostics only (no score effect). */
export function resolveDayRuleGodPresence(day: RuleDay) {
  const out: Record<string, { operand: string; equals: number }[]> = {}
  for (const god of [...goodGods.items, ...badGods.items] as { id: string; rule?: DayRule }[]) {
    const rule = god.rule
    if (!rule) continue
    if (rule.dayCan?.includes(day.can)) out[god.id] = [{ operand: 'DAY_STEM', equals: day.can }]
    else if (rule.dayChi?.includes(day.chi))
      out[god.id] = [{ operand: 'DAY_BRANCH', equals: day.chi }]
    else if (rule.lunarDay?.includes(day.lunarDay))
      out[god.id] = [{ operand: 'LUNAR_DAY', equals: day.lunarDay }]
    else if (rule.thoVuongDungSu && day.thoVuongDungSu)
      out[god.id] = [{ operand: 'THO_VUONG_DUNG_SU', equals: 1 }]
  }
  return out
}
