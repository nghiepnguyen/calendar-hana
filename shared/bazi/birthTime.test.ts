import { describe, expect, it } from 'vitest'
import { normalizeBirthTime } from './birthTime'

describe('normalizeBirthTime', () => {
  it('normalizes a Vietnamese wall time with pinned timezone metadata', () => {
    expect(
      normalizeBirthTime({
        civilDate: '2000-02-29',
        wallTime: '23:45',
        timezoneId: 'Asia/Ho_Chi_Minh',
      }),
    ).toMatchObject({
      status: 'ready',
      tzdbVersion: '2026d',
      candidates: [{ instantUtc: '2000-02-29T16:45:00.000Z', offsetMinutes: 420 }],
    })
  })

  it('returns both candidates for the southern 1975 repeated hour', () => {
    const result = normalizeBirthTime({
      civilDate: '1975-06-12',
      wallTime: '23:30',
      timezoneId: 'Asia/Ho_Chi_Minh',
    })
    expect(result.status).toBe('ambiguous')
    expect(result.candidates.map((candidate) => candidate.offsetMinutes)).toEqual([480, 420])
  })

  it('requires confirmed offset before 1970 and never invents noon', () => {
    expect(
      normalizeBirthTime({
        civilDate: '1954-07-21',
        wallTime: '12:34',
        timezoneId: 'Asia/Ho_Chi_Minh',
      }).status,
    ).toBe('needsOffsetConfirmation')
    expect(
      normalizeBirthTime({
        civilDate: '2000-01-01',
        wallTime: null,
        timezoneId: 'Asia/Ho_Chi_Minh',
      }).status,
    ).toBe('missingTime')
  })
})
