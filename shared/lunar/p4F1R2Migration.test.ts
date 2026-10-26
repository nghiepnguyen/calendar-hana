import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// F1 Stage 3 (docs/audits/p4-f1-wuli-lijuan-stage3-migration.md): owner R2 shipped as puzhu:06 authority v4.
// Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4F1WuliStage2Impact.test.ts:
//   shipped   production as committed (p4b-puzhu06-v4)
//   rollback  v3 at the v4 path (f1R2Rollback.ts) = pre-R2 production
//   mutation  v4 with liftExclusions.五離 deleted: the envelope must disappear (the rule, not the file, moves it)
// npm test: witnesses, regression boundary, mutation and outside dates. F1S3_DUMP=1: rollback vs shipped over
// every day of 2025–2027 → f1-wuli-lijuan-stage3/migration-diff.json (+ rollback.json digests).
type Model = 'shipped' | 'rollback' | 'mutation'
const PUZHU06 = '../almanac-data/p4b-puzhu06-v4.json'
const OUT = 'docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/'
const STAGE2 = 'docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/impact.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  if (model === 'rollback') vi.doMock(PUZHU06, async () => (await import('./f1R2Rollback')).puzhu06V3())
  if (model === 'mutation')
    vi.doMock(PUZHU06, async (orig) => {
      const a = ((await orig()) as { default: { liftExclusions: Record<string, unknown> } }).default
      const { 五離: _drop, ...liftExclusions } = a.liftExclusions
      return { default: { ...a, version: 'p4b-puzhu06-v4-mutation', liftExclusions } }
    })
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { P4_PUZHU06_AUTHORITY_ID } = await import('./p4Puzhu06')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { resolveP4OwnerRulesDay } = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiSoil')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { getVol10JieshaRuntime } = await import('./xiejiVol10JieshaAuthority')
  return {
    id: P4_PUZHU06_AUTHORITY_ID,
    getAlmanac,
    getP4DayHeadings,
    resolveP4OwnerRulesDay,
    getP4MoonPhase,
    getP4SoilPresence,
    getP4MuCangSoil,
    evaluateEventDay,
    eventOutput,
    EVENT_HOURS,
    EVENT_OPTIONS,
    getVol10JieshaRuntime,
  }
}
type Engine = Awaited<ReturnType<typeof load>>
type Rec = {
  activityId: string
  score: number
  status: string
  hardWarning: boolean
  contributions: { ruleId: string; status: string; classical?: { verdict?: string } }[]
}
type Row = { state: string; puzhu06?: string; trace?: { ji?: string[] } }
const h16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

/** Owner rows of a date with the same operands as getP4DayHeadings. */
function owner(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  return e.resolveP4OwnerRulesDay(
    BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!,
    STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!,
    {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: e.getP4MoonPhase(date),
      soil: e.getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: e.getP4MuCangSoil(date) },
    } as never,
  ) as Record<string, Row>
}

function snapshot(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const op = {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  }
  const heads = e.getP4DayHeadings(date, op)
  const context = `${BRANCHES[op.monthJianBranch]}-${STEMS[op.dayStem]}${BRANCHES[op.dayBranch]}`
  const acts = Object.fromEntries(
    (a.activityRecommendations as unknown as Rec[]).map((r) => [
      r.activityId,
      {
        score: r.score,
        status: r.status,
        hardWarning: r.hardWarning,
        rules: r.contributions
          .map((c) => `${c.ruleId}:${c.status}:${c.classical?.verdict ?? ''}`)
          .sort()
          .join(' '),
        sha: h16(JSON.stringify(r)),
      },
    ]),
  )
  const events: Record<string, { score: unknown; classification: string; sha: string }> = {}
  for (const [id] of e.EVENT_OPTIONS)
    for (const h of e.EVENT_HOURS) {
      const ev = e.eventOutput(e.evaluateEventDay, date, id, h) as {
        score: unknown
        classification: string
      }
      events[`${id}@${h ?? ''}`] = {
        score: ev.score,
        classification: ev.classification,
        sha: h16(JSON.stringify(ev)),
      }
    }
  return { context, heads, acts, events }
}
type Snap = ReturnType<typeof snapshot>

/** Same record shapes as the Stage 2 impact.json (current = rollback, r2 = shipped). */
function diff(dates: string[], x: Map<string, Snap>, y: Map<string, Snap>, xr: Map<string, Row>, yr: Map<string, Row>) {
  const decision: unknown[] = []
  const heading: unknown[] = []
  const activity: unknown[] = []
  const event: unknown[] = []
  for (const d of dates) {
    const p = x.get(d)!
    const q = y.get(d)!
    const cr = xr.get(d)
    const rr = yr.get(d)
    if (cr?.puzhu06 !== rr?.puzhu06)
      decision.push({ date: d, context: p.context, current: [cr?.state, cr?.puzhu06], r2: [rr?.state, rr?.puzhu06] })
    for (const h of new Set([...Object.keys(p.heads), ...Object.keys(q.heads)]))
      if (JSON.stringify(p.heads[h]) !== JSON.stringify(q.heads[h]))
        heading.push({ date: d, context: p.context, heading: h, current: p.heads[h], r2: q.heads[h] })
    for (const id of Object.keys(p.acts)) {
      const a = p.acts[id]!
      const b = q.acts[id]!
      if (a.sha !== b.sha)
        activity.push({
          date: d,
          context: p.context,
          activityId: id,
          current: { score: a.score, status: a.status, hardWarning: a.hardWarning, rules: a.rules },
          r2: { score: b.score, status: b.status, hardWarning: b.hardWarning, rules: b.rules },
        })
    }
    for (const k of Object.keys(p.events)) {
      const a = p.events[k]!
      const b = q.events[k]!
      if (a.sha !== b.sha)
        event.push({
          date: d,
          context: p.context,
          event: k,
          current: { score: a.score, classification: a.classification },
          r2: { score: b.score, classification: b.classification },
        })
    }
  }
  return { decision, heading, activity, event }
}

async function run(model: Model, dates: string[]) {
  const e = await load(model)
  return {
    id: e.id,
    snaps: new Map(dates.map((d) => [d, snapshot(e, d)])),
    rows: new Map(dates.map((d) => [d, owner(e, d)['立券交易']!])),
    owner: (d: string) => owner(e, d),
    e,
  }
}

const N14 = '2025-10-30' // 戌-壬申, 四相 + 五離, witness 06067696-n14
const N62 = '2025-10-18' // 戌-庚申, 月恩 + 五離, witness 06067696-n62
const YI = '2025-01-15' // 丑-甲申, independent 宜 on 立券交易 (semantic consequence, not witnessed)
const OWN = '2025-07-14' // 未-甲申, 天德 + 月德: 五離's own lifters
const JIUKONG = '2025-03-09' // 卯-丁丑, 立券交易 lifted by 九空 under 月恩 + 四相 (another Q4 god)
const WEISHEN = '2026-08-02' // 未-戊申, intermediate only
const OUTSIDE = ['2024-11-04', '2028-10-14'] // 戌-壬申 outside P4_DOMAIN

describe('F1 Stage 3: R2 migration (puzhu:06 authority v4)', () => {
  it('witnesses, 宜 case, regression boundary and G2 / W1', async () => {
    const all = [N14, N62, YI, OWN, JIUKONG, WEISHEN]
    const s = await run('shipped', all)
    const r = await run('rollback', all)
    expect([s.id, r.id]).toEqual(['p4b-puzhu06-v4', 'p4b-puzhu06-v3'])
    // n14 / n62: 五離 survives a generic trigger; 立券交易 keeps 忌.
    for (const d of [N14, N62]) {
      const row = s.rows.get(d)!
      expect([row.state, row.puzhu06, row.trace?.ji], d).toEqual(['only_ji', 'keep:QL_EXCLUDED', ['五離']])
      expect(r.rows.get(d)!.puzhu06, d).toBe('lift:QL')
    }
    // Independent 宜 survives and so does 五離's 忌.
    expect([s.rows.get(YI)!.state, s.rows.get(YI)!.puzhu06]).toEqual(['both_present', 'keep:QL_EXCLUDED'])
    // 五離's own lifter (天德, 月德): unchanged, no 五離 忌 on the heading.
    expect(s.owner(OWN)).toEqual(r.owner(OWN))
    expect(s.rows.get(OWN)!.trace?.ji ?? []).not.toContain('五離')
    // Another Q4 god (九空) on the same heading stays lifted.
    expect(s.owner(JIUKONG)).toEqual(r.owner(JIUKONG))
    expect(s.rows.get(JIUKONG)!.puzhu06).toBe('lift:QL')
    // 未-戊申: puzhu:06 keeps 五離, puzhu:21 withholds it; the final state is unchanged.
    expect([s.rows.get(WEISHEN)!.state, s.rows.get(WEISHEN)!.puzhu06]).toEqual(['neither_recorded', 'keep:QL_EXCLUDED'])
    expect(s.snaps.get(WEISHEN)).toEqual(r.snaps.get(WEISHEN))
    // G2 / W1: 劫煞 × 立券交易 on 未-戊申 stays BLANK / I1.
    for (const a of ['contract', 'transaction'])
      expect(s.e.getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
    // Only 立券交易 headings move, and only contract / transaction activities.
    const d = diff(all, r.snaps, s.snaps, r.rows, s.rows)
    expect(new Set(d.heading.map((h) => (h as { heading: string }).heading))).toEqual(new Set(['立券交易']))
    expect(new Set(d.activity.map((a) => (a as { activityId: string }).activityId))).toEqual(
      new Set(['contract', 'transaction']),
    )
  }, 300_000)

  it('mutation: v4 without the 五離 exclusion gives the rollback output', async () => {
    const dates = [N14, N62, YI, WEISHEN]
    const m = await run('mutation', dates)
    const r = await run('rollback', dates)
    expect(m.id).toBe('p4b-puzhu06-v4-mutation')
    for (const d of dates) {
      expect(m.snaps.get(d), d).toEqual(r.snaps.get(d))
      expect(m.rows.get(d), d).toEqual(r.rows.get(d))
    }
  }, 300_000)

  it('outside P4_DOMAIN nothing moves', async () => {
    const s = await run('shipped', OUTSIDE)
    const r = await run('rollback', OUTSIDE)
    for (const d of OUTSIDE) {
      expect(s.snaps.get(d)!.context).toBe('戌-壬申')
      expect(s.snaps.get(d), d).toEqual(r.snaps.get(d))
    }
  }, 300_000)

  it('the committed migration diff equals the frozen Stage 2 envelope', () => {
    const got = JSON.parse(readFileSync(OUT + 'migration-diff.json', 'utf8'))
    const want = JSON.parse(readFileSync(STAGE2, 'utf8'))
    for (const k of ['range', 'decision', 'activity', 'event']) expect(got[k], k).toEqual(want[k])
    // Stage 2 heading records also carried the owner rows; the heading fields themselves must match.
    const strip = (h: Record<string, unknown>) => {
      const { currentRow: _c, r2Row: _r, ...rest } = h
      return rest
    }
    expect(got.heading).toEqual(want.heading.map(strip))
    // Outside P4_DOMAIN the owner-rules decision moves (the layer is date-agnostic) but production does not.
    expect([got.outside.heading, got.outside.activity, got.outside.event]).toEqual([[], [], []])
  })

  it.runIf(process.env.F1S3_DUMP === '1')(
    'full 2025–2027 rollback vs shipped → migration-diff.json, rollback.json',
    async () => {
      const range = days('2025-01-01', '2027-12-31')
      const dates = [...range, ...OUTSIDE]
      const r = await run('rollback', dates)
      const s = await run('shipped', dates)
      const d = diff(range, r.snaps, s.snaps, r.rows, s.rows)
      const outside = diff(OUTSIDE, r.snaps, s.snaps, r.rows, s.rows)
      writeFileSync(
        OUT + 'migration-diff.json',
        JSON.stringify({ range: ['2025-01-01', '2027-12-31'], ...d, outside }, null, 1) + '\n',
      )
      const digest = (m: Map<string, Snap>) =>
        createHash('sha256')
          .update(dates.map((x) => JSON.stringify(m.get(x))).join('\n'))
          .digest('hex')
      writeFileSync(
        OUT + 'rollback.json',
        JSON.stringify(
          {
            note: 'sha256 over every day snapshot (P4 headings, activities, events), 2025–2027 + 2 outside dates',
            rollback: { authority: r.id, digest: digest(r.snaps) },
            shipped: { authority: s.id, digest: digest(s.snaps) },
          },
          null,
          1,
        ) + '\n',
      )
    },
    1_800_000,
  )
})
