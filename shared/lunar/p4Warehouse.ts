import authority from '../almanac-data/p5-warehouse-v1.json'
import { resolveP4YiDay, type P4YiDayOperands } from './p4YiDayComposition'
import { assembleP4YiFullDayWithRaw } from './p4YiFullDayCore'
import { freezeP4YiTrace } from './p4YiTrace'

// P5 修倉庫 co-presence, owner decision D (audit-only). Semantics are the frozen Golden's
// (golden-p5-warehouse-v1, derive.py `resolve`): Kleene readings, and D / heading taken over every
// completion of the unknown operands, impossible pairs included.
type Presence = Readonly<Record<string, boolean | undefined>>
type Verdict = 'agreed' | 'agreed_absent' | 'source_dependent' | 'unknown'
export type P5WarehouseHeading = 'yi' | 'no_yi' | 'source_dependent' | 'unknown'

/** Identity of the locked authority this module reads, verified by p4Warehouse.test.ts. */
export const P5_WAREHOUSE_AUTHORITY = Object.freeze({
  path: 'shared/almanac-data/p5-warehouse-v1.json',
  version: authority.version,
  sha256: '0e7372fbde81dadea3514261b8fc20943fc9533994beb8e135132a7cd946e8bc',
})

const cp = authority.coPresence
const DIRECT: readonly string[] = authority.direct.gods
const BASES: readonly string[] = cp.bases
const R10 = cp.R10.partners as Record<string, string[]>
const R11 = cp.R11.partners as Record<string, string[]>
const IMPOSSIBLE = Object.keys(cp.impossible).map((pair) => pair.split('+') as [string, string])
export const P5_WAREHOUSE_GODS: readonly string[] = [
  ...new Set([...DIRECT, ...BASES, ...BASES.flatMap((b) => [...R10[b]!, ...R11[b]!])]),
]

const anyOf = (v: (boolean | undefined)[]) =>
  v.includes(true) ? true : v.includes(undefined) ? undefined : false
const andOf = (a: boolean | undefined, b: boolean | undefined) =>
  a === false || b === false ? false : a === undefined || b === undefined ? undefined : true
const dOf = (r10: boolean, r11: boolean): Verdict =>
  r10 && r11 ? 'agreed' : !r10 && !r11 ? 'agreed_absent' : 'source_dependent'

function* completions(p: Presence, names: readonly string[]): Generator<Record<string, boolean>> {
  const unknown = [...new Set(names)].filter((g) => p[g] === undefined)
  for (let bits = 0; bits < 1 << unknown.length; bits++)
    yield {
      ...p,
      ...Object.fromEntries(unknown.map((g, i) => [g, Boolean(bits & (1 << i))])),
    } as Record<string, boolean>
}

/** One outcome over every completion, or unknown when completions disagree. */
function settle<T extends string>(outcomes: Iterable<T>): T | 'unknown' {
  const set = new Set(outcomes)
  return set.size === 1 ? [...set][0]! : 'unknown'
}

function headingKnown(s: Record<string, boolean>): Exclude<P5WarehouseHeading, 'unknown'> {
  if (DIRECT.some((g) => s[g])) return 'yi'
  const ds = BASES.filter((b) => s[b]).map((b) =>
    dOf(
      R10[b]!.some((g) => s[g]),
      R11[b]!.some((g) => s[g]),
    ),
  )
  return ds.includes('agreed')
    ? 'yi'
    : ds.includes('source_dependent')
      ? 'source_dependent'
      : 'no_yi'
}

/** 修倉庫 宜 from operand presence (true / false / undefined = unknown). */
export function resolveP4Warehouse(p: Presence) {
  for (const g of P5_WAREHOUSE_GODS)
    if (!Object.hasOwn(p, g)) throw new RangeError(`Missing warehouse operand: ${g}`)
  for (const [a, b] of IMPOSSIBLE)
    if (p[a] === true && p[b] === true)
      throw Object.assign(new RangeError(`Impossible warehouse co-presence: ${a}+${b}`), {
        code: 'IMPOSSIBLE_CO_PRESENCE',
        pair: `${a}+${b}`,
      })
  const bases = BASES.filter((b) => p[b] !== false).map((base) => ({
    base,
    present: p[base],
    r10: andOf(p[base], anyOf(R10[base]!.map((g) => p[g]))),
    r11: andOf(p[base], anyOf(R11[base]!.map((g) => p[g]))),
    d: settle(
      [...completions(p, [base, ...R10[base]!, ...R11[base]!])].map((c) =>
        c[base]
          ? dOf(
              R10[base]!.some((g) => c[g]),
              R11[base]!.some((g) => c[g]),
            )
          : 'agreed_absent',
      ),
    ),
    partners: [...new Set([...R10[base]!, ...R11[base]!])].map((han) => ({
      han,
      presence: p[han],
      r10: R10[base]!.includes(han),
      r11: R11[base]!.includes(han),
    })),
    sources: {
      r10: cp.R10.clauses[base as keyof typeof cp.R10.clauses],
      r11: authority.heading.修倉庫,
    },
  }))
  const heading = settle([...completions(p, P5_WAREHOUSE_GODS)].map(headingKnown))
  return {
    authorityId: authority.authorityId,
    heading,
    yi: heading === 'yi' ? true : heading === 'no_yi' ? false : undefined,
    bases,
    unknownOperands: P5_WAREHOUSE_GODS.filter((g) => p[g] === undefined),
  }
}

/** P4-C day with 修倉庫 resolved by D. Every other heading is P4-C's: no propagation or
 * suppression line reads from 修倉庫 (composition v2). Operands come from the P4-C traces. */
export function resolveP4WarehouseDay(
  month: string,
  pillar: string,
  operands: P4YiDayOperands = {},
) {
  const p4c = resolveP4YiDay(month, pillar, operands)
  // Union of every heading's trace: 月恩 is traced only under 開倉庫出貨財 (卷十一 修倉庫 omits it).
  type Item = { traceId: string; han: string; presence: string }
  const seen = new Map<string, Item>()
  for (const evidence of Object.values(p4c.yiEvidence))
    for (const t of evidence.trace as readonly Item[]) {
      if (seen.has(t.han) && seen.get(t.han)!.presence !== t.presence)
        throw new RangeError(`Conflicting warehouse operand trace: ${t.han}`)
      seen.set(t.han, t)
    }
  const traced = P5_WAREHOUSE_GODS.map((g) => {
    const t = seen.get(g)
    if (!t) throw new RangeError(`Untraced warehouse operand: ${g}`)
    return t
  })
  const presence = Object.fromEntries(
    traced.map((t) => [t.han, t.presence === 'unknown' ? undefined : t.presence === 'present']),
  )
  const traceIds = Object.fromEntries(traced.map((t) => [t.han, t.traceId]))
  const warehouse = { ...resolveP4Warehouse(presence), presence, traceIds }
  const yi = Object.fromEntries(
    Object.entries(p4c.yiEvidence).map(([h, e]) => [h, h === '修倉庫' ? warehouse.yi : e.yi]),
  )
  const day = assembleP4YiFullDayWithRaw(month, pillar, operands, yi)
  const { deferred: _deferred, ...xiu } = p4c.yiEvidence['修倉庫']!
  // SOURCE_DEPENDENT is undetermined like a missing operand; the tag keeps the two apart.
  const tag: { warehouse?: 'SOURCE_DEPENDENT' } =
    warehouse.heading === 'source_dependent' ? { warehouse: 'SOURCE_DEPENDENT' } : {}
  type Heading = (typeof day.headings)[string] & { warehouse?: 'SOURCE_DEPENDENT' }
  type Evidence = (typeof p4c.yiEvidence)[string] & { warehouse?: P5WarehouseHeading }
  return {
    ...p4c,
    ...day,
    version: 'p5-warehouse-day-v1' as const,
    headings: { ...day.headings, 修倉庫: { ...day.headings['修倉庫']!, ...tag } } as Record<
      string,
      Heading
    >,
    yiEvidence: freezeP4YiTrace<Record<string, Evidence>>({
      ...p4c.yiEvidence,
      修倉庫: { ...xiu, yi: warehouse.yi, warehouse: warehouse.heading },
    }),
    warehouse: freezeP4YiTrace(warehouse),
  }
}
