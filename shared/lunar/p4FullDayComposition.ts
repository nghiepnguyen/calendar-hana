import lunarDayAuthority from '../almanac-data/p4-lunar-day-taboo-v1.json'
import art from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import { applyP4Propagation, resolveP4Day } from './p4DayComposition'
import { resolveP4RemainingJi } from './p4RemainingJi'

/** Audit-only assembly before 鋪註. Existing partial oracle and production pipeline remain unchanged.
 * Unknown operands affect only their listed heading; proved 忌 stays in evidence. */
export function resolveP4FullDay(
  month: string,
  pillar: string,
  operands: { lunarDay?: number } = {},
) {
  const { lunarDay } = operands
  if (lunarDay !== undefined && (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30))
    throw new RangeError('Invalid lunar day')
  const lunarDayScopes = Object.fromEntries(
    lunarDayAuthority.rules.map((rule) => [
      rule.token,
      {
        heading: rule.heading,
        sourceActivity: rule.sourceActivity,
        source: rule.source,
        presence:
          lunarDay === undefined ? 'unknown' : rule.days.includes(lunarDay) ? 'present' : 'absent',
      },
    ]),
  )
  const base = resolveP4Day(month, pillar)
  const remaining = resolveP4RemainingJi(month, pillar)
  const days = { ...base.prePropagationHeadings }
  const unresolvedJi: Record<string, string[]> = {}
  // 卷十 puzhu:28 「…德合與赦願所會之辰諸事不忌」: listed days drop every 忌, 百忌 included (月表
  // prints no 忌 on them). Owner corrected the 六月 item to 未月甲午 from the 月表 witness.
  const dayRule = art.dayRules.find((r) =>
    r.applied.some(([m, p]) => m === month && p === pillar),
  )?.id
  const allTaboo = Object.values(remaining.scopes).some(
    (s) => s.presence === 'present' && s.effect === 'all_taboo',
  )
  const known = new Set([
    '月建',
    '月破',
    '平日',
    '收日',
    '閉日',
    '劫煞',
    '災煞',
    '月煞',
    '月刑',
    '月害',
    '月厭',
    '大時',
    '天吏',
    '土府',
    '大耗',
    '死神',
    '地火',
    '月虛',
    '咸池',
    '無',
  ])
  for (const [h, initial] of Object.entries(days)) {
    const states = Object.values(remaining.scopes).map((s) => s.headings[h])
    const unresolved = Object.entries(remaining.scopes)
      .filter(([, s]) => s.headings[h] === 'undetermined')
      .map(([g]) => g)
    const tokens = (art.jiInventory as Record<string, string[]>)[h] ?? []
    for (const token of tokens)
      if (
        !(token in remaining.scopes) &&
        !known.has(token) &&
        !(token in lunarDayScopes && lunarDayScopes[token]!.presence !== 'unknown') &&
        !/^[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]日$/.test(token)
      )
        unresolved.push(token)
    if (dayRule) {
      unresolvedJi[h] = []
      days[h] = {
        ...initial,
        ji: false,
        protectedJi: false,
        state: initial.yi === undefined ? 'undetermined' : initial.yi ? 'only_yi' : 'not_recorded',
      }
      continue
    }
    unresolvedJi[h] = unresolved
    if (allTaboo || base.pillarAllTaboo.length) {
      days[h] = { ...initial, state: 'only_ji', ji: true, protectedJi: true }
      continue
    }
    const lunarJi = Object.values(lunarDayScopes).some(
      (scope) => scope.heading === h && scope.presence === 'present',
    )
    const extraJi = lunarJi || states.some((s) => s === 'kept' || s === 'protected')
    const pendingProvedJi = Object.values(remaining.scopes).some(
      (s) => s.presence === 'present' && s.headings[h] === 'undetermined',
    )
    const ji = initial.ji || extraJi || pendingProvedJi
    const protectedJi = lunarJi || initial.protectedJi || states.includes('protected')
    const ambiguous =
      initial.state === 'undetermined' ||
      unresolved.length > 0 ||
      (initial.state === 'neither_recorded' && extraJi && !protectedJi)
    const state = ambiguous
      ? 'undetermined'
      : initial.state === 'neither_recorded' && !protectedJi
        ? 'neither_recorded'
        : ji
          ? initial.yi
            ? 'both_present'
            : 'only_ji'
          : initial.state
    days[h] = { ...initial, ji, protectedJi, state }
  }
  return {
    ...base,
    remaining,
    lunarDayScopes,
    ...(dayRule ? { dayRule } : {}),
    prePropagationHeadings: days,
    headings: applyP4Propagation(days),
    unresolvedJi,
    unmodeledJi: Object.fromEntries(
      Object.entries(unresolvedJi).map(([h, tokens]) => [h, tokens.join('')]),
    ),
    completeness: Object.values(unresolvedJi).some((tokens) => tokens.length)
      ? 'partial'
      : 'modeled',
  }
}
