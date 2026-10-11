import art from '../almanac-data/p4-vol10-heading-annotation.json'
import gradeArt from '../almanac-data/p4-vol10-grade-resolution-v2.json'
import youwei from '../almanac-data/p4-vol10-youwei-scopes.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import { classifyP4Annotation } from './p4Annotation'
import { resolveP4Context } from './p4ContextBridge'
import { evaluateP4Clause, presentP4De } from './p4GradeResolution'
import { splitHeadings } from './xiejiVol10Resolution'
import { YUE_PO_STILL_AVOID } from './yuePoStillAvoidPolicy'

/** Source audit only (A04a): per 卷十 subject scope, the annotation state of each heading.
 * Scopes are never merged here; not imported by the production pipeline. */
export type P4HeadingState =
  | 'both_present'
  | 'only_yi'
  | 'only_ji'
  | 'neither_recorded'
  | 'undetermined'
  | 'not_avoided'
  | 'not_listed'

type Lists = {
  avoid: string
  extraAvoid: { avoid: string; months?: string[]; as?: string }[]
  notAvoid: string
  stopLists?: Partial<Record<string, string>>
}

const ENTRY_BY_SUBJECT = gradeArt.subjectEntries as Record<string, string>
const LISTS = new Map<string, Lists>([
  // 忌同刼煞 (月煞, 災煞): share 刼煞's 忌 and 止不忌 lists, as the production resolver does.
  ...vol10.entries.map((e) => {
    const same = (e as { avoidSameAs?: string }).avoidSameAs
    const src = same ? vol10.entries.find((x) => x.id === same)! : undefined
    return [e.id, (src ? { ...e, avoid: src.avoid, notAvoid: src.notAvoid } : e) as Lists] as const
  }),
  ...art.entryLists.map((e) => [e.entry, { extraAvoid: [], ...e } as Lists] as const),
])
/** 卷十 writes 立劵交易, 卷十一 and the activity map 立券交易 (p4-vol10-day-composition.json). */
export const canonP4Heading = (h: string) => h.replace(/劵/g, '券')
const split = (text: string | undefined) =>
  new Set(text ? splitHeadings(text).map(canonP4Heading) : [])
export const P4_HEADINGS: readonly string[] = [
  ...new Set([
    ...[...LISTS.values()].flatMap((l) => [
      ...split(l.avoid),
      ...split(l.notAvoid),
      ...l.extraAvoid.flatMap((x) => [...split(x.avoid)]),
    ]),
    ...Object.values(vol11.activityEntries as Record<string, string[]>)
      .flat()
      .flatMap((h) => splitHeadings(h).map(canonP4Heading)),
  ]),
]

/** 忌 + month-filtered 又為X lists of a subject's entry, in splitHeadings normal form. */
/** 又為X lists that are scopes of their own (p4-vol10-youwei-scopes.json); 死神 stays in the base. */
type Youwei = {
  alias: string
  parent: string
  status: 'zhuanji' | 'convention'
  protected: boolean
}
export const P4_YOUWEI: readonly Youwei[] = (youwei.aliases as { status: string }[]).filter(
  (a) => a.status !== 'base',
) as Youwei[]
const SEPARATE = new Set(P4_YOUWEI.map((a) => a.alias))

/** 忌 + month-filtered 又為X lists of a subject's entry (separate 又為 scopes excluded). */
export function getP4BaseAvoid(subject: string, month: string) {
  const lists = LISTS.get(ENTRY_BY_SUBJECT[subject]!)!
  return new Set([
    ...split(lists.avoid),
    ...lists.extraAvoid
      .filter((x) => (!x.months || x.months.includes(month)) && !SEPARATE.has(x.as ?? ''))
      .flatMap((x) => [...split(x.avoid)]),
  ])
}

/** The 又為 scopes present with a subject: 忌 of the alias list only, never lifted by the parent. */
export function getP4YouweiScopes(subjects: readonly string[]) {
  const out: Record<string, Youwei & { headings: Record<string, 'only_ji' | 'not_listed'> }> = {}
  for (const a of P4_YOUWEI.filter((a) => subjects.includes(a.parent))) {
    const list = LISTS.get(ENTRY_BY_SUBJECT[a.parent]!)!.extraAvoid.find((x) => x.as === a.alias)
    if (!list) throw new Error(`No 又為 list ${a.alias} on ${a.parent}`)
    const avoided = split(list.avoid)
    out[a.alias] = {
      ...a,
      headings: Object.fromEntries(
        P4_HEADINGS.map((h) => [h, avoided.has(h) ? 'only_ji' : 'not_listed']),
      ),
    }
  }
  return out
}

/** A05: subject 忌 the deferral target's own list does not contain (天吏不能該月害之所忌). */
export function getP4DeferralUncovered(subject: string, target: string, month: string) {
  const covered = getP4BaseAvoid(target, month)
  return [...getP4BaseAvoid(subject, month)].filter((h) => !covered.has(h))
}

function annotate(
  owner: string,
  month: string,
  clause: ReturnType<typeof evaluateP4Clause>['clause'] & { list?: string; notAvoid?: string },
  effect: string,
  yi: Readonly<Record<string, boolean>>,
): Record<string, P4HeadingState> {
  const lists = LISTS.get(ENTRY_BY_SUBJECT[owner]!)!
  const avoided = getP4BaseAvoid(owner, month)
  const stop = split(
    clause.list ??
      Object.entries(lists.stopLists ?? {}).find(([months]) => months.includes(month))?.[1],
  )
  const spared = split(clause.notAvoid)
  // 月破 子午未申 with 德: 仍忌 three headings outside the base list, read literally as in the
  // production resolver (yuePoStillAvoidPolicy).
  if (
    effect === 'still_avoid' &&
    owner === '月破' &&
    (YUE_PO_STILL_AVOID.months as readonly string[]).includes(month)
  )
    for (const h of split(YUE_PO_STILL_AVOID.headings)) avoided.add(h)
  const notAvoided = new Set([...split(lists.notAvoid), ...spared])
  const out: Record<string, P4HeadingState> = {}
  for (const h of P4_HEADINGS) {
    if (effect === 'avoid_all') out[h] = 'only_ji'
    else if (!avoided.has(h)) out[h] = notAvoided.has(h) ? 'not_avoided' : 'not_listed'
    else if (effect === 'cancel_both') out[h] = 'neither_recorded'
    else if (effect === 'as_usual') out[h] = 'only_ji'
    else if (effect === 'still_avoid') out[h] = spared.has(h) ? 'not_avoided' : 'only_ji'
    else if (effect === 'only_avoid')
      out[h] = classifyP4Annotation({ yi: yi[h], ji: stop.has(h), explicitNeither: false })
    else throw new RangeError(`Unhandled clause effect ${effect}`)
  }
  return out
}

/** `yi` is caller-supplied 宜 evidence per heading; a missing key means unknown. */
export function resolveP4Headings(
  month: string,
  pillar: string,
  yi: Readonly<Record<string, boolean>> = {},
) {
  const ctx = resolveP4Context(month, pillar)
  const de = presentP4De(month, pillar)
  const scopes: Record<
    string,
    | { status: 'undetermined' }
    | {
        owner: string
        clauseEffect: string
        headings: Record<string, P4HeadingState>
        uncoveredByDeferral?: string[]
      }
  > = {}
  for (const [subject, walk] of Object.entries(ctx.deferrals)) {
    const e =
      walk.terminal === null ? null : evaluateP4Clause(walk.terminal, month, de, ctx.pillarRules)
    if (!e || e.undetermined) {
      scopes[subject] = { status: 'undetermined' }
      continue
    }
    const headings = annotate(walk.terminal!, month, e.clause, e.clauseEffect, yi)
    // A05: never drop or keep an uncovered 忌 silently; the target's 忌 may still cover it.
    const uncovered =
      walk.path.length > 1 ? getP4DeferralUncovered(subject, walk.terminal!, month) : []
    for (const h of uncovered) if (headings[h] !== 'only_ji') headings[h] = 'undetermined'
    scopes[subject] = {
      owner: walk.terminal!,
      clauseEffect: e.clauseEffect,
      headings,
      ...(uncovered.length ? { uncoveredByDeferral: uncovered } : {}),
    }
  }
  return { scopes, youweiScopes: getP4YouweiScopes(Object.keys(ctx.deferrals)) }
}
