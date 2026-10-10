import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { XIEJI_AUTHORITY_ID } from './activityRecommendations'
import { getSourceLockedCatHungPresence, getSourceLockedCatHungStars } from './catHungStars'
import { evaluateEventDay } from './eventEvaluation'
import type { SolarDateString } from '../types'
import { LEGACY_LUNAR_GOD_IDS } from './xiejiGodPresence'

// Mappings the interpretation review left for the owner (xieji-activity-mapping-review.json).
const PENDING = new Set<string>()
const LOCKED_OR_DAY_RULE = new Set([
  'thien_duc',
  'thien_duc_hop',
  'nguyet_duc',
  'nguyet_duc_hop',
  'nguyet_pha',
  'kiep_sat',
  'tru_than',
  'dinh_nhat',
  'giap_nhat',
  'at_nhat',
  'bach_ky_dan',
  'bach_ky_dau',
  'bach_ky_than',
  'bach_ky_mui',
  'bach_ky_ty',
  'bach_ky_hoi',
  'nhan_than_toc',
  'tho_vuong_dung_su',
  // 14 legacy gods read on Month Jian (policy legacyGodsMonthJian).
  ...LEGACY_LUNAR_GOD_IDS,
])
const days = (year: number) =>
  Array.from({ length: 365 }, (_, i) => {
    const d = new Date(Date.UTC(year, 0, 1 + i))
    return d.toISOString().slice(0, 10) as SolarDateString
  })

describe('Trực and locked gods enter evidence diagnostics without score changes', () => {
  it('restates exactly the source-locked Cát/Hung presence with explicit operands', () => {
    for (let month = 0; month < 12; month++)
      for (let can = 0; can < 10; can++)
        for (let chi = 0; chi < 12; chi++) {
          const stars = getSourceLockedCatHungStars(month, can, chi)
          const presence = getSourceLockedCatHungPresence(month, can, chi)
          expect(presence.map((p) => p.name).sort()).toEqual(
            [...stars.good, ...stars.bad].map((s) => s.name).sort(),
          )
          for (const p of presence) {
            expect(p.conditions[0]).toEqual({ operand: 'MONTH_JIAN_BRANCH', equals: month })
            expect([
              { operand: 'DAY_STEM', equals: can },
              { operand: 'DAY_BRANCH', equals: chi },
            ]).toContainEqual(p.conditions[1])
          }
        }
  })

  it('attaches authority, mapping and applicable operands only to audited sources', () => {
    let truc = 0
    let gods = 0
    for (const date of days(2026)) {
      const a = getAlmanac(date)
      for (const row of a.activityRecommendations.flatMap((r) => r.contributions)) {
        if (row.source === 'mansion') continue
        // Added 卷十 penalties have their own deciding source, not a 卷十一 mapping.
        if (row.ruleId.startsWith('xieji10:')) {
          expect(row.classical).toMatchObject({
            version: 'xieji-vol10-scoring-v1',
            verdict: 'avoid',
          })
          expect(row.classical!.quote.length).toBeGreaterThan(0)
          expect(row.scoreDelta).toBeLessThanOrEqual(0)
          expect(row.activityMapping).toBeUndefined()
          continue
        }
        const audited =
          (row.source === 'truc' && row.status !== 'no_evidence') ||
          ((row.source === 'good_god' || row.source === 'bad_god') &&
            LOCKED_OR_DAY_RULE.has(row.ruleId))
        if (!audited) {
          expect(row.activityMapping, `${date} ${row.ruleId}`).toBeUndefined()
          continue
        }
        expect(row.activityMapping).toMatchObject({
          version: 'xieji-activity-mapping-v1',
          authorityId: XIEJI_AUTHORITY_ID,
          reviewStatus: PENDING.has(row.activityId)
            ? 'interpretation_pending'
            : 'interpretation_reviewed',
          activityId: row.activityId,
        })
        expect(row.exceptions).toEqual([])
        expect(row.conditions!.length).toBeGreaterThan(0)
        for (const c of row.conditions!) expect(a.selectionContext[c.operand]).toBe(c.equals)
        if (row.source === 'truc') {
          expect(row.conditions).toEqual([{ operand: 'OFFICER_INDEX', equals: a.officer.index }])
          truc++
        } else gods++
      }
    }
    expect(truc).toBeGreaterThan(0)
    expect(gods).toBeGreaterThan(0)
  }, 60000)

  it('reports opposing Trực/god witnesses for an event without choosing a winner', () => {
    let within = 0
    for (const date of days(2026)) {
      const result = evaluateEventDay(date, 'wedding', { hour: 9 })
      for (const c of result.conflictAnalysis.conflicts)
        if (c.authorityIds.includes(XIEJI_AUTHORITY_ID)) {
          // Wedding 嫁娶 is a reviewed mapping; mansion rows never share this authority.
          expect(c.reviewPending).toBe(false)
          expect(c.witnesses.some((w) => w.polarity === 'positive')).toBe(true)
          expect(c.witnesses.some((w) => w.polarity === 'negative')).toBe(true)
          within++
        }
      // Only audited presences enter as asserted witnesses (the 14 legacy gods now on Month Jian).
      for (const c of result.conflictAnalysis.conflicts)
        for (const w of c.witnesses)
          expect(w.ruleId.includes(':') || LOCKED_OR_DAY_RULE.has(w.ruleId)).toBe(true)
    }
    expect(within).toBeGreaterThan(0)
  }, 60000)
})
