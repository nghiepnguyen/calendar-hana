import { describe, expect, it } from 'vitest'
import activities from '../almanac-data/activities.json'
import patterns from '../almanac-data/mansion-patterns.json'
import content from '../almanac-data/mansion-content-yuxia-1880-v1.json'
import { ACTIVITY_SCOPES, getActivityScope, resolveActivityScope } from './activityTaxonomy'

describe('activity taxonomy contract', () => {
  it('covers exactly the existing catalog without deriving defaults from phrase order', () => {
    expect(Object.keys(ACTIVITY_SCOPES).sort()).toEqual(activities.items.map((x) => x.id).sort())
    expect(getActivityScope('travel')).toBe('travel_general')
    expect(getActivityScope('water_travel')).toBe('travel_water')
    expect(getActivityScope('grave_repair')).toBe('funeral_grave_repair')
    expect(getActivityScope('cut_hair')).toBe('cut_hair')
    expect(getActivityScope('unknown')).toBeUndefined()
    expect(getActivityScope('')).toBeUndefined()
    expect(getActivityScope('constructor')).toBeUndefined()
    expect(getActivityScope('__proto__')).toBeUndefined()
  })
  it('preserves every pre-migration default scope', () => {
    for (const activity of activities.items) {
      const before =
        patterns.items.find((row) => row.activityId === activity.id && row.scope !== 'travel_road')
          ?.scope ?? activity.id
      expect(getActivityScope(activity.id)).toBe(before)
    }
  })
  it('accepts existing lexical pairs and preserves source-specific unmapped clauses', () => {
    for (const row of patterns.items.filter((x) => x.activityId))
      expect(resolveActivityScope(row.activityId, row.scope).status).toBe('exact')
    for (const mansion of content.items)
      for (const clause of mansion.clauses)
        expect(resolveActivityScope(clause.activityId, clause.scope).status).toBe(
          clause.activityId ? 'exact' : 'unmapped',
        )
  })
  it('does not promote a broad or unrelated activity to a narrow operative scope', () => {
    for (const [id, scope] of [
      ['opening', 'door_opening'],
      ['construction', 'construction_wall'],
      ['water_travel', 'waterworks'],
      ['burial', 'funeral_grave_repair'],
      ['travel', 'travel_water'],
      ['water_travel', 'boat_building'],
    ])
      expect(resolveActivityScope(id, scope).status).toBe('incompatible')
    expect(resolveActivityScope('', 'door_opening')).toEqual({
      status: 'unmapped',
      activityId: '',
      scope: 'door_opening',
    })
    expect(resolveActivityScope('UNKNOWN', 'travel_general').status).toBe('unmapped')
  })
})
