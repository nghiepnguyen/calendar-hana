import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Q4-REST Stage 2C (docs/audits/p4-q4-rest-stage2c-xiaohao-replication.md), audit only. DIAGNOSTIC impact of each
// candidate owner ruling, each in its own module graph; none is approved and none is a production expectation:
//   jk   九空: liftExclusions.九空 = puzhu:06 triggers outside 九空's own lifters
//   wx   五虛: the same for 五虛
//   xh   小耗: the same for 小耗
//   f1y  五離 × 立券交易: a both_present row whose only surviving 忌 is 五離 reads only_ji
//   all  the four together
// Q4R2C_DUMP=1 writes q4-rest-stage2c/runtime.json (2025–2027 diffs vs production + the 戌-癸卯 rows); npm test
// re-derives the 戌-癸卯 rows.
type Ruling = 'jk' | 'wx' | 'xh' | 'f1y'
type Model = 'production' | Ruling | 'all'
// Production imports authority v5 since Q4-REST Stage 3; this proof stays pinned to v4 (q4RestRollback.ts).
const PUZHU06 = '../almanac-data/p4b-puzhu06-v5.json'
const OWNER = './p4OwnerRules'
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2c/'
const OUT = DIR + 'runtime.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
// Own lifters ∩ puzhu:06 triggers (卷十 entries; Stage 1 models.json `own`).
const OWN: Record<string, string[]> = {
  九空: ['月德', '天德合', '月德合'],
  五虛: ['天德', '月德', '天德合', '月德合', '天願'],
  小耗: ['天德', '月德', '天德合', '月德合', '天願'],
}
const J_GOD: Partial<Record<Ruling, string>> = { jk: '九空', wx: '五虛', xh: '小耗' }
type Row = { state: string; yiNoted?: boolean; puzhu06?: string; trace?: { ji: string[] } }

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  vi.doMock(PUZHU06, async () => (await import('./q4RestRollback')).puzhu06V4())
  vi.doUnmock(OWNER)
  const rulings: Ruling[] =
    model === 'all' ? ['jk', 'wx', 'xh', 'f1y'] : model === 'production' ? [] : [model]
  const gods = rulings.map((r) => J_GOD[r]).filter((g): g is string => Boolean(g))
  if (gods.length)
    vi.doMock(PUZHU06, async () => {
      const a = ((await import('./q4RestRollback')).puzhu06V4() as { default: { triggers: string[]; liftExclusions: object } })
        .default
      const extra = Object.fromEntries(
        gods.map((g) => [g, { triggers: a.triggers.filter((t) => !OWN[g]!.includes(t)) }]),
      )
      return { default: { ...a, liftExclusions: { ...a.liftExclusions, ...extra } } }
    })
  if (rulings.includes('f1y'))
    vi.doMock(OWNER, async (orig) => {
      const real = (await orig()) as typeof import('./p4OwnerRules')
      return {
        ...real,
        resolveP4OwnerRulesDay: (...a: Parameters<typeof real.resolveP4OwnerRulesDay>) =>
          Object.fromEntries(
            Object.entries(real.resolveP4OwnerRulesDay(...a)).map(([h, r]) => [
              h,
              h === '立券交易' &&
              r.state === 'both_present' &&
              JSON.stringify((r as Row).trace?.ji) === '["五離"]'
                ? { ...r, state: 'only_ji', yiNoted: false }
                : r,
            ]),
          ),
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

function snapshot(e: Engine, date: string) {
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

/** 戌-癸卯 context rows under production: state, 忌 sources, puzhu:06 decision. */
async function xuGuimao() {
  const e = await load('production')
  const rows = e.resolveP4OwnerRulesDay('戌', '癸卯') as Record<string, Row>
  return Object.fromEntries(
    ['開市', '立券交易', '納財', '開倉庫出貨財'].map((h) => [
      h,
      { state: rows[h]!.state, ji: rows[h]!.trace?.ji ?? [], puzhu06: rows[h]!.puzhu06 ?? '' },
    ]),
  )
}

describe('Q4-REST Stage 2C diagnostic impact', () => {
  it.runIf(process.env.Q4R2C_DUMP === '1')(
    'dumps per-ruling and combined impact (2025–2027)',
    async () => {
      const range = days('2025-01-01', '2027-12-31')
      const prod = await load('production')
      const base = new Map(range.map((d) => [d, snapshot(prod, d)]))
      const impact: Record<string, unknown> = {}
      for (const model of ['jk', 'wx', 'xh', 'f1y', 'all'] as const) {
        const e = await load(model)
        const decision: unknown[] = []
        const heading: unknown[] = []
        const activity: unknown[] = []
        const event: unknown[] = []
        for (const d of range) {
          const x = base.get(d)!
          const y = snapshot(e, d)
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
        impact[model] = { decision, heading, activity, event }
      }
      writeFileSync(
        OUT,
        JSON.stringify({ authority: 'p4b-puzhu06-v4', xuGuimao: await xuGuimao(), impact }) + '\n',
      )
    },
    3_600_000,
  )

  it('the frozen dump re-derives the 戌-癸卯 production rows', async () => {
    expect(existsSync(OUT)).toBe(true)
    const dump = JSON.parse(readFileSync(OUT, 'utf8'))
    expect(dump.authority).toBe('p4b-puzhu06-v4')
    expect(await xuGuimao()).toEqual(dump.xuGuimao)
  }, 120_000)
})
