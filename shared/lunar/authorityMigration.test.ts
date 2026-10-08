/// <reference types="node" />
// Phase 3B.4.4B: every solar-term consumer against oracles built directly from
// the frozen golden-v4 authority rows (not from production code).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  purgeStaleSolarTermCaches,
  SOLAR_TERM_AUTHORITY,
  SOLAR_TERM_CACHE_NAMESPACE,
  solarTermCacheStore,
} from '../astronomy/solarTerms'
import { getAlmanac } from './almanac'
import { evaluateGroupAAtInstant } from './groupA'
import { evaluateGroupBAtInstant } from './groupB'
import { getDayInfo } from './index'
import { solarStringToJd } from './julian'
import { getOfficer, getOfficerAtInstant } from './officers'
import { getSolarMonth, getSolarTerm, getSolarTermAt, SOLAR_TERM_METHOD } from './solarTerms'

const DAY = 86_400_000
const zone = 'Asia/Ho_Chi_Minh'
const vnDate = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
const AUTHORITY = 'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json'
const rows = (JSON.parse(readFileSync(AUTHORITY, 'utf8')).rows as string[]).map((r) => {
  const f = r.split('|')
  return { year: +f[0]!, index: +f[1]!, longitude: +f[1]! * 15, civil: +f[4]!, iso: f[5]! }
})
const jie = rows.filter((r) => r.index % 2 === 1)
// Independent Month Jian: Lập xuân (315°) opens Dần (2), each later Jie the next branch.
const jianOf = (longitude: number) => (2 + ((longitude - 315 + 360) % 360) / 30) % 12
// Independent day branch from the Gregorian day count (1970-01-01 = 辰, index 4... via JDN).
const dayChiOf = (date: string) =>
  (Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY) + 2440588 + 1) % 12
const lastAtOrBefore = <T extends { civil: number }>(list: T[], t: number) => {
  let lo = 0
  let hi = list.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (list[mid]!.civil <= t) lo = mid
    else hi = mid
  }
  return list[lo]!
}
const days: string[] = []
for (let t = Date.UTC(1900, 0, 1); t < Date.UTC(2101, 0, 1); t += DAY)
  days.push(new Date(t).toISOString().slice(0, 10))

describe('solar-term consumers use the canonical authority', () => {
  it('reports the authority and clock identity', () => {
    expect(SOLAR_TERM_METHOD).toBe('jpl-de440s-table:astronomy-authority-v4:clock-v1')
    expect(evaluateGroupBAtInstant('2024-04-07T12:00:00+07:00', zone).astronomyMethod).toBe(
      SOLAR_TERM_METHOD,
    )
  })

  it('daily term label for every civil day 1900–2100 (whole day uses the term before next midnight)', () => {
    const byDate = new Map<string, number>()
    for (const r of rows) byDate.set(vnDate(r.civil), r.index)
    for (const date of days) {
      const nextMidnight = Date.parse(`${date}T00:00:00+07:00`) + DAY
      const active = lastAtOrBefore(rows, nextMidnight - 1)
      const label = getSolarTerm(solarStringToJd(date))
      expect([label.index, label.startsToday, label.startsAtUtc], date).toEqual([
        active.index,
        byDate.has(date),
        active.iso,
      ])
    }
  }, 120_000)

  it('daily Officer for every civil day 1900–2100 (crossing day uses the new month)', () => {
    for (const date of days) {
      const month = jianOf(
        lastAtOrBefore(jie, Date.parse(`${date}T00:00:00+07:00`) + DAY - 1).longitude,
      )
      const chi = dayChiOf(date)
      expect(getOfficer(solarStringToJd(date), chi).index, date).toBe((chi - month + 12) % 12)
    }
  }, 120_000)

  it('exact-instant Month Jian and Officer at every Jie: T − 1 ms OLD, T NEW, T + 1 ms NEW', () => {
    let checked = 0
    for (let i = 1; i < jie.length; i++) {
      const b = jie[i]!
      if (b.year < 1900 || b.year > 2100) continue
      const previous = jianOf(jie[i - 1]!.longitude)
      const current = jianOf(b.longitude)
      expect(current).toBe((previous + 1) % 12)
      for (const [delta, month] of [
        [-1, previous],
        [0, current],
        [1, current],
      ] as const) {
        const instant = new Date(b.civil + delta).toISOString()
        expect(getSolarMonth(instant, zone), instant).toBe(month)
        const chi = dayChiOf(vnDate(b.civil + delta))
        expect(getOfficerAtInstant(instant, zone).index, instant).toBe((chi - month + 12) % 12)
        checked++
      }
      expect(getSolarTermAt(new Date(b.civil).toISOString()).instantUtc).toBe(b.iso)
    }
    expect(checked).toBe(2412 * 3)
  }, 120_000)

  it('1946 Đại tuyết: reviewed daily Officer change, derived not hard-coded', () => {
    const daiTuyet = rows.find((r) => r.year === 1946 && r.longitude === 255)!
    expect(daiTuyet.iso).toBe('1946-12-07T17:00:11.131Z')
    expect(vnDate(daiTuyet.civil)).toBe('1946-12-08')
    const impact = JSON.parse(
      readFileSync(
        'tasks/calendar-audit/solar-term-migration-v3.4B/production-impact-v3.4B.json',
        'utf8',
      ),
    )
    expect(impact.days.dailyOfficer.EXPECTED_AUTHORITY_MIGRATION_CHANGE).toBe(1)
    expect(impact.days.dailyOfficer.examples[0]).toMatchObject({ date: '1946-12-07' })
    // Pre-migration roots put the crossing at 23:59:57 on 12-07 (Tý all day); now 12-07 is Hợi.
    const jd = solarStringToJd('1946-12-07')
    const chi = dayChiOf('1946-12-07')
    expect(getOfficer(jd, chi).index).toBe((chi - 11 + 12) % 12)
    expect(impact.days.dailyOfficer.examples[0].old).toBe((chi - 0 + 12) % 12)
    expect(getAlmanac('1946-12-07').officer.index).toBe((chi - 11 + 12) % 12)
    expect(getDayInfo('1946-12-08').solarTerm).toMatchObject({ index: 17, startsToday: true })
  })
})

describe('Group A against versioned authority-v4 evidence', () => {
  const evidence = JSON.parse(
    readFileSync(
      'tasks/calendar-audit/solar-term-migration-v3.4B/group-a-authority-v4-evidence.json',
      'utf8',
    ),
  )
  it('evidence is pinned to the frozen authority', () => {
    expect(evidence.authority.sha256).toBe(
      createHash('sha256').update(readFileSync(AUTHORITY)).digest('hex'),
    )
    expect(evidence.fourSeparations).toHaveLength(804)
    expect(evidence.fourExtinctions).toHaveLength(804)
  })

  it('Tứ Ly / Tứ Tuyệt / Nguyệt Kỵ for every civil day 1900–2100', () => {
    const separations = new Set(
      evidence.fourSeparations.map((r: { matchedDate: string }) => r.matchedDate),
    )
    const extinctions = new Set(
      evidence.fourExtinctions.map((r: { matchedDate: string }) => r.matchedDate),
    )
    for (const date of days) {
      const rules = evaluateGroupAAtInstant(`${date}T12:00:00+07:00`, zone).rules
      expect([rules[1]!.matched, rules[2]!.matched], date).toEqual([
        separations.has(date),
        extinctions.has(date),
      ])
    }
  }, 120_000)

  it('1938 Thu phân: Tứ Ly moves from 09-23 to 09-22 (EXPECTED_AUTHORITY_MIGRATION_CHANGE)', () => {
    expect(evidence.migrationChanges).toEqual([
      expect.objectContaining({
        rule: 'four-separations',
        term: '1938:180',
        preMigrationMatchedDate: '1938-09-23',
        authorityMatchedDate: '1938-09-22',
        classification: 'EXPECTED_AUTHORITY_MIGRATION_CHANGE',
      }),
    ])
    const tuLy = (date: string) =>
      evaluateGroupAAtInstant(`${date}T12:00:00+07:00`, zone).rules.find(
        (r) => r.id === 'four-separations',
      )!.matched
    expect([tuLy('1938-09-21'), tuLy('1938-09-22'), tuLy('1938-09-23')]).toEqual([
      false,
      true,
      false,
    ])
  })
})

describe('cache versioning', () => {
  it('namespace carries authority and clock versions', () => {
    expect(SOLAR_TERM_CACHE_NAMESPACE).toBe(
      `solar-terms/${SOLAR_TERM_AUTHORITY.authorityVersion}/${SOLAR_TERM_AUTHORITY.clockVersion}`,
    )
    expect(SOLAR_TERM_CACHE_NAMESPACE).toBe('solar-terms/astronomy-authority-v4/clock-v1')
  })

  it('stale-authority / stale-clock entries are never served and are purged', () => {
    const poison = { poisoned: true }
    const stale = [
      'astronomy-engine-search-sun-longitude-v1',
      'solar-terms/astronomy-authority-v3/clock-v1',
      'solar-terms/astronomy-authority-v4/clock-v0',
      'solar-terms/astronomy-engine-2.1.19/astronomy-engine-delta-t',
    ]
    const date = '1946-12-07'
    const almanacKey = (ns: string) => `${ns}|${getAlmanacKeySuffix(date)}`
    for (const ns of stale) {
      solarTermCacheStore('day-info').set(`${ns}|${date}`, poison)
      solarTermCacheStore('almanac').set(almanacKey(ns), poison)
      solarTermCacheStore('solar-terms-for-year').set(`${ns}|1946`, poison)
    }
    solarTermCacheStore('day-info').set(date, poison)
    expect(getDayInfo(date)).not.toBe(poison)
    expect(getAlmanac(date)).not.toBe(poison)
    expect(getDayInfo(date).solarTerm.index).toBe(16)
    expect(getAlmanac(date).officer).toBeDefined()
    expect(getSolarTermAt('1946-12-07T17:00:11.131Z').index).toBe(17)
    expect(purgeStaleSolarTermCaches()).toBe(stale.length * 3 + 1)
    for (const consumer of ['day-info', 'almanac', 'solar-terms-for-year'])
      for (const key of solarTermCacheStore(consumer).keys())
        expect(key.startsWith(`${SOLAR_TERM_CACHE_NAMESPACE}|`)).toBe(true)
  })
})

function getAlmanacKeySuffix(date: string) {
  const manifest = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8'))
  const engine = readFileSync('shared/lunar/evidence.ts', 'utf8').match(/'([^']+)'/)![1]
  return `${manifest.datasetVersion}:${engine}:${date}`
}
