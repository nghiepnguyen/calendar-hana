import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import badGods from '../almanac-data/bad-gods.json'
import goodGods from '../almanac-data/good-gods.json'
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
import {
  ACTIVITY_HEADER,
  activityLine,
  capFirstDiff,
  CHANGED_HEADER,
  changedLine,
  configSummary,
  DAY_HEADER,
  dayLine,
  EVENT_HEADER,
  eventLine,
  fullSummary,
  monthJian,
  REVIEW_HEADER,
  reviewLines,
  type EventDiff,
} from './p4MigrationReport'
import { P4_MIGRATION_RULES_VERSION } from './p4MigrationRules'
import { P4_DOMAIN, P4_DORMANT_GODS, p4ActivityState } from './p4ScoreAdapter'
import { solarTermsForYear } from './solarTerms'

// Roadmap 9 harness (tasks/prd-p4-migration-diff.md §2, FR-02; owner §6.10). Test-only: no runtime
// change. Each configuration is its own module graph (vi.resetModules), because the almanac memo key
// has no flag. `baseline` is the real manifest (OFF) without the provider, i.e. baseline v1; every
// other configuration runs the almanac with the manifest mocked ON and the provider loaded, and
// rewrites the activity input per configuration before calling the real scorer.
// npm test: every 10th P4 date + the 3 outside dates; ci:p4 (P4_MIGRATION_FULL=1): all 1098.
const FULL = process.env.P4_MIGRATION_FULL === '1'
const WRITE = process.env.P4_MIGRATION_WRITE === '1'
const OUT = 'docs/audits/sources/p4-vol10/p4-migration-diff-v1/'
const inDomain = (date: string) => date >= P4_DOMAIN[0] && date <= P4_DOMAIN[1]
const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10)
// FR-07: every Jie (month-opening term, odd index) of 2025–2027, its civil date in UTC+7, ±1 day.
const JIE = [2025, 2026, 2027]
  .flatMap((y) => solarTermsForYear(y))
  .filter((t) => t.index % 2 === 1)
  .map((t) => ({
    name: t.name,
    instantUtc: t.instantUtc,
    date: new Date(Date.parse(t.instantUtc) + 7 * 3_600_000).toISOString().slice(0, 10),
  }))
  .filter((t) => inDomain(t.date))
const JIE_DATES = new Set(JIE.flatMap((t) => [-1, 0, 1].map((d) => shiftDate(t.date, d))))
const DATES = [
  ...P4_DOMAIN_DATES.filter((d, i) => FULL || i % 10 === 0 || JIE_DATES.has(d)),
  ...OUTSIDE_P4_DOMAIN,
]
const SAMPLED = new Set(DATES)
const HEADINGS = xieji.activityEntries as Record<string, string[] | undefined>
const RESOLVED = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']

type Config = 'baseline' | 'presence' | 'balancing' | 'full' | 'stars' | 'chainSwap'
type EventOut = ReturnType<typeof eventOutput>
interface Day {
  recs: ActivityRecommendation[]
  /** Activity input as the ON almanac built it, before the configuration rewrite. */
  input?: ActivityInput
  events: Map<string, EventOut>
  stars: string[]
  ctx: Record<string, number>
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
    const alm = getAlmanac(date as never)
    const day: Day = {
      recs: alm.activityRecommendations,
      input: captured.input,
      events: new Map(),
      stars: [...alm.stars.good, ...alm.stars.bad].map((star) => star.name),
      ctx: alm.selectionContext,
    }
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
const goldenPresence = new Map(
  tsv(GOLDEN + 'p4-full-golden-v2/presence/dated.tsv').map((r) => [r.date!, r]),
)
const goldenDormant = new Map(
  [...goldenPresence].map(([date, r]) => [date, new Set(r.dormant!.split(' ').filter(Boolean))]),
)
const goldenState = new Map(
  tsv(GOLDEN + 'p4-score-golden-v1/activity-states.tsv').map((r) => [
    `${r.date}|${r.activity}`,
    r.state!,
  ]),
)
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

const fit = (e: EventOut) => e.criteria.find((c) => c.id === 'event_fit')?.status ?? ''
const LABEL = new Map([...goodGods.items, ...badGods.items].map((g) => [g.label, g.id] as const))
const dormantOf = (day: Day) =>
  day.stars
    .map((n) => LABEL.get(n))
    .filter((id): id is string => !!id && P4_DORMANT_GODS.has(id))
    .sort()

async function eventDiffs(config: Config): Promise<EventDiff[]> {
  const [base, cfg] = await Promise.all([run('baseline'), run(config)])
  const out: EventDiff[] = []
  for (const date of DATES) {
    const b = base.get(date)!
    const c = cfg.get(date)!
    const changed = new Set(
      c.recs.filter((r, k) => conclusion(b.recs[k]!, r)).map((r) => r.activityId),
    )
    for (const [key, e] of c.events) {
      const be = b.events.get(key)!
      out.push({
        date,
        key,
        base: { score: be.score, classification: be.classification, fit: fit(be) },
        cfg: { score: e.score, classification: e.classification, fit: fit(e) },
        profileChanged: resolveEventActivities(key.split('|')[0]!).filter((a) => changed.has(a)),
      })
    }
  }
  return out
}
const lines = (header: string, body: readonly string[]) => [header, ...body].join('\n') + '\n'
const eventChanged = (e: EventDiff) =>
  e.base.score !== e.cfg.score || e.base.classification !== e.cfg.classification

/** FR-07 rows: each Jie of the domain and the day before/after, in the full configuration. */
async function jieLines() {
  const full = await run('full')
  const out: string[] = []
  for (const t of JIE)
    for (const offset of [-1, 0, 1]) {
      const date = shiftDate(t.date, offset)
      if (!inDomain(date)) continue
      const day = full.get(date)!
      const g = goldenPresence.get(date)!
      const hourDiffers = EVENT_OPTIONS.filter(
        ([id]) =>
          day.events.get(`${id}|9`)!.classification !== day.events.get(`${id}|`)!.classification,
      ).length
      out.push(
        [
          t.name,
          t.instantUtc,
          date,
          offset,
          monthJian(day.ctx),
          g.month_jian,
          g.noon_month_jian,
          dormantOf(day).join(' '),
          g.dormant,
          g.noon_dormant,
          offset === 0 ? Date.parse(`${date}T09:00:00+07:00`) < Date.parse(t.instantUtc) : '',
          hourDiffers,
        ].join('\t'),
      )
    }
  return out
}
const JIE_HEADER =
  'jie\tinstant_utc\tdate\toffset\tmonth_jian\tgolden_month_jian\tnoon_month_jian\tdormant\tgolden_dormant\tnoon_dormant\thour9_before_instant\tevents_hour_differs'

/** FR-03/FR-06 files; summary and review are meaningful only over all dates. */
async function buildFiles() {
  const [base, full] = await Promise.all([run('baseline'), run('full')])
  const rows = await diffRows('full')
  const files: Record<string, string> = {}
  files['days.tsv'] = lines(
    DAY_HEADER,
    DATES.map((date) =>
      dayLine({
        date,
        ctx: full.get(date)!.ctx,
        stars: full.get(date)!.stars,
        baseStars: base.get(date)!.stars,
      }),
    ),
  )
  files['activities-full.tsv'] = lines(
    ACTIVITY_HEADER,
    rows.map((r) =>
      activityLine(
        r,
        p4ActivityState(r.full.activityId, full.get(r.date)!.input?.p4Headings ?? {}).heading,
        HEADINGS[r.full.activityId] ?? [],
      ),
    ),
  )
  const fullEvents = await eventDiffs('full')
  files['events-full.tsv'] = lines(EVENT_HEADER, fullEvents.map(eventLine))
  const configs: Record<string, ReturnType<typeof configSummary>> = {}
  const changedKeys: Record<string, Set<string>> = {}
  for (const config of ['presence', 'balancing', 'full', 'stars', 'chainSwap'] as const) {
    const cfg = await run(config)
    const pairs = DATES.flatMap((date) =>
      cfg.get(date)!.recs.map((r, k) => ({ date, base: base.get(date)!.recs[k]!, cfg: r })),
    )
    const events = config === 'full' ? fullEvents : await eventDiffs(config)
    configs[config] = configSummary(pairs, events)
    changedKeys[config] = new Set(
      pairs.filter((p) => conclusion(p.base, p.cfg)).map((p) => `${p.date}|${p.cfg.activityId}`),
    )
    if (config === 'presence' || config === 'balancing') {
      files[`activities-${config}-changed.tsv`] = lines(
        CHANGED_HEADER,
        pairs
          .filter((p) => conclusion(p.base, p.cfg))
          .map((p) => changedLine(p.date, p.base, p.cfg)),
      )
      files[`events-${config}-changed.tsv`] = lines(
        EVENT_HEADER,
        events.filter(eventChanged).map(eventLine),
      )
    }
  }
  const [f, b] = [changedKeys.full!, changedKeys.balancing!]
  files['jie-boundary.tsv'] = lines(JIE_HEADER, await jieLines())
  files['review.tsv'] = lines(
    REVIEW_HEADER,
    reviewLines(
      rows.filter((r) => r.inDomain),
      fullEvents,
    ),
  )
  const summary = {
    version: 'p4-migration-diff-v1',
    rulesVersion: P4_MIGRATION_RULES_VERSION,
    dates: DATES.length,
    configs,
    overlapFullBalancing: {
      both: [...f].filter((k) => b.has(k)).length,
      fullOnly: [...f].filter((k) => !b.has(k)).length,
      balancingOnly: [...b].filter((k) => !f.has(k)).length,
    },
    full: fullSummary(rows, changedKeys.chainSwap!),
  }
  files['summary.json'] = JSON.stringify(summary, null, 2) + '\n'
  return files
}
/** Files whose rows are keyed by date (first column), checked on sampled dates in npm test. */
const DATED = (name: string) =>
  name.endsWith('.tsv') && name !== 'review.tsv' && name !== 'jie-boundary.tsv'
const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
const git = (...args: string[]) => execFileSync('git', args).toString().trim()

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

  it('FR-05(a) cap-first counterfactual differs on 0 rows (one sign per pool, lift by sign)', async () => {
    const rows = await diffRows('full')
    const diff = rows.filter((r) => r.state !== 'baseline' && capFirstDiff(r.full) !== 0)
    expect(
      diff
        .slice(0, 10)
        .map((r) => `${r.date} ${r.full.activityId}`)
        .join('\n'),
    ).toBe('')
  }, 1_800_000)

  it('FR-07 exact-Jie fixture: Month Jian and dormant gods follow Golden v2 around every Jie', async () => {
    const full = await run('full')
    expect(JIE).toHaveLength(36)
    const diff: string[] = []
    for (const t of JIE) {
      const before = shiftDate(t.date, -1)
      const after = shiftDate(t.date, 1)
      if (
        inDomain(before) &&
        inDomain(after) &&
        full.get(before)!.ctx.MONTH_JIAN_BRANCH === full.get(after)!.ctx.MONTH_JIAN_BRANCH
      )
        diff.push(`${t.date} ${t.name}: Month Jian does not change`)
    }
    for (const date of JIE_DATES) {
      if (!inDomain(date)) continue
      const day = full.get(date)!
      const g = goldenPresence.get(date)!
      if (monthJian(day.ctx) !== g.month_jian)
        diff.push(`${date} Month Jian ${monthJian(day.ctx)} ≠ ${g.month_jian}`)
      if (dormantOf(day).join(' ') !== [...goldenDormant.get(date)!].sort().join(' '))
        diff.push(`${date} dormant ${dormantOf(day)} ≠ ${g.dormant}`)
    }
    expect(diff.join('\n')).toBe('')
  }, 1_800_000)

  it('migration files equal the lock (write: P4_MIGRATION_FULL=1 P4_MIGRATION_WRITE=1)', async () => {
    const files = await buildFiles()
    if (WRITE) {
      expect(FULL, 'write needs all dates').toBe(true)
      mkdirSync(OUT, { recursive: true })
      for (const [name, text] of Object.entries(files)) writeFileSync(OUT + name, text)
      const lock = {
        version: 'p4-migration-diff-lock-v1',
        prd: 'tasks/prd-p4-migration-diff.md FR-02/FR-03/FR-05/FR-06/FR-07, owner §6.10',
        generatedAt: git('rev-parse', 'HEAD'),
        treeCleanOutsideOutput: git('status', '--porcelain', '--', '.', `:!${OUT}`) === '',
        rules: 'docs/audits/sources/p4-vol10/p4-migration-rules-v1/lock.json',
        baseline: 'docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/lock.json',
        rulesVersion: P4_MIGRATION_RULES_VERSION,
        manifestPolicies: manifest.policies,
        configurations: {
          baseline:
            'real manifest (xiejiVol10BalancingEnabled false), provider not loaded = baseline v1',
          presence:
            'manifest ON + provider; activity input: override false, no p4Headings, 21 dormant kept (owner 6.10.1 a)',
          balancing: 'manifest ON + provider; activity input without the 21 dormant gods',
          full: 'manifest ON + provider, input unchanged (roadmap 10 path)',
          stars: 'manifest ON + provider; p4Headings {} (aid: alias star swap only)',
          chainSwap:
            'balancing with every resolved heading forced to both_present, prot kept (aid: 6-chain removal only)',
        },
        dates: {
          p4Domain: P4_DOMAIN_DATES.length,
          outside: OUTSIDE_P4_DOMAIN,
          jieFixture: JIE_DATES.size,
        },
        eventHours: ['none', 9],
        personalInput: 'none',
        timezone: process.env.TZ,
        node: process.version,
        regenerate:
          'P4_MIGRATION_FULL=1 P4_MIGRATION_WRITE=1 npx vitest run shared/lunar/p4MigrationDiff.test.ts',
        files: Object.keys(files).map((name) => ({
          path: OUT + name,
          sha256: sha256(readFileSync(OUT + name)),
        })),
      }
      writeFileSync(OUT + 'lock.json', JSON.stringify(lock, null, 2) + '\n')
    }
    const lock = JSON.parse(readFileSync(OUT + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    expect(lock.files.map((f) => f.path).sort()).toEqual(
      Object.keys(files)
        .map((n) => OUT + n)
        .sort(),
    )
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    for (const [name, text] of Object.entries(files)) {
      if (!FULL && !DATED(name) && name !== 'jie-boundary.tsv') continue
      const keep = (l: string) => FULL || !DATED(name) || SAMPLED.has(l.split('\t')[0]!)
      const want = readFileSync(OUT + name, 'utf8')
        .split('\n')
        .filter(keep)
      const got = text.split('\n').filter(keep)
      expect(
        got
          .filter((l, i) => l !== want[i])
          .slice(0, 5)
          .join('\n'),
        name,
      ).toBe('')
      expect(got.length, name).toBe(want.length)
    }
  }, 1_800_000)
})
