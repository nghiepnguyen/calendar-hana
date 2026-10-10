import { describe, expect, it } from 'vitest'
import { evaluateEventDay } from './eventEvaluation'
import { getAlmanac } from './almanac'
import { addDays } from './julian'
import { findNextGoodEventDate } from './eventRecommendations'
import { EVENT_OPTIONS, getEventProfile } from './eventMapping'

describe('event classification guardrails', () => {
  it('requires an actual hour for receiving a vehicle', () => {
    const result = evaluateEventDay('2026-10-05', 'receive_vehicle')
    expect(result.classification).toBe('insufficient_evidence')
    expect(result.score).toBeNull()
    expect(result.mustHave).toContainEqual(
      expect.objectContaining({ id: 'good_hour', status: 'unknown' }),
    )
  })
  it('fails must-have for a bad chosen hour even when gods are favorable', () => {
    const day = getAlmanac('2026-10-05')
    const hour = day.hours.find((hour) => !hour.isGood)!.startHour
    const result = evaluateEventDay('2026-10-05', 'receive_vehicle', { hour })
    expect(result.classification).toBe('not_recommended')
  })
  it('does not infer an event-fit pass from supporting activities', () => {
    // Scan real dates for events whose primary activity has no evidence while a supporting one
    // is recommended, e.g. Chuyển nhà on a Trừ day (掃舍宇 suits 除日; 般移 does not mention it).
    // very_high events stay insufficient; lighter ones are neutral but never recommended.
    const found = new Set<string>()
    let candidate = '2026-10-01'
    for (let i = 0; i < 366 && found.size < 2; i++, candidate = addDays(candidate, 1)) {
      const rows = getAlmanac(candidate).activityRecommendations
      const status = (id: string) => rows.find((row) => row.activityId === id)?.status
      for (const [eventId] of EVENT_OPTIONS) {
        const profile = getEventProfile(eventId)!
        const primary = profile.activities.find((item) => item.role === 'primary')!
        const supporting = profile.activities.filter((item) => item.role === 'supporting')
        if (
          status(primary.activityId) !== 'no_evidence' ||
          !supporting.some((item) => status(item.activityId) === 'recommended')
        )
          continue
        const result = evaluateEventDay(candidate, eventId, { hour: 9 })
        expect(result.classification, `${candidate} ${eventId}`).not.toBe('recommended')
        if (profile.severity === 'very_high')
          expect(result.classification, `${candidate} ${eventId}`).toBe('insufficient_evidence')
        found.add(profile.severity === 'very_high' ? 'very_high' : 'lighter')
      }
    }
    expect([...found].sort()).toEqual(['lighter', 'very_high'])
  })
  it('rejects invalid calendar dates before invoking lunar calculations', () => {
    expect(evaluateEventDay('2026-02-30', 'wedding').classification).toBe('not_recommended')
  })
  it('keeps conditional travel out of receiving-vehicle evidence unless explicitly selected', () => {
    const result = evaluateEventDay('2026-10-05', 'receive_vehicle')
    expect(
      result.contributions.some(
        (row) => row.activityId === 'travel' || row.activityId === 'water_travel',
      ),
    ).toBe(false)
  })
  it('records source caps, multipliers and dataset versions in the audit', () => {
    const result = evaluateEventDay('2026-10-05', 'open_business')
    expect(result.datasetVersion).toBe('1.2.1')
    expect(
      result.contributions.every((row) => !!row.ruleId && !!row.sourceRef && !!row.scope),
    ).toBe(true)
    expect(result.contributions.some((row) => row.activityId === 'business')).toBe(false)
    expect(
      result.contributions
        .filter((row) => row.activityId === 'finance')
        .every((row) => row.multiplier === 0.3),
    ).toBe(true)
    expect(
      result.contributions
        .filter((row) => row.source === 'mansion')
        .every((row) => row.appliedDelta === 0),
    ).toBe(true)
  })
  it('returns no next suitable date when a required hour is missing', () => {
    expect(findNextGoodEventDate('2026-10-05', 'receive_vehicle')).toBeNull()
  })
  it('uses the same evaluation for every suggested date', () => {
    const next = findNextGoodEventDate('2026-10-05', 'open_business')
    if (next) expect(evaluateEventDay(next, 'open_business').classification).toBe('recommended')
  })
  it('keeps events up to high severity neutral without taboos, but not very_high ones', () => {
    // 18/09/2026: no rule applies to haircuts, contracts or buying property.
    const haircut = evaluateEventDay('2026-09-18', 'cut_hair')
    expect(haircut).toMatchObject({ classification: 'caution', score: 50, neutralByPolicy: true })
    const contract = evaluateEventDay('2026-09-18', 'sign_contract')
    expect(contract).toMatchObject({ classification: 'caution', score: 50, neutralByPolicy: true })
    const property = evaluateEventDay('2026-09-18', 'buy_property')
    expect(property).toMatchObject({
      classification: 'insufficient_evidence',
      neutralByPolicy: false,
    })
  })
  it('names the actual hard warning instead of always blaming Nguyệt Phá', () => {
    let date = '2026-01-01'
    for (let i = 0; i < 60; i++, date = addDays(date, 1)) {
      const result = evaluateEventDay(date, 'cut_hair')
      if (result.contributions.some((row) => row.ruleId === 'dinh_nhat')) {
        expect(result.warnings.join(' ')).toContain('Ngày Đinh (Bách Kỵ)')
        expect(result.classification).not.toBe('recommended')
        return
      }
    }
    throw new Error('Expected a Đinh day within 60 days')
  })
})
