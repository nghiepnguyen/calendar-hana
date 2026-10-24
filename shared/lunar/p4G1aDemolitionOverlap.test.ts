import { readFileSync, writeFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { solarTermCacheStore } from '../astronomy/solarTerms/cache'
import { getP4DayHeadings } from './p4AlmanacHeadings'
import type { ActivityRecommendation } from './activityRecommendations'
import { getAlmanac } from './almanac'
import {
  p4ActivityState,
  setP4HeadingsProvider,
  type P4DayOperands,
  type P4HeadingInput,
  type P4ScoreHeadingLookup,
} from './p4ScoreAdapter'
import { thoVuongDungSuPeriods } from './thoVuongDungSu'

// Audit only: G1-a overlap dates (docs/audits/p4-g1a-demolition-authority.md). Production policy is never
// changed: the manifest is mocked per call, as in p4ScoreHeadingLookup.test.ts. Covers the five G1-b §8
// overlap days and every 2025–2027 day in the four witness-conflict contexts.
// npm test: compare with overlap.json; G1A_WRITE=1 rewrites it.
const policy = vi.hoisted(() => ({ lookup: 'source-key-v1' }))
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return {
    default: {
      ...real,
      policies: {
        ...real.policies,
        get p4ScoreHeadingLookup() {
          return policy.lookup
        },
      },
    },
  }
})

const DIR = 'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1'
const OVERLAP = ['2025-02-02', '2026-01-28', '2027-01-23', '2026-08-02', '2027-07-28']
const CONFLICTS = ['丑-甲寅', '丑-丙寅', '丑-壬寅', '未-戊申']
// p4-soil-owner-convention-v1 headings: canonical demolition should join them, not stand alone.
const SOIL_HEADINGS = ['營建宮室', '修宮室', '興造動土', '修倉庫', '破屋壊垣', '栽種']
const SIBLING_ACTIVITIES = ['groundbreaking', 'construction', 'renovation', 'warehouse', 'planting']
const ST = '甲乙丙丁戊己庚辛壬癸'
const BR = '子丑寅卯辰巳午未申酉戌亥'
const DAY_MS = 864e5

let seen: { day: P4DayOperands; headings: Record<string, P4HeadingInput> } | null = null
const spy = (date: string, day: P4DayOperands) => {
  const headings = getP4DayHeadings(date, day)
  seen = { day, headings }
  return headings
}

const recs = (date: string, lookup: P4ScoreHeadingLookup) => {
  policy.lookup = lookup
  solarTermCacheStore('almanac').clear() // the getAlmanac memo key has no policy component
  return getAlmanac(date as never).activityRecommendations
}
const penalty = (r: ActivityRecommendation, ruleId: string) => {
  const c = r.contributions.find((x) => x.ruleId === ruleId)
  return c ? `${c.status}:${c.scoreDelta}` : null
}
// Score-level comparison: does canonical demolition join the soil-convention siblings?
const summary = (r: ActivityRecommendation) => ({
  score: r.score,
  status: r.status,
  kiepSat: penalty(r, 'kiep_sat'),
  thoVuongDungSu: penalty(r, 'tho_vuong_dung_su'),
})
const demolition = (date: string, lookup: P4ScoreHeadingLookup) => {
  const r = recs(date, lookup).find((x) => x.activityId === 'demolition')!
  return {
    score: r.score,
    status: r.status,
    hardWarning: r.hardWarning,
    sourceRefs: r.sourceRefs,
    contributions: r.contributions.map((c) => JSON.stringify(c)),
  }
}

function soilWindow(date: string) {
  const p = thoVuongDungSuPeriods(Number(date.slice(0, 4))).find(
    (w) => date >= w.onset && date <= w.eve,
  )
  if (!p) return { inWindow: false }
  const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY_MS
  return {
    inWindow: true,
    li: p.li,
    daysAfterOnset: days(p.onset, date),
    daysBeforeEve: days(date, p.eve),
  }
}

function row(date: string) {
  setP4HeadingsProvider(spy)
  const a = demolition(date, 'source-key-v1')
  const { day, headings } = seen!
  const b = demolition(date, 'canonical-v1')
  const ctx = `${BR[day.monthJianBranch]}-${ST[day.dayStem]}${BR[day.dayBranch]}`
  return {
    date,
    context: ctx,
    lunarDay: day.lunarDay,
    soil: soilWindow(date),
    p4: Object.fromEntries(SOIL_HEADINGS.map((h) => [h, headings[h] ?? null])),
    activityState: {
      sourceKey: p4ActivityState('demolition', headings, 'source-key-v1'),
      canonical: p4ActivityState('demolition', headings, 'canonical-v1'),
    },
    sourceKey: { ...a, contributions: undefined, contributionCount: a.contributions.length },
    canonical: { ...b, contributions: undefined, contributionCount: b.contributions.length },
    contributionsAdded: b.contributions.filter((c) => !a.contributions.includes(c)),
    contributionsRemoved: a.contributions.filter((c) => !b.contributions.includes(c)),
    differs: JSON.stringify(a) !== JSON.stringify(b),
    canonicalSummary: summary(
      recs(date, 'canonical-v1').find((x) => x.activityId === 'demolition')!,
    ),
    soilSiblings: Object.fromEntries(
      recs(date, 'source-key-v1')
        .filter((x) => SIBLING_ACTIVITIES.includes(x.activityId))
        .map((x) => [x.activityId, summary(x)]),
    ),
  }
}

afterEach(() => {
  policy.lookup = 'source-key-v1'
  setP4HeadingsProvider(getP4DayHeadings)
  solarTermCacheStore('almanac').clear()
})

describe('G1-a overlap dates (isolated simulator)', () => {
  it(
    'computes source-key-v1 and canonical-v1 for the overlap and conflict-context days',
    { timeout: 300_000 },
    () => {
      const overlap = OVERLAP.map(row)
      const inContexts: ReturnType<typeof row>[] = []
      for (let t = Date.UTC(2025, 0, 1); t <= Date.UTC(2027, 11, 31); t += DAY_MS) {
        const date = new Date(t).toISOString().slice(0, 10)
        setP4HeadingsProvider(spy)
        policy.lookup = 'source-key-v1'
        solarTermCacheStore('almanac').clear()
        getAlmanac(date as never)
        const d = seen!.day
        if (CONFLICTS.includes(`${BR[d.monthJianBranch]}-${ST[d.dayStem]}${BR[d.dayBranch]}`))
          inContexts.push(row(date))
      }
      const out = { overlap, conflictContextDays2025to2027: inContexts }
      if (process.env.G1A_WRITE)
        writeFileSync(`${DIR}/overlap.json`, JSON.stringify(out, null, 1) + '\n')
      expect(out).toEqual(JSON.parse(readFileSync(`${DIR}/overlap.json`, 'utf8')))
      expect(overlap.map((r) => r.context)).toEqual([
        '丑-壬寅',
        '丑-壬寅',
        '丑-壬寅',
        '未-戊申',
        '未-戊申',
      ])
    },
  )
})
