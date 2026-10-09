import { yearCanChi } from './canChi'
import { solarTermsForYear, SOLAR_TERM_METHOD } from './solarTerms'

export const ANNUAL_DIRECTIONS_AUTHORITY_ID = 'annual-directions-authority-v1' as const

export interface AnnualDirectionalRule {
  readonly id: string
  readonly name: string
  readonly operands: readonly ['SOLAR_YEAR_BRANCH']
  readonly yearBoundary: 'LI_CHUN'
  /** Branch positions, 0=Tý ... 11=Hợi. Not a compass-degree interval. */
  readonly branches: readonly number[]
  readonly direction?: '北' | '東' | '南' | '西'
  readonly status: 'SOURCE_LOCKED'
  readonly recommendationPolicy: 'INFORMATIONAL_ONLY'
  readonly source: {
    readonly work: string
    readonly section: string
    readonly confidence: 'PRIMARY'
  }
}

function record(
  id: string,
  name: string,
  branches: readonly number[],
  section: string,
  direction?: AnnualDirectionalRule['direction'],
): AnnualDirectionalRule {
  return {
    id,
    name,
    operands: ['SOLAR_YEAR_BRANCH'],
    yearBoundary: 'LI_CHUN',
    branches,
    ...(direction ? { direction } : {}),
    status: 'SOURCE_LOCKED',
    recommendationPolicy: 'INFORMATIONAL_ONLY',
    source: { work: '欽定協紀辨方書 (四庫全書本)', section, confidence: 'PRIMARY' },
  }
}

/** Calendar positions only. Never interprets a birth branch or personal affliction. */
export function getAnnualDirectionsByYearBranch(yearBranch: number) {
  if (!Number.isInteger(yearBranch) || yearBranch < 0 || yearBranch > 11) {
    throw new RangeError('Expected solar year branch 0..11')
  }
  // 卷三: 三煞 = 劫煞、災煞、歲煞, ordered by those three components.
  const groups = [
    { branches: [5, 6, 7], direction: '南' }, // 申子辰
    { branches: [2, 3, 4], direction: '東' }, // 巳酉丑
    { branches: [11, 0, 1], direction: '北' }, // 寅午戌
    { branches: [8, 9, 10], direction: '西' }, // 亥卯未
  ] as const
  const sanSha = groups[yearBranch % 4]!
  return {
    yearBranch,
    taiSui: record('tai-sui-direction-v1', 'Thái Tuế', [yearBranch], '卷三 太歲'),
    suiPo: record('sui-po-direction-v1', 'Tuế Phá', [(yearBranch + 6) % 12], '卷三 歲破'),
    sanSha: record(
      'san-sha-direction-v1',
      'Tam Sát',
      [...sanSha.branches],
      '卷三 劫煞 災煞 歲煞',
      sanSha.direction,
    ),
  }
}

/** Li Chun year turnover. Millisecond precision is a project convention layered on the source.
 * Absolute instants require Z/offset. No lunar/Gregorian-year fallback; JPL/clock-v1 only.
 */
export function getAnnualDirectionsAtInstant(dateTime: string) {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(dateTime)) throw new RangeError('Expected zoned instant')
  const instant = Date.parse(dateTime)
  if (!Number.isFinite(instant)) throw new RangeError('Invalid instant')
  const year = new Date(instant).getUTCFullYear()
  if (year < 1900 || year > 2100) throw new RangeError('Supported instant years: 1900–2100')
  const liChun = solarTermsForYear(year).find((term) => term.id === 'lap-xuan')!
  const solarYear = instant < Date.parse(liChun.instantUtc) ? year - 1 : year
  return {
    authorityId: ANNUAL_DIRECTIONS_AUTHORITY_ID,
    solarYear,
    yearBoundary: 'LI_CHUN' as const,
    boundaryPrecision: 'PROJECT_CONVENTION_EXACT_INSTANT' as const,
    astronomyMethod: SOLAR_TERM_METHOD,
    ...getAnnualDirectionsByYearBranch(yearCanChi(solarYear).chi),
  }
}
