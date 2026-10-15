import soilAuthority from '../almanac-data/p4-soil-owner-convention-v1.json'
import phaseAuthority from '../almanac-data/p4-lunar-phase-authority-v1.json'
import puzhuEndAuthority from '../almanac-data/p4-puzhu-end-v1.json'
import lunarDayAuthority from '../almanac-data/p4-lunar-day-taboo-v1.json'
import art from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import { applyP4Propagation } from './p4DayComposition'
import { assembleP4YiDay } from './p4YiDayCore'
import type { resolveP4FullDay } from './p4FullDayComposition'
import { canonP4Heading, getP4BaseAvoid } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'
import { matchP4PillarRules } from './p4NamedClauses'
import { resolveP4RemainingJi } from './p4RemainingJi'

type P4FullDayOperands = NonNullable<Parameters<typeof resolveP4FullDay>[2]>

// Inventory labels and evaluated headings must use the same source spelling normalization.
const jiInventory = new Map(
  Object.entries(art.jiInventory).map(([h, tokens]) => [
    canonP4Heading(splitHeadings(h)[0]!),
    tokens,
  ]),
)

/** Audit-only assembly before 鋪註. Existing partial oracle and production pipeline remain unchanged.
 * Unknown operands affect only their listed heading; proved 忌 stays in evidence. */
/** Versioned P4-C assembly; historical full-day source remains byte-locked. */
export function assembleP4YiFullDay(
  month: string,
  pillar: string,
  operands: P4FullDayOperands = {},
  yi: Readonly<Record<string, boolean | undefined>>,
) {
  const { rawJiHeadings: _raw, ...day } = assembleP4YiFullDayWithRaw(month, pillar, operands, yi)
  return day
}

/** Same assembly plus `rawJiHeadings`: the pre-override, pre-propagation record of every
 * heading. puzhu:28 removes effective 忌 only; the 忌 it removed stays visible here. */
export function assembleP4YiFullDayWithRaw(
  month: string,
  pillar: string,
  operands: P4FullDayOperands = {},
  yi: Readonly<Record<string, boolean | undefined>>,
) {
  const { lunarDay, phase, soil } = operands
  if (
    soil &&
    (soil.authorityId !== soilAuthority.version ||
      soil.status !== soilAuthority.status ||
      !['present', 'absent', 'unknown'].includes(soil.presence))
  )
    throw new RangeError('Unrecognized soil authority or value')
  const soilScope = {
    authorityId: soilAuthority.version,
    status: soilAuthority.status,
    source: soilAuthority.source,
    headings: soilAuthority.headings,
    evidence: soil,
    presence: soil?.presence ?? 'unknown',
  }
  if (
    phase &&
    (phase.authorityId !== phaseAuthority.version ||
      ![...phaseAuthority.phases, 'none', 'unknown'].includes(phase.phase))
  )
    throw new RangeError('Unrecognized phase authority or value')
  const phaseScope = {
    heading: phaseAuthority.heading,
    source: phaseAuthority.source,
    evidence: phase,
    presence:
      !phase || phase.phase === 'unknown'
        ? 'unknown'
        : phase.phase === 'none'
          ? 'absent'
          : 'present',
  }
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
  const base = assembleP4YiDay(month, pillar, yi)
  const remaining = resolveP4RemainingJi(month, pillar)
  const days = { ...base.prePropagationHeadings }
  const pillarRuleIds = matchP4PillarRules(month, pillar, true)
    .rules.filter((r) => puzhuEndAuthority.suppressYiRuleIds.includes(r.id))
    .map((r) => r.id)
  const deathDefeat = pillarRuleIds.length > 0 || remaining.scopes['四廢']?.presence === 'present'
  const restoredSubjects = deathDefeat
    ? puzhuEndAuthority.deathDefeatSubjects.filter((subject) => base.subjects.includes(subject))
    : []
  const restoredJiHeadings = new Set(
    restoredSubjects.flatMap((subject) => [...getP4BaseAvoid(subject, month)]),
  )
  const suppressedYiHeadings = pillarRuleIds.length
    ? getP4BaseAvoid('月厭', month)
    : new Set<string>()
  const puzhuEnd = {
    pillarRuleIds,
    restoredSubjects,
    restoredJiHeadings: [...restoredJiHeadings],
    suppressedYiHeadings: [...suppressedYiHeadings],
  }
  const unresolvedJi: Record<string, string[]> = {}
  const rawDays: typeof days = {}
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
  for (const [h, original] of Object.entries(days)) {
    const suppressedYi = suppressedYiHeadings.has(h) || restoredJiHeadings.has(h)
    const initial = suppressedYi ? { ...original, yi: false } : original
    const states = Object.values(remaining.scopes).map((s) => s.headings[h])
    const unresolved = Object.entries(remaining.scopes)
      .filter(([, s]) => s.headings[h] === 'undetermined')
      .map(([g]) => g)
    const tokens = jiInventory.get(h) ?? []
    for (const token of tokens)
      if (
        !(token in remaining.scopes) &&
        !known.has(token) &&
        !(token === soilAuthority.inventoryToken && soilScope.presence !== 'unknown') &&
        !(token === phaseAuthority.inventoryToken && phaseScope.presence !== 'unknown') &&
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
    } else unresolvedJi[h] = unresolved
    // On an override day the ordinary record is still built, into the raw view only.
    const out = dayRule ? rawDays : days
    if (allTaboo || base.pillarAllTaboo.length) {
      out[h] = { ...initial, state: 'only_ji', ji: true, protectedJi: true }
      continue
    }
    const lunarJi = Object.values(lunarDayScopes).some(
      (scope) => scope.heading === h && scope.presence === 'present',
    )
    const phaseJi = phaseScope.heading === h && phaseScope.presence === 'present'
    const soilJi = soilScope.headings.includes(h) && soilScope.presence === 'present'
    const deathDefeatJi = restoredJiHeadings.has(h)
    const extraJi =
      phaseJi ||
      deathDefeatJi ||
      lunarJi ||
      soilJi ||
      states.some((s) => s === 'kept' || s === 'protected')
    const pendingProvedJi = Object.values(remaining.scopes).some(
      (s) => s.presence === 'present' && s.headings[h] === 'undetermined',
    )
    const ji = initial.ji || extraJi || pendingProvedJi
    const protectedJi =
      phaseJi || lunarJi || initial.protectedJi || soilJi || states.includes('protected')
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
          : suppressedYi && initial.state !== 'neither_recorded'
            ? 'not_recorded'
            : initial.state
    out[h] = { ...initial, ji, protectedJi, state }
  }
  return {
    ...base,
    remaining,
    lunarDayScopes,
    phaseScope,
    soilScope,
    puzhuEnd,
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
    rawJiHeadings: dayRule ? rawDays : days,
  }
}
