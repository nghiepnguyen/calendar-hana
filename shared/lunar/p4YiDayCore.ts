import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import {
  applyP4Propagation,
  P4_DAY_HEADINGS,
  P4_PROPAGATION_OUT_OF_SCOPE,
} from './p4DayComposition'
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

export type P4DayState = Exclude<P4HeadingState, 'not_avoided' | 'not_listed'> | 'not_recorded'
type Day = { state: P4DayState; protectedJi: boolean; ji: boolean; yi: boolean | undefined }

export function getP4LegacyYiPresence(month: string, pillar: string) {
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
  return Object.fromEntries(VOCAB.map((god) => [god, isPresent(god)]))
}

/** Audit assembly seam: evidence enters before classification/suppression/propagation.
 * No provider import here; the historical wrapper supplies its original lookup. */
export function assembleP4YiDay(
  month: string,
  pillar: string,
  yi: Readonly<Record<string, boolean | undefined>>,
) {
  const ctx = resolveP4Context(month, pillar)
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
