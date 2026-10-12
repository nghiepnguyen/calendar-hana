import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import { getSourceLockedCatHungStars } from './catHungStars'
import { resolveP4Context } from './p4ContextBridge'
import { resolveP4Grades } from './p4GradeResolution'
import { canonP4Heading, resolveP4Headings, type P4HeadingState } from './p4HeadingAnnotation'
import { getP4SeasonDays } from './p4SeasonDays'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { splitHeadings } from './xiejiVol10Resolution'
import { getVol10VirtuesPresent } from './xiejiVirtues'

/** Source audit only (A04b): one day, the 29 卷十一 activity headings, composed from the modeled
 * scopes (13 卷十 subjects, named pillar clauses, 百忌日). Not imported by the production pipeline. */
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const OFFICERS = [
  'kien',
  'tru',
  'man',
  'binh',
  'dinh',
  'chap',
  'pha',
  'nguy',
  'thanh',
  'thu',
  'khai',
  'be',
]
const STAR_HAN: Record<string, string> = {
  'Thiên Đức': '天德',
  'Thiên Đức Hợp': '天德合',
  'Nguyệt Đức': '月德',
  'Nguyệt Đức Hợp': '月德合',
}
const OPS = art.yiEvidence.operands
const XIEJI_GOD = OPS.xiejiGod as Record<string, string>
const OFFICER_GOD = OPS.officer as Record<string, string>
const VOCAB = [
  ...OPS.catHung,
  ...OPS.virtues,
  ...Object.keys(XIEJI_GOD),
  ...Object.keys(OFFICER_GOD),
  ...OPS.seasonDays,
  ...art.yiEvidence.unknown,
].sort((a, b) => b.length - a.length)
const SUBJECT_NAMES = /月建|月破|平日|收日|閉日|劫煞|刼煞|災煞|月煞|月刑|月害|月厭|大時|天吏/g
const ENTRIES = vol11.entries as Record<string, { 宜: string; 忌: string }>
/** Artifact headings are written as in the source; compare them in splitHeadings' normal form. */
const norm = (h: string) => canonP4Heading(splitHeadings(h)[0]!)
export const P4_DAY_HEADINGS = Object.keys(ENTRIES).map(norm)

export type P4DayState = Exclude<P4HeadingState, 'not_avoided' | 'not_listed'> | 'not_recorded'
type Day = { state: P4DayState; protectedJi: boolean; ji: boolean; yi: boolean | undefined }

/** Splits a 卷十一 宜 list into god names; throws on a token outside the artifact vocabulary. */
export function splitP4YiGods(text: string): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length;) {
    const hit = VOCAB.find((v) => text.startsWith(v, i))
    if (!hit) throw new Error(`Unknown 宜 token at ${i}: ${text.slice(i, i + 4)}`)
    out.push(hit)
    i += hit.length
  }
  return out
}

function yiEvidence(month: string, pillar: string) {
  const m = BRANCHES.indexOf(month)
  const stem = STEMS.indexOf(pillar[0]!)
  const branch = BRANCHES.indexOf(pillar[1]!)
  const present = new Set<string>([
    ...getSourceLockedCatHungStars(m, stem, branch)
      .good.map((s) => STAR_HAN[s.name])
      .filter((h): h is string => h !== undefined),
    ...getVol10VirtuesPresent(m, stem, branch),
  ])
  const gods = getXiejiGodPresence(m, stem, branch)
  const officer = OFFICERS[(branch - m + 12) % 12]
  const season = getP4SeasonDays(m, branch)
  const isPresent = (god: string): boolean | undefined =>
    art.yiEvidence.unknown.includes(god)
      ? undefined
      : OPS.seasonDays.includes(god)
        ? season[god] === 'unknown'
          ? undefined
          : season[god] === 'present'
        : god in XIEJI_GOD
          ? XIEJI_GOD[god]! in gods
          : god in OFFICER_GOD
            ? OFFICER_GOD[god] === officer
            : present.has(god)
  const out: Record<string, boolean | undefined> = {}
  for (const [raw, entry] of Object.entries(ENTRIES)) {
    const h = norm(raw)
    if (raw in (art.yiEvidence.deferred as Record<string, string>)) continue
    const seen = splitP4YiGods(entry.宜).map(isPresent)
    out[h] = seen.includes(true) ? true : seen.includes(undefined) ? undefined : false
  }
  return out
}

type Line = { from?: string[]; to?: string[]; pairs?: string[][]; requireAll?: boolean }

/** Propagation headings outside the 29 day headings: never composed here, reported, not hidden. */
export const P4_PROPAGATION_OUT_OF_SCOPE: readonly string[] = [
  ...new Set(
    (art.propagation.lines as Line[])
      .flatMap((l) => [...(l.from ?? []), ...(l.to ?? []), ...(l.pairs ?? []).flat()])
      .map(norm)
      .filter((h) => !P4_DAY_HEADINGS.includes(h)),
  ),
]

/** Single pass over composed day states: a 相抵 from-heading lifts the to-heading's unprotected 忌. */
export function applyP4Propagation(
  days: Record<string, Day>,
  lines: readonly Line[] = art.propagation.lines,
) {
  const out: Record<string, Day & { propagatedFrom?: string; propagationBlocked?: string }> = {
    ...days,
  }
  const edges = lines.flatMap((l) =>
    l.pairs
      ? l.pairs.map(([from, to]) => ({ from: [norm(from!)], to: [norm(to!)], all: false }))
      : l.from && l.to
        ? [{ from: l.from.map(norm), to: l.to.map(norm), all: l.requireAll === true }]
        : [],
  )
  for (const { from, to, all } of edges) {
    const fired = from.filter((h) => days[h]?.state === 'neither_recorded')
    if (all ? fired.length !== from.length : !fired.length) continue
    for (const h of to) {
      const d = days[h]
      if (!d?.ji) continue
      // A heading still undetermined for other reasons stays so; propagation only lifts a known 忌.
      if (d.state === 'undetermined') continue
      if (d.protectedJi) {
        out[h] = { ...out[h]!, propagationBlocked: fired.join('+') }
        continue
      }
      out[h] = {
        ...d,
        ji: false,
        state: d.yi === undefined ? 'undetermined' : d.yi ? 'only_yi' : 'not_recorded',
        propagatedFrom: fired.join('+'),
      }
    }
  }
  return out
}

export function resolveP4Day(month: string, pillar: string) {
  const ctx = resolveP4Context(month, pillar) // validates input before any lookup
  const yi = yiEvidence(month, pillar)
  const allTaboo = resolveP4Grades(month, pillar).allTabooRuleIds
  const { scopes, youweiScopes } = resolveP4Headings(
    month,
    pillar,
    Object.fromEntries(Object.entries(yi).filter(([, v]) => v !== undefined)) as Record<
      string,
      boolean
    >,
  )
  const dayChars = [pillar[0]!, pillar[1]!]
  const baiji = new Set(
    art.baiji.rules
      .filter((r) => r.heading && dayChars.includes(r.day))
      .map((r) => norm(r.heading!)),
  )
  const suppressed = new Set(
    art.yiSuppression.flatMap((line) =>
      ('rules' in line ? line.rules! : [line]).flatMap((r) =>
        dayChars.includes(r.day!) ? r.headings!.map(norm) : [],
      ),
    ),
  )
  const resolved = Object.values(scopes).filter((s) => 'headings' in s)
  const anyScopeUndetermined = resolved.length !== Object.keys(scopes).length
  const days: Record<string, Day> = {}
  for (const h of P4_DAY_HEADINGS) {
    const yiH = yi[h]
    if (allTaboo.length) {
      days[h] = { state: 'only_ji', protectedJi: true, ji: true, yi: yiH }
      continue
    }
    const states = resolved.map((s) => {
      const st = s.headings[h] ?? 'not_listed'
      // A 止忌 scope cannot be undetermined with known-false 宜 unless the 忌 was lifted.
      return {
        st:
          st === 'undetermined' && yiH === false && !s.uncoveredByDeferral?.includes(h)
            ? ('not_avoided' as const)
            : st,
        effect: s.clauseEffect,
      }
    })
    const kept = states.filter((x) => x.st === 'only_ji' || x.st === 'both_present')
    // 又為 scopes note 忌 only; 專忌 ones are protected like 百忌日, and none suppresses 宜.
    const youweiJi = Object.values(youweiScopes).filter((y) => y.headings[h] === 'only_ji')
    const ji = baiji.has(h) || kept.length > 0 || youweiJi.length > 0
    const protectedJi =
      baiji.has(h) ||
      kept.some((x) => x.effect === 'only_avoid') ||
      youweiJi.some((y) => y.protected)
    const neither = states.some((x) => x.st === 'neither_recorded')
    const suppress =
      suppressed.has(h) ||
      neither ||
      kept.some((x) => ['as_usual', 'still_avoid', 'avoid_all'].includes(x.effect))
    const undetermined =
      anyScopeUndetermined ||
      states.some((x) => x.st === 'undetermined') ||
      (neither && ji && !protectedJi)
    const yiNoted = suppress ? false : yiH
    const state: P4DayState = undetermined
      ? 'undetermined'
      : neither && !protectedJi
        ? 'neither_recorded'
        : ji
          ? yiNoted === undefined
            ? 'undetermined'
            : yiNoted
              ? 'both_present'
              : 'only_ji'
          : yiNoted === undefined
            ? 'undetermined'
            : yiNoted
              ? 'only_yi'
              : 'not_recorded'
    days[h] = { state, protectedJi, ji, yi: yiNoted }
  }
  const unmodeled = Object.fromEntries(
    Object.entries(ENTRIES).map(([raw, e]) => [norm(raw), e.忌.replace(SUBJECT_NAMES, '')]),
  )
  return {
    pillarAllTaboo: allTaboo,
    subjects: Object.keys(ctx.deferrals),
    headings: applyP4Propagation(days),
    prePropagationHeadings: days,
    // 卷十一 忌 gods outside the modeled scopes (raw text, presence not audited here).
    unmodeledJi: unmodeled,
    propagationOutOfScope: P4_PROPAGATION_OUT_OF_SCOPE,
  }
}
