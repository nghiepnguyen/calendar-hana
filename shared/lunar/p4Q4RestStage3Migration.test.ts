import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Q4-REST Stage 3 (docs/audits/p4-q4-rest-stage3-migration.md): owner R-JK / R-WX / R-XH / R-F1Y shipped as puzhu:06
// authority v5. One module graph per model:
//   shipped   production as committed (p4b-puzhu06-v5)
//   rollback  v4 at the v5 path (q4RestRollback.ts) = pre-Stage-3 production
//   -jk -wx -xh  v5 without that god's QL_NARROW exclusion; -f1y  v5 with yiComposition emptied
// Q4R3M_DUMP=1 writes q4-rest-stage3/migration-diff.json (rollback vs shipped, per-rule attribution, digests);
// npm test re-derives the source-witness cells, the rollback on the witness dates and the outside dates.
type Model = 'shipped' | 'rollback' | '-jk' | '-wx' | '-xh' | '-f1y'
const PUZHU06 = '../almanac-data/p4b-puzhu06-v5.json'
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage3/'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const DROP: Partial<Record<Model, string>> = { '-jk': '九空', '-wx': '五虛', '-xh': '小耗' }
type Row = { state: string; puzhu06?: string; yiRule?: string; trace?: { ji: string[] } }

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  if (model === 'rollback')
    vi.doMock(PUZHU06, async () => (await import('./q4RestRollback')).puzhu06V4())
  if (model !== 'shipped' && model !== 'rollback')
    vi.doMock(PUZHU06, async (orig) => {
      const a = (
        (await orig()) as {
          default: Record<string, unknown> & { liftExclusions: Record<string, unknown> }
        }
      ).default
      if (model === '-f1y') return { default: { ...a, yiComposition: [] } }
      const { [DROP[model]!]: _drop, ...liftExclusions } = a.liftExclusions
      return { default: { ...a, liftExclusions } }
    })
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { P4_PUZHU06_AUTHORITY_ID } = await import('./p4Puzhu06')
  expect(P4_PUZHU06_AUTHORITY_ID).toBe(model === 'rollback' ? 'p4b-puzhu06-v4' : 'p4b-puzhu06-v5')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { resolveP4OwnerRulesDay } = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiOperands')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  return {
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
  }
}
type Engine = Awaited<ReturnType<typeof load>>
const h16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

function ownerRows(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const month = BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!
  const pillar = STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!
  const rows = e.resolveP4OwnerRulesDay(month, pillar, {
    lunarDay: a.selectionContext.LUNAR_DAY!,
    phase: e.getP4MoonPhase(date),
    soil: e.getP4SoilPresence(date),
    yiInputs: { SOIL_REIGN_STATE: e.getP4MuCangSoil(date) },
  } as never) as Record<string, Row>
  return { a, context: `${month}-${pillar}`, rows }
}

/** Same snapshot as the frozen prediction harness (p4Q4RestStage3Prediction.test.ts). */
function snapshot(e: Engine, date: string) {
  const { a, context, rows } = ownerRows(e, date)
  const decisions = Object.fromEntries(Object.entries(rows).map(([h, r]) => [h, r.puzhu06 ?? '']))
  const yiRules = Object.fromEntries(
    Object.entries(rows).flatMap(([h, r]) => (r.yiRule ? [[h, r.yiRule]] : [])),
  )
  const heads = e.getP4DayHeadings(date, {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  })
  type Rec = { activityId: string; score: number; status: string; hardWarning: boolean }
  const acts = Object.fromEntries(
    (a.activityRecommendations as unknown as Rec[]).map((r) => [
      r.activityId,
      { score: r.score, status: r.status, hardWarning: r.hardWarning, sha: h16(JSON.stringify(r)) },
    ]),
  )
  const events: Record<string, { score: unknown; classification: string; sha: string }> = {}
  for (const [id] of e.EVENT_OPTIONS)
    for (const hr of e.EVENT_HOURS) {
      const ev = e.eventOutput(e.evaluateEventDay, date, id, hr) as {
        score: unknown
        classification: string
      }
      events[`${id}@${hr ?? ''}`] = {
        score: ev.score,
        classification: ev.classification,
        sha: h16(JSON.stringify(ev)),
      }
    }
  return { context, decisions, yiRules, heads, acts, events }
}
type Snap = ReturnType<typeof snapshot>
const digest = (s: Snap) =>
  createHash('sha256')
    .update(JSON.stringify({ heads: s.heads, acts: s.acts, events: s.events }))
    .digest('hex')

function diff(x: Map<string, Snap>, y: Map<string, Snap>, range: string[]) {
  const decision: unknown[] = []
  const heading: unknown[] = []
  const activity: unknown[] = []
  const event: unknown[] = []
  for (const d of range) {
    const p = x.get(d)!
    const q = y.get(d)!
    for (const h of Object.keys(p.decisions))
      if (p.decisions[h] !== q.decisions[h])
        decision.push({
          date: d,
          context: p.context,
          heading: h,
          production: p.decisions[h],
          model: q.decisions[h],
        })
    for (const h of new Set([...Object.keys(p.heads), ...Object.keys(q.heads)]))
      if (JSON.stringify(p.heads[h]) !== JSON.stringify(q.heads[h]))
        heading.push({
          date: d,
          context: p.context,
          heading: h,
          production: p.heads[h],
          model: q.heads[h],
        })
    for (const id of Object.keys(p.acts)) {
      const u = p.acts[id]!
      const v = q.acts[id]!
      if (u.sha !== v.sha)
        activity.push({
          date: d,
          context: p.context,
          activityId: id,
          production: { score: u.score, status: u.status, hardWarning: u.hardWarning },
          model: { score: v.score, status: v.status, hardWarning: v.hardWarning },
        })
    }
    for (const k of Object.keys(p.events)) {
      const u = p.events[k]!
      const v = q.events[k]!
      if (u.sha !== v.sha)
        event.push({
          date: d,
          context: p.context,
          event: k,
          production: { score: u.score, classification: u.classification },
          model: { score: v.score, classification: v.classification },
        })
    }
  }
  return { decision, heading, activity, event }
}

const ALL = () => [...days('2025-01-01', '2027-12-31'), '2024-11-04', '2028-10-14']
const RANGE = () => days('2025-01-01', '2027-12-31')

describe('Q4-REST Stage 3 migration (authority v5)', () => {
  it.runIf(process.env.Q4R3M_DUMP === '1')(
    'dumps rollback vs shipped, per-rule attribution and digests',
    async () => {
      const snaps: Record<string, Map<string, Snap>> = {}
      for (const m of ['rollback', 'shipped', '-jk', '-wx', '-xh', '-f1y'] as const) {
        const e = await load(m)
        snaps[m] = new Map(
          (m === 'rollback' || m === 'shipped' ? ALL() : RANGE()).map((d) => [d, snapshot(e, d)]),
        )
      }
      const out = {
        authority: 'p4b-puzhu06-v5',
        diff: diff(snaps.rollback!, snaps.shipped!, RANGE()),
        // A row is attributed to a rule when removing that rule alone moves it back.
        withoutRule: Object.fromEntries(
          (['-jk', '-wx', '-xh', '-f1y'] as const).map((m) => [
            m,
            diff(snaps[m]!, snaps.shipped!, RANGE()),
          ]),
        ),
        yiRules: Object.fromEntries(
          RANGE().flatMap((d) =>
            Object.keys(snaps.shipped!.get(d)!.yiRules).length
              ? [[d, snaps.shipped!.get(d)!.yiRules]]
              : [],
          ),
        ),
        rollbackDigests: Object.fromEntries(ALL().map((d) => [d, digest(snaps.rollback!.get(d)!)])),
        shippedDigests: Object.fromEntries(ALL().map((d) => [d, digest(snaps.shipped!.get(d)!)])),
      }
      writeFileSync(DIR + 'migration-diff.json', JSON.stringify(out) + '\n')
    },
    3_600_000,
  )

  it('rollback reproduces the frozen pre-Stage-3 baseline on the witness and outside dates', async () => {
    expect(existsSync(DIR + 'prediction.json')).toBe(true)
    const baseline = JSON.parse(readFileSync(DIR + 'prediction.json', 'utf8')).baseline as Record<
      string,
      string
    >
    const e = await load('rollback')
    for (const d of ['2025-06-08', '2025-01-15', '2025-03-09', '2024-11-04', '2028-10-14'])
      expect(digest(snapshot(e, d)), d).toBe(baseline[d])
  }, 300_000)

  it('outside P4_DOMAIN shipped output equals the baseline', async () => {
    const baseline = JSON.parse(readFileSync(DIR + 'prediction.json', 'utf8')).baseline as Record<
      string,
      string
    >
    const e = await load('shipped')
    for (const d of ['2024-11-04', '2028-10-14'])
      expect(digest(snapshot(e, d)), d).toBe(baseline[d])
  }, 300_000)
})
