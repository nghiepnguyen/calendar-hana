import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/mansion-content-golden-v1.json'
import interpretation from './audit-fixtures/mansion-activity-interpretation-golden-v1.json'
import { getMansionContent, getMansionContentEvidence } from './mansionContentAuthority'
import { resolveMansionActivityMapping } from './ruleActivityMapping'

const clause = (activityId: string, scope: string, quote = '', id = 'test-1') => ({
  id,
  quote,
  activityId,
  scope,
})

describe('explicit mansion activity mapping, separate from source review', () => {
  it.each([
    ['construction', 'construction_general', '造作'],
    ['wedding', 'relationship_wedding', '婚姻'],
    ['burial', 'funeral_burial', '埋葬'],
    ['grave_repair', 'funeral_grave_repair', '修墳'],
    ['water_travel', 'travel_water', '行船'],
  ])(
    'records compatible catalog pair %s / %s without scoring authorization',
    (activityId, scope, term) => {
      expect(resolveMansionActivityMapping(clause(activityId, scope, `X${term}Y`))).toEqual({
        version: 'mansion-activity-mapping-v2',
        status: 'exact_catalog_pair',
        reviewStatus: 'interpretation_reviewed',
        reviewTerm: term,
        reason: expect.any(String),
      })
    },
  )
  it.each([
    'door_opening',
    'waterworks',
    'construction_columns',
    'construction_high_hall',
    'construction_new_room',
    'construction_wall',
    'construction_waterside',
  ])('retains an explicit catalog gap for %s', (scope) => {
    expect(resolveMansionActivityMapping(clause('', scope))).toMatchObject({
      status: 'unmapped',
      reviewStatus: 'interpretation_pending',
      reason: expect.any(String),
    })
  })
  it('rejects broadening, crossed pairs and invented mappings even when catalog-compatible', () => {
    for (const [id, scope] of [
      ['opening', 'door_opening'],
      ['construction', 'construction_wall'],
      ['travel', 'travel_water'],
      ['water_travel', 'waterworks'],
      ['burial', 'funeral_grave_repair'],
      ['wedding', 'funeral_burial'],
      ['opening', 'business_opening'],
      ['', 'unrecognized_scope'],
      ['', 'funeral_burial'],
      ['unknown', 'door_opening'],
      ['constructor', 'door_opening'],
    ])
      expect(() => resolveMansionActivityMapping(clause(id, scope, '開門放水'))).toThrow(/mapping/i)
  })
  it('keeps a clause pending when its quote lacks a reviewed term or it is listed as ambiguous', () => {
    expect(
      resolveMansionActivityMapping(clause('wedding', 'relationship_wedding', '別嫁郎')),
    ).toMatchObject({
      reviewStatus: 'interpretation_pending',
      reviewNote: expect.any(String),
    })
    // Reviewed terms never leak across scopes.
    expect(resolveMansionActivityMapping(clause('', 'door_opening', '放水'))).toMatchObject({
      reviewStatus: 'interpretation_pending',
    })
    expect(
      resolveMansionActivityMapping(clause('wedding', 'relationship_wedding', '婚姻許定', '參-5')),
    ).toMatchObject({
      reviewStatus: 'interpretation_pending',
      reviewNote: expect.stringContaining('許定'),
    })
  })
  it('matches the independent interpretation golden for every clause', () => {
    expect(interpretation.authorityId).toBe(golden.authorityId)
    const actual = golden.items.flatMap((m) =>
      getMansionContentEvidence(getMansionContent(m.index)).map((e) => ({
        id: e.activityMapping!.clauseId,
        quote: e.sourceQuote,
        activityId: e.activityId,
        scope: e.scope,
        reviewStatus: e.activityMapping!.reviewStatus,
        ...(e.activityMapping!.reviewTerm ? { reviewTerm: e.activityMapping!.reviewTerm } : {}),
      })),
    )
    expect(actual).toEqual(interpretation.items)
    const pending = actual.filter((r) => r.reviewStatus === 'interpretation_pending')
    expect(pending.map((r) => r.id).sort()).toEqual(['參-5', '婁-1', '張-1', '星-4', '鬼-6'].sort())
    // Every pending clause carries a specific note, not the generic fallback.
    for (const m of golden.items)
      for (const e of getMansionContentEvidence(getMansionContent(m.index)))
        if (e.activityMapping!.reviewStatus === 'interpretation_pending')
          expect(e.activityMapping!.reviewNote).not.toMatch(/không chứa thuật ngữ/)
  })
  it('annotates every independent golden clause while preserving its evidence fields', () => {
    for (const expected of golden.items) {
      const actual = getMansionContentEvidence(getMansionContent(expected.index))
      expected.clauses.forEach((clause, i) => {
        expect(actual[i]).toMatchObject({
          activityId: clause.activityId,
          scope: clause.scope,
          sourceQuote: clause.quote,
          polarity: clause.polarity,
          conditions: clause.conditions,
          exceptions: clause.exceptions,
          status: 'informational',
          scoreDelta: 0,
          rawDelta: 0,
          activityMapping: {
            status: clause.activityId ? 'exact_catalog_pair' : 'unmapped',
            authorityId: golden.authorityId,
            clauseId: clause.id,
          },
        })
      })
    }
  })
  it('rejects a tampered operative pair before returning evidence', () => {
    const row = getMansionContent(5)
    const clause = row.clauses.find((c) => c.scope === 'door_opening')!
    expect(() =>
      getMansionContentEvidence({
        ...row,
        clauses: [{ ...clause, activityId: 'opening' }],
      }),
    ).toThrow(/mapping/i)
  })
})
