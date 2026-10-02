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
  personalStarsSpec: Object.freeze({
    reference: 'tasks/prd-personal-feng-shui-stars.md',
    locator: 'v1.0.0: sections 2–7; tasks/fixtures/personal-feng-shui-stars.v1.json',
  }),
  attachmentCan: Object.freeze({
    reference: '1. canchi.ts',
    locator: 'CAN_XUNG_MAP, LUC_XUNG_MAP, TAM_SAT_MAP, THU_TU_MAP, SAT_CHU_DUONG_MAP',
  }),
  attachmentAnnual: Object.freeze({ reference: '2. quy_t_c_h_n_phong_th_y.md', locator: '1–3' }),
  attachmentBirth: Object.freeze({
    reference: '3. prd_chu_n_h_a_gi_sinh_b_t_t.md',
    locator: '3–5',
  }),
  annualSpec: Object.freeze({
    reference: 'tasks/prd-annual-feng-shui.md',
    locator: 'v1.0.0: sections 2–7; tasks/fixtures/annual-feng-shui.v1.json',
  }),
  batTrachCourse: Object.freeze({
    reference:
      'https://tuvithuchanh.com/wp-content/uploads/2025/03/Phong-thuy-bat-trach-ban-rut-gon.pdf',
    locator: 'Uông Sỹ Cần; Bài 7.I–II; printed/PDF pages 47–48',
  }),
  khoiSuExtract: Object.freeze({
    reference: 'https://www.tuviglobal.com/static/upload/books/demo/1352132109_khoi%20su_2.pdf',
    locator: 'Phần thứ tư: Khởi sự; II.1.a; printed page 2 / PDF page 3; author/edition absent',
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
  astronomyEngine: Object.freeze({
    reference: 'https://github.com/cosinekitty/astronomy',
    locator: 'Astronomy Engine 2.1.19; MIT; SearchSunLongitude, HourAngle',
  }),
  birthTimeSpec: Object.freeze({
    reference: 'tasks/prd-birth-time-normalization.md',
    locator: 'v1.0.0; tasks/fixtures/bazi-engine-benchmark.v1.json',
  }),
  yuXiaJi: Object.freeze({
    reference: 'https://zh.wikisource.org/zh-hant/玉匣記',
    locator:
      '理論吉凶日篇, 九耀星君值男女命限圖: thứ tự 9 sao Nam (La Hầu 1) và Nữ (Kế Đô 1) theo tuổi',
  }),
  sanmingTongHui5: Object.freeze({
    reference: 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/卷05',
    locator: '生我者…立名印綬；我生者…立名食神；同我者 Tỷ/Kiếp (định nghĩa Thập thần)',
  }),
  sanmingTongHui7: Object.freeze({
    reference: 'https://zh.wikisource.org/zh-hant/三命通會/卷七',
    locator: '論六親: 我克者為財，克我者為官; phân chính/thiên theo âm dương',
  }),
  baziFixture: Object.freeze({
    reference: 'tasks/fixtures/bazi-interpretation.v1.json',
    locator: 'v1.0.0: tenGodMatrix 10×10; hiddenStems 12 Chi',
  }),
  baziInterpretationSpec: Object.freeze({
    reference: 'tasks/prd-bazi-interpretation.md',
    locator: 'v1.2.0: 6.1 Nhật chủ; 6.1a thống kê ngũ hành 8 chữ; 6.4a điểm trọng số',
  }),
  attachmentBaziEngine: Object.freeze({
    reference: 'bazi_calculation_engine_spec.md',
    locator: '3.1–3.2 bảng Can/Chi; 5.1–5.3 đã sửa ở PRD 6.4a (không dùng ví dụ 2.2)',
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
  version = RULE_VERSION,
): RuleDefinition {
  return Object.freeze({
    id,
    version,
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
    'verified',
    ['selection', 'personalStarsSpec'],
    ['dayCan', 'birthYearCan'],
    'Civil day at 00:00 Vietnam; birth year at lunar New Year',
    'Vietnamese lunar birth year; civil viewed date',
    ['general'],
    ['self'],
    'Four explicit pairs only: Giáp–Canh, Ất–Tân, Bính–Nhâm, Đinh–Quý; Mậu/Kỷ have no selected clash. Adds a reason but does not change the MVP summary.',
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
    ['attachmentAnnual', 'annualSpec', 'localCalendar'],
    ['birthDate', 'viewDate'],
    'Lunar New Year',
    'Vietnamese lunar years for both dates',
    ['general', 'construction', 'wedding', 'business'],
    ['self', 'owner', 'bride', 'principal'],
    'Product convention: both Gregorian dates within 1900–2100; lunar year may be 1899; viewed lunar year minus birth lunar year plus one, ages 1–202; dates before birth do not apply.',
    '1.1.0',
  ),
  definition(
    'annual.application-policy',
    'annual',
    'verified',
    ['annualSpec', 'attachmentAnnual'],
    ['purpose', 'role'],
    'Lunar New Year; does not change daily assessments',
    'Vietnamese lunar year; one saved self profile',
    ['general', 'construction', 'wedding', 'business'],
    ['self', 'owner', 'bride', 'principal', 'other', 'unspecified'],
    'Product policy v1: explicit purpose/role matrix, no gender inference or couple verdict; unsupported activities stay unsupported. Required independently of numerical rules.',
  ),
  definition(
    'annual.kim-lau',
    'annual',
    'verified',
    ['attachmentAnnual', 'batTrachCourse', 'annualSpec'],
    ['nominalAge', 'purpose', 'role'],
    'Lunar New Year',
    'Vietnamese lunar year; nominal ages 1–202',
    ['construction', 'wedding'],
    ['owner', 'bride'],
    'Reviewed remainder table 1/3/6/8 and named categories; modulo 9 only. Purpose/role eligibility is product policy, not a prediction of harm.',
    '1.1.0',
  ),
  definition(
    'annual.hoang-oc',
    'annual',
    'verified',
    ['attachmentAnnual', 'batTrachCourse', 'annualSpec'],
    ['nominalAge', 'purpose', 'role'],
    'Lunar New Year',
    'Vietnamese lunar year; supported nominal ages 10–69 only',
    ['construction'],
    ['owner'],
    'Reviewed anchors 10–60 and six-palace unit counting for ages 10–69 only; other ages unsupported. Construction eligibility is product policy; no extrapolation or harm prediction.',
    '1.1.0',
  ),
  definition(
    'annual.sao-chieu-menh',
    'annual',
    'verified',
    ['yuXiaJi', 'localCalendar'],
    ['nominalAge', 'gender'],
    'Lunar New Year (tuổi mụ)',
    'Vietnamese lunar years; tuổi mụ chia 9',
    ['general'],
    ['self'],
    'Name of the governing star only. The source gives a gender-dependent verse per star, not a fixed cát/hung class; the popular 3 cát/3 hung/3 trung split has no primary source and conflicts with it (Thủy, Hỏa, Thổ), so no label is shown.',
  ),
  definition(
    'annual.han-tuoi',
    'annual',
    'pending',
    ['localCalendar'],
    ['nominalAge', 'gender'],
    'Lunar New Year (tuổi mụ)',
    'Vietnamese lunar years',
    ['general'],
    ['self'],
    'No primary source found. Published folk tables use a 9-year cycle where ages ending in 0 repeat the previous hạn (e.g. Nam 36 Huỳnh Tuyền, 37 Tam Kheo) and include Diêm Vương; the former tuổi mụ mod 8 calculation contradicts them. Hidden until sourced.',
  ),
  definition(
    'annual.tam-tai',
    'annual',
    'verified',
    ['attachmentAnnual', 'khoiSuExtract', 'annualSpec'],
    ['birthYearChi', 'viewYearChi', 'purpose', 'role'],
    'Lunar New Year',
    'Vietnamese lunar birth/view years',
    ['general', 'construction', 'wedding', 'business'],
    ['self', 'owner', 'bride', 'principal', 'other', 'unspecified'],
    'Unattributed published method extract corroborates the four branch groups only. Return cycle position, not severity; gender/activity assertions excluded. Applicability is product policy.',
    '1.1.0',
  ),
  definition(
    'birth.historical-timezone',
    'birthTime',
    'verified',
    ['iana', 'attachmentBirth', 'birthTimeSpec'],
    ['birthWallTime', 'birthplace', 'timezone', 'offsetEvidence'],
    'Exact historical offset transition',
    'Civil wall time to UTC/UT with historical policy',
    ['bazi'],
    ['self'],
    'Pin tzdb 2026d. Vietnam 1970–2100 resolves from place/region; 1900–1969 requires a confirmed offset when regional history is uncertain. Gaps reject and overlaps return candidates.',
    '1.1.0',
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
    'verified',
    ['attachmentBirth', 'noaa', 'jpl', 'astronomyEngine', 'birthTimeSpec'],
    ['instant', 'longitude', 'engineVersion', 'uncertainty'],
    'Precision-tested instant',
    'UTC instant; engine uses UT≈UTC and TT internally; TST is a derived representation',
    ['bazi'],
    ['self'],
    'Astronomy Engine 2.1.19 HourAngle selected after 12-case JPL quantity 34 benchmark; max absolute error 0.323 seconds. NOAA approximation remains explanatory only.',
    '1.1.0',
  ),
  definition(
    'birth.solar-term-angles',
    'birthTime',
    'verified',
    ['hko', 'birthTimeSpec'],
    ['solarLongitude'],
    '315 + 30*k modulo 360 for proposed month-opening terms',
    'Solar reference; not lunar month',
    ['bazi'],
    ['self'],
    'Reference angles reviewed: Thanh Minh 15 degrees, Xuân Phân 0; month-opening sequence is 315 + 30*k modulo 360.',
    '1.1.0',
  ),
  definition(
    'birth.term-instant-engine',
    'birthTime',
    'verified',
    ['jpl', 'attachmentBirth', 'astronomyEngine', 'birthTimeSpec'],
    ['instant', 'solarLongitudeEngine', 'timeScale'],
    'Exact crossing instant',
    'Geocentric apparent ecliptic-of-date longitude; UTC boundary instant with TT handled internally',
    ['bazi'],
    ['self'],
    'Astronomy Engine 2.1.19 SearchSunLongitude selected; 12 month-opening crossings benchmarked against JPL DE441 quantity 31 with max absolute error 19.926 seconds.',
    '1.1.0',
  ),
  definition(
    'birth.zi-policy',
    'birthTime',
    'verified',
    ['attachmentBirth', 'localCalendar', 'birthTimeSpec'],
    ['trueSolarTime', 'ziPolicy', 'dayStem'],
    'Proposed splitZi or dayStartsAt23',
    'Bát Tự convention independent from common calendar',
    ['bazi'],
    ['self'],
    'Product default is splitZi: 23:00–23:59 keeps the TST civil date for the day pillar and advances only the date basis used for the hour stem; dayStartsAt23 is explicit opt-in. Hour stem always varies with its day-stem basis.',
    '1.1.0',
  ),
  definition(
    'interpretation.day-master',
    'interpretation',
    'verified',
    ['baziInterpretationSpec', 'attachmentBaziEngine', 'localElements'],
    ['pillars.day.can'],
    'Each P3 candidate separately; never from nạp âm',
    'Bát Tự pillars from P3',
    ['bazi'],
    ['self'],
    'Day Master is the day-pillar stem; element from CAN_ELEMENTS, even index Dương, odd index Âm.',
  ),
  definition(
    'interpretation.element-count',
    'interpretation',
    'verified',
    ['baziInterpretationSpec', 'attachmentBaziEngine', 'localElements'],
    ['pillars.can', 'pillars.chi'],
    'Four visible stems plus main element of four branches; total 8',
    'Bát Tự pillars from P3',
    ['bazi'],
    ['self'],
    'Descriptive count only: no hidden-stem weights, no position weights, no strength or useful-god conclusion.',
  ),
  definition(
    'interpretation.strength-score',
    'interpretation',
    'verified',
    ['baziInterpretationSpec', 'attachmentBaziEngine', 'localElements'],
    ['pillars', 'positionWeights', 'dayMaster'],
    'Seven positions weighted 35/15/12/12/10/10/6 = 100, day stem excluded; support = same element + generating element; ≥ 50 Thân Vượng',
    'Bát Tự pillars from P3; branch main element only',
    ['bazi'],
    ['self'],
    'Simplified weighted method weighted-v1 (PRD 6.4a). No hidden stems, combinations or seasons beyond position weight; never selects Dụng thần.',
  ),
  definition(
    'interpretation.thap-than',
    'interpretation',
    'verified',
    ['sanmingTongHui5', 'sanmingTongHui7', 'baziInterpretationSpec', 'baziFixture'],
    ['pillars', 'dayMaster', 'yinYang'],
    'Directed Day Master → stem; visible stems, hidden stems and the viewed day stem',
    'Bát Tự pillars from P3; viewed day from the common calendar',
    ['bazi'],
    ['self'],
    'Five directed element relations plus polarity (same = Tỷ Kiên/Thực Thần/Thiên Tài/Thất Sát/Thiên Ấn). Fixture checked by an independent derivation; no human content review recorded yet. Names only, never good/bad.',
  ),
  definition(
    'interpretation.hidden-stems',
    'interpretation',
    'verified',
    ['baziInterpretationSpec', 'baziFixture'],
    ['pillars.chi'],
    'Ordered main → middle → residual; 28 stems over 12 branches',
    'Bát Tự pillars from P3',
    ['bazi'],
    ['self'],
    'Table fixed by PRD 6.3 and fixture; no weights, no transformation by combination or clash, not added to the strength score.',
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
