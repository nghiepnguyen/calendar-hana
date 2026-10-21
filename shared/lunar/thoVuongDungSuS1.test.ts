import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/s1-tuwang/lock.json'
import { SOLAR_TERM_AUTHORITY } from '../astronomy/solarTerms'
import { getAlmanac } from './almanac'
import { TIME_ZONE_OFFSET } from './lunar'
import { solarTermsForYear } from './solarTerms'
import { isThoVuongDungSu, thoVuongDungSuPeriods } from './thoVuongDungSu'

// S1 final review (docs/audits/p4-vol10-remaining-operands-research.md). Real manifest, no mocks:
// production runs with 卷十 scoring and balancing on.
const DAY_MS = 86_400_000
const GOD = 'tho_vuong_dung_su'
const EARTH = [
  'groundbreaking',
  'construction',
  'renovation',
  'warehouse',
  'planting',
  'demolition',
]
const DE = ['thien_duc', 'nguyet_duc', 'thien_duc_hop', 'nguyet_duc_hop']
const days = Array.from({ length: 1095 }, (_, i) =>
  new Date(Date.parse('2025-01-01') + i * DAY_MS).toISOString().slice(0, 10),
)
const rows = (date: string, activityId: string) =>
  getAlmanac(date as never).activityRecommendations.find((r) => r.activityId === activityId)!
    .contributions
// Applied with its raw penalty; scoreDelta may be 0 once the per-activity bad-god cap is spent.
const hasGod = (date: string, id: string) =>
  rows(date, id).some(
    (r) => r.source === 'bad_god' && r.ruleId === GOD && r.status === 'applied' && r.rawDelta < 0,
  )
const hasKien = (date: string, id: string) =>
  rows(date, id).some((r) => r.source === 'truc' && r.ruleId === `kien:${id}`)

describe('S1 土王用事 final review', () => {
  it('pins the research witnesses and their quotes', () => {
    for (const f of lock.files) {
      const text = readFileSync(f.path, 'utf8')
      expect(createHash('sha256').update(text).digest('hex'), f.path).toBe(f.sha256)
      for (const q of f.quotes) expect(text, q).toContain(q)
    }
  })

  // S1-B: only the supported invariant (civil-day count), no instant ± ε golden.
  it('every authority year: four 18-civil-day periods ending the day before each 四立', () => {
    for (let year = SOLAR_TERM_AUTHORITY.firstYear; year <= SOLAR_TERM_AUTHORITY.lastYear; year++) {
      const periods = thoVuongDungSuPeriods(year)
      expect(periods.map((p) => p.termIndex)).toEqual([21, 3, 9, 15])
      for (const p of periods) {
        const li = Date.parse(p.li)
        expect(Date.parse(p.onset), `${year} ${p.li}`).toBe(li - 18 * DAY_MS)
        expect(Date.parse(p.eve), `${year} ${p.li}`).toBe(li - DAY_MS)
      }
    }
  })

  // S1-B2 open item: a fractional 土王策 (大統 ≈ 立 − 18.2621 d) names an earlier onset day than
  // civil(立) − 18 whenever 立 falls before 0.2621 day local time. Pins the count in the doc.
  it('counts 四立 where the two historical families disagree', () => {
    let all = 0
    let early = 0
    for (let year = SOLAR_TERM_AUTHORITY.firstYear; year <= SOLAR_TERM_AUTHORITY.lastYear; year++)
      for (const t of solarTermsForYear(year))
        if ([21, 3, 9, 15].includes(t.index)) {
          all++
          const local = Date.parse(t.instantUtc) + TIME_ZONE_OFFSET * 3_600_000
          if ((((local % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS < 0.2621) early++
        }
    expect([early, all]).toEqual([212, 812])
  })

  // S1-C1: 土府 (Trực Kiến alias) and 土王用事後 stay separate rows.
  it('土府 and 土王用事後 never alias', () => {
    const periodNotKien = days.find((d) => isThoVuongDungSu(d) && !hasKien(d, 'construction'))!
    const kienNotPeriod = days.find((d) => !isThoVuongDungSu(d) && hasKien(d, 'construction'))!
    const both = days.find((d) => isThoVuongDungSu(d) && hasKien(d, 'construction'))!
    expect(hasGod(periodNotKien, 'construction')).toBe(true)
    expect(hasGod(kienNotPeriod, 'construction')).toBe(false)
    expect([hasGod(both, 'construction'), hasKien(both, 'construction')]).toEqual([true, true])
  })

  // S1-C2: 卷十 「與徳合赦願併猶忌…以下並同」; no global 德 cancellation.
  it('德 on a period day leaves the 土王 row on all six activities', () => {
    const deDays = days.filter(
      (d) =>
        isThoVuongDungSu(d) && getAlmanac(d as never).auditedGodIds.some((id) => DE.includes(id)),
    )
    expect(deDays.length).toBe(40)
    for (const d of deDays) for (const id of EARTH) expect(hasGod(d, id), `${d} ${id}`).toBe(true)
  })
})
