import bridge from '../almanac-data/p4-vol10-context-bridge.json'
import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import { matchP4PillarRules } from './p4NamedClauses'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { isMonthlyShaPresent, type MonthlyShaId } from './xiejiMonthlySha'

/** Source audit bridge only: subject presence → named pillar clauses → named deferral paths.
 * No grade, heading annotation or score; not imported by the production pipeline. */
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

export const P4_SUBJECTS = bridge.subjects.map((s) => s.han) as readonly string[]
export type P4Presence = 'present' | 'absent' | 'unknown'
type Edge = { subject: string; months: string[]; target: string }

export interface P4DeferralWalk {
  status: 'named_deferral' | 'no_named_deferral' | 'undetermined' | 'target_absent' | 'cycle'
  path: string[]
  terminal: string | null
}

export function getP4SubjectPresence(monthJianBranch: number, dayStem: number, dayBranch: number) {
  const gods = getXiejiGodPresence(monthJianBranch, dayStem, dayBranch)
  const officer = OFFICERS[(dayBranch - monthJianBranch + 12) % 12]
  const out: Record<string, P4Presence> = {}
  for (const { han, presence: p } of bridge.subjects as {
    han: string
    presence: { officer?: string; monthlySha?: string; xiejiGod?: string; unknown?: string }
  }[]) {
    out[han] =
      p.unknown !== undefined
        ? 'unknown'
        : (
              p.officer
                ? p.officer === officer
                : p.monthlySha
                  ? isMonthlyShaPresent(p.monthlySha as MonthlyShaId, monthJianBranch, dayBranch)
                  : p.xiejiGod! in gods
            )
          ? 'present'
          : 'absent'
  }
  return out
}

/** Follows named edges from a present subject. Each hop needs a co-present target; unknown
 * target presence stays undetermined, and no edge is ever inferred from severity. */
export function walkP4Deferral(
  subject: string,
  month: string,
  presence: (subject: string) => P4Presence,
  edges: readonly Edge[] = clauses.namedDeferrals,
): P4DeferralWalk {
  const path = [subject]
  for (;;) {
    const current = path.at(-1)!
    const edge = edges.find((e) => e.subject === current && e.months.includes(month))
    if (!edge)
      return {
        status: path.length > 1 ? 'named_deferral' : 'no_named_deferral',
        path,
        terminal: current,
      }
    const seen = path.includes(edge.target)
    path.push(edge.target)
    if (seen) return { status: 'cycle', path, terminal: null }
    const p = presence(edge.target)
    if (p === 'unknown') return { status: 'undetermined', path, terminal: null }
    if (p === 'absent') return { status: 'target_absent', path, terminal: null }
  }
}

export function resolveP4Context(month: string, pillar: string) {
  const m = BRANCHES.indexOf(month)
  const stem = STEMS.indexOf(pillar[0] ?? '')
  const branch = BRANCHES.indexOf(pillar[1] ?? '')
  if (month.length !== 1 || m < 0) throw new RangeError('Invalid Month Jian')
  if (pillar.length !== 2 || stem < 0 || branch < 0 || stem % 2 !== branch % 2)
    throw new RangeError('Invalid sexagenary pillar')
  const subjects = getP4SubjectPresence(m, stem, branch)
  const deferrals: Record<string, P4DeferralWalk> = {}
  for (const s of P4_SUBJECTS)
    if (subjects[s] === 'present')
      deferrals[s] = walkP4Deferral(s, month, (t) => subjects[t] ?? 'unknown')
  // The clause predicate is the listed date itself; see pillarClausePredicate in the bridge.
  const pillarRules = matchP4PillarRules(month, pillar, true).rules
  const ids = new Set(pillarRules.map((r) => r.id))
  return {
    officer: OFFICERS[(branch - m + 12) % 12]!,
    subjects,
    pillarRules,
    deferrals,
    terminals: [
      ...new Set(
        Object.values(deferrals)
          .map((d) => d.terminal)
          .filter((t): t is string => t !== null),
      ),
    ],
    ignoredVirtueGroups: [
      ...new Set(pillarRules.map((r) => r.ignoredVirtueGroup).filter((g) => g !== null)),
    ],
    deAsJianRuleIds: [
      ...new Set(bridge.deAsJian.flatMap((g) => g.ruleIds.filter((id) => ids.has(id)))),
    ],
  }
}
