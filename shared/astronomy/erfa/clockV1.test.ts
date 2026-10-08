import { readFileSync } from 'node:fs'
import { DeltaT_EspenakMeeus } from 'astronomy-engine'
import { describe, expect, it } from 'vitest'
import {
  CLOCK_POLICY_ID,
  CLOCK_V1_KNOWN_THROUGH_UTC_MS,
  ClockPolicyError,
  deltaTEspenakMeeusSeconds,
  erfaSolarTermAtCivil,
  erfaSolarTermsForYear,
  J2000_TT_CLOCK_EPOCH_MS,
  serializeBoundary,
  serializeEpochMs,
  ttToCivil,
} from './index'

const ttOfUtc = (iso: string, taiMinusUtc: number) =>
  Date.parse(iso) + 32184 + taiMinusUtc * 1000 - J2000_TT_CLOCK_EPOCH_MS

describe('clock-v1 policy', () => {
  it('reproduces the archived IERS leap-second history exactly', () => {
    const lines = readFileSync(
      'tasks/calendar-audit/erfa-foundation-v3.3/clock/iers-Leap_Second.dat',
      'utf8',
    )
      .split('\n')
      .filter((l) => /^\s+\d+\.0\s/.test(l))
      .map((l) => l.trim().split(/\s+/).map(Number))
    expect(lines).toHaveLength(28)
    for (const [, day, month, year, taiMinusUtc] of lines) {
      const start = new Date(Date.UTC(year!, month! - 1, day!)).toISOString()
      // First millisecond of the new offset maps exactly to the UTC start.
      expect(ttToCivil(ttOfUtc(start, taiMinusUtc!)).epochMs).toBe(Date.parse(start))
    }
  })

  it('rejects instants inside an inserted leap second (no silent mapping)', () => {
    // 2016-12-31T23:59:60.500 UTC: TT reading lies between the two offsets.
    const inside = ttOfUtc('2017-01-01T00:00:00.000Z', 36) + 500
    expect(() => ttToCivil(inside)).toThrow(ClockPolicyError)
    expect(() => ttToCivil(inside)).toThrow(/LEAP_SECOND_UNREPRESENTABLE/)
    expect(ttToCivil(ttOfUtc('2017-01-01T00:00:00.000Z', 36) - 1).epochMs).toBe(
      Date.parse('2016-12-31T23:59:59.999Z'),
    )
  })

  it('labels regimes and pins TAI − UTC = 37 s after the last known leap second', () => {
    expect(ttToCivil(ttOfUtc('1971-06-01T00:00:00Z', 10)).regime).toBe('PRE1972_MODELED_UT1')
    expect(ttToCivil(ttOfUtc('2024-02-04T08:27:07.554Z', 37)).regime).toBe('UTC_LEAP_HISTORY')
    const future = ttToCivil(ttOfUtc('2100-12-21T00:00:00.000Z', 37))
    expect(future.regime).toBe('PROJECTED_PINNED_TAI_UTC')
    expect(future.epochMs).toBe(Date.parse('2100-12-21T00:00:00.000Z'))
    expect(CLOCK_V1_KNOWN_THROUGH_UTC_MS).toBe(Date.parse('2027-06-28T00:00:00Z'))
    expect(ttToCivil(0).clockPolicy).toBe(CLOCK_POLICY_ID)
  })

  it('pre-1972 Delta-T equals the Astronomy Engine Espenak–Meeus polynomial', () => {
    for (let ut = -36600; ut < -10220; ut += 7.3)
      expect(deltaTEspenakMeeusSeconds(ut)).toBe(DeltaT_EspenakMeeus(ut))
    expect(() => deltaTEspenakMeeusSeconds(0)).toThrow(ClockPolicyError)
  })

  it('is monotone across the 1972 regime switch', () => {
    const switchTt = ttOfUtc('1972-01-01T00:00:00Z', 10)
    let previous = -Infinity
    for (let t = switchTt - 200; t <= switchTt + 200; t++) {
      const { epochMs } = ttToCivil(t)
      expect(epochMs).toBeGreaterThanOrEqual(previous)
      previous = epochMs
    }
  })

  it('serializes integer ms with exactly three fractional digits', () => {
    expect(serializeEpochMs(Date.parse('1900-01-06T02:03:04Z'))).toBe('1900-01-06T02:03:04.000Z')
    expect(serializeEpochMs(-2208988800000 + 7)).toBe('1900-01-01T00:00:00.007Z')
    expect(() => serializeEpochMs(1.5)).toThrow(RangeError)
  })
})

describe('civil serialization of all boundaries', { timeout: 120000 }, () => {
  const boundaries: ReturnType<typeof erfaSolarTermsForYear>[number][] = []
  const load = () => {
    if (!boundaries.length)
      for (let year = 1900; year <= 2100; year++) boundaries.push(...erfaSolarTermsForYear(year))
    return boundaries
  }

  it('serializes every 1900–2100 boundary; none falls in a leap second', () => {
    load()
    expect(boundaries).toHaveLength(4824)
    for (const b of boundaries) {
      const s = serializeBoundary(b)
      expect(Number.isInteger(s.civilEpochMs)).toBe(true)
      expect(s.civilIso).toMatch(/\.\d{3}Z$/)
    }
  })

  it('civil T - 1 ms is OLD, civil T and T + 1 ms are NEW', () => {
    load()
    for (let i = 1; i < boundaries.length; i++) {
      const civil = serializeBoundary(boundaries[i]!).civilEpochMs
      expect(erfaSolarTermAtCivil(civil - 1).id).toBe(boundaries[i - 1]!.id)
      expect(erfaSolarTermAtCivil(civil).id).toBe(boundaries[i]!.id)
      expect(erfaSolarTermAtCivil(civil + 1).id).toBe(boundaries[i]!.id)
    }
  }, 120000)
})
