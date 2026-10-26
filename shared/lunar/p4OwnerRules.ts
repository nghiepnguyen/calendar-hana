import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import remainingArt from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import { resolveP4Context } from './p4ContextBridge'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { evaluateP4Clause, presentP4De, resolveP4Grades } from './p4GradeResolution'
import {
  canonP4Heading,
  getP4BaseAvoid,
  getP4DeferralUncovered,
  resolveP4Headings,
} from './p4HeadingAnnotation'
import { getP4MoonPhase } from './p4LunarPhase'
import { decideP4Puzhu06, resolveP4Puzhu06Day, type P4Puzhu06Row } from './p4Puzhu06'
import { resolveP4RemainingJi } from './p4RemainingJi'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4WarehouseDay } from './p4Warehouse'
import { resolveP4YiDay, type P4YiDayOperands } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { splitHeadings } from './xiejiVol10Resolution'

/** Roadmap 7b: the P4 resolution layer with the owner rules of the accepted full Golden v2
 * (c574e57): H1-B/F5, E3, H2-A, F1, E1, E5 and 德作建論 (i). Built on the engine's own fact layers with
 * opt-in hooks whose defaults keep the accepted P4 behaviour. Production reaches it through
 * getP4DayHeadings (p4AlmanacHeadings.ts) inside the P4 domain. */
export type P4OwnerRow = {
  state: string
  ji: boolean | undefined
  protectedJi: boolean | undefined
  yi?: boolean | undefined
  yiNoted?: boolean | undefined
  rule?: string
  puzhu06?: string
  propagatedFrom?: string
  propagationBlocked?: string
  /** Owner (i) changed this row's puzhu:06 trigger set ('reduced') or removed every trigger ('skipped'). */
  puzhu06Dropped?: 'reduced' | 'skipped'
  /** Deciding trace, ids as in the Golden `code`: primary rule, 忌 sources, protecting sources. */
  trace?: { primary: string; ji: string[]; prot: string[] }
}
export type P4OwnerDay = Record<string, P4OwnerRow>

const DE_HE = ['天德', '月德', '天德合', '月德合']
const norm = (h: string) => canonP4Heading(splitHeadings(h)[0]!)
const PUZHU06_HEADINGS = ['安牀', '開市', '立券交易', '納財', '開倉庫出貨財']
const PUZHU06_TRIGGERS = [
  '天德',
  '月德',
  '天德合',
  '月德合',
  '天赦',
  '天願',
  '月恩',
  '四相',
  '時德',
]
// Rule D of 修倉庫 (p5-warehouse-v1, owner D): direct gods, or a base with partners agreeing in 卷十 and 卷十一.
const D_DIRECT = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '三合', '滿日']
const D_R10: Record<string, string[]> = {
  收日: ['月恩', '四相', '時德'],
  母倉: ['月恩', '四相', '開日'],
  六合: ['月恩', '四相', '時德'],
  五富: ['月恩', '四相', '時德'],
  天倉: ['月恩', '四相', '開日'],
}
const D_R11 = ['月德', '四相', '時德', '開日']

/** 德作建論 / 不作德合論 day: the four 德合 gods count as no 德 anywhere (owner (i)). */
function deAsJian(month: string, pillar: string) {
  const ctx = resolveP4Context(month, pillar)
  return (
    ctx.deAsJianRuleIds.length > 0 || ctx.pillarRules.some((r) => r.ignoredVirtueGroup === '德合')
  )
}

function ruleD(
  presence: Readonly<Record<string, boolean | undefined>>,
  drop: boolean,
): boolean | undefined {
  const on = (g: string) => presence[g] === true && !(drop && DE_HE.includes(g))
  if (D_DIRECT.some(on)) return true
  const v = Object.keys(D_R10)
    .filter(on)
    .map((b) => [D_R10[b]!.some(on), D_R11.some(on)] as const)
  if (v.some(([a, b]) => a && b)) return true
  return v.some(([a, b]) => a !== b) ? undefined : false
}

type Fact = { source: string; kind: string; effect?: string; state: string }

/** Owner H2-A (2026-10-17): 天願 ∈ 德願, so 「亦不從德願所宜」 removes 天願 from the clause's named 德
 * group. Re-evaluates a scope the engine left undetermined for 德願, through the engine's own clause
 * evaluator. Returns null when it stays undetermined (another named god of unknown membership). */
function h2aScope(month: string, pillar: string, subject: string) {
  const ctx = resolveP4Context(month, pillar)
  if (!ctx.pillarRules.some((r) => r.ignoredVirtueGroup === '德願')) return null
  const terminal = ctx.deferrals[subject]?.terminal
  if (!terminal) return null
  const de = new Set(presentP4De(month, pillar))
  de.delete('天願')
  const rules = ctx.pillarRules.filter((r) => r.ignoredVirtueGroup !== '德願')
  const e = evaluateP4Clause(terminal, month, de, rules)
  if (e.undetermined || e.named.some((g) => DE_HE.includes(g) || g === '天赦')) return null
  // The only real case (未月戊午 閉日/天吏) resolves to 如常例; anything else is outside this rule.
  if (e.clauseEffect !== 'as_usual') throw new Error(`H2-A: unsupported effect ${e.clauseEffect}`)
  const headings: Record<string, string> = {}
  for (const h of getP4BaseAvoid(terminal, month)) headings[h] = 'only_ji'
  if (terminal !== subject)
    for (const h of getP4DeferralUncovered(subject, terminal, month)) headings[h] ??= 'undetermined'
  return { effect: e.clauseEffect, headings }
}

type RemainingScope = { presence: string; effect: string; headings: Record<string, string> }
type RemainingEntry = {
  han: string
  avoid: string
  presence: unknown
  protected?: boolean
  protection?: { months: string[] | string; headings: string; allMonths?: string[] }
  conditions: {
    effect: string
    withGods: string[]
    months: string[] | string
    exceptMonths?: string[]
    require?: string
    pillar?: string
    keep?: string
    target?: string
  }[]
  aliases?: Record<string, string>
}
const UNMAPPED = ['修築園圃', '逺廻']
// Trace ids follow the Golden: a remaining-ji alias scope (招搖) is reported under its entry (厭對).
const ALIAS_ENTRY: Record<string, string> = Object.fromEntries(
  (remainingArt.entries as RemainingEntry[]).flatMap((e) =>
    Object.keys(e.aliases ?? {}).map((a) => [a, e.han]),
  ),
)
const traceId = (f: Fact) =>
  f.kind === 'remaining' ? (ALIAS_ENTRY[f.source] ?? f.source) : f.source
const remHeadings = (s: string) =>
  splitHeadings(UNMAPPED.reduce((t, h) => t.replaceAll(h, ''), s)).map(canonP4Heading)

/** Remaining 卷十一 凶 scopes. Owner (i): on 德作建論 days a lift condition takes no 德合 god. The engine
 * output is used as is on other days; on 德作建論 days the condition choice is re-run here with the same
 * rules, and the re-run without the drop must equal the engine (checked). */
function remainingScopes(month: string, pillar: string, drop: boolean, check = false) {
  const engine = resolveP4RemainingJi(month, pillar).scopes as Record<string, RemainingScope>
  if (!drop && !check) return engine
  const ctx = resolveP4Context(month, pillar)
  const B = '子丑寅卯辰巳午未申酉戌亥'
  const S = '甲乙丙丁戊己庚辛壬癸'
  const gods = getXiejiGodPresence(B.indexOf(month), S.indexOf(pillar[0]!), B.indexOf(pillar[1]!))
  const allTrue = Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, true]))
  const baseScopes = resolveP4Headings(month, pillar, allTrue).scopes
  const run = (withoutDeHe: boolean) => {
    const present = new Set([...Object.keys(ctx.deferrals), ...presentP4De(month, pillar)])
    for (const [han, id] of Object.entries({ 三合: 'tam_hop', 六合: 'luc_hop' }))
      if (id in gods) present.add(han)
    if (withoutDeHe) for (const g of DE_HE) present.delete(g)
    const out: Record<string, RemainingScope> = {}
    for (const entry of remainingArt.entries as RemainingEntry[]) {
      const presence = engine[entry.han]!.presence
      const clause = entry.conditions.find(
        (c) =>
          (c.months === '*' || c.months.includes(month)) &&
          !c.exceptMonths?.includes(month) &&
          (!c.pillar || c.pillar === pillar) &&
          (!c.require || present.has(c.require)) &&
          (!c.withGods.length || c.withGods.some((g) => present.has(g))),
      )
      const effect = clause?.effect ?? 'keep'
      const avoided = new Set(remHeadings(entry.avoid))
      const keep = new Set(remHeadings(clause?.keep ?? ''))
      const headings: Record<string, string> = {}
      for (const h of P4_DAY_HEADINGS) {
        if (presence === 'absent') headings[h] = 'absent'
        else if (effect === 'all_taboo') headings[h] = 'all_taboo'
        else if (!avoided.has(h)) headings[h] = 'not_listed'
        else if (presence === 'unknown') headings[h] = 'undetermined'
        else if (effect === 'defer') {
          const target = baseScopes[clause!.target!]
          const st = target && 'headings' in target ? target.headings[h] : 'undetermined'
          headings[h] =
            st === 'only_ji' || st === 'both_present'
              ? 'kept'
              : st === 'not_avoided' || st === 'neither_recorded' || st === 'only_yi'
                ? 'lifted'
                : 'undetermined'
        } else if (effect === 'lift' || (effect === 'only_avoid' && !keep.has(h)))
          headings[h] = 'lifted'
        else if (effect === 'no_annotation') headings[h] = 'no_annotation'
        else
          headings[h] =
            entry.protected ||
            entry.protection?.allMonths?.includes(month) ||
            (entry.protection &&
              (entry.protection.months === '*' || entry.protection.months.includes(month)) &&
              (entry.protection.headings === '*' ||
                remHeadings(entry.protection.headings).includes(h)))
              ? 'protected'
              : 'kept'
      }
      out[entry.han] = { presence, effect, headings }
      for (const [alias, raw] of Object.entries(entry.aliases ?? {})) {
        const hs = new Set(remHeadings(raw))
        out[alias] = {
          presence,
          effect: 'shared_virtue_lift',
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
    return out
  }
  const same = run(false)
  for (const [k, s] of Object.entries(engine))
    if (
      JSON.stringify([s.presence, s.effect, s.headings]) !==
      JSON.stringify([same[k]?.presence, same[k]?.effect, same[k]?.headings])
    )
      throw new Error(`remaining-ji re-run differs from the engine on ${month}${pillar} ${k}`)
  return drop ? run(true) : engine
}

/** Throws unless the layer's re-run of the remaining-ji condition choice (without the (i) drop) equals the
 * engine on this context; the full test calls it for all 720 contexts. */
export function checkP4RemainingRerun(month: string, pillar: string) {
  remainingScopes(month, pillar, false, true)
}

/** puzhu:06 triggers present today; owner (i): none of the four 德合 gods on a 德作建論 day. */
export function p4Puzhu06Triggers(present: ReadonlySet<string>, deAsJianDay: boolean) {
  return PUZHU06_TRIGGERS.filter((g) => present.has(g) && !(deAsJianDay && DE_HE.includes(g)))
}

function yiState(yi: boolean | undefined) {
  return yi === undefined ? 'undetermined' : yi ? 'only_yi' : 'not_recorded'
}

/** Dated day: every date operand known. */
export function resolveP4OwnerRulesDay(
  month: string,
  pillar: string,
  operands: P4YiDayOperands = {},
): P4OwnerDay {
  const day = resolveP4YiDay(month, pillar, operands)
  const warehouse = resolveP4WarehouseDay(month, pillar, operands).warehouse
  const drop = deAsJian(month, pillar)
  const dayChars = [pillar[0]!, pillar[1]!]
  const dayRule = 'dayRule' in day && Boolean(day.dayRule)

  // 宜 evidence: ANY over the engine's own 宜 trace, without 德合 gods on 德作建論 days (owner (i)).
  const yiEv: Record<string, boolean | undefined> = {}
  for (const h of P4_DAY_HEADINGS) {
    if (h === '修倉庫') {
      if (ruleD(warehouse.presence, false) !== warehouse.yi && !warehouse.unknownOperands.length)
        throw new Error(`rule D disagrees with the P5 engine on ${month}${pillar}`)
      yiEv[h] = warehouse.unknownOperands.length ? warehouse.yi : ruleD(warehouse.presence, drop)
      continue
    }
    const trace = (day.yiEvidence[h]?.trace ?? []) as { han: string; presence: string }[]
    const states = trace
      .filter((t) => !(drop && DE_HE.includes(t.han)))
      .map((t) => (t.presence === 'present' ? true : t.presence === 'absent' ? false : undefined))
    yiEv[h] = states.includes(true) ? true : states.includes(undefined) ? undefined : false
  }

  // Facts. 卷十 subject scopes with 宜 fixed true: both_present = 止忌 kept (遇德猶忌), only_yi = lifted.
  const allTrue = Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, true]))
  const { scopes, youweiScopes } = resolveP4Headings(month, pillar, allTrue)
  const remaining = remainingScopes(month, pillar, drop)
  const restored = new Set(day.puzhuEnd.restoredSubjects)
  const facts: Record<string, Fact[]> = Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, []]))
  for (const [subject, scope] of Object.entries(scopes)) {
    if (restored.has(subject)) {
      // puzhu:27 仍以死敗論: the subject reads 如常例 on its own base list.
      for (const h of getP4BaseAvoid(subject, month))
        facts[h]?.push({ source: subject, kind: 'subject', effect: 'as_usual', state: 'only_ji' })
      continue
    }
    if (!('headings' in scope)) {
      const resolved = h2aScope(month, pillar, subject)
      if (resolved) {
        for (const [h, state] of Object.entries(resolved.headings))
          facts[h]?.push({ source: subject, kind: 'subject', effect: resolved.effect, state })
        continue
      }
      // A whole-scope undetermined makes only its own headings undetermined (spec §4).
      for (const h of getP4BaseAvoid(subject, month))
        facts[h]?.push({ source: subject, kind: 'subject', state: 'undetermined' })
      continue
    }
    for (const h of P4_DAY_HEADINGS) {
      const s = scope.headings[h]
      if (!s || s === 'not_listed' || s === 'not_avoided') continue
      const state = s === 'both_present' ? 'stop' : s === 'only_yi' ? 'lifted' : s
      facts[h]!.push({ source: subject, kind: 'subject', effect: scope.clauseEffect, state })
    }
  }
  for (const [alias, y] of Object.entries(youweiScopes))
    for (const h of P4_DAY_HEADINGS)
      if (y.headings[h] === 'only_ji')
        facts[h]!.push({
          source: alias,
          kind: y.protected ? 'zhuanji' : 'convention',
          state: 'only_ji',
        })
  for (const [name, s] of Object.entries(remaining))
    if (s.presence !== 'absent')
      for (const h of P4_DAY_HEADINGS) {
        const st = s.headings[h]!
        if (st !== 'not_listed' && st !== 'absent' && st !== 'lifted')
          facts[h]!.push({ source: name, kind: 'remaining', effect: s.effect, state: st })
      }
  for (const r of art.baiji.rules) {
    // Owner F1: 巳日「出行」 is 行幸遣使 (卷十一 「出行同」).
    const h = r.heading ?? (r.day === '巳' && r.raw === '出行' ? '行幸遣使' : null)
    if (h && dayChars.includes(r.day))
      facts[norm(h)]?.push({ source: `百忌${r.day}`, kind: 'baiji', state: 'protected' })
  }
  // Named pillar 諸事皆忌 clauses: every heading, protected (recorded for the trace; allTaboo decides).
  for (const id of day.pillarAllTaboo)
    for (const h of P4_DAY_HEADINGS)
      facts[h]!.push({ source: id, kind: 'pillar_all', state: 'protected' })
  for (const [token, s] of Object.entries(day.lunarDayScopes))
    if (s.presence === 'present')
      facts[norm(s.heading)]?.push({ source: token, kind: 'dated', state: 'protected' })
  if (day.phaseScope.presence === 'present')
    facts[norm(day.phaseScope.heading)]?.push({
      source: '朔望日',
      kind: 'dated',
      state: 'protected',
    })
  if (day.soilScope.presence === 'present')
    for (const h of day.soilScope.headings)
      facts[norm(h)]?.push({ source: '土王用事後', kind: 'dated', state: 'protected' })
  for (const [kind, scope] of [
    ['lunarDay', Object.values(day.lunarDayScopes)],
    ['phase', [day.phaseScope]],
  ] as const)
    for (const s of scope as { presence: string; heading: string }[])
      if (s.presence === 'unknown')
        facts[norm(s.heading)]?.push({ source: kind, kind: 'dated', state: 'undetermined' })
  if (day.soilScope.presence === 'unknown')
    for (const h of day.soilScope.headings)
      facts[norm(h)]?.push({ source: 'soil', kind: 'dated', state: 'undetermined' })

  const yiOff = new Set<string>([
    ...art.yiSuppression.flatMap((line) =>
      ('rules' in line ? line.rules! : [line]).flatMap((r) =>
        dayChars.includes(r.day!) ? r.headings!.map(norm) : [],
      ),
    ),
    ...day.puzhuEnd.suppressedYiHeadings.map(norm),
  ])
  const allTaboo =
    day.pillarAllTaboo.length > 0 ||
    Object.values(remaining).some((s) => s.presence === 'present' && s.effect === 'all_taboo')

  // Composition (owner rules H1-B/F5, E1 and the A04b layering fix live here).
  const pre: P4OwnerDay = {}
  const xiangdi: Record<string, boolean> = {}
  for (const h of P4_DAY_HEADINGS) {
    const fs = facts[h]!
    const yi = yiEv[h]
    const kept = fs.filter(
      (f) => f.kind === 'subject' && (f.state === 'stop' || f.state === 'only_ji'),
    )
    const ji =
      kept.length > 0 ||
      fs.some(
        (f) =>
          f.kind !== 'subject' && ['only_ji', 'kept', 'protected', 'all_taboo'].includes(f.state),
      )
    const prot =
      kept.some((f) => f.state === 'stop') ||
      fs.some(
        (f) =>
          f.kind === 'zhuanji' ||
          f.kind === 'baiji' ||
          f.kind === 'pillar_all' ||
          (f.kind === 'dated' && f.state === 'protected'),
      ) ||
      fs.some((f) => f.kind === 'remaining' && (f.state === 'protected' || f.state === 'all_taboo'))
    // E1: 復日/重日 「不忌亦不註宜」 is 不註 like 相抵.
    const neither = fs.some((f) => f.state === 'neither_recorded' || f.state === 'no_annotation')
    const suppress =
      yiOff.has(h) ||
      neither ||
      day.puzhuEnd.restoredJiHeadings.map(norm).includes(h) ||
      kept.some((f) => ['as_usual', 'still_avoid', 'avoid_all'].includes(f.effect ?? ''))
    const yiNoted = suppress ? false : yi
    const undetermined = fs.some((f) => f.state === 'undetermined')
    xiangdi[h] = neither
    let row: P4OwnerRow
    if (dayRule) row = { state: yiState(yiNoted), ji: false, protectedJi: false, rule: 'puzhu:28' }
    else if (allTaboo) row = { state: 'only_ji', ji: true, protectedJi: true, rule: 'all_taboo' }
    else if (undetermined)
      row = { state: 'undetermined', ji, protectedJi: prot, rule: 'undetermined' }
    // H1-B/F5: an unprotected 忌 meeting another scope's 相抵 survives; 宜 is not noted.
    else if (neither && ji && !prot)
      row = { state: 'only_ji', ji: true, protectedJi: false, rule: 'H1-B' }
    else if (neither && !prot) row = { state: 'neither_recorded', ji: false, protectedJi: false }
    else if (ji)
      row = {
        state: yiNoted === undefined ? 'undetermined' : yiNoted ? 'both_present' : 'only_ji',
        ji: true,
        protectedJi: prot,
      }
    else row = { state: yiState(yiNoted), ji: false, protectedJi: false }
    const restoredHere = day.puzhuEnd.restoredJiHeadings.map(norm).includes(h)
    const jiIds = [
      ...new Set([
        ...kept.map(traceId),
        ...fs
          .filter(
            (f) =>
              f.kind !== 'subject' &&
              ['only_ji', 'kept', 'protected', 'all_taboo'].includes(f.state),
          )
          .map(traceId),
        ...(restoredHere ? ['puzhu:27'] : []),
      ]),
    ].sort()
    const protIds = [
      ...new Set([
        ...kept.filter((f) => f.state === 'stop').map(traceId),
        ...fs
          .filter(
            (f) =>
              f.kind === 'zhuanji' ||
              f.kind === 'baiji' ||
              f.kind === 'pillar_all' ||
              (f.kind === 'dated' && f.state === 'protected') ||
              (f.kind === 'remaining' && (f.state === 'protected' || f.state === 'all_taboo')),
          )
          .map(traceId),
      ]),
    ].sort()
    const primary =
      row.rule ??
      (row.state === 'undetermined'
        ? 'undetermined'
        : row.state === 'neither_recorded'
          ? 'xiangdi'
          : row.ji
            ? 'ji'
            : 'no_ji')
    const trace = {
      primary,
      ji: !dayRule && row.state !== 'neither_recorded' ? jiIds : [],
      prot: !dayRule && row.protectedJi ? protIds : [],
    }
    pre[h] = { ...row, yi, yiNoted, trace }
  }

  // puzhu:06 (authority v3, owner Q1–Q4a) through the engine's own decision, triggers per owner (i).
  const presentTriggers = new Set(
    PUZHU06_TRIGGERS.filter((g) =>
      P4_DAY_HEADINGS.some((h) =>
        ((day.yiEvidence[h]?.trace ?? []) as { han: string; presence: string }[]).some(
          (t) => t.han === g && t.presence === 'present',
        ),
      ),
    ),
  )
  const rawTriggers = p4Puzhu06Triggers(presentTriggers, false)
  const triggers = p4Puzhu06Triggers(presentTriggers, drop)
  const grades = resolveP4Grades(month, pillar).subjects as Record<string, Record<string, unknown>>
  for (const h of PUZHU06_HEADINGS) {
    const d = pre[h]!
    if (!rawTriggers.length || !d.ji || d.protectedJi || dayRule || d.state === 'undetermined')
      continue
    // Evidence for the (i) trigger rule: an eligible row whose trigger set (i) reduces or empties.
    if (triggers.length !== rawTriggers.length)
      d.puzhu06Dropped = triggers.length ? 'reduced' : 'skipped'
    if (!triggers.length) continue
    const known = Object.fromEntries(
      P4_DAY_HEADINGS.flatMap((x) => (yiEv[x] === undefined ? [] : [[x, yiEv[x]!]])),
    )
    const annotated = resolveP4Headings(month, pillar, known).scopes
    const sources: Record<string, unknown>[] = []
    for (const [name, sc] of Object.entries(annotated)) {
      const g = grades[name] ?? {}
      sources.push(
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
    for (const [name, y] of Object.entries(youweiScopes))
      if (y.headings[h] === 'only_ji')
        sources.push({ kind: 'youwei', name, parent: y.parent, protected: y.protected })
    for (const [name, s] of Object.entries(remaining))
      if (
        s.presence === 'present' &&
        ['kept', 'protected', 'undetermined'].includes(s.headings[h]!)
      )
        sources.push({ kind: 'remaining', name, effect: s.effect, state: s.headings[h] })
    if (day.puzhuEnd.restoredJiHeadings.map(norm).includes(h))
      sources.push({ kind: 'puzhuEnd', name: 'deathDefeat' })
    const row: P4Puzhu06Row = {
      heading: h,
      month,
      triggers,
      day_rule: '',
      yi: d.yiNoted === undefined ? 'unknown' : d.yiNoted ? 'true' : 'false',
      ji: true,
      protected: false,
      state: d.state,
      sources,
    }
    const decision = decideP4Puzhu06(row)
    d.puzhu06 = `${decision.action}:${decision.classes.join('+')}`
    if (decision.action === 'lift')
      Object.assign(d, { ji: false, state: xiangdi[h] ? 'neither_recorded' : yiState(d.yiNoted) })
  }

  // Propagation (鋪註 11, 16–24): one pass over the pre-propagation day. E3: a lift that leaves a 相抵
  // scope on the heading reads neither_recorded.
  const out: P4OwnerDay = Object.fromEntries(Object.entries(pre).map(([h, d]) => [h, { ...d }]))
  for (const line of art.propagation.lines as {
    from?: string[]
    to?: string[]
    pairs?: string[][]
    requireAll?: boolean
  }[]) {
    const edges = line.pairs
      ? line.pairs.map(([a, b]) => ({ from: [norm(a!)], to: [norm(b!)], all: false }))
      : line.from && line.to
        ? [{ from: line.from.map(norm), to: line.to.map(norm), all: line.requireAll === true }]
        : []
    for (const { from, to, all } of edges) {
      const fired = from.filter((h) => pre[h]?.state === 'neither_recorded')
      if (all ? fired.length !== from.length : !fired.length) continue
      for (const h of to) {
        const d = pre[h]
        if (!d || !d.ji || d.state === 'undetermined') continue
        if (d.protectedJi) {
          out[h]!.propagationBlocked = fired.join('+')
          continue
        }
        Object.assign(out[h]!, {
          ji: false,
          state: xiangdi[h] ? 'neither_recorded' : yiState(d.yiNoted),
          propagatedFrom: fired.join('+'),
        })
      }
    }
  }
  return out
}

/** Current engine stitching (registered in the Golden v2 lock): P4-C → puzhu:06 (5 headings) → P5 修倉庫. */
export function stitchP4EngineDay(
  month: string,
  pillar: string,
  operands: P4YiDayOperands = {},
): P4OwnerDay {
  const day = resolveP4Puzhu06Day(month, pillar, operands)
  const wh = resolveP4WarehouseDay(month, pillar, operands)
  const out: P4OwnerDay = {}
  for (const [h, d] of Object.entries(day.headings))
    out[h] = { state: d.state, ji: d.ji, protectedJi: d.protectedJi }
  const w = wh.headings['修倉庫']!
  out['修倉庫'] = { state: w.state, ji: w.ji, protectedJi: w.protectedJi }
  return out
}

// E5 templates: the engine requires every dated operand object to come from one date, so each
// soil × phase combination uses a real date (from the Golden v2 dated operands); lunar day is a number.
const VARIANT_DATES = [
  '2025-01-01', // soil absent, no phase
  '2025-01-07', // soil absent, First Quarter
  '2025-01-16', // soil present (立春 period), no phase
  '2025-01-22', // soil present, Last Quarter
] as const

/** Context (no date): owner rule E5 — a heading is determined only if every combination of soil
 * (shared by 母倉 and 土王用事後) × lunar day (12 / 15 / other) × primary phase gives the same row. */
export function resolveP4OwnerRulesContext(month: string, pillar: string): P4OwnerDay {
  const variants: P4OwnerDay[] = []
  for (const date of VARIANT_DATES)
    for (const lunarDay of [12, 15, 1])
      variants.push(
        resolveP4OwnerRulesDay(month, pillar, {
          lunarDay,
          phase: getP4MoonPhase(date),
          soil: getP4SoilPresence(date),
          yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
        }),
      )
  const key = (r: P4OwnerRow) =>
    JSON.stringify([
      r.state,
      r.ji,
      r.protectedJi,
      r.yi,
      r.yiNoted,
      r.rule ?? '',
      r.puzhu06 ?? '',
      r.propagatedFrom ?? '',
      r.propagationBlocked ?? '',
    ])
  const out: P4OwnerDay = {}
  for (const h of P4_DAY_HEADINGS) {
    const rows = variants.map((v) => v[h]!)
    // The trace of an invariant row is taken from the variant without any date-only 忌 (soil absent, lunar day
    // not 12/15, no phase): index 2 of the variant order.
    out[h] = rows.every((r) => key(r) === key(rows[0]!))
      ? rows[2]!
      : {
          state: 'undetermined',
          ji: undefined,
          protectedJi: undefined,
          rule: 'context:date-operand-dependent',
        }
  }
  return out
}
