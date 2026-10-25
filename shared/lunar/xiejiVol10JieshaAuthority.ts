import authority from '../almanac-data/xieji-vol10-jiesha-authority-v3.json'

/**
 * 協紀 卷十 劫煞, 辰戌丑未 months without 德: 「不與德神併凡所忌者則不註宜所宜者亦不註忌」. The old
 * resolver read it as cancel_both and left every 劫煞 heading unannotated. The faithful reading keeps
 * 劫煞 忌 on a heading without its own 宜, after the 鋪註 pairs; the owner-approved audit matrix is a
 * fixed table per Month Jian + day pillar and activity (docs/audits/p4-chou-bingyin-yuede.md).
 *
 * `faithful-v1` is that matrix projected through the current resolveVol10 heading normalization, with
 * explicit exclusions (`runtimeCoverage`). Authority v2 (G2 Stage 2) applies contract / transaction, which
 * the 卷十 headingAliases entry 立劵交易 → 立券交易 makes reachable; v1 stays frozen as rollback evidence.
 * Authority v3 (G1 glyph Stage 2, R3) applies demolition per context: 11 contexts APPLIED, the 5 whose cell
 * depends on 土王用事 EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY with no cell (G1-SOIL); v2 stays frozen as rollback.
 * The policy lives in `manifest.policies.xiejiVol10JieshaPolicy` (shipped: faithful-v1); production
 * callers pass it to resolveVol10, and historical tests pin `legacy-cancel-both` explicitly.
 */
export type Vol10JieshaPolicy = 'legacy-cancel-both' | 'faithful-v1'
export const VOL10_JIESHA_AUTHORITY_ID = authority.version

export const VOL10_JIESHA_STATUSES = [
  'APPLIED',
  'APPLIED_BY_CONTEXT',
  'EXCLUDED_PENDING_GLYPH_AUDIT',
  'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION',
] as const
/** Context-level states of an APPLIED_BY_CONTEXT activity. */
export const VOL10_JIESHA_CONTEXT_STATUSES = [
  'APPLIED',
  'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY',
] as const
type Status = (typeof VOL10_JIESHA_STATUSES)[number]
type ContextStatus = (typeof VOL10_JIESHA_CONTEXT_STATUSES)[number]
type ContextCoverage = {
  status: ContextStatus
  cell?: string
  grade?: unknown
  identityApproved?: boolean
  authorityApproved?: boolean
  productionApproved?: boolean
  reason?: string
  debt?: string
}
type Coverage = {
  status: Status
  reason?: string
  debt?: string
  contexts?: Record<string, ContextCoverage>
}

const CELLS = authority.cells as Record<string, Record<string, string>>
const COVERAGE = authority.runtimeCoverage.activities as Record<string, Coverage>
const ACTIVITIES = authority.activities as string[]

/** Context coverage of one activity: per-context entries only for APPLIED_BY_CONTEXT. */
function contextOk(activity: string, c: Coverage): boolean {
  if (c.status !== 'APPLIED_BY_CONTEXT') return c.contexts === undefined
  const ctx = c.contexts ?? {}
  if (JSON.stringify(Object.keys(ctx).sort()) !== JSON.stringify(Object.keys(CELLS).sort()))
    return false
  return Object.entries(ctx).every(([key, e]) => {
    const cell = CELLS[key]![activity]
    const flags = [e.identityApproved, e.authorityApproved, e.productionApproved]
    if (e.status === 'APPLIED')
      return (
        (cell === 'avoid' || cell === 'blank') && e.cell === cell && flags.every((f) => f === true)
      )
    // Excluded: no cell anywhere (never a static blank / avoid), production never approved.
    if (e.status === 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY')
      return (
        !(activity in CELLS[key]!) &&
        e.cell === undefined &&
        e.productionApproved === false &&
        e.authorityApproved === false &&
        Boolean(e.reason && e.debt)
      )
    return false
  })
}

// A malformed table must fail on import, never on some user's day.
function validate() {
  const values = Object.values(CELLS).flatMap((row) => Object.values(row))
  const counts = {
    contexts: Object.keys(CELLS).length,
    activities: authority.activities.length,
    cells: values.length,
    avoid: values.filter((v) => v === 'avoid').length,
    blank: values.filter((v) => v === 'blank').length,
  }
  const coverageOk = Object.entries(COVERAGE).every(
    ([a, c]) =>
      VOL10_JIESHA_STATUSES.includes(c.status) &&
      (c.status === 'APPLIED' || c.status === 'APPLIED_BY_CONTEXT'
        ? true
        : Boolean(c.reason && c.debt)) &&
      // An excluded activity has no audit cells; every other one does.
      (c.status === 'EXCLUDED_PENDING_GLYPH_AUDIT') !== ACTIVITIES.includes(a) &&
      contextOk(a, c),
  )
  // A row holds every activity except an explicitly excluded (activity, context) pair, which is absent.
  const expected = (ctx: string, a: string) =>
    COVERAGE[a]?.contexts?.[ctx]?.status !== 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY'
  const ok =
    authority.schema === 'xieji-vol10-jiesha-authority' &&
    JSON.stringify(counts) === JSON.stringify(authority.counts) &&
    counts.cells === counts.avoid + counts.blank &&
    ACTIVITIES.every((a) => a in COVERAGE) &&
    coverageOk &&
    Object.entries(CELLS).every(
      ([ctx, row]) =>
        JSON.stringify(Object.keys(row).sort()) ===
        JSON.stringify(ACTIVITIES.filter((a) => expected(ctx, a)).sort()),
    )
  if (!ok) throw new Error(`invalid ${authority.version}: ${JSON.stringify(counts)}`)
}
validate()

export type Vol10JieshaRuntime =
  | { status: 'APPLIED'; cell: 'avoid' | 'blank' }
  | { status: 'EXCLUDED_PENDING_GLYPH_AUDIT'; reason: string }
  | { status: 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY'; reason: string }

/**
 * Runtime v1 for a 劫煞-listed activity on a day inside the scope. Throws on an unknown context, an
 * activity without coverage, a missing APPLIED cell, or an UNREACHABLE activity that was reached
 * (the heading normalization changed without a new authority revision).
 */
export function getVol10JieshaRuntime(
  month: string,
  pillar: string,
  activityId: string,
): Vol10JieshaRuntime {
  const row = CELLS[month + pillar]
  if (!row) throw new Error(`${authority.version}: no context ${month}${pillar}`)
  const coverage = COVERAGE[activityId]
  if (!coverage) throw new Error(`${authority.version}: no coverage for ${activityId}`)
  if (coverage.status === 'EXCLUDED_PENDING_GLYPH_AUDIT')
    return { status: coverage.status, reason: coverage.reason! }
  if (coverage.status === 'APPLIED_BY_CONTEXT') {
    const ctx = coverage.contexts![month + pillar]
    if (!ctx)
      throw new Error(`${authority.version}: ${activityId} has no coverage for ${month}${pillar}`)
    // Excluded context: the exclusion is returned without reading the cell table.
    if (ctx.status === 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY')
      return { status: ctx.status, reason: ctx.reason! }
    if (ctx.status !== 'APPLIED')
      throw new Error(`${authority.version}: ${activityId} ${month}${pillar} is ${ctx.status}`)
  } else if (coverage.status !== 'APPLIED')
    throw new Error(`${authority.version}: ${activityId} is ${coverage.status} but was reached`)
  const cell = row[activityId]
  if (cell !== 'avoid' && cell !== 'blank')
    throw new Error(`${authority.version}: no cell ${month}${pillar} ${activityId}`)
  return { status: 'APPLIED', cell }
}

/** The only way to read an authority cell: APPLIED returns it; every other state throws, so an exclusion can
 * never be read as blank, avoid or a fallback. */
export function vol10JieshaCell(runtime: Vol10JieshaRuntime): 'avoid' | 'blank' {
  if (runtime.status !== 'APPLIED')
    throw new Error(`${authority.version}: authority cell requested for ${runtime.status}`)
  return runtime.cell
}
