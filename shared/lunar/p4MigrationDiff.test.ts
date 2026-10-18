import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import type { ActivityInput, ActivityRecommendation } from './activityRecommendations'
import { EVENT_OPTIONS, resolveEventActivities } from './eventMapping'
import {
  BASELINE_DATES,
  baselineLines,
  EVENT_HOURS,
  eventOutput,
  OUTSIDE_P4_DOMAIN,
  P4_DOMAIN_DATES,
  recSha,
} from './p4AdapterBaselineRows'
import {
  activityViolations,
  classifyActivityRow,
  eventViolations,
  type ActivityDiffRow,
  type MigrationClass,
} from './p4MigrationRules'
import { P4_DOMAIN, P4_DORMANT_GODS, p4ActivityState } from './p4ScoreAdapter'

// Roadmap 9 harness (tasks/prd-p4-migration-diff.md §2, FR-02; owner §6.10). Test-only: no runtime
// change. Each configuration is its own module graph (vi.resetModules), because the almanac memo key
// has no flag. `baseline` is the real manifest (OFF) without the provider, i.e. baseline v1; every
// other configuration runs the almanac with the manifest mocked ON and the provider loaded, and
// rewrites the activity input per configuration before calling the real scorer.
// npm test: every 10th P4 date + the 3 outside dates; ci:p4 (P4_MIGRATION_FULL=1): all 1098.
const FULL = process.env.P4_MIGRATION_FULL === '1'
const DATES = [...P4_DOMAIN_DATES.filter((_, i) => FULL || i % 10 === 0), ...OUTSIDE_P4_DOMAIN]
const HEADINGS = xieji.activityEntries as Record<string, string[] | undefined>
const RESOLVED = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']

type Config = 'baseline' | 'presence' | 'balancing' | 'full' | 'stars' | 'chainSwap'
type EventOut = ReturnType<typeof eventOutput>
interface Day {
  recs: ActivityRecommendation[]
  /** Activity input as the ON almanac built it, before the configuration rewrite. */
  input?: ActivityInput
  events: Map<string, EventOut>
}

const stripDormant = (i: ActivityInput): ActivityInput => ({
  ...i,
  presentGoodGods: i.presentGoodGods?.filter((g) => !P4_DORMANT_GODS.has(g)),
  presentBadGods: i.presentBadGods?.filter((g) => !P4_DORMANT_GODS.has(g)),
  godPresence: Object.fromEntries(
    Object.entries(i.godPresence ?? {}).filter(([g]) => !P4_DORMANT_GODS.has(g)),
  ),
})
/** §2: presence-only (owner §6.10.1 a), balancing-only, full, and the stars-only / chain-swap aids. */
function rewrite(config: Config, i: ActivityInput): ActivityInput {
  if (config === 'presence')
    return { ...i, xiejiVol10BalancingEnabled: false, p4Headings: undefined }
  if (config === 'balancing') return stripDormant(i)
  if (config === 'stars') return { ...i, p4Headings: i.p4Headings && {} }
  if (config === 'chainSwap')
    return {
      ...stripDormant(i),
      p4Headings:
        i.p4Headings &&
        Object.fromEntries(
          Object.entries(i.p4Headings).map(([h, v]) => [
            h,
            RESOLVED.includes(v.state)
              ? { state: 'both_present', ...(v.prot && { prot: v.prot }) }
              : v,
          ]),
        ),
    }
  return i
}

const runs = new Map<Config, Promise<Map<string, Day>>>()
let queue: Promise<unknown> = Promise.resolve()
/** One configuration over DATES, memoized; graphs are built one at a time (module mocks are global). */
function run(config: Config) {
  if (!runs.has(config)) {
    const next = queue.then(() => compute(config))
    queue = next.catch(() => undefined)
    runs.set(config, next)
  }
  return runs.get(config)!
}
async function compute(config: Config) {
  vi.resetModules()
  vi.doUnmock('../almanac-data/manifest.json')
  vi.doUnmock('./activityRecommendations')
  const captured: { input?: ActivityInput } = {}
  if (config !== 'baseline') {
    vi.doMock('../almanac-data/manifest.json', async (load) => {
      const real = ((await load()) as { default: { policies: object } }).default
      return {
        default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: true } },
      }
    })
    vi.doMock('./activityRecommendations', async (load) => {
      const real = (await load()) as typeof import('./activityRecommendations')
      return {
        ...real,
        getActivityRecommendations: (i: ActivityInput) => {
          captured.input = i
          return real.getActivityRecommendations(rewrite(config, i))
        },
      }
    })
    await import('./p4AlmanacHeadings')
  }
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const out = new Map<string, Day>()
  for (const date of DATES) {
    captured.input = undefined
    const recs = getAlmanac(date as never).activityRecommendations
    const day: Day = { recs, input: captured.input, events: new Map() }
    for (const [id] of EVENT_OPTIONS)
      for (const hour of EVENT_HOURS)
        day.events.set(`${id}|${hour ?? ''}`, eventOutput(evaluateEventDay, date, id, hour))
    out.set(date, day)
  }
  return out
}

const tsv = (path: string) => {
  const [head, ...rows] = readFileSync(path, 'utf8').trimEnd().split('\n')
  const keys = head!.split('\t')
  return rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [keys[i]!, v])))
}
const GOLDEN = 'docs/audits/sources/p4-vol10/'
const goldenDormant = new Map(
  tsv(GOLDEN + 'p4-full-golden-v2/presence/dated.tsv').map((r) => [
    r.date!,
    new Set(r.dormant!.split(' ').filter(Boolean)),
  ]),
)
const goldenState = new Map(
  tsv(GOLDEN + 'p4-score-golden-v1/activity-states.tsv').map((r) => [
    `${r.date}|${r.activity}`,
    r.state!,
  ]),
)
const inDomain = (date: string) => date >= P4_DOMAIN[0] && date <= P4_DOMAIN[1]

/** Rows of a configuration against baseline, in the shape the frozen rules read. */
async function diffRows(config: Config) {
  const [base, cfg, balancing] = await Promise.all([
    run('baseline'),
    run(config),
    config === 'full' ? run('balancing') : undefined,
  ])
  const rows: ActivityDiffRow[] = []
  for (const date of DATES) {
    const day = cfg.get(date)!
    const headings = day.input?.p4Headings ?? {}
    day.recs.forEach((full, k) => {
      const hs = HEADINGS[full.activityId] ?? []
      rows.push({
        date,
        inDomain: inDomain(date),
        state: p4ActivityState(full.activityId, headings).state,
        headingStates: hs.map((h) => headings[h]?.state ?? 'missing'),
        prot: new Set(hs.flatMap((h) => headings[h]?.prot ?? [])),
        base: base.get(date)!.recs[k]!,
        full,
        ...(balancing && { balancing: balancing.get(date)!.recs[k]! }),
        ...(inDomain(date) && {
          goldenDormant: goldenDormant.get(date),
          goldenState: goldenState.get(`${date}|${full.activityId}`),
        }),
      })
    })
  }
  return rows
}
const conclusion = (a: ActivityRecommendation, b: ActivityRecommendation) =>
  a.score !== b.score || a.status !== b.status || a.hardWarning !== b.hardWarning

describe(`roadmap 9 migration diff harness (${FULL ? 'all' : 'sampled'} dates)`, () => {
  it('baseline = baseline v1 sha256 on every activity and event row', async () => {
    const base = await run('baseline')
    const acts = baselineLines('activities.tsv')
    const events = baselineLines('events.tsv')
    const diff: string[] = []
    for (const [date, day] of base) {
      for (const r of day.recs)
        if (acts.get(`${date}|${r.activityId}`)?.split('\t')[5] !== recSha(r))
          diff.push(`${date} ${r.activityId}`)
      for (const [key, e] of day.events)
        if (events.get(`${date}|${key}`)?.split('\t')[5] !== recSha(e)) diff.push(`${date} ${key}`)
    }
    expect(diff.slice(0, 10).join('\n')).toBe('')
    expect(base.size).toBe(DATES.length)
    expect(DATES.every((d) => BASELINE_DATES.includes(d))).toBe(true)
  }, 1_800_000)

  it('full: 0 UNEXPECTED_REGRESSION over activities (invariants 1–9, 11, 12) and events (10)', async () => {
    const rows = await diffRows('full')
    const violations = rows.flatMap((r) =>
      activityViolations(r).map((v) => `${r.date} ${r.full.activityId} ${v}`),
    )
    const changed = new Map<string, Set<string>>()
    const classes = new Map<MigrationClass, number>()
    for (const r of rows) {
      const c = classifyActivityRow(r)
      if (c.changed) {
        if (!changed.has(r.date)) changed.set(r.date, new Set())
        changed.get(r.date)!.add(r.full.activityId)
      }
      for (const x of c.classes) classes.set(x, (classes.get(x) ?? 0) + 1)
    }
    const [base, full] = await Promise.all([run('baseline'), run('full')])
    for (const date of DATES)
      for (const [key, e] of full.get(date)!.events) {
        const b = base.get(date)!.events.get(key)!
        const id = key.split('|')[0]!
        for (const v of eventViolations({
          changed: b.score !== e.score || b.classification !== e.classification,
          profileActivities: resolveEventActivities(id),
          changedActivities: changed.get(date) ?? new Set(),
        }))
          violations.push(`${date} ${key} ${v}`)
      }
    expect(violations.slice(0, 20).join('\n')).toBe('')
    expect(rows).toHaveLength(DATES.length * 32)
    // Every conclusion class is witnessed on real data (sampled run included).
    for (const c of [
      'STATE_LIFT',
      'DEFAULT_PENALTY',
      'DORMANT_GOD_ADDED',
      'CHAIN_REPLACED',
    ] as const)
      expect(classes.get(c), c).toBeGreaterThan(0)
  }, 1_800_000)

  it('stars-only equals baseline on score/status/hard warning and event results (spec §5 guard)', async () => {
    const [base, stars] = await Promise.all([run('baseline'), run('stars')])
    const diff: string[] = []
    for (const date of DATES) {
      stars.get(date)!.recs.forEach((r, k) => {
        if (conclusion(base.get(date)!.recs[k]!, r)) diff.push(`${date} ${r.activityId}`)
      })
      for (const [key, e] of stars.get(date)!.events) {
        const b = base.get(date)!.events.get(key)!
        if (b.score !== e.score || b.classification !== e.classification)
          diff.push(`${date} ${key}`)
      }
    }
    expect(diff.slice(0, 10).join('\n')).toBe('')
  }, 1_800_000)

  it('every configuration: hard warning unchanged; outside the P4 domain the whole output is baseline', async () => {
    const base = await run('baseline')
    for (const config of ['presence', 'balancing', 'full', 'stars', 'chainSwap'] as const) {
      const cfg = await run(config)
      const diff: string[] = []
      for (const date of DATES)
        cfg.get(date)!.recs.forEach((r, k) => {
          const b = base.get(date)!.recs[k]!
          if (b.hardWarning !== r.hardWarning) diff.push(`${date} ${r.activityId} hard warning`)
          if (!inDomain(date) && recSha(b) !== recSha(r))
            diff.push(`${date} ${r.activityId} outside`)
        })
      for (const date of OUTSIDE_P4_DOMAIN)
        for (const [key, e] of cfg.get(date)!.events)
          if (recSha(base.get(date)!.events.get(key)) !== recSha(e))
            diff.push(`${date} ${key} outside`)
      expect(diff.slice(0, 10).join('\n'), config).toBe('')
    }
  }, 1_800_000)

  it('chain-swap changes only activities whose baseline carried a 6-chain row', async () => {
    const [base, swap] = await Promise.all([run('baseline'), run('chainSwap')])
    const diff: string[] = []
    for (const date of DATES)
      swap.get(date)!.recs.forEach((r, k) => {
        const b = base.get(date)!.recs[k]!
        if (
          conclusion(b, r) &&
          !b.contributions.some((c) => c.classical?.version === 'xieji-vol10-scoring-v1')
        )
          diff.push(`${date} ${r.activityId}`)
      })
    expect(diff.slice(0, 10).join('\n')).toBe('')
  }, 1_800_000)
})
