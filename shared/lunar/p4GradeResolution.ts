import authority from '../almanac-data/p4-vol10-authority.json'
import art from '../almanac-data/p4-vol10-grade-resolution-v2.json'
import bridge from '../almanac-data/p4-vol10-context-bridge-v2.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import { getSourceLockedCatHungStars } from './catHungStars'
import { resolveP4Context } from './p4ContextBridge'
import { getVol10VirtuesPresent } from './xiejiVirtues'

/** Source audit only (A03): (subject, Month Jian) → 等第 cell, the 德 group the entry clause
 * names, and the grade action that follows. No heading annotation or score; not imported by
 * the production pipeline. */
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const DE_HE = ['天德', '月德', '天德合', '月德合']
const STAR_HAN: Record<string, string> = {
  'Thiên Đức': '天德',
  'Thiên Đức Hợp': '天德合',
  'Nguyệt Đức': '月德',
  'Nguyệt Đức Hợp': '月德合',
}

type Clause = {
  months: string[] | '*'
  effect: string
  with?: string[]
  otherwise?: string
  to?: string
}
type GradeAction = 'only_yi' | 'only_ji' | 'both_present' | 'all_taboo'

const ENTRIES = new Map<string, Clause[]>([
  ...vol10.entries.map((e) => [e.id, e.clauses as Clause[]] as const),
  ...art.entries.map((e) => [e.id, e.clauses as Clause[]] as const),
])
const ENTRY_BY_SUBJECT = art.subjectEntries as Record<string, string>
const COLUMN_BY_SUBJECT = art.gridColumns as Record<string, string>
const GRADES = new Map(authority.grades.map((g) => [g.id, g]))
const ACTION_EFFECT = art.actionEffect as unknown as Record<GradeAction, string[]>
const DE_AS_JIAN = new Set(bridge.deAsJian.flatMap((g) => g.ruleIds))

/** The clause of a subject's own entry for this month. */
export function getP4EntryClause(subject: string, month: string): Clause {
  const clauses = ENTRIES.get(ENTRY_BY_SUBJECT[subject]!)
  const clause = clauses?.find((c) => c.months === '*' || c.months.includes(month))
  if (!clause) throw new RangeError(`No 卷十 clause for ${subject} in ${month}月`)
  return clause
}

/** The one 等第 cell whose month groups contain this month; throws if zero or several. */
export function getP4GridCell(subject: string, month: string) {
  const column = COLUMN_BY_SUBJECT[subject]
  if (!column) return null
  const cells = authority.cells.filter(
    (c) =>
      c.id.startsWith(`${column}:`) &&
      c.displayReading
        .split(' / ')
        .some((group) => (group.split('：')[0]!.split('月')[0] ?? '').includes(month)),
  )
  if (cells.length !== 1)
    throw new RangeError(`${subject} ${month}月 matches ${cells.length} 等第 cells`)
  return cells[0]!
}

function presentDe(monthJianBranch: number, dayStem: number, dayBranch: number) {
  return new Set<string>([
    ...getSourceLockedCatHungStars(monthJianBranch, dayStem, dayBranch)
      .good.map((s) => STAR_HAN[s.name])
      .filter((h): h is string => h !== undefined),
    ...getVol10VirtuesPresent(monthJianBranch, dayStem, dayBranch),
  ])
}

export function resolveP4Grades(month: string, pillar: string) {
  const ctx = resolveP4Context(month, pillar)
  const m = BRANCHES.indexOf(month)
  const de = presentDe(m, STEMS.indexOf(pillar[0]!), BRANCHES.indexOf(pillar[1]!))
  const subjects: Record<string, unknown> = {}
  for (const [subject, walk] of Object.entries(ctx.deferrals)) {
    const cell = getP4GridCell(subject, month)
    if (!cell) {
      subjects[subject] = { status: 'no_grid_column' }
      continue
    }
    if (walk.terminal === null) {
      subjects[subject] = { cell: cell.id, status: 'undetermined', reason: walk.status }
      continue
    }
    const owner = walk.terminal
    const clause = getP4EntryClause(owner, month)
    const group = clause.with ?? []
    const suppressedBy: string[] = []
    let named = group.filter((g) => de.has(g))
    let undetermined = false
    for (const rule of ctx.pillarRules) {
      const removesDeHe = DE_AS_JIAN.has(rule.id) || rule.ignoredVirtueGroup === '德合'
      if (removesDeHe && group.some((g) => DE_HE.includes(g))) {
        suppressedBy.push(rule.id)
        named = named.filter((g) => !DE_HE.includes(g))
      }
      // 德願 membership is not spelled out by the source.
      if (rule.ignoredVirtueGroup === '德願' && named.length) {
        suppressedBy.push(rule.id)
        undetermined = true
      }
    }
    const grade = GRADES.get(cell.gradeRows[0]!)!
    if (undetermined) {
      subjects[subject] = { cell: cell.id, grade: grade.id, status: 'undetermined', suppressedBy }
      continue
    }
    const dePresent = clause.with !== undefined && named.length > 0
    const gradeAction = (dePresent ? grade.withDe : grade.withoutDe) as GradeAction
    const clauseEffect = clause.with
      ? dePresent
        ? clause.effect
        : (clause.otherwise ?? 'as_usual')
      : clause.effect
    subjects[subject] = {
      cell: cell.id,
      grade: grade.id,
      clauseOwner: owner,
      deGroup: group,
      dePresentIds: named,
      dePresent,
      gradeAction,
      clauseEffect,
      consistency: !ACTION_EFFECT[gradeAction]?.includes(clauseEffect)
        ? 'conflict'
        : gradeAction === 'both_present'
          ? 'xiangdi'
          : 'agree',
      ...(suppressedBy.length ? { suppressedBy } : {}),
    }
  }
  return {
    subjects,
    allTabooRuleIds: ctx.pillarRules.filter((r) => r.effect === 'avoid_all').map((r) => r.id),
  }
}
