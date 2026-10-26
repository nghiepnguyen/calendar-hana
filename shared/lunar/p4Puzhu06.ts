import authority from '../almanac-data/p4b-puzhu06-v5.json'
import { applyP4Propagation, type P4DayState } from './p4DayComposition'
import { resolveP4Grades } from './p4GradeResolution'
import { getP4YouweiScopes, resolveP4Headings } from './p4HeadingAnnotation'
import { resolveP4YiDay, type P4YiDayOperands } from './p4YiDayComposition'

/** P4-B follow-up (authority p4b-puzhu06-v5): 鋪註 puzhu:06
 * 「凡徳合赦願月恩四相時徳等日不註忌…如遇徳猶忌及從忌不從宜之日則仍註忌」 on the P4-C day.
 * Owner 2026-10-16: Q1-Q3 no, Q4 yes, Q4a block; 2026-10-26 F1 R2 block (五離 only, its own lifters only);
 * 2026-10-26 R-JK / R-WX / R-XH (九空 / 五虛 / 小耗 lifted only by their own lifters, class QL_NARROW with the
 * scoped only_ji rule) and R-F1Y (yiComposition, applied by p4OwnerRules).
 * v4 is the rollback (v3 before it). Production reaches it through p4OwnerRules (getP4DayHeadings, P4 domain only). */
export type P4Puzhu06Source = Readonly<Record<string, unknown>>
export type P4Puzhu06Row = {
  heading: string
  month: string
  triggers: readonly string[]
  day_rule: string
  yi: 'true' | 'false' | 'unknown'
  ji: boolean
  protected: boolean
  state: string
  sources: readonly P4Puzhu06Source[]
}
type Rec = Record<string, unknown> & { kind?: string; name?: string }
type Decision = { action: string; classes: string[]; ji: boolean; state: string }

export const P4_PUZHU06_AUTHORITY_ID = authority.version
const IN_SCOPE = authority.headings.filter((h) => h.scope === 'IN_SCOPE').map((h) => h.p4)
const TRIGGERS = authority.triggers
const CLASSES = authority.classes as Record<string, { action: string }>
const LIFT_GODS = new Set(Object.keys(authority.liftLists))
const EXCLUDED = Object.fromEntries(
  Object.entries(authority.liftExclusions).map(([g, x]) => [g, x.triggers]),
) as Record<string, readonly string[]>
// v5: an exclusion may name its own keep class (QL_NARROW, owner R-JK / R-WX / R-XH); v4 has none.
const EXCLUDED_CLASS = Object.fromEntries(
  Object.entries(authority.liftExclusions).map(([g, x]) => [
    g,
    (x as { class?: string }).class ?? 'QL_EXCLUDED',
  ]),
) as Record<string, string>
export const P4_PUZHU06_ONLY_JI_TAG = 'Q4_REST_OWNER_ONLY_JI'
/** Owner R-F1Y and any later heading-level 宜 composition rule (absent before v5). */
export const P4_PUZHU06_YI_COMPOSITION = ((authority as { yiComposition?: unknown[] })
  .yiComposition ?? []) as readonly {
  id: string
  heading: string
  soleJi: string
  from: string
  to: string
}[]

/** Owner scoped 宜 rule (v5): the row is kept only because of a QL_NARROW exclusion (every other class lifts). */
export function p4Puzhu06NarrowOnlyJi(classes: readonly string[]) {
  return (
    classes.includes('QL_NARROW') &&
    classes.every((c) => c === 'QL_NARROW' || CLASSES[c]?.action === 'lift')
  )
}
const YOUWEI = authority.inherit.youwei as Record<string, string>
const DEFER = authority.inherit.remainingDefer as Record<
  string,
  { months: string[]; target: string }[]
>

function specGap(detail: string): never {
  throw Object.assign(new RangeError(`puzhu:06 SPEC_GAP: ${detail}`), { code: 'SPEC_GAP', detail })
}

/** Class of a subject's own clause, whatever its state on the heading (parents, owners). */
function clauseClass(rec: Rec | undefined): string {
  if (!rec || rec.scope === 'undetermined') return 'UNDETERMINED'
  switch (rec.clauseEffect) {
    case 'still_avoid':
      return 'YOUJI'
    case 'avoid_all':
      return 'ZHUSHI'
    case 'cancel_both':
      return 'UNDETERMINED' // 相抵 parent with an open list (P5 F3)
    case 'only_avoid':
      return 'PROTECTED'
    case 'as_usual':
      if (rec.grade == null) return 'AU'
      // AN/AD stand on Q1 = no: the 等第 grade action is 從忌不從宜.
      if (rec.gradeAction != null && rec.gradeAction !== 'only_ji')
        specGap(`${rec.name} as_usual with grade action ${rec.gradeAction}`)
      return rec.dePresent ? 'AD' : 'AN'
    default:
      return specGap(`clause effect ${rec.clauseEffect}`)
  }
}

function classify(row: P4Puzhu06Row) {
  const sources = row.sources as Rec[]
  const subjects = new Map(sources.filter((s) => s.kind === 'subject').map((s) => [s.name!, s]))
  const out = new Set<string>()
  for (const s of sources) {
    if (s.kind === 'subject') {
      // P4-C reading: a 止忌 scope cannot stay undetermined once 宜 is known false.
      if (s.clauseEffect === 'only_avoid' && s.state === 'undetermined' && row.yi === 'false')
        continue
      if (s.scope === 'undetermined' || s.state === 'undetermined') out.add('UNDETERMINED')
      else if (s.state === 'only_ji' || s.state === 'both_present') {
        const c = clauseClass(s)
        // 從…論 without its own 等第: the owner's own record decides.
        out.add(c === 'AU' && s.owner !== s.name ? clauseClass(subjects.get(s.owner as string)) : c)
      }
    } else if (s.kind === 'youwei')
      out.add(s.protected ? 'PROTECTED' : clauseClass(subjects.get(YOUWEI[s.name!]!)))
    else if (s.kind === 'remaining') {
      if (s.state === 'protected') out.add('PROTECTED')
      else if (s.state === 'undetermined') out.add('UNDETERMINED')
      else if (s.effect === 'defer') {
        const target = DEFER[s.name!]?.find((d) => d.months.includes(row.month))?.target
        if (!target) specGap(`defer ${s.name} in ${row.month}`)
        out.add(clauseClass(subjects.get(target)))
      } else if (LIFT_GODS.has(s.name!)) {
        // Q4a: a trigger the god's own entry refuses (五墓 「不取德合」) cannot lift it.
        const excluded = EXCLUDED[s.name!] ?? []
        out.add(row.triggers.some((t) => !excluded.includes(t)) ? 'QL' : EXCLUDED_CLASS[s.name!]!)
      } else specGap(`remaining ${s.name} not in liftLists`)
    } else if (s.kind === 'puzhuEnd') out.add('PUZHU27')
    else specGap(`source kind ${s.kind}`)
  }
  if (!out.size) specGap('忌 without a source')
  return [...out].sort()
}

/** One heading-day under the authority row rule. */
export function decideP4Puzhu06(row: P4Puzhu06Row): Decision {
  const before = { ji: row.ji, state: row.state }
  const touch =
    IN_SCOPE.includes(row.heading) &&
    row.triggers.length > 0 &&
    row.ji &&
    !row.protected &&
    !row.day_rule
  if (!touch) return { action: 'untouched', classes: [], ...before }
  const classes = classify(row)
  const actions = new Set(classes.map((c) => CLASSES[c]!.action))
  if (actions.has('untouched')) specGap('protected source on an unprotected row')
  const action = actions.has('hold') ? 'hold' : actions.has('keep') ? 'keep' : 'lift'
  if (action !== 'lift') return { action, classes, ...before }
  // A 相抵 subject left on the heading reads neither_recorded (puzhu:05, P4-B state model).
  const xiangdi = (row.sources as Rec[]).some(
    (s) => s.kind === 'subject' && s.state === 'neither_recorded',
  )
  const state = xiangdi
    ? 'neither_recorded'
    : { true: 'only_yi', false: 'not_recorded', unknown: 'undetermined' }[row.yi]
  return { action, classes, ji: false, state }
}

type YiDay = ReturnType<typeof resolveP4YiDay>

/** The nine triggers as the P4-C 宜 traces see them (union over every heading). */
function triggersOf(day: YiDay) {
  const present = new Set<string>()
  for (const e of Object.values(day.yiEvidence) as unknown as {
    trace?: { han: string; presence: string }[]
  }[])
    for (const t of e.trace ?? []) if (t.presence === 'present') present.add(t.han)
  return TRIGGERS.filter((g) => present.has(g))
}

/** Raw 忌 sources of one heading (same record shape as the task 1.0 baseline). */
function sourcesOf(month: string, pillar: string, day: YiDay, h: string): Rec[] {
  const yiKnown = Object.fromEntries(
    Object.entries(day.yiEvidence as Record<string, { yi?: boolean }>)
      .filter(([, e]) => e.yi !== undefined)
      .map(([k, e]) => [k, e.yi!]),
  )
  const { scopes } = resolveP4Headings(month, pillar, yiKnown)
  const grades = resolveP4Grades(month, pillar).subjects as Record<string, Record<string, unknown>>
  const out: Rec[] = []
  for (const [name, sc] of Object.entries(scopes)) {
    const g = grades[name] ?? {}
    out.push(
      'headings' in sc
        ? {
            kind: 'subject',
            name,
            owner: sc.owner,
            clauseEffect: sc.clauseEffect,
            grade: g.grade ?? null,
            gradeAction: g.gradeAction ?? null,
            dePresent: g.dePresent ?? null,
            state: sc.headings[h],
          }
        : { kind: 'subject', name, scope: 'undetermined' },
    )
  }
  for (const [name, y] of Object.entries(getP4YouweiScopes(day.subjects)))
    if (y.headings[h] === 'only_ji')
      out.push({ kind: 'youwei', name, parent: y.parent, protected: y.protected })
  for (const [name, s] of Object.entries(day.remaining.scopes))
    if (s.presence === 'present' && ['kept', 'protected', 'undetermined'].includes(s.headings[h]!))
      out.push({ kind: 'remaining', name, effect: s.effect, state: s.headings[h] })
  if (day.puzhuEnd.restoredJiHeadings.includes(h))
    out.push({ kind: 'puzhuEnd', name: 'deathDefeat', subjects: day.puzhuEnd.restoredSubjects })
  return out
}

/** Opt-in audit only: the P4-C day with puzhu:06 applied before propagation. Every field other
 * than the five in-scope headings (and propagation recomputed from them) is P4-C's. */
export function resolveP4Puzhu06Day(month: string, pillar: string, operands: P4YiDayOperands = {}) {
  const day = resolveP4YiDay(month, pillar, operands)
  const triggers = triggersOf(day)
  const dayRule = 'dayRule' in day ? String(day.dayRule) : ''
  const pre = { ...day.prePropagationHeadings }
  const puzhu06: Record<
    string,
    Decision & { authorityId: string; triggers: string[]; sources: Rec[]; yiRule?: string }
  > = {}
  for (const h of IN_SCOPE) {
    const f = day.headings[h]!
    const row: P4Puzhu06Row = {
      heading: h,
      month,
      triggers,
      day_rule: dayRule,
      yi: f.yi === undefined ? 'unknown' : f.yi ? 'true' : 'false',
      ji: f.ji,
      protected: f.protectedJi,
      state: f.state,
      sources: f.ji && !f.protectedJi && triggers.length ? sourcesOf(month, pillar, day, h) : [],
    }
    const d = decideP4Puzhu06(row)
    puzhu06[h] = { ...d, authorityId: authority.version, triggers, sources: row.sources as Rec[] }
    if (d.action === 'lift') pre[h] = { ...pre[h]!, ji: false, state: d.state as P4DayState }
  }
  const headings = applyP4Propagation(pre)
  // Owner scoped 宜 rule, after propagation: a heading kept only by QL_NARROW that still notes 宜 reads only_ji.
  for (const h of IN_SCOPE) {
    const d = puzhu06[h]!
    if (
      d.action === 'keep' &&
      p4Puzhu06NarrowOnlyJi(d.classes) &&
      headings[h]!.state === 'both_present'
    ) {
      headings[h] = { ...headings[h]!, state: 'only_ji', yi: false }
      puzhu06[h] = { ...d, yiRule: P4_PUZHU06_ONLY_JI_TAG }
    }
  }
  return {
    ...day,
    version: 'p4b-puzhu06-day-v1' as const,
    prePropagationHeadings: pre,
    headings,
    puzhu06,
  }
}
