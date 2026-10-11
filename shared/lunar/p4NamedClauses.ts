import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import { classifyP4Annotation, type P4AnnotationInput } from './p4Annotation'

/** Source audit helpers only. No import from the production scoring pipeline. */
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
function assertMonth(month: string) {
  if (month.length !== 1 || !BRANCHES.includes(month)) throw new RangeError('Invalid Month Jian')
}

/** Returns every applicable named rule, preserving overlap instead of ranking severity.
 * The caller must prove the source scope applies; this does not establish god presence. */
export function matchP4PillarRules(month: string, pillar: string, applicable: boolean | undefined) {
  assertMonth(month)
  const stem = STEMS.indexOf(pillar[0] ?? '')
  const branch = BRANCHES.indexOf(pillar[1] ?? '')
  if (pillar.length !== 2 || stem < 0 || branch < 0 || stem % 2 !== branch % 2)
    throw new RangeError('Invalid sexagenary pillar')
  if (applicable === undefined) return { status: 'undetermined' as const, rules: [] }
  if (!applicable) return { status: 'not_applicable' as const, rules: [] }
  const rules = clauses.pillarRules.filter((rule) =>
    rule.contexts.some((context) => context.monthJian === month && context.pillar === pillar),
  )
  return { status: rules.length ? ('matched' as const) : ('no_named_override' as const), rules }
}

/** An edge names the source to consult; it does not assume the target clause resolves. */
export function resolveP4NamedDeferral(
  subject: string,
  month: string,
  applicable: boolean | undefined,
) {
  assertMonth(month)
  if (applicable === undefined) return { status: 'undetermined' as const }
  if (!applicable) return { status: 'not_applicable' as const }
  const rule = clauses.namedDeferrals.find(
    (rule) => rule.subject === subject && rule.months.includes(month),
  )
  return rule
    ? { status: 'named_deferral' as const, target: rule.target, source: rule.source }
    : { status: 'no_named_deferral' as const }
}

/** Heading-specific annotation, not a score or product status. Other scopes remain outside
 * this transformation. Missing 宜 is never synthesized by lifting a 忌. */
export function resolveP4HeadingClause(
  input: P4AnnotationInput,
  action: 'cancel_annotations' | 'lift_ji',
  applicable: boolean | undefined,
  persistentJi: boolean | undefined,
) {
  const original = classifyP4Annotation(input) // Also validates contradictory explicitNeither.
  if (applicable === false) return original
  if (applicable === undefined || persistentJi === undefined) return 'undetermined' as const
  // A blank heading is outside the demonstrated overlap, not an explicit no-annotation result.
  if (input.yi === undefined || input.ji === undefined || (!input.yi && !input.ji)) return original
  if (action === 'cancel_annotations')
    return persistentJi ? ('only_ji' as const) : ('neither_recorded' as const)
  if (persistentJi) return original
  return classifyP4Annotation({ yi: input.yi, ji: false, explicitNeither: false })
}
