import authority from '../almanac-data/p4-yi-operands-v1.json'
import { SOLAR_TERM_AUTHORITY } from '../astronomy/solarTerms/authority'
import { thoVuongDungSuPeriods } from './thoVuongDungSu'

const convention = authority.entries[0]!.soilConvention!
const sourcePath = `${SOLAR_TERM_AUTHORITY.goldenVersion}/astronomy/${SOLAR_TERM_AUTHORITY.datasetId}.json`
const states = ['present', 'absent', 'unknown']

/** Same frozen boundary/civil calculation as P4-B, under the separately adopted 母倉 authority. */
export function getP4MuCangSoil(date: string) {
  if (!isP4YiCivilDate(date))
    throw Object.assign(new RangeError('Invalid 母倉 civil date'), {
      code: 'MALFORMED_SOIL_PROVENANCE',
      inputKey: 'SOIL_REIGN_STATE',
      requestName: '母倉',
    })
  const covered = date >= convention.coverage[0]! && date <= convention.coverage[1]!
  const boundary = soilBoundary(date)
  return Object.freeze({
    date,
    authorityId: convention.authorityId,
    status: convention.status,
    timezone: convention.timezone,
    coverage: covered ? ('inside' as const) : ('outside' as const),
    state:
      covered && boundary
        ? date >= boundary.onset
          ? ('present' as const)
          : ('absent' as const)
        : ('unknown' as const),
    validated: boundary !== undefined,
    sourcePath,
    sourceSha256: SOLAR_TERM_AUTHORITY.sourceSha256,
    astronomyAuthorityId: SOLAR_TERM_AUTHORITY.authorityVersion,
    clockPolicy: SOLAR_TERM_AUTHORITY.clockVersion,
    ...(boundary
      ? {
          nextLi: boundary.li,
          onset: boundary.onset,
          sourceRowIndex: boundary.rowIndex,
          arithmetic: `${boundary.li} - 18 civil days = ${boundary.onset}; onset <= date < Li`,
        }
      : {}),
  })
}

export function isP4YiCivilDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  )
}

function soilBoundary(date: string) {
  const year = Number(date.slice(0, 4))
  if (year < SOLAR_TERM_AUTHORITY.firstYear || year > SOLAR_TERM_AUTHORITY.lastYear)
    return undefined
  const period =
    thoVuongDungSuPeriods(year).find((candidate) => candidate.li > date) ??
    (year < SOLAR_TERM_AUTHORITY.lastYear ? thoVuongDungSuPeriods(year + 1)[0] : undefined)
  if (!period) return undefined
  const boundaryYear = Number(period.li.slice(0, 4))
  return {
    ...period,
    rowIndex:
      (boundaryYear - SOLAR_TERM_AUTHORITY.firstYear) * 24 + ((period.termIndex - 19 + 24) % 24),
  }
}

/** Validate the separate 母倉 adoption, never relabel a P4-B soil result. */
export function getP4YiSoilReason(soil: Readonly<Record<string, unknown>>, requestName: string) {
  const fail = () => {
    throw Object.assign(new RangeError('Invalid 母倉 soil provenance'), {
      code: 'MALFORMED_SOIL_PROVENANCE',
      inputKey: 'SOIL_REIGN_STATE',
      requestName,
    })
  }
  for (const [key, expected] of Object.entries({
    authorityId: convention.authorityId,
    status: convention.status,
    timezone: convention.timezone,
    // Optional on old frozen inputs, but an explicit identity claim must be truthful.
    sourceSha256: SOLAR_TERM_AUTHORITY.sourceSha256,
    astronomyAuthorityId: SOLAR_TERM_AUTHORITY.authorityVersion,
    clockPolicy: SOLAR_TERM_AUTHORITY.clockVersion,
  }))
    if (soil[key] !== undefined && soil[key] !== expected) fail()
  for (const key of ['date', 'nextLi', 'onset'])
    if (soil[key] !== undefined && !isP4YiCivilDate(soil[key])) fail()
  if (soil.sourcePath !== undefined && soil.sourcePath !== sourcePath) fail()
  if (
    soil.sourceRowIndex !== undefined &&
    (!Number.isInteger(soil.sourceRowIndex) || (soil.sourceRowIndex as number) < 0)
  )
    fail()
  if (soil.validated !== undefined && typeof soil.validated !== 'boolean') fail()
  if (soil.coverage !== undefined && !['inside', 'outside'].includes(soil.coverage as string))
    fail()

  const date = soil.date
  if (!isP4YiCivilDate(date)) return 'UNVALIDATED_SOIL_PROVENANCE'
  const covered = date >= convention.coverage[0]! && date <= convention.coverage[1]!
  if (soil.coverage !== undefined && soil.coverage !== (covered ? 'inside' : 'outside')) fail()
  if (!covered) return 'OUTSIDE_LOCAL_COVERAGE'
  const required = [
    'authorityId',
    'status',
    'timezone',
    'date',
    'coverage',
    'nextLi',
    'onset',
    'sourcePath',
    'sourceRowIndex',
  ]
  if (soil.validated !== true || required.some((key) => soil[key] === undefined))
    return 'UNVALIDATED_SOIL_PROVENANCE'

  const period = soilBoundary(date)!
  if (
    soil.nextLi !== period.li ||
    soil.onset !== period.onset ||
    soil.sourceRowIndex !== period.rowIndex
  )
    fail()
  const actual = date >= period.onset ? 'present' : 'absent'
  // Unknown remains unknown even if the independent boundary could resolve it.
  if (soil.state !== 'unknown' && soil.state !== actual) fail()
  return soil.state === 'unknown' ? 'UNKNOWN_SOIL' : undefined
}

export function isP4YiSoilValue(value: unknown): value is Readonly<Record<string, unknown>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    states.includes((value as Record<string, unknown>).state as string)
  )
}
