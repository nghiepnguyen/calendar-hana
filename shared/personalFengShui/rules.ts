// Audit and evidence boundaries: tasks/feng-shui-rule-audit.md.
// This registry authorizes rule selection only; it does not implement an assessment engine.

export type VerificationStatus = 'verified' | 'pending' | 'rejected'
export type RuleScope = 'personalDay' | 'commonDay' | 'annual' | 'birthTime' | 'interpretation'
export type ApplicationStatus = 'applies' | 'notApplicable' | 'insufficientData' | 'unsupported'

export interface RuleSource {
  readonly reference: string
  readonly locator: string
}

export const RULE_SOURCES: Readonly<Record<string, RuleSource>> = Object.freeze({
  mvp: Object.freeze({ reference: 'tasks/prd-personal-feng-shui.md', locator: '4.2–4.7, 7.2' }),
  attachmentCan: Object.freeze({
    reference: '1. canchi.ts',
    locator: 'CAN_XUNG_MAP, LUC_XUNG_MAP, TAM_SAT_MAP, THU_TU_MAP, SAT_CHU_DUONG_MAP',
  }),
  attachmentAnnual: Object.freeze({ reference: '2. quy_t_c_h_n_phong_th_y.md', locator: '1–3' }),
  attachmentBirth: Object.freeze({
    reference: '3. prd_chu_n_h_a_gi_sinh_b_t_t.md',
    locator: '3–5',
  }),
  selection: Object.freeze({
    reference: 'https://zh.wikisource.org/zh-hant/選擇紀要/上編',
    locator: '五行相生/相剋; 天干相剋/相沖; 五鼠遁時例; 披麻・紅紗・受死',
  }),
  xieji3: Object.freeze({
    reference: 'https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷03',
    locator: '太歲; 歲破',
  }),
  xieji34: Object.freeze({
    reference: 'https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷34',
    locator: '制煞要法; 三煞',
  }),
  lunisolar: Object.freeze({
    reference: 'https://lunisolar.js.org/reference/stemBranch.html',
    locator: '冲、破、刑、害、合; 地支三合; 天干合化',
  }),
  localCalendar: Object.freeze({
    reference: 'shared/lunar/canChi.ts',
    locator: 'yearCanChi; monthCanChi; hourCanChi; canChi.test.ts',
  }),
  localStars: Object.freeze({
    reference: 'shared/lunar/stars.data.ts',
    locator: 'Thụ Tử; Sát Chủ; stars.ts byMonth',
  }),
  localElements: Object.freeze({
    reference: 'shared/lunar/elements.ts',
    locator: 'CAN_ELEMENTS; GENERATES; OVERCOMES; napAm.ts',
  }),
  hko: Object.freeze({
    reference: 'https://www.hko.gov.hk/en/gts/time/24solarterms.htm',
    locator: 'Table 1: Sun longitudes',
  }),
  iana: Object.freeze({
    reference: 'https://data.iana.org/time-zones/tzdb/asia',
    locator: 'Vietnam; Asia/Ho_Chi_Minh; historical uncertainty',
  }),
  noaa: Object.freeze({
    reference: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF',
    locator: 'p.1: equation of time; time_offset; tst',
  }),
  jpl: Object.freeze({
    reference: 'https://ssd.jpl.nasa.gov/horizons/manual.html',
    locator: 'Specification of Time; quantities 31, 34; Earth seasons',
  }),
})

export interface RuleDefinition {
  readonly id: string
  readonly version: string
  readonly scope: RuleScope
  readonly verificationStatus: VerificationStatus
  readonly sourceIds: readonly string[]
  readonly reviewedOn: string
  readonly inputs: readonly string[]
  readonly boundary: string
  readonly calendar: string
  readonly purposes: readonly string[]
  readonly roles: readonly string[]
  readonly reason: string
}

const REVIEWED_ON = '2026-10-01'
const RULE_VERSION = '1.0.0'

function definition(
  id: string,
  scope: RuleScope,
  verificationStatus: VerificationStatus,
  sourceIds: readonly string[],
  inputs: readonly string[],
  boundary: string,
  calendar: string,
  purposes: readonly string[],
  roles: readonly string[],
  reason: string,
): RuleDefinition {
  return Object.freeze({
    id,
    version: RULE_VERSION,
    scope,
    verificationStatus,
    reviewedOn: REVIEWED_ON,
    sourceIds: Object.freeze([...sourceIds]),
    inputs: Object.freeze([...inputs]),
    boundary,
    calendar,
    purposes: Object.freeze([...purposes]),
    roles: Object.freeze([...roles]),
    reason,
  })
}

// Verified means only the rule/reference named here has been reviewed. Engine accuracy,
// completeness of an assessment and suitability for a purpose require their own gates.
export const FENG_SHUI_RULES: readonly RuleDefinition[] = Object.freeze([
  definition(
    'personal.branch-relations',
    'personalDay',
    'verified',
    ['lunisolar', 'mvp'],
    ['dayChi', 'birthYearChi'],
    'Civil day at 00:00 Vietnam; birth year at lunar New Year',
    'Vietnamese lunar birth year; civil viewed date',
    ['general'],
    ['self'],
    'Lục xung/lục hợp/tam hợp tables checked; same group is not a complete tam hợp cục.',
  ),
  definition(
    'personal.stem-relations',
    'personalDay',
    'verified',
    ['lunisolar', 'selection', 'localElements', 'mvp'],
    ['dayCan', 'birthYearCan'],
    'Civil day at 00:00 Vietnam; birth year at lunar New Year',
    'Vietnamese lunar birth year; civil viewed date',
    ['general'],
    ['self'],
    'Five combining pairs and directed element relations; combine-first presentation is a documented MVP product policy.',
  ),
  definition(
    'personal.nap-am-elements',
    'personalDay',
    'verified',
    ['localElements', 'mvp', 'selection'],
    ['dayNapAmElement', 'birthYearNapAmElement'],
    'Civil day at 00:00 Vietnam; birth year at lunar New Year',
    'Vietnamese lunar birth year; day sexagenary cycle',
    ['general'],
    ['self'],
    'Five-element relation with explicit direction, using existing nạp âm; no Dụng thần inference.',
  ),
  definition(
    'personal.birth-year-boundary',
    'personalDay',
    'verified',
    ['localCalendar', 'mvp'],
    ['birthDate'],
    'Vietnamese lunar New Year, not Lập Xuân',
    'Existing Vietnamese lunar calendar UTC+7',
    ['general'],
    ['self'],
    'Established MVP policy; not a claim about all schools or historical birthplace time.',
  ),
  definition(
    'personal.summary-policy',
    'personalDay',
    'verified',
    ['mvp'],
    ['verifiedPersonalDayRelations'],
    'Selected civil day',
    'MVP conventions',
    ['general'],
    ['self'],
    'Documented product rule prioritizes caution over favorable factors; no annual or common-star inputs.',
  ),
  definition(
    'personal.hour-policy',
    'personalDay',
    'verified',
    ['mvp', 'localCalendar'],
    ['day', 'birthYearCanChi', 'commonHours'],
    '00:00 day change; Tý split within the viewed civil date',
    'Existing Vietnamese common-hour conventions',
    ['general'],
    ['self'],
    'MVP selection policy only; Bát Tự Zi policy does not replace it.',
  ),
  definition(
    'personal.attachment-can-xung',
    'personalDay',
    'rejected',
    ['attachmentCan', 'selection'],
    ['dayCan', 'birthYearCan'],
    'Not approved',
    'Attachment day-year comparison',
    ['general'],
    ['self'],
    'Reject the combined clash map: it labels directed same-polarity element overcoming as stem clash.',
  ),
  definition(
    'personal.can-xung',
    'personalDay',
    'pending',
    ['selection', 'attachmentCan'],
    ['dayCan', 'birthYearCan'],
    'Pending scope and priority policy',
    'Day-year comparison proposed',
    ['general'],
    ['self'],
    'Separate clash reference found; P2 school choice and interaction with MVP combine/overcome still need specification.',
  ),
  definition(
    'personal.thai-tue',
    'personalDay',
    'pending',
    ['attachmentCan', 'xieji3'],
    ['birthYearChi', 'viewedYearOrMonthOrDayChi'],
    'Year/month/day scope unresolved',
    'Boundary to be specified',
    ['general', 'construction'],
    ['self', 'owner'],
    'Day equality alone does not establish the claimed Thái Tuế interpretation.',
  ),
  definition(
    'personal.tue-pha',
    'personalDay',
    'pending',
    ['attachmentCan', 'xieji3'],
    ['birthYearChi', 'viewedYearOrMonthOrDayChi'],
    'Year/month/day scope unresolved',
    'Boundary to be specified',
    ['general', 'construction'],
    ['self', 'owner'],
    'Lục xung is verified separately; attaching Tuế Phá semantics needs a specific source and scope.',
  ),
  definition(
    'personal.tam-sat',
    'personalDay',
    'pending',
    ['attachmentCan', 'xieji34'],
    ['birthYearChi', 'dayChi', 'activity', 'directionIfRequired'],
    'Unresolved time and direction model',
    'Unresolved year/month/day basis',
    ['construction'],
    ['owner'],
    'Reviewed source concerns direction/construction; birth-age to day-branch application is not established.',
  ),
  definition(
    'personal.sat-chu',
    'personalDay',
    'pending',
    ['attachmentCan', 'localStars'],
    ['birthCanChiOrElement', 'dayCanChi', 'month'],
    'Unresolved',
    'Lunar versus solar-term month unresolved',
    ['construction', 'wedding'],
    ['owner', 'bride'],
    'Attachment lacks a personal operand for its month table; no verified personal rule yet.',
  ),
  definition(
    'common.thu-tu',
    'commonDay',
    'verified',
    ['selection', 'localStars', 'attachmentCan'],
    ['lunarMonth', 'dayChi'],
    'Existing month boundary; leap month uses same month number',
    'Vietnamese lunar month in the existing app',
    ['existingAlmanac'],
    ['all'],
    'All 12 entries match the existing table and reviewed monthly reference; reuse common star only.',
  ),
  definition(
    'common.sat-chu-duong',
    'commonDay',
    'pending',
    ['attachmentCan', 'localStars'],
    ['month', 'dayChi'],
    'Unresolved source convention',
    'Month basis and leap policy unverified',
    ['construction'],
    ['all'],
    'Sequential attachment table differs from existing Sát Chủ; neither equivalence nor source proven.',
  ),
  definition(
    'annual.nominal-age',
    'annual',
    'verified',
    ['attachmentAnnual', 'mvp', 'localCalendar'],
    ['birthDate', 'viewDate'],
    'Lunar New Year',
    'Vietnamese lunar years for both dates',
    ['general', 'construction', 'wedding', 'business'],
    ['self', 'owner', 'bride', 'principal'],
    'Audited proposed age convention: viewed lunar year minus birth lunar year plus one; dates before birth do not apply.',
  ),
  definition(
    'annual.kim-lau',
    'annual',
    'pending',
    ['attachmentAnnual'],
    ['nominalAge', 'purpose', 'role'],
    'Proposed lunar New Year',
    'Vietnamese lunar year proposed',
    ['construction', 'wedding'],
    ['owner', 'bride'],
    'Modulo arithmetic is specified by attachment; source for cultural classification and role matrix remains unverified.',
  ),
  definition(
    'annual.hoang-oc',
    'annual',
    'pending',
    ['attachmentAnnual'],
    ['nominalAge', 'purpose', 'role'],
    'Proposed lunar New Year',
    'Vietnamese lunar year proposed',
    ['construction'],
    ['owner'],
    'Full age domain, continuation beyond 60 and activity applicability need sourced fixtures.',
  ),
  definition(
    'annual.tam-tai',
    'annual',
    'pending',
    ['attachmentAnnual'],
    ['birthYearChi', 'viewYearChi', 'purpose', 'role'],
    'Proposed lunar New Year',
    'Vietnamese lunar year proposed',
    ['general', 'construction', 'wedding', 'business'],
    ['self', 'owner', 'bride', 'principal'],
    'Four groups supplied; primary source and interpretation/applicability fixtures remain pending.',
  ),
  definition(
    'birth.historical-timezone',
    'birthTime',
    'pending',
    ['iana', 'attachmentBirth'],
    ['birthWallTime', 'birthplace', 'timezone', 'offsetEvidence'],
    'Exact historical offset transition',
    'Civil wall time to UTC/UT with historical policy',
    ['bazi'],
    ['self'],
    'IANA reference checked, but pinned data, pre-1970/regional coverage and ambiguity resolution are not selected.',
  ),
  definition(
    'birth.solar-time-formula',
    'birthTime',
    'verified',
    ['noaa', 'attachmentBirth'],
    ['instant', 'longitude', 'utcOffset', 'equationOfTime'],
    'Carry corrected date across midnight',
    'Civil to apparent solar time; consistent EoT convention',
    ['bazi'],
    ['self'],
    'Formula sign and units checked; this is not verification of an approximation or 30-second accuracy.',
  ),
  definition(
    'birth.solar-time-engine',
    'birthTime',
    'pending',
    ['attachmentBirth', 'noaa', 'jpl'],
    ['instant', 'longitude', 'engineVersion', 'uncertainty'],
    'Precision-tested instant',
    'Time scales to be specified',
    ['bazi'],
    ['self'],
    'No selected engine or benchmark proves the requested accuracy.',
  ),
  definition(
    'birth.solar-term-angles',
    'birthTime',
    'verified',
    ['hko'],
    ['solarLongitude'],
    '315 + 30*k modulo 360 for proposed month-opening terms',
    'Solar reference; not lunar month',
    ['bazi'],
    ['self'],
    'Reference angles reviewed: Thanh Minh 15 degrees, Xuân Phân 0; not certification of computed instants or school choice.',
  ),
  definition(
    'birth.term-instant-engine',
    'birthTime',
    'pending',
    ['jpl', 'attachmentBirth'],
    ['instant', 'solarLongitudeEngine', 'timeScale'],
    'Exact crossing instant',
    'Geocentric apparent solar longitude convention to be pinned',
    ['bazi'],
    ['self'],
    'Current daily solarTerms API is insufficient; precise engine/fixtures belong to P3.',
  ),
  definition(
    'birth.zi-policy',
    'birthTime',
    'pending',
    ['attachmentBirth', 'localCalendar'],
    ['trueSolarTime', 'ziPolicy', 'dayStem'],
    'Proposed splitZi or dayStartsAt23',
    'Bát Tự convention independent from common calendar',
    ['bazi'],
    ['self'],
    'Hour stem must vary; default school and output day/hour bases need P3 specification.',
  ),
  definition(
    'interpretation.thap-than',
    'interpretation',
    'pending',
    ['selection', 'attachmentBirth'],
    ['pillars', 'dayMaster', 'yinYang'],
    'Requires complete or explicitly partial chart policy',
    'Depends on verified Bát Tự conventions',
    ['bazi'],
    ['self'],
    'P4 interpretation and fixtures not specified; source relation alone is not a complete engine.',
  ),
  definition(
    'interpretation.dung-than',
    'interpretation',
    'pending',
    ['attachmentBirth'],
    ['pillars', 'hiddenStems', 'season', 'strengthMethod'],
    'Requires explicit school and uncertainty policy',
    'Depends on verified Bát Tự conventions',
    ['bazi'],
    ['self'],
    'No method or primary evidence supplied; never infer from missing elements or annual nạp âm.',
  ),
])

export interface UnavailableRule {
  readonly id: string
  readonly reason: 'missing' | 'pending' | 'rejected' | 'scopeMismatch'
}

export type RuleReadiness =
  | {
      readonly status: 'ready'
      readonly rules: readonly RuleDefinition[]
      readonly unavailable: readonly []
    }
  | {
      readonly status: 'blocked'
      readonly rules: readonly []
      readonly unavailable: readonly UnavailableRule[]
    }

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const SCOPES: readonly string[] = [
  'personalDay',
  'commonDay',
  'annual',
  'birthTime',
  'interpretation',
]
const STATUSES: readonly string[] = ['verified', 'pending', 'rejected']

function isReviewDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
}

/** Fail closed: no partial rules are released when a mandatory group is unavailable. */
export function createRuleRegistry(definitions: readonly RuleDefinition[]) {
  const byId = new Map<string, RuleDefinition>()
  for (const rule of definitions) {
    if (byId.has(rule.id)) throw new Error(`Duplicate rule ID: ${rule.id}`)
    if (!VERSION_PATTERN.test(rule.version)) throw new Error(`Invalid rule version: ${rule.id}`)
    const strings = [rule.id, rule.reason, rule.boundary, rule.calendar]
    const lists = [rule.sourceIds, rule.inputs, rule.purposes, rule.roles]
    if (
      strings.some((value) => !value.trim()) ||
      lists.some((list) => !list.length || list.some((value) => !value.trim())) ||
      !isReviewDate(rule.reviewedOn) ||
      !SCOPES.includes(rule.scope) ||
      !STATUSES.includes(rule.verificationStatus) ||
      rule.sourceIds.some((id) => !Object.hasOwn(RULE_SOURCES, id))
    ) {
      throw new Error(`Invalid rule metadata: ${rule.id}`)
    }
    byId.set(
      rule.id,
      Object.freeze({
        ...rule,
        sourceIds: Object.freeze([...rule.sourceIds]),
        inputs: Object.freeze([...rule.inputs]),
        purposes: Object.freeze([...rule.purposes]),
        roles: Object.freeze([...rule.roles]),
      }),
    )
  }
  return Object.freeze({
    getReadiness(scope: RuleScope, requiredRuleIds: readonly string[]): RuleReadiness {
      if (!requiredRuleIds.length || requiredRuleIds.some((id) => !id.trim())) {
        throw new Error('Required rule IDs must be nonempty')
      }
      const unavailable: UnavailableRule[] = []
      const rules: RuleDefinition[] = []
      for (const id of new Set(requiredRuleIds)) {
        const rule = byId.get(id)
        if (!rule) unavailable.push({ id, reason: 'missing' })
        else if (rule.scope !== scope) unavailable.push({ id, reason: 'scopeMismatch' })
        else if (rule.verificationStatus !== 'verified')
          unavailable.push({ id, reason: rule.verificationStatus })
        else rules.push(rule)
      }
      if (unavailable.length) return { status: 'blocked', rules: [], unavailable }
      return { status: 'ready', rules: Object.freeze(rules), unavailable: [] }
    },
  })
}
