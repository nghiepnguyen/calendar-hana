import { todayInVietnam } from '../time'
import { parseSolarDate, solarStringToJd } from './julian'
import { solarToLunar } from './lunar'
import { solarTermsForYear, SOLAR_TERM_METHOD } from './solarTerms'

// Only the three admitted Group A rules. Evidence is a digital primary-text
// transcription; facsimile collation has not been performed.
const definitions = [
  {
    id: 'yue-ji',
    name: 'Nguyệt Kỵ',
    polarity: 'inauspicious',
    sourceId: 'XJBF_QD',
    sourceTier: 'A',
    ruleVersion: '3.0.0',
    provenanceStatus: 'verified',
    basis: ['lunar_day'],
    sourceEvidence: [
      {
        sourceId: 'XJBF_QD',
        location: '卷六 / 義例四 / 月忌日 / 齊東野語曰',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        originalText: '俗以每月初五十四二十三日為月忌',
        interpretation:
          'Match lunar days 5,14,23 only. Do not infer a global prohibition; the paragraph explicitly discusses limited annotations and usable auspicious influences.',
        evidenceLevel: 'primary-work-digital-transcription',
        facsimileCollation: 'not-performed',
      },
    ],
    effects: [],
    aliases: ['月忌', '月忌日', 'Nguyệt Kỵ'],
  },
  {
    id: 'four-separations',
    name: 'Tứ Ly',
    polarity: 'inauspicious',
    sourceId: 'XJBF_QD',
    sourceTier: 'A',
    ruleVersion: '3.0.0',
    provenanceStatus: 'verified',
    basis: ['solar_term_transition', 'civil_date'],
    sourceEvidence: [
      {
        sourceId: 'XJBF_QD',
        location: '卷六 / 義例四 / 四離四絶 / 曹震圭曰',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        originalText:
          '四離者冬至前一日水離夏至前一日火離春分前一日陽體分而木亦離也秋分前一日隂體分而金亦離也',
        interpretation:
          'Day before winter/summer solstices and spring/autumn equinoxes. Modern apparent-longitude instants and UTC+7 civil-day assignment are project conventions, not claimed as ancient numerical method.',
        evidenceLevel: 'primary-work-digital-transcription',
        facsimileCollation: 'not-performed',
      },
      {
        sourceId: 'XJBF_QD',
        location: '卷六 / 義例四 / 四離四絶 / 李鼎祚曰',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        originalText: '此日忌出行征伐',
        interpretation:
          'travel avoid; military action has no matching approved activity ID and is not broadened into litigation or business.',
      },
    ],
    effects: [
      {
        activityId: 'travel',
        effect: 'avoid',
        sourceTextRef:
          'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343#四離四絶',
        interpretationStatus: 'direct lexical mapping: 出行/逺行 → travel',
      },
    ],
    aliases: ['四離', 'Tứ Ly'],
  },
  {
    id: 'four-extinctions',
    name: 'Tứ Tuyệt',
    polarity: 'inauspicious',
    sourceId: 'XJBF_QD',
    sourceTier: 'A',
    ruleVersion: '3.0.0',
    provenanceStatus: 'verified',
    basis: ['solar_term_transition', 'civil_date'],
    sourceEvidence: [
      {
        sourceId: 'XJBF_QD',
        location: '卷六 / 義例四 / 四離四絶 / 玉門經曰、曹震圭曰',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        originalText: '四絶者四立前一辰也',
        interpretation:
          'Day before Spring/Summer/Autumn/Winter Commences. Four season starts at 315,45,135,225 degrees under the project astronomical convention.',
        evidenceLevel: 'primary-work-digital-transcription',
        facsimileCollation: 'not-performed',
      },
      {
        sourceId: 'XJBF_QD',
        location: '卷六 / 義例四 / 四離四絶 / 李鼎祚曰',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        originalText: '此日忌出軍逺行',
        interpretation:
          'travel avoid; military action has no matching approved activity ID and is not broadened into litigation or business.',
      },
      {
        sourceId: 'XJBF_QD',
        url: 'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343',
        location: '卷六 / 四絶 / 曹震圭曰',
        originalText: '立春木旺水絶立夏火旺木絶立秋金旺土絶立冬水旺金絶故先一日為絶也',
        interpretation:
          'Explicit four seasonal starts; numeric longitudes come from the project astronomical convention.',
      },
    ],
    effects: [
      {
        activityId: 'travel',
        effect: 'avoid',
        sourceTextRef:
          'https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343#四離四絶',
        interpretationStatus: 'direct lexical mapping: 出行/逺行 → travel',
      },
    ],
    aliases: ['四絶', '四絕', 'Tứ Tuyệt'],
  },
] as const

export type GroupARuleId = (typeof definitions)[number]['id']
export function normalizeGroupARuleId(alias: string): GroupARuleId | undefined {
  return definitions.find((rule) => rule.id === alias || rule.aliases.some((a) => a === alias))?.id
}

/** Group A uses the locked Vietnamese civil UTC+7 convention, including
 * historical dates. Other zones are rejected rather than silently changing
 * lunar calendar semantics. No scoring or legacy star tables participate.
 */
export function evaluateGroupAAtInstant(instant: string, timezone: string) {
  if (timezone !== 'Asia/Ho_Chi_Minh') throw new RangeError('Group A requires Asia/Ho_Chi_Minh')
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instant) || !Number.isFinite(Date.parse(instant)))
    throw new RangeError('Expected valid zoned instant')
  const date = todayInVietnam(new Date(instant))
  const solar = parseSolarDate(date)
  if (solar.year < 1900 || solar.year > 2100) throw new RangeError('Unsupported calendar year')
  const lunar = solarToLunar(solar.day, solar.month, solar.year)
  const jd = solarStringToJd(date)
  const terms = solarTermsForYear(solar.year)
  const beforeTransition = (longitudes: readonly number[]) =>
    terms.find(
      (term) =>
        longitudes.includes(term.longitude) &&
        solarStringToJd(todayInVietnam(new Date(term.instantUtc))) - jd === 1,
    )
  const separation = beforeTransition([0, 90, 180, 270])
  const extinction = beforeTransition([315, 45, 135, 225])
  const matches = [[5, 14, 23].includes(lunar.day), !!separation, !!extinction]
  const rules = definitions.map((rule, index) => ({
    ...rule,
    matched: matches[index]!,
    contextEvidence:
      index === 0
        ? { method: 'production-lunar-core', lunarDate: lunar }
        : { method: SOLAR_TERM_METHOD, transition: index === 1 ? separation : extinction },
  }))
  const reasons = rules
    .filter((rule) => rule.matched && rule.effects.some((effect) => effect.activityId === 'travel'))
    .map((rule) => rule.id)
  const activities: Partial<Record<'travel', { status: 'avoid'; reasons: GroupARuleId[] }>> = {}
  if (reasons.length) activities.travel = { status: 'avoid', reasons }
  return { date, timezone, rules, activities }
}
