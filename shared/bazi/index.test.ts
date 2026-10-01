import { describe, expect, it } from 'vitest'
import { calculateBazi } from './index'

const base = {
  birthDate: '2024-02-04',
  birthTime: '15:30',
  birthTimePrecision: 'exact' as const,
  birthTimeUncertaintyMinutes: 0,
  birthPlace: {
    countryCode: 'VN' as const,
    subdivisionCode: 'VN-SG',
    label: 'TP. Hồ Chí Minh',
    latitude: 10.76,
    longitude: 106.66,
    coordinateSource: 'bundledGazetteer' as const,
    coordinateAccuracyKm: 10,
  },
  birthTimezoneId: 'Asia/Ho_Chi_Minh' as const,
  birthTimezoneSource: 'bundledMapping' as const,
  birthConfirmedOffsetMinutes: null,
  birthZiPolicy: 'splitZi' as const,
}

describe('calculateBazi', () => {
  it('returns versioned four pillars when the profile is complete', () => {
    const result = calculateBazi(base)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.versions).toEqual({ rules: '1.1.0', astronomy: '2.1.19', tzdb: '2026d' })
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].pillars.year.name).toBe('Giáp Thìn')
    expect(result.candidates[0].pillars.month.name).toBe('Bính Dần')
  })

  it('keeps missing metadata explicit and returns multiple candidates for uncertainty boundaries', () => {
    expect(calculateBazi({ birthDate: '2024-02-04' })).toMatchObject({ status: 'insufficientData' })
    const uncertain = calculateBazi({
      ...base,
      birthTime: '15:27',
      birthTimePrecision: 'estimated',
      birthTimeUncertaintyMinutes: 5,
    })
    expect(uncertain.status).toBe('ambiguous')
    if (uncertain.status === 'ambiguous') expect(uncertain.candidates.length).toBeGreaterThan(1)
  })
})
