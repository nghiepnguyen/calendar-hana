import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/mansion-content-golden-v1.json'
import { getMansionContent, getMansionContentEvidence } from './mansionContentAuthority'
import { resolveMansionActivityMapping } from './ruleActivityMapping'

describe('explicit mansion activity mapping, separate from source review', () => {
  it.each([
    ['construction', 'construction_general'],
    ['wedding', 'relationship_wedding'],
    ['burial', 'funeral_burial'],
    ['grave_repair', 'funeral_grave_repair'],
    ['water_travel', 'travel_water'],
  ])(
    'records compatible catalog pair %s / %s without scoring authorization',
    (activityId, scope) => {
      expect(resolveMansionActivityMapping(activityId, scope)).toMatchObject({
        version: 'mansion-activity-mapping-v1',
        status: 'exact_catalog_pair',
        reviewStatus: 'interpretation_pending',
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
    expect(resolveMansionActivityMapping('', scope)).toMatchObject({
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
      expect(() => resolveMansionActivityMapping(id, scope)).toThrow(/mapping/i)
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
            reviewStatus: 'interpretation_pending',
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
