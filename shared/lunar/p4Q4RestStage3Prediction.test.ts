import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Q4-REST Stage 3 (docs/audits/p4-q4-rest-stage3-migration.md). Frozen BEFORE any Stage 3 engine code, on the
// v4 tree: the production baseline digest (what a v5 → v4 rollback must reproduce) and an independent
// prediction of the approved rulings, defined without the implementation's class mechanism:
//   jOnly   liftExclusions for 九空/五虛/小耗 (= Stage 2C combined; must reproduce it row for row)
//   full    jOnly + scoped Y (v4 decision lift ∧ model decision keep ∧ final both_present → only_ji)
//           + R-F1Y (立券交易, final both_present, sole surviving 忌 五離 → only_ji)
// Q4R3_DUMP=1 writes q4-rest-stage3/prediction.json; npm test checks it exists and is v4-based.
type Model = 'production' | 'jOnly' | 'full'
const PUZHU06 = '../almanac-data/p4b-puzhu06-v4.json'
const OWNER = './p4OwnerRules'
const OUT = 'docs/audits/sources/p4-vol10/q4-rest-stage3/prediction.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const OWN: Record<string, string[]> = {
  九空: ['月德', '天德合', '月德合'],
  五虛: ['天德', '月德', '天德合', '月德合', '天願'],
  小耗: ['天德', '月德', '天德合', '月德合', '天願'],
}
type Row = { state: string; yiNoted?: boolean; puzhu06?: string; trace?: { ji: string[] } }
// v4 puzhu:06 decisions of the production pass, keyed by the owner-rules call arguments.
const v4Decisions = new Map<string, Record<string, string>>()

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  vi.doUnmock(OWNER)
  if (model !== 'production') {
    vi.doMock(PUZHU06, async (orig) => {
      const a = ((await orig()) as { default: { triggers: string[]; liftExclusions: object } })
        .default
      const extra = Object.fromEntries(
        Object.entries(OWN).map(([g, own]) => [
          g,
          { triggers: a.triggers.filter((t) => !own.includes(t)) },
        ]),
      )
      return { default: { ...a, liftExclusions: { ...a.liftExclusions, ...extra } } }
    })
  }
  vi.doMock(OWNER, async (orig) => {
    const real = (await orig()) as typeof import('./p4OwnerRules')
    return {
      ...real,
      resolveP4OwnerRulesDay: (...a: Parameters<typeof real.resolveP4OwnerRulesDay>) => {
        const rows = real.resolveP4OwnerRulesDay(...a) as Record<string, Row>
        const key = JSON.stringify(a)
        if (model === 'production') {
          v4Decisions.set(
            key,
            Object.fromEntries(Object.entries(rows).map(([h, r]) => [h, r.puzhu06 ?? ''])),
          )
          return rows
        }
        if (model === 'jOnly') return rows
        const base = v4Decisions.get(key)
        if (!base) throw new Error(`no v4 decisions for ${key}`)
        return Object.fromEntries(
          Object.entries(rows).map(([h, r]) => {
            const scopedY =
              base[h]!.startsWith('lift') &&
              (r.puzhu06 ?? '').startsWith('keep') &&
              r.state === 'both_present'
            const f1y =
              h === '立券交易' &&
              r.state === 'both_present' &&
              JSON.stringify(r.trace?.ji) === '["五離"]'
            return [h, scopedY || f1y ? { ...r, state: 'only_ji', yiNoted: false } : r]
          }),
        )
      },
    }
  })
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { resolveP4OwnerRulesDay } = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiOperands')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { P4_PUZHU06_AUTHORITY_ID } = await import('./p4Puzhu06')
  expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
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

export function q4r3Snapshot(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const month = BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!
  const pillar = STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!
  const rows = e.resolveP4OwnerRulesDay(month, pillar, {
    lunarDay: a.selectionContext.LUNAR_DAY!,
    phase: e.getP4MoonPhase(date),
    soil: e.getP4SoilPresence(date),
    yiInputs: { SOIL_REIGN_STATE: e.getP4MuCangSoil(date) },
  } as never) as Record<string, Row>
  const decisions = Object.fromEntries(Object.entries(rows).map(([h, r]) => [h, r.puzhu06 ?? '']))
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
  return { context: `${month}-${pillar}`, decisions, heads, acts, events }
}
export const q4r3Days = () => [...days('2025-01-01', '2027-12-31'), '2024-11-04', '2028-10-14']
export const q4r3Digest = (s: ReturnType<typeof q4r3Snapshot>) =>
  createHash('sha256')
    .update(JSON.stringify({ heads: s.heads, acts: s.acts, events: s.events }))
    .digest('hex')

function diff(base: Map<string, ReturnType<typeof q4r3Snapshot>>, e: Engine, range: string[]) {
  const decision: unknown[] = []
  const heading: unknown[] = []
  const activity: unknown[] = []
  const event: unknown[] = []
  for (const d of range) {
    const x = base.get(d)!
    const y = q4r3Snapshot(e, d)
    for (const h of Object.keys(x.decisions))
      if (x.decisions[h] !== y.decisions[h])
        decision.push({
          date: d,
          context: x.context,
          heading: h,
          production: x.decisions[h],
          model: y.decisions[h],
        })
    for (const h of new Set([...Object.keys(x.heads), ...Object.keys(y.heads)]))
      if (JSON.stringify(x.heads[h]) !== JSON.stringify(y.heads[h]))
        heading.push({
          date: d,
          context: x.context,
          heading: h,
          production: x.heads[h],
          model: y.heads[h],
        })
    for (const id of Object.keys(x.acts)) {
      const p = x.acts[id]!
      const q = y.acts[id]!
      if (p.sha !== q.sha)
        activity.push({
          date: d,
          context: x.context,
          activityId: id,
          production: { score: p.score, status: p.status, hardWarning: p.hardWarning },
          model: { score: q.score, status: q.status, hardWarning: q.hardWarning },
        })
    }
    for (const k of Object.keys(x.events)) {
      const p = x.events[k]!
      const q = y.events[k]!
      if (p.sha !== q.sha)
        event.push({
          date: d,
          context: x.context,
          event: k,
          production: { score: p.score, classification: p.classification },
          model: { score: q.score, classification: q.classification },
        })
    }
  }
  return { decision, heading, activity, event }
}

describe('Q4-REST Stage 3 prediction (frozen on v4)', () => {
  it.runIf(process.env.Q4R3_DUMP === '1')(
    'dumps the baseline digest and the J-only / full predictions',
    async () => {
      const prod = await load('production')
      const all = q4r3Days()
      const base = new Map(all.map((d) => [d, q4r3Snapshot(prod, d)]))
      const baseline = Object.fromEntries(all.map((d) => [d, q4r3Digest(base.get(d)!)]))
      const range = all.filter((d) => d >= '2025-01-01' && d <= '2027-12-31')
      const jOnly = diff(base, await load('jOnly'), range)
      const full = diff(base, await load('full'), range)
      writeFileSync(
        OUT,
        JSON.stringify({ authority: 'p4b-puzhu06-v4', baseline, jOnly, full }) + '\n',
      )
    },
    3_600_000,
  )

  it('the frozen prediction exists and was taken on v4', () => {
    expect(existsSync(OUT)).toBe(true)
    const p = JSON.parse(readFileSync(OUT, 'utf8'))
    expect(p.authority).toBe('p4b-puzhu06-v4')
    expect(Object.keys(p.baseline)).toHaveLength(1097)
  })
})
