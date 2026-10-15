import authority from '../almanac-data/p4-yi-operands-v1.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import { splitP4YiGods } from './p4DayComposition'
import { canonP4Heading } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'

/** A single source heading key; spelling normalization never implies listedness. */
export function normalizeP4YiHeading(heading: string) {
  const headings = splitHeadings(heading)
  if (headings.length !== 1) throw new RangeError('Expected one P4 宜 heading')
  return canonP4Heading(headings[0]!)
}
const entries = new Map(
  Object.entries(vol11.entries).map(([heading, value]) => [normalizeP4YiHeading(heading), value]),
)

/** Isolated evidence and real provider output share this audit-only routing/ANY seam.
 * Complete eligible trace is retained even when a present masks an unknown. */
export function composeP4YiEvidence(
  heading: string,
  operands: readonly Readonly<Record<string, unknown>>[],
): {
  readonly yi: boolean | undefined
  readonly trace: readonly Readonly<Record<string, unknown>>[]
  readonly unresolvedTraceIds: readonly string[]
  readonly deferred?: 'P5'
} {
  const key = normalizeP4YiHeading(heading)
  // Warehouse is a compound clause, never a flat ANY list (P5): its listed operands are traced
  // and unknowns kept, but no presence, 母倉 included, resolves the heading.
  const warehouse = key === '修倉庫'
  const mode = warehouse ? 'P5_DEFERRED_CO_PRESENCE' : 'DIRECT_YI'
  const source = entries.get(key)
  // Warehouse labels only: strip the clause grammar as the baseline inventory does (1.4).
  const listed = source
    ? splitP4YiGods(warehouse ? source.宜.replace(/又|與|併者/g, '') : source.宜)
    : []
  const trace = operands.filter((operand) => {
    const entry = authority.entries.find(
      (candidate) =>
        candidate.han === operand.han || candidate.aliases.some((alias) => alias === operand.han),
    )
    return entry
      ? entry.headingScopes.some(
          (scope) => scope.mode === mode && normalizeP4YiHeading(scope.normalized) === key,
        )
      : typeof operand.han === 'string' && listed.includes(operand.han)
  })
  const unresolved = trace.filter((operand) => operand.presence === 'unknown')
  if (warehouse)
    return {
      yi: undefined,
      trace,
      unresolvedTraceIds: unresolved.map((operand) => operand.traceId as string),
      deferred: 'P5',
    }
  return {
    yi: trace.some((operand) => operand.presence === 'present')
      ? true
      : unresolved.length
        ? undefined
        : false,
    trace,
    unresolvedTraceIds: unresolved.map((operand) => operand.traceId as string),
  }
}
