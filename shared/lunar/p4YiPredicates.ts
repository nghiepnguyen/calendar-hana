import type authority from '../almanac-data/p4-yi-operands-v1.json'

export type P4YiAuthorityEntry = (typeof authority.entries)[number]
export type P4YiPredicateContext = Readonly<{
  monthJianBranch?: string
  dayBranch?: string
  dayPillar?: string
  soilState?: 'present' | 'absent'
}>

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10]! + BRANCHES[i % 12]!)

export function isP4YiDayPillar(value: unknown): value is string {
  return typeof value === 'string' && PILLARS.includes(value)
}

function supplied(value: string | undefined, key: string): string {
  if (value === undefined) throw new RangeError(`Missing predicate input ${key}`)
  return value
}

/** Pure predicate layer: caller validates input/provenance before invoking it. */
export function evaluateP4YiPredicate(
  entry: P4YiAuthorityEntry,
  context: P4YiPredicateContext,
): boolean {
  const rule = entry.predicate
  // Each monthly entry owns its locked lookup, even where two gods share a position.
  if ('byMonthJian' in rule && rule.byMonthJian) {
    const month = supplied(context.monthJianBranch, 'MONTH_JIAN_BRANCH')
    const targets: Readonly<Record<string, string>> = rule.byMonthJian
    if (!(month in targets)) throw new RangeError('Invalid predicate Month Jian')
    return targets[month] === supplied(context.dayBranch, 'DAY_BRANCH')
  }
  if ('rangesInclusive' in rule && rule.rangesInclusive) {
    const pillar = supplied(context.dayPillar, 'DAY_PILLAR')
    if (!isP4YiDayPillar(pillar)) throw new RangeError('Invalid predicate day pillar')
    const index = PILLARS.indexOf(pillar)
    return rule.rangesInclusive.some(([first, last]) => index >= first! && index <= last!)
  }
  if ('branches' in rule && rule.branches)
    return rule.branches.includes(supplied(context.dayBranch, 'DAY_BRANCH'))
  if (rule.type === 'FIXED_SEXAGENARY_PILLAR_SET' && 'pillars' in rule && rule.pillars)
    return rule.pillars.includes(supplied(context.dayPillar, 'DAY_PILLAR'))
  if ('seasonBranches' in rule && rule.seasonBranches && rule.ordinaryDayBranches) {
    const month = supplied(context.monthJianBranch, 'MONTH_JIAN_BRANCH')
    const day = supplied(context.dayBranch, 'DAY_BRANCH')
    const season = (Object.keys(rule.seasonBranches) as (keyof typeof rule.seasonBranches)[]).find(
      (key) => rule.seasonBranches![key].includes(month),
    )
    if (!season || !context.soilState) throw new RangeError('Missing seasonal/soil predicate input')
    // The adopted soil set replaces the seasonal set; never union the two sets.
    return (
      context.soilState === 'present' ? rule.soilDayBranches! : rule.ordinaryDayBranches[season]
    ).includes(day)
  }
  throw new Error(`Unsupported locked 宜 predicate: ${rule.type}`)
}
