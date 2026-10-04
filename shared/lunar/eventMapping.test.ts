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
    expect(resolveEventActivities('property_handover')).toEqual(['moving', 'transaction'])
  })
})
