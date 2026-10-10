import type { Evidence } from './evidence'
import { resolveActivityScope } from './activityTaxonomy'

export type ConflictWitness = Pick<Evidence, 'ruleId' | 'sourceRef' | 'polarity'> & {
  authorityId: string
}
export interface EvidenceConflict {
  kind: 'within_authority' | 'between_authorities'
  activityId: string
  scope: string
  authorityIds: string[]
  witnesses: ConflictWitness[]
  reviewPending: boolean
}
export interface ConflictAnalysis {
  version: 'evidence-conflicts-v1'
  context: Record<string, number>
  conflicts: EvidenceConflict[]
  unresolved: { ruleId: string; sourceRef: string; reason: string }[]
  notApplicable: { ruleId: string; sourceRef: string; reason: string }[]
}

/** Diagnostic only: no winner, majority vote, cancellation, scoring or verdict changes.
 * Applicable positive/negative witnesses compare only at an exact activity/scope.
 * Authority IDs must identify the edition/convention; never infer them from a URL.
 * Free-text exceptions cannot be evaluated here and remain unresolved.
 */
export function analyzeEvidenceConflicts(
  rows: readonly Evidence[],
  context: Readonly<Record<string, number>>,
): ConflictAnalysis {
  const result: ConflictAnalysis = {
    version: 'evidence-conflicts-v1',
    context: { ...context },
    conflicts: [],
    unresolved: [],
    notApplicable: [],
  }
  const groups = new Map<string, Evidence[]>()
  for (const row of rows) {
    const reference = { ruleId: row.ruleId, sourceRef: row.sourceRef }
    if (row.status === 'no_evidence') {
      result.notApplicable.push({ ...reference, reason: 'no_evidence' })
      continue
    }
    const mapping = row.activityMapping
    const reason =
      !row.activityId || mapping?.status === 'unmapped'
        ? 'unmapped_activity'
        : resolveActivityScope(row.activityId, row.scope).status !== 'exact'
          ? 'incompatible_activity_scope'
          : !mapping?.authorityId
            ? 'missing_authority_context'
            : !row.conditions?.length
              ? 'missing_conditions'
              : row.conditions.some(
                    (c) =>
                      !Object.hasOwn(context, c.operand) ||
                      !Number.isFinite(context[c.operand]) ||
                      !Number.isFinite(c.equals),
                  )
                ? 'unknown_operand'
                : undefined
    if (reason) {
      result.unresolved.push({ ...reference, reason })
      continue
    }
    if (row.conditions!.some((c) => context[c.operand] !== c.equals)) {
      result.notApplicable.push({ ...reference, reason: 'condition_mismatch' })
      continue
    }
    if (row.exceptions === undefined || row.exceptions.length > 0) {
      result.unresolved.push({ ...reference, reason: 'unresolved_exceptions' })
      continue
    }
    const key = JSON.stringify([row.activityId, row.scope])
    const group = groups.get(key) ?? []
    group.push(row)
    groups.set(key, group)
  }
  const add = (kind: EvidenceConflict['kind'], rows: Evidence[]) => {
    result.conflicts.push({
      kind,
      activityId: rows[0].activityId,
      scope: rows[0].scope,
      authorityIds: [...new Set(rows.map((r) => r.activityMapping!.authorityId))].sort(),
      witnesses: rows.map((r) => ({
        ruleId: r.ruleId,
        sourceRef: r.sourceRef,
        polarity: r.polarity,
        authorityId: r.activityMapping!.authorityId,
      })),
      reviewPending: rows.some((r) => r.activityMapping!.reviewStatus === 'interpretation_pending'),
    })
  }
  for (const group of groups.values()) {
    const authorities = new Map<string, Evidence[]>()
    for (const row of group) {
      const key = row.activityMapping!.authorityId
      const rows = authorities.get(key) ?? []
      rows.push(row)
      authorities.set(key, rows)
    }
    for (const rows of authorities.values()) {
      if (
        rows.some((r) => r.polarity === 'positive') &&
        rows.some((r) => r.polarity === 'negative')
      )
        add('within_authority', rows)
    }
    if (
      group.some(
        (a) =>
          a.polarity === 'positive' &&
          group.some(
            (b) =>
              b.polarity === 'negative' &&
              a.activityMapping!.authorityId !== b.activityMapping!.authorityId,
          ),
      )
    )
      add('between_authorities', group)
  }
  return result
}
