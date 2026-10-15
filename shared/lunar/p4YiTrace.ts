import authority from '../almanac-data/p4-yi-operands-v1.json'
import type { P4YiAuthorityEntry } from './p4YiPredicates'

type InputMap = Readonly<Record<string, unknown>>
const evidenceHashes = new Map(authority.evidenceFiles.map((file) => [file.path, file.sha256]))

/** Identity of the unchanged source bundle frozen before implementation, verified by audit tests. */
const bundle = Object.freeze({
  path: 'shared/almanac-data/p4-yi-operands-v1.json',
  version: authority.version,
  sha256: '8c15e14bf21277004158b87c5ca36b285b44766c7704e1014e2f5ec94fe8a3fb',
})

/** Copy before freezing: never freeze or retain a mutable reference into caller/artifact data. */
export function freezeP4YiTrace<T>(value: T): Readonly<T> {
  const copy = structuredClone(value)
  const seen = new WeakSet<object>()
  const freeze = (item: unknown) => {
    if (item === null || typeof item !== 'object' || seen.has(item)) return
    seen.add(item)
    for (const child of Object.values(item)) freeze(child)
    Object.freeze(item)
  }
  freeze(copy)
  return copy
}

function evidenceHash(path: string): string {
  const hash = evidenceHashes.get(path)
  if (!hash) throw new Error(`Missing locked 宜 evidence hash: ${path}`)
  return hash
}

function sourceReference(entry: P4YiAuthorityEntry) {
  return freezeP4YiTrace({
    bundle,
    entryId: entry.id,
    ...entry.provenance,
    offsetProtocol: authority.offsetProtocol,
    // All local indices remain available, including those used only by headingScopes.
    sources: entry.sources.map((source, sourceRef) => ({
      ...source,
      sourceRef,
      rawSha256: evidenceHash(source.path),
    })),
    predicateSourceRefs: [...entry.predicate.sourceRefs],
    scanChecks: entry.scanChecks.map((scan) => ({
      ...scan,
      sha256: evidenceHash(scan.renderPath),
    })),
    headingScopes: entry.headingScopes,
    coverage: entry.coverage,
    review: entry.review,
  })
}
const references = new Map<string, ReturnType<typeof sourceReference>>()

export function getP4YiSourceReference(entry: P4YiAuthorityEntry) {
  let reference = references.get(entry.id)
  if (!reference) {
    reference = sourceReference(entry)
    references.set(entry.id, reference)
  }
  return reference
}

/** Bind caller-declared context to required keys only. Metadata never determines presence. */
export function getP4YiInputProvenance(
  entry: P4YiAuthorityEntry,
  inputs: InputMap,
  providerStates: InputMap,
  caller: InputMap,
) {
  const context = Object.fromEntries(
    ['kind', 'instantUtc', 'civilDateUtc7', 'note', 'providerScenario']
      .filter((key) => Object.hasOwn(caller, key))
      .map((key) => [key, caller[key]]),
  )
  return freezeP4YiTrace(
    Object.fromEntries(
      entry.operandInputs
        .filter((input) => input.required)
        .map((input) => {
          const key = input.key
          let evidence: unknown = caller[key]
          if (evidence === undefined) {
            if (key === 'SOIL_REIGN_STATE')
              evidence = inputs[key] ?? { kind: 'MISSING_SOIL_EVIDENCE' }
            else {
              const calculationKey =
                key === 'MONTH_JIAN_BRANCH' ? 'monthCalculation' : 'dayCalculation'
              evidence = {
                kind: 'CALLER_SUPPLIED',
                ...context,
                ...(caller[calculationKey] !== undefined
                  ? { calculation: caller[calculationKey] }
                  : {}),
                ...(key !== 'MONTH_JIAN_BRANCH' && caller.validPillar !== undefined
                  ? { validPillar: caller.validPillar }
                  : {}),
              }
            }
          }
          return [
            key,
            {
              originRequirement: input.origin,
              supplied: inputs[key] !== undefined,
              providerState: providerStates[key] ?? 'unspecified',
              evidenceOrigin: 'CALLER_DECLARED',
              evidence,
            },
          ]
        }),
    ),
  )
}
