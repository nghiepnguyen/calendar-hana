import { describe, expect, it } from 'vitest'
import type { Evidence } from './evidence'
import { analyzeEvidenceConflicts } from './evidenceConflicts'
import { getMansionContent, getMansionContentEvidence } from './mansionContentAuthority'
import { evaluateEventDay } from './eventEvaluation'

const row = (
  id: string,
  polarity: Evidence['polarity'],
  authorityId = 'edition-a',
  reviewStatus: 'interpretation_pending' | 'interpretation_reviewed' = 'interpretation_pending',
): Evidence => ({
  source: 'mansion',
  ruleId: id,
  activityId: 'wedding',
  scope: 'relationship_wedding',
  polarity,
  sourcePhrase: id,
  sourceRef: `scan:${authorityId}/${id}`,
  confidence: 'medium',
  status: 'informational',
  scoreDelta: 0,
  rawDelta: 0,
  label: id,
  conditions: [{ operand: 'MANSION_INDEX', equals: 0 }],
  exceptions: [],
  activityMapping: {
    version: 'mansion-activity-mapping-v2',
    activityId: 'wedding',
    status: 'exact_catalog_pair',
    reviewStatus,
    reason: 'test',
    authorityId,
    clauseId: id,
  },
})
const context = { MANSION_INDEX: 0 }

describe('evidence conflict diagnostics without majority vote or scoring', () => {
  it('preserves opposing witnesses within one authority without selecting a winner', () => {
    const input = [row('p1', 'positive'), row('p2', 'positive'), row('n', 'negative')]
    const before = structuredClone(input)
    const result = analyzeEvidenceConflicts(input, context)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0]).toMatchObject({
      kind: 'within_authority',
      activityId: 'wedding',
      scope: 'relationship_wedding',
      authorityIds: ['edition-a'],
      reviewPending: true,
    })
    expect(result.conflicts[0].witnesses.map((x) => x.ruleId)).toEqual(['p1', 'p2', 'n'])
    expect(input).toEqual(before)
  })
  it('clears reviewPending only when every witness interpretation is reviewed', () => {
    const reviewed = (id: string, polarity: Evidence['polarity']) =>
      row(id, polarity, 'edition-a', 'interpretation_reviewed')
    expect(
      analyzeEvidenceConflicts([reviewed('p', 'positive'), reviewed('n', 'negative')], context)
        .conflicts[0].reviewPending,
    ).toBe(false)
    expect(
      analyzeEvidenceConflicts([reviewed('p', 'positive'), row('n', 'negative')], context)
        .conflicts[0].reviewPending,
    ).toBe(true)
  })
  it('distinguishes disagreements across editions from an internal contradiction', () => {
    const result = analyzeEvidenceConflicts(
      [row('a', 'positive'), row('b', 'negative', 'edition-b')],
      context,
    )
    expect(result.conflicts[0].kind).toBe('between_authorities')
    expect(result.conflicts[0].authorityIds).toEqual(['edition-a', 'edition-b'])
  })
  it('does not confuse neutral, unrelated activities or different scopes with opposition', () => {
    expect(
      analyzeEvidenceConflicts([row('a', 'positive'), row('b', 'neutral')], context).conflicts,
    ).toEqual([])
    const other = { ...row('b', 'negative'), activityId: 'engagement', scope: 'engagement' }
    expect(analyzeEvidenceConflicts([row('a', 'positive'), other], context).conflicts).toEqual([])
    const general = { ...row('a', 'positive'), activityId: 'travel', scope: 'travel_general' }
    const road = { ...row('b', 'negative'), activityId: 'travel', scope: 'travel_road' }
    expect(analyzeEvidenceConflicts([general, road], context).conflicts).toEqual([])
  })
  it('keeps missing context, unmapped evidence and unresolved exceptions out of asserted conflict', () => {
    const inputs = [
      { ...row('empty', 'negative'), activityId: '' },
      { ...row('exception', 'negative'), exceptions: ['Only under a source-specific exception'] },
      { ...row('unknown', 'negative'), conditions: [{ operand: 'UNKNOWN', equals: 1 }] },
      { ...row('legacy', 'negative'), activityMapping: undefined },
      { ...row('no-conditions', 'negative'), conditions: undefined },
      { ...row('bad-pair', 'negative'), scope: 'funeral_burial' },
    ]
    const result = analyzeEvidenceConflicts([row('positive', 'positive'), ...inputs], context)
    expect(result.conflicts).toEqual([])
    expect(result.unresolved).toHaveLength(inputs.length)
    expect(
      analyzeEvidenceConflicts([row('p', 'positive'), row('n', 'negative')], {}).unresolved,
    ).toHaveLength(2)
  })
  it('excludes nonmatching conditions and no-evidence records without treating them as permission', () => {
    const result = analyzeEvidenceConflicts(
      [
        row('p', 'positive'),
        { ...row('other-day', 'negative'), conditions: [{ operand: 'MANSION_INDEX', equals: 1 }] },
        { ...row('missing', 'negative'), status: 'no_evidence' },
      ],
      context,
    )
    expect(result.conflicts).toEqual([])
    expect(result.notApplicable.map((x) => x.ruleId)).toEqual(['other-day', 'missing'])
  })
  it('can report internal and cross-authority opposition together', () => {
    const result = analyzeEvidenceConflicts(
      [row('p', 'positive'), row('n', 'negative'), row('b', 'positive', 'edition-b')],
      context,
    )
    expect(result.conflicts.map((x) => x.kind)).toEqual(['within_authority', 'between_authorities'])
  })
  it('keeps real clauses informational and adds event diagnostics without changing scores', () => {
    for (let index = 0; index < 28; index++) {
      const evidence = getMansionContentEvidence(getMansionContent(index))
      expect(analyzeEvidenceConflicts(evidence, { MANSION_INDEX: index }).conflicts).toEqual([])
      expect(evidence.every((x) => x.scoreDelta === 0 && x.status === 'informational')).toBe(true)
    }
    expect(evaluateEventDay('2026-10-10', 'wedding', { hour: 9 }).conflictAnalysis).toBeDefined()
    expect(evaluateEventDay('invalid', 'wedding').conflictAnalysis.conflicts).toEqual([])
    expect(evaluateEventDay('2026-10-10', 'unknown').conflictAnalysis.conflicts).toEqual([])
  })
})
