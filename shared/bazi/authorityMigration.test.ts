/// <reference types="node" />
// Phase 3B.4.4B: Bazi reads Jie / Lập xuân boundaries from the canonical
// authority only; TST, day, hour and Zi conventions are untouched.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calculatePillars } from './pillars'
import { calculateTrueSolarTime } from './solarTime'
import { MONTH_OPENING_ANGLES, monthOpeningTerms, termContextAt } from './termInstants'

const rows = (
  JSON.parse(readFileSync('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', 'utf8'))
    .rows as string[]
).map((r) => {
  const f = r.split('|')
  return { year: +f[0]!, longitude: +f[1]! * 15, civil: +f[4]!, iso: f[5]! }
})
const jie = rows.filter((r) => r.longitude % 30 === 15)

describe('Bazi month / year context at every canonical Jie 1900–2100', () => {
  it('termInstants equal the authority table', () => {
    for (let year = 1899; year <= 2100; year++) {
      const opening = monthOpeningTerms(year)
      opening.forEach((term, i) => {
        const y = i === 11 ? year + 1 : year
        const row = jie.find((r) => r.year === y && r.longitude === MONTH_OPENING_ANGLES[i])!
        expect(term.instantUtc).toBe(row.iso)
      })
    }
  })

  it('T − 1 ms OLD, T NEW, T + 1 ms NEW for month offset, active term and Lập xuân year', () => {
    let checked = 0
    for (let i = 1; i < jie.length; i++) {
      const b = jie[i]!
      if (b.year < 1900 || b.year > 2100) continue
      const previous = jie[i - 1]!
      const offset = MONTH_OPENING_ANGLES.indexOf(b.longitude as 315)
      const prevOffset = MONTH_OPENING_ANGLES.indexOf(previous.longitude as 315)
      for (const [delta, term, monthOffset] of [
        [-1, previous, prevOffset],
        [0, b, offset],
        [1, b, offset],
      ] as const) {
        const instant = new Date(b.civil + delta).toISOString()
        const ctx = termContextAt(instant)
        expect(
          [ctx.activeTerm.longitude, ctx.activeTerm.instantUtc, ctx.monthOffset],
          instant,
        ).toEqual([term.longitude, term.iso, monthOffset])
        if (b.longitude === 315) expect(ctx.pillarYear).toBe(delta < 0 ? b.year - 1 : b.year)
        // Month pillar branch follows the same boundary; day/hour come from TST only.
        const pillars = calculatePillars(instant, '2000-01-01T12:00:00.000', 'splitZi').pillars
        expect(pillars.month.chi).toBe((monthOffset + 2) % 12)
        checked++
      }
    }
    expect(checked).toBe(2412 * 3)
  }, 120_000)
})

describe('unrelated Bazi outputs are unchanged by the migration', () => {
  const snapshot = JSON.parse(
    readFileSync(
      'tasks/calendar-audit/solar-term-migration-v3.4B/bazi-pre-migration-snapshot.json',
      'utf8',
    ),
  ) as {
    records: {
      instantUtc: string
      longitude: number
      latitude: number
      offsetMinutes: number
      policy: 'splitZi' | 'dayStartsAt23'
      tstDateTime: string
      equationOfTimeSeconds: number
      year: string
      month: string
      day: string
      hour: string
      zi: unknown
    }[]
  }
  it('TST, day pillar, hour pillar and Zi reproduce pre-migration production exactly', () => {
    expect(snapshot.records).toHaveLength(300)
    for (const r of snapshot.records) {
      const solar = calculateTrueSolarTime(r.instantUtc, r.longitude, r.offsetMinutes, r.latitude)
      expect(solar.engineVersion).toBe('astronomy-engine@2.1.19')
      expect([solar.tstDateTime, solar.equationOfTimeSeconds]).toEqual([
        r.tstDateTime,
        r.equationOfTimeSeconds,
      ])
      const { pillars, zi } = calculatePillars(r.instantUtc, solar.tstDateTime, r.policy)
      expect([pillars.day.name, pillars.hour.name, zi]).toEqual([r.day, r.hour, r.zi])
      // These instants lie outside every old/new boundary window (classified in
      // production-impact-v3.4B.json), so year and month pillars are unchanged too.
      expect([pillars.year.name, pillars.month.name]).toEqual([r.year, r.month])
    }
  })
})
