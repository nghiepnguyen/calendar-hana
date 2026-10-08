import { todayInVietnam } from '../time'
import { dayCanChi } from './canChi'
import { parseSolarDate, solarStringToJd } from './julian'
import { getSolarMonth, SOLAR_TERM_METHOD } from './solarTerms'

const branches = '子丑寅卯辰巳午未申酉戌亥'
const stems = '甲乙丙丁戊己庚辛壬癸'

// Source Jian order: 寅卯辰巳午未申酉戌亥子丑. Admitted by the
// Phase 3B.3 review / Group B v3.1 freeze, not the legacy lunar-month tables.
const definitions = [
  {
    id: 'month-breaker',
    name: 'Nguyệt Phá',
    aliases: ['月破'],
    operandType: 'DAY_BRANCH',
    targets: '申酉戌亥子丑寅卯辰巳午未',
    sourceLocation: '卷四 / 義例二 / 月破 / 考原曰',
  },
  {
    id: 'robbery-sha',
    name: 'Kiếp Sát',
    aliases: ['劫煞', '刼煞'],
    operandType: 'DAY_BRANCH',
    targets: '亥申巳寅亥申巳寅亥申巳寅',
    sourceLocation: '卷六 / 義例四 / 刼煞 / 李鼎祚曰',
  },
  {
    id: 'disaster-sha',
    name: 'Tai Sát',
    aliases: ['災煞', '月災煞', '天獄'],
    operandType: 'DAY_BRANCH',
    targets: '子酉午卯子酉午卯子酉午卯',
    sourceLocation: '卷六 / 義例四 / 月災煞、天獄 / 按',
  },
  {
    id: 'month-sha',
    name: 'Nguyệt Sát',
    aliases: ['月煞', '月殺', '月虚', '月虛'],
    operandType: 'DAY_BRANCH',
    targets: '丑戌未辰丑戌未辰丑戌未辰',
    sourceLocation: '卷六 / 義例四 / 月煞 / 歴例曰',
  },
  {
    id: 'month-virtue',
    name: 'Nguyệt Đức',
    aliases: ['月徳', '月德'],
    operandType: 'DAY_STEM',
    targets: '丙甲壬庚丙甲壬庚丙甲壬庚',
    sourceLocation: '卷五 / 義例三 / 月徳 / 歴例曰',
  },
] as const

export type GroupBRuleId = (typeof definitions)[number]['id']

export interface GroupBRawContext {
  monthJian: string
  dayStem: string
  dayBranch: string
}

/** Monthly identities only: 天獄 is the admitted monthly 災煞 alias.
 * Aliases do not import activity prose or other annual/source variants.
 */
export function normalizeGroupBRuleId(label: string): GroupBRuleId | undefined {
  return definitions.find(
    (rule) =>
      rule.id === label || rule.name === label || rule.aliases.some((alias) => alias === label),
  )?.id
}

/** Deterministic raw rule layer. Lunar metadata, effects and scoring are
 * deliberately absent. Optional labels select canonical identities once.
 */
export function evaluateGroupBContext(context: GroupBRawContext, labels?: readonly string[]) {
  const { monthJian, dayStem, dayBranch } = context
  if (
    monthJian.length !== 1 ||
    !branches.includes(monthJian) ||
    dayStem.length !== 1 ||
    !stems.includes(dayStem) ||
    dayBranch.length !== 1 ||
    !branches.includes(dayBranch)
  )
    throw new RangeError('Expected Month Jian, day stem and day branch symbols')
  const row = (branches.indexOf(monthJian) + 10) % 12
  const selected = labels ? new Set(labels.map(normalizeGroupBRuleId)) : undefined
  return definitions
    .filter((rule) => !selected || selected.has(rule.id))
    .map((rule) => {
      const observedOperand = rule.operandType === 'DAY_STEM' ? dayStem : dayBranch
      const targetOperand = rule.targets[row]!
      return {
        id: rule.id,
        name: rule.name,
        matched: observedOperand === targetOperand,
        operandType: rule.operandType,
        observedOperand,
        targetOperand,
        sourceId: 'XJBF_QD' as const,
        sourceTier: 'A' as const,
        ruleVersion: '3.1.0' as const,
        provenanceStatus: 'verified' as const,
        sourceLocation: rule.sourceLocation,
        provenanceScope: 'reviewed primary digital transcription; no facsimile collation' as const,
        basis: ['active_month_jian', rule.operandType] as const,
      }
    })
}

/** Reuses Phase 2.1 astronomy, including its [T,next T) exact cutoff.
 * Project civil days use fixed UTC+7 (also for historical dates), as Group A.
 * Golden compatibility is separately tested; no reference timestamps bypass
 * the production astronomy path. This API does not define whole-day UI labels.
 */
export function evaluateGroupBAtInstant(
  instant: string,
  timezone: string,
  labels?: readonly string[],
) {
  if (timezone !== 'Asia/Ho_Chi_Minh') throw new RangeError('Group B requires Asia/Ho_Chi_Minh')
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instant) || !Number.isFinite(Date.parse(instant)))
    throw new RangeError('Expected valid zoned instant')
  const civilDate = todayInVietnam(new Date(instant))
  const solar = parseSolarDate(civilDate)
  if (solar.year < 1900 || solar.year > 2100) throw new RangeError('Unsupported calendar year')
  const day = dayCanChi(solarStringToJd(civilDate))
  const month = getSolarMonth(instant, timezone)
  const context = {
    instant,
    timezone,
    civilDate,
    monthJian: branches[month]!,
    dayStem: stems[day.can]!,
    dayBranch: branches[day.chi]!,
  }
  return {
    context,
    rules: evaluateGroupBContext(context, labels),
    astronomyMethod: SOLAR_TERM_METHOD,
  }
}
