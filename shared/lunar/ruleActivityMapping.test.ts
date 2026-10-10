import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/mansion-content-golden-v1.json'
import interpretation from './audit-fixtures/mansion-activity-interpretation-golden-v2.json'
import { getMansionContent } from './mansionContentAuthority'
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
    ['door_opening', 'door_opening', '開門'],
    ['waterworks', 'waterworks', '放水'],
  ])(
    'records compatible catalog pair %s / %s without scoring authorization',
    (activityId, scope, term) => {
      expect(resolveMansionActivityMapping(clause(activityId, scope, `X${term}Y`))).toEqual({
        version: 'mansion-activity-mapping-v2',
        activityId,
        status: 'exact_catalog_pair',
        reviewStatus: 'interpretation_reviewed',
        reviewTerm: term,
        reason: expect.any(String),
      })
    },
  )
  it.each([['door_opening'], ['waterworks']])(
    'assigns the added catalog ID to a %s clause source-locked with an empty ID',
    (scope) => {
      expect(resolveMansionActivityMapping(clause('', scope, '開門放水'))).toMatchObject({
        activityId: scope,
        status: 'exact_catalog_pair',
        reviewStatus: 'interpretation_reviewed',
      })
    },
  )
  it.each([
    'construction_columns',
    'construction_high_hall',
    'construction_new_room',
    'construction_wall',
    'construction_waterside',
  ])('retains an explicit catalog gap for %s', (scope) => {
    expect(resolveMansionActivityMapping(clause('', scope))).toMatchObject({
      activityId: '',
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
      ['door_opening', 'waterworks'],
      ['waterworks', 'door_opening'],
      ['door_opening', 'construction_general'],
      ['burial', 'funeral_grave_repair'],
      ['wedding', 'funeral_burial'],
      ['opening', 'business_opening'],
      ['', 'unrecognized_scope'],
      ['', 'funeral_burial'],
      ['', 'travel_water'],
      ['unknown', 'door_opening'],
      ['constructor', 'door_opening'],
    ])
      expect(() => resolveMansionActivityMapping(clause(id, scope, '開門放水'))).toThrow(/mapping/i)
  })
  it('keeps a clause pending when its quote lacks a reviewed term of its own scope', () => {
    expect(
      resolveMansionActivityMapping(clause('wedding', 'relationship_wedding', '別嫁郎')),
    ).toMatchObject({ reviewStatus: 'interpretation_pending', reviewNote: expect.any(String) })
    // Reviewed terms never leak across scopes.
    expect(resolveMansionActivityMapping(clause('', 'door_opening', '放水'))).toMatchObject({
      reviewStatus: 'interpretation_pending',
    })
  })
  it('marks a consequence line not operative instead of mapping it to an activity', () => {
    expect(
      resolveMansionActivityMapping(
        clause('wedding', 'relationship_wedding', '自要歸休別嫁郎', '星-4'),
      ),
    ).toMatchObject({
      activityId: '',
      status: 'not_operative',
      reviewNote: expect.stringContaining('不可葬埋并放水'),
    })
  })
  it('matches the independent interpretation golden for every source-locked clause', () => {
    expect(interpretation.authorityId).toBe(golden.authorityId)
    const actual = golden.items.flatMap((m) =>
      getMansionContent(m.index).clauses.map((c) => {
        const mapping = resolveMansionActivityMapping(c)
        return {
          id: c.id,
          quote: c.quote,
          activityId: mapping.activityId,
          scope: c.scope,
          status: mapping.status,
          reviewStatus: mapping.reviewStatus,
          ...(mapping.reviewTerm ? { reviewTerm: mapping.reviewTerm } : {}),
        }
      }),
    )
    expect(actual).toEqual(interpretation.items)
    expect(actual.every((r) => r.reviewStatus === 'interpretation_reviewed')).toBe(true)
  })
  it('settles each formerly pending clause with a reading from its full verse', () => {
    const verses = interpretation.verses as Record<string, string>
    for (const [id, han] of [
      ['張-1', '張'],
      ['參-5', '參'],
      ['婁-1', '婁'],
      ['鬼-6', '鬼'],
      ['星-4', '星'],
    ]) {
      const row = golden.items.find((m) => m.han === han)!
      const c = row.clauses.find((x) => x.id === id)!
      expect(verses[han]).toContain(c.quote.replace('克', '剋'))
      expect(resolveMansionActivityMapping(c).reviewNote).toEqual(expect.any(String))
    }
  })
  it('rejects a tampered operative pair before returning evidence', () => {
    const row = getMansionContent(5)
    const c = row.clauses.find((x) => x.scope === 'door_opening')!
    expect(() => resolveMansionActivityMapping({ ...c, activityId: 'opening' })).toThrow(/mapping/i)
  })
})
