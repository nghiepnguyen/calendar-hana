import { describe, expect, it } from 'vitest'
import {
  CLOCK_POLICY_ID,
  CLOCK_V1_KNOWN_THROUGH_UTC_MS,
  ClockPolicyError,
  getCanonicalSolarTermsForYear,
  J2000_TT_CLOCK_EPOCH_MS,
  serializeEpochMs,
  ttToCivil,
} from './index'

const tt = (utcIso: string, taiMinusUtc: number) =>
  Date.parse(utcIso) + 32_184 + taiMinusUtc * 1000 - J2000_TT_CLOCK_EPOCH_MS

describe('clock-v1 production civil serialization', () => {
  it('is the ratified policy with a pinned post-2027 TAI − UTC of 37 s', () => {
    expect(CLOCK_POLICY_ID).toBe('clock-v1')
    expect(new Date(CLOCK_V1_KNOWN_THROUGH_UTC_MS).toISOString()).toBe('2027-06-28T00:00:00.000Z')
  })

  it('pre-1972: modeled UT1 (Espenak–Meeus Delta-T), labelled PRE1972_MODELED_UT1', () => {
    const b = getCanonicalSolarTermsForYear(1938).find((t) => t.termIndex === 12)!
    expect(b.clockRegime).toBe('PRE1972_MODELED_UT1')
    expect(b.civilIso).toBe('1938-09-23T16:59:27.175Z')
    // Delta-T ≈ 24 s in 1938; civil = TT − ΔT, not TT − 32.184 − 10 s.
    const ttClock = b.ttMs + J2000_TT_CLOCK_EPOCH_MS
    expect((ttClock - b.civilEpochMs) / 1000).toBeGreaterThan(23)
    expect((ttClock - b.civilEpochMs) / 1000).toBeLessThan(25)
  })

  it('1972 transition: first UTC ms maps exactly; regime switches at 1972-01-01', () => {
    const start = tt('1972-01-01T00:00:00.000Z', 10)
    expect(ttToCivil(start)).toMatchObject({
      regime: 'UTC_LEAP_HISTORY',
      epochMs: Date.UTC(1972, 0, 1),
    })
    expect(ttToCivil(start - 1).regime).toBe('PRE1972_MODELED_UT1')
    expect(ttToCivil(start - 1).epochMs).toBeLessThan(Date.UTC(1972, 0, 1) + 1000)
  })

  it('known leap-second eras use the IERS offset (1980, 1999, 2016)', () => {
    for (const [iso, offset] of [
      ['1980-06-01T00:00:00.000Z', 19],
      ['1999-06-01T00:00:00.000Z', 32],
      ['2016-06-01T00:00:00.000Z', 36],
      ['2026-10-08T12:00:00.000Z', 37],
    ] as const)
      expect(ttToCivil(tt(iso, offset))).toMatchObject({
        regime: 'UTC_LEAP_HISTORY',
        epochMs: Date.parse(iso),
      })
  })

  it('post-2027 and 2100: projected with TAI − UTC = 37 s, never Astronomy Engine Delta-T', () => {
    for (const iso of [
      '2027-06-28T00:00:00.000Z',
      '2050-01-01T00:00:00.000Z',
      '2100-12-31T23:59:59.999Z',
    ])
      expect(ttToCivil(tt(iso, 37))).toMatchObject({
        regime: 'PROJECTED_PINNED_TAI_UTC',
        epochMs: Date.parse(iso),
      })
    const last = getCanonicalSolarTermsForYear(2100).at(-1)!
    expect(last.clockRegime).toBe('PROJECTED_PINNED_TAI_UTC')
    expect(last.civilEpochMs).toBe(last.ttMs + J2000_TT_CLOCK_EPOCH_MS - 32_184 - 37_000)
  })

  it('an instant inside an inserted leap second fails explicitly', () => {
    const inside = tt('2017-01-01T00:00:00.000Z', 36) + 500
    expect(() => ttToCivil(inside)).toThrow(ClockPolicyError)
    expect(() => ttToCivil(inside)).toThrow('LEAP_SECOND_UNREPRESENTABLE')
    expect(() => ttToCivil(1.5)).toThrow(RangeError)
    expect(serializeEpochMs(0)).toBe('1970-01-01T00:00:00.000Z')
  })
})
