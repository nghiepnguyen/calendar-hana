import art from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import { resolveP4Context } from './p4ContextBridge'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { canonP4Heading, resolveP4Headings } from './p4HeadingAnnotation'
import { presentP4De } from './p4GradeResolution'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { splitHeadings } from './xiejiVol10Resolution'

/** P4-B source audit. No production imports, score, activation or new 宜 operands. */
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
type Presence = 'present' | 'absent' | 'unknown'
export type RemainingJiState =
  | 'kept'
  | 'protected'
  | 'lifted'
  | 'all_taboo'
  | 'no_annotation'
  | 'undetermined'
  | 'absent'
  | 'not_listed'
type Rule = {
  xiejiGod?: string
  officerOffset?: number
  table?: Record<string, string[]>
  unknown?: string
}
type Condition = {
  effect: string
  withGods: string[]
  months: string[] | string
  exceptMonths?: string[]
  require?: string
  pillar?: string
  keep?: string
  target?: string
}
type Entry = {
  han: string
  avoid: string
  presence: Rule
  protected?: boolean
  protection?: { months: string[] | string; headings: string; allMonths?: string[] }
  conditions: Condition[]
  aliases?: Record<string, string>
}
type Scope = {
  presence: Presence
  headings: Record<string, RemainingJiState>
  effect: string
  reason?: string
  sourceOffset: number
}
// These fragments are unmapped in the activity taxonomy; retain raw text in the source artifact.
const unmapped = ['修築園圃', '逺廻']
const headings = (s: string) =>
  splitHeadings(unmapped.reduce((t, h) => t.replaceAll(h, ''), s)).map(canonP4Heading)

export function resolveP4RemainingJi(month: string, pillar: string) {
  const ctx = resolveP4Context(month, pillar)
  const m = B.indexOf(month),
    stem = S.indexOf(pillar[0]!),
    branch = B.indexOf(pillar[1]!)
  const gods = getXiejiGodPresence(m, stem, branch)
  const present = new Set([...Object.keys(ctx.deferrals), ...presentP4De(month, pillar)])
  for (const [han, id] of Object.entries({ 三合: 'tam_hop', 六合: 'luc_hop' }))
    if (id in gods) present.add(han)
  // Scopes here carry 忌 only; 宜 is composed later. Fix 宜 to true so a deferred 止忌 clause reads
  // as both_present/only_yi (忌 yes/no) instead of 'undetermined' from the missing 宜 operand.
  const baseScopes = resolveP4Headings(
    month,
    pillar,
    Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, true])),
  ).scopes
  const scopes: Record<string, Scope> = {}
  for (const entry of art.entries) {
    const e = entry as Entry
    const rule = e.presence
    const values = rule.table?.[String(((m + 10) % 12) + 1)]
    const presence: Presence = rule.unknown
      ? 'unknown'
      : rule.xiejiGod
        ? rule.xiejiGod in gods
          ? 'present'
          : 'absent'
        : rule.officerOffset !== undefined
          ? (branch - m + 12) % 12 === rule.officerOffset
            ? 'present'
            : 'absent'
          : values?.some((v) =>
                v.length === 2 ? v === pillar : S.includes(v) ? v === pillar[0] : v === pillar[1],
              )
            ? 'present'
            : 'absent'
    const clause = e.conditions.find(
      (c) =>
        (c.months === '*' || c.months.includes(month)) &&
        !c.exceptMonths?.includes(month) &&
        (!c.pillar || c.pillar === pillar) &&
        (!c.require || present.has(c.require)) &&
        (!c.withGods.length || c.withGods.some((g) => present.has(g))),
    )
    const effect = clause?.effect ?? 'keep'
    const avoided = new Set(headings(e.avoid))
    const keep = new Set(headings(clause?.keep ?? ''))
    const states: Record<string, RemainingJiState> = {}
    for (const h of P4_DAY_HEADINGS) {
      if (presence === 'absent') states[h] = 'absent'
      else if (effect === 'all_taboo') states[h] = 'all_taboo'
      else if (!avoided.has(h)) states[h] = 'not_listed'
      else if (presence === 'unknown') states[h] = 'undetermined'
      else if (effect === 'defer') {
        const target = baseScopes[clause!.target!]
        const state = target && 'headings' in target ? target.headings[h] : 'undetermined'
        states[h] =
          state === 'only_ji' || state === 'both_present'
            ? 'kept'
            : state === 'not_avoided' || state === 'neither_recorded' || state === 'only_yi'
              ? 'lifted'
              : 'undetermined'
      } else if (effect === 'lift' || (effect === 'only_avoid' && !keep.has(h)))
        states[h] = 'lifted'
      else if (effect === 'no_annotation') states[h] = 'no_annotation'
      else
        states[h] =
          e.protected ||
          e.protection?.allMonths?.includes(month) ||
          (e.protection &&
            (e.protection.months === '*' || e.protection.months.includes(month)) &&
            (e.protection.headings === '*' || headings(e.protection.headings).includes(h)))
            ? 'protected'
            : 'kept'
    }
    scopes[e.han] = {
      presence,
      headings: states,
      effect,
      sourceOffset: entry.source.offset,
      ...(rule.unknown ? { reason: rule.unknown } : {}),
    }
    // 卷十 按 explicitly says 厭對/招搖 both take the 德赦 lift. Keep water and marriage headings separate.
    for (const [alias, raw] of Object.entries(e.aliases ?? {})) {
      const hs = new Set(headings(raw))
      scopes[alias] = {
        presence,
        effect: 'shared_virtue_lift',
        sourceOffset: entry.source.offset,
        headings: Object.fromEntries(
          P4_DAY_HEADINGS.map((h) => [
            h,
            !hs.has(h)
              ? 'not_listed'
              : presence === 'present'
                ? effect === 'lift'
                  ? 'lifted'
                  : 'kept'
                : presence === 'unknown'
                  ? 'undetermined'
                  : 'absent',
          ]),
        ),
      }
    }
  }
  return {
    scopes,
    dormantPresence: Object.fromEntries(art.dormantIds.map((id) => [id, id in gods])),
  }
}
