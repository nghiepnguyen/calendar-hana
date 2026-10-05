import { describe, expect, it } from 'vitest'
import { getEventProfile, resolveEventActivities } from './eventMapping'

describe('event mapping', () => {
  it('returns canonical profile and criteria for receiving a vehicle', () => {
    expect(getEventProfile('receive_vehicle')).toMatchObject({
      severity: 'high',
      mustHave: ['calendar_validity', 'good_hour'],
    })
  })

  it('resolves event aliases to normalized activity ids', () => {
    expect(resolveEventActivities('property_handover')).toEqual(['transaction', 'moving'])
  })
})

it('declares one primary with supporting multipliers instead of flat aliases', () => {
  expect(getEventProfile('open_business')?.activities).toEqual([
    { activityId: 'opening', role: 'primary', multiplier: 1 },
    { activityId: 'business', role: 'supporting', multiplier: 0.5 },
    { activityId: 'finance', role: 'supporting', multiplier: 0.3 },
  ])
})
