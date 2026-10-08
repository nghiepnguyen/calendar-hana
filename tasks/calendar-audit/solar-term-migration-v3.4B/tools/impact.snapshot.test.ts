/// <reference types="node" />
// Production snapshot for pre/post migration impact. Copied temporarily to
// shared/__impact__.snapshot.test.ts in a tree (pre-migration worktree or the
// migrated tree), run with IMPACT_OUTPUT=<file>, then removed. Uses only APIs
// present in both trees, so the same harness measures both.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { getAlmanac } from './lunar/almanac'
import { evaluateGroupAAtInstant } from './lunar/groupA'
import { evaluateGroupBAtInstant } from './lunar/groupB'
import { getDayInfo } from './lunar/index'
import { getOfficerAtInstant } from './lunar/officers'
import { solarTermsForYear } from './lunar/solarTerms'
import { calculatePillars } from './bazi/pillars'
import { calculateTrueSolarTime } from './bazi/solarTime'
import { termContextAt } from './bazi/termInstants'

const h = (v: unknown) => createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 16)

test('impact snapshot', () => {
  const out = process.env['IMPACT_OUTPUT']
  expect(out).toBeTruthy()
  const terms: Record<string, string> = {}
  for (let year = 1900; year <= 2100; year++)
    for (const t of solarTermsForYear(year)) terms[`${year}:${t.longitude}`] = t.instantUtc

  const days: Record<string, unknown> = {}
  for (let t = Date.UTC(1900, 0, 1); t < Date.UTC(2101, 0, 1); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10)
    const info = getDayInfo(date)
    const almanac = getAlmanac(date)
    const noon = `${date}T12:00:00+07:00`
    const a = evaluateGroupAAtInstant(noon, 'Asia/Ho_Chi_Minh')
    const b = evaluateGroupBAtInstant(noon, 'Asia/Ho_Chi_Minh')
    days[date] = {
      term: [info.solarTerm.index, info.solarTerm.startsToday, info.solarTerm.startsAtUtc],
      officer: almanac.officer.index,
      groupA: a.rules.map((r) => r.matched),
      groupB: [b.context.monthJian, ...b.rules.map((r) => r.matched)],
      almanac: h({ ...almanac, solarTerm: undefined }),
      almanacOfficerIndependent: h({
        ...almanac,
        solarTerm: undefined,
        officer: undefined,
        activityRecommendations: undefined,
        stars: undefined,
      }),
    }
  }

  // Bazi: deterministic pseudo-random instants plus samples at each Jie (±2 min).
  let seed = 20261008
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const instants: string[] = []
  for (let i = 0; i < 3000; i++) {
    const t = Date.UTC(1900, 1, 1) + Math.floor(rand() * (Date.UTC(2100, 10, 1) - Date.UTC(1900, 1, 1)))
    instants.push(new Date(t).toISOString())
  }
  // Union of old and new Jie civil ms (IMPACT_JIE_MS), so both trees see identical inputs.
  const jieMs: number[] = process.env['IMPACT_JIE_MS']
    ? JSON.parse(readFileSync(process.env['IMPACT_JIE_MS'], 'utf8'))
    : []
  for (const t of jieMs)
    for (const d of [-120_000, -1, 0, 1, 120_000]) instants.push(new Date(t + d).toISOString())
  const bazi: Record<string, unknown> = {}
  const places = [
    [105.85, 21.03, 420],
    [106.7, 10.78, 420],
    [100.5, 13.75, 420],
  ] as const
  instants.forEach((instant, i) => {
    const [lon, lat, offset] = places[i % 3]!
    const solar = calculateTrueSolarTime(instant, lon, offset, lat)
    const policy = i % 2 ? 'splitZi' : 'dayStartsAt23'
    const p = calculatePillars(instant, solar.tstDateTime, policy)
    const ctx = termContextAt(instant)
    bazi[instant] = {
      tst: solar.tstDateTime,
      eot: solar.equationOfTimeSeconds,
      year: p.pillars.year.name,
      month: p.pillars.month.name,
      day: p.pillars.day.name,
      hour: p.pillars.hour.name,
      zi: p.zi,
      term: [ctx.activeTerm.longitude, ctx.activeTerm.instantUtc, ctx.monthOffset, ctx.pillarYear],
    }
  })
  const officerAtJie: Record<string, unknown> = {}
  for (const t of jieMs) {
    officerAtJie[t] = [-1, 0, 1].map(
      (d) => getOfficerAtInstant(new Date(t + d).toISOString(), 'Asia/Ho_Chi_Minh').index,
    )
  }
  writeFileSync(out!, JSON.stringify({ terms, days, bazi, officerAtJie }))
}, 900_000)
