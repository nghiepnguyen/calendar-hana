import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// F1 Stage 2 (docs/audits/p4-f1-wuli-lijuan-stage2-authority-reconciliation.md): impact of the R2 design
// (puzhu:06 cannot lift 五離 with a trigger outside 五離's own lift list) against current production.
// Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4G2Stage2Migration.test.ts:
//   current  production as shipped (p4b-puzhu06-v3, Q4 lifts 五離)
//   r2       the same authority with liftExclusions.五離 = the non-lifter triggers (Q4a mechanism)
// npm test: the frozen witnesses only. F1S2_DUMP=1: full 2025–2027 comparison (headings, activities,
// events, every day) written to f1-wuli-lijuan-stage2/impact.json.
type Model = 'current' | 'r2'
const PUZHU06 = '../almanac-data/p4b-puzhu06-v3.json'
const OUT = 'docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/impact.json'
// 五離's own list 「與天德月德天德合月德合天赦三合六合併則不忌」 ∩ puzhu:06 triggers; the rest cannot lift it.
const WULI_OWN = ['天德', '月德', '天德合', '月德合', '天赦']

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  if (model === 'r2')
    vi.doMock(PUZHU06, async (orig) => {
      const real = (await orig()) as { default: { triggers: string[]; liftExclusions: object } }
      const a = real.default
      const triggers = a.triggers.filter((t) => !WULI_OWN.includes(t))
      return { default: { ...a, liftExclusions: { ...a.liftExclusions, 五離: { triggers } } } }
    })
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { resolveP4OwnerRulesDay } = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiSoil')
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
type Rec = {
  activityId: string
  score: number
  status: string
  hardWarning: boolean
  contributions: { ruleId: string; status: string; classical?: { verdict?: string } }[]
}
const h16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

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

/** 立券交易 owner row with its trace, built with the same operands as getP4DayHeadings. */
function lijuanRow(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const rows = e.resolveP4OwnerRulesDay(
    BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!,
    STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!,
    {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: e.getP4MoonPhase(date),
      soil: e.getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: e.getP4MuCangSoil(date) },
    } as never,
  ) as Record<string, { state: string; rule?: string; puzhu06?: string; trace?: unknown }>
  return rows['立券交易']
}

async function compare(from: string, to: string) {
  const cur = await load('current')
  const a = new Map(days(from, to).map((d) => [d, snapshot(cur, d)]))
  const curRows = new Map(days(from, to).map((d) => [d, lijuanRow(cur, d)]))
  const r2 = await load('r2')
  const heading: unknown[] = []
  const decision: unknown[] = []
  const activity: unknown[] = []
  const event: unknown[] = []
  for (const d of days(from, to)) {
    const x = a.get(d)!
    const y = snapshot(r2, d)
    const cr = curRows.get(d)
    const rr = lijuanRow(r2, d)
    if (cr?.puzhu06 !== rr?.puzhu06)
      decision.push({
        date: d,
        context: x.context,
        current: [cr?.state, cr?.puzhu06],
        r2: [rr?.state, rr?.puzhu06],
      })
    for (const h of new Set([...Object.keys(x.heads), ...Object.keys(y.heads)]))
      if (JSON.stringify(x.heads[h]) !== JSON.stringify(y.heads[h]))
        heading.push({
          date: d,
          context: x.context,
          heading: h,
          current: x.heads[h],
          r2: y.heads[h],
          currentRow: curRows.get(d),
          r2Row: rr,
        })
    for (const id of Object.keys(x.acts)) {
      const p = x.acts[id]!
      const q = y.acts[id]!
      if (p.sha !== q.sha)
        activity.push({
          date: d,
          context: x.context,
          activityId: id,
          current: { score: p.score, status: p.status, hardWarning: p.hardWarning, rules: p.rules },
          r2: { score: q.score, status: q.status, hardWarning: q.hardWarning, rules: q.rules },
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
          current: { score: p.score, classification: p.classification },
          r2: { score: q.score, classification: q.classification },
        })
    }
  }
  return { decision, heading, activity, event }
}

describe('F1 Stage 2 R2 impact', () => {
  it('witness dates: R2 restores 五離 忌 on 立券交易 only where Q4 lifted it', async () => {
    const { heading } = await compare('2025-10-18', '2025-10-30')
    expect(
      (heading as { date: string; heading: string; r2: { state: string } }[]).map((h) => [
        h.date,
        h.heading,
        h.r2.state,
      ]),
    ).toEqual([
      ['2025-10-18', '立券交易', 'only_ji'],
      ['2025-10-30', '立券交易', 'only_ji'],
    ])
  }, 120_000)

  it('未-戊申: R2 keeps 五離 at puzhu:06, then puzhu:21 (N-A, from 納財) still withholds it', async () => {
    const pick = (r: { state: string; puzhu06?: string }) => [r.state, r.puzhu06]
    expect(pick(lijuanRow(await load('current'), '2026-08-02'))).toEqual(['neither_recorded', 'lift:QL'])
    expect(pick(lijuanRow(await load('r2'), '2026-08-02'))).toEqual(['neither_recorded', 'keep:QL_EXCLUDED'])
  }, 120_000)

  it('outside P4_DOMAIN the R2 data change moves nothing (戌-壬申 2024-11-04, 2028-10-14)', async () => {
    for (const d of ['2024-11-04', '2028-10-14']) {
      const r = await compare(d, d)
      expect(snapshot(await load('current'), d).context).toBe('戌-壬申')
      expect([r.heading, r.activity, r.event]).toEqual([[], [], []])
    }
  }, 120_000)

  it.runIf(process.env.F1S2_DUMP === '1')(
    'full 2025–2027 comparison → impact.json',
    async () => {
      const r = await compare('2025-01-01', '2027-12-31')
      // Diagnostic only, not production impact: the P4 layer is gated to P4_DOMAIN, so outside it R2 moves
      // nothing in production. Context level (no date operands) under both models, then civil-date counts.
      const cur = await load('current')
      const r2 = await load('r2')
      const ctx = (e: Engine, m: string, p: string) => {
        try {
          const row = (
            e.resolveP4OwnerRulesDay(m, p) as Record<string, { state: string; puzhu06?: string }>
          )['立券交易']
          return row ? `${row.state}|${row.puzhu06 ?? ''}` : '-'
        } catch (err) {
          return `throws:${(err as Error).message.slice(0, 40)}`
        }
      }
      const contexts: Record<string, { current: string; r2: string }> = {}
      for (const m of BRANCHES)
        for (let i = 0; i < 60; i++) {
          const p = STEMS[i % 10]! + BRANCHES[i % 12]!
          const x = ctx(cur, m, p)
          const y = ctx(r2, m, p)
          if (x !== y) contexts[`${m}-${p}`] = { current: x, r2: y }
        }
      const { solarStringToJd } = await import('./julian')
      const { dayCanChi } = await import('./canChi')
      const { solarTermMonthChi } = await import('./solarTerms')
      const counts: Record<string, number> = Object.fromEntries(Object.keys(contexts).map((k) => [k, 0]))
      for (const d of days('1900-01-01', '2100-12-31')) {
        if (d >= '2025-01-01' && d <= '2027-12-31') continue
        const jd = solarStringToJd(d as never)
        const cc = dayCanChi(jd)
        const k = `${BRANCHES[solarTermMonthChi(jd)]}-${STEMS[cc.can]}${BRANCHES[cc.chi]}`
        if (k in counts) counts[k]! += 1
      }
      const diagnostic = { note: 'context level, not frozen production impact', contexts, datesOutside2025_2027: counts }
      writeFileSync(
        OUT,
        JSON.stringify({ range: ['2025-01-01', '2027-12-31'], ...r, diagnostic }, null, 1) + '\n',
      )
      expect(JSON.parse(readFileSync(OUT, 'utf8')).heading.length).toBe(r.heading.length)
    },
    1_800_000,
  )
})
