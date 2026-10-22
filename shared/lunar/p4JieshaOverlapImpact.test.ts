import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import goldenLock from '../../docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'

// Audit only: 劫煞 OVERLAP impact study (docs/audits/p4-jiesha-overlap-impact.md). Not production.
// The candidate lives only in these vi.mock wrappers and is off unless S.mode is set, so no
// production module, flag or Golden changes. Scope (卷十 刼煞, offset 11115): Month Jian 辰戌丑未 and
// the clause's cancel_both branch (「不與德神併凡所忌者則不註宜所宜者亦不註忌」). In it a 劫煞 heading
// whose 宜 evidence is false keeps 忌; true or unknown stays as production. Scenario B adds the
// source chain 鳴吠對 宜啟攢 (卷十 offset 7284) + 鋪註 「凡吉凶相抵有宜啟攢不註忌安葬」 for 安葬.
// npm test: invariance + a sample; JIESHA_IMPACT_FULL=1 sweeps 1900–2100 and writes the artifact.
const S = vi.hoisted(() => ({
  mode: null as null | 'A' | 'B',
  date: '',
  day: null as null | { key: string; yi: Record<string, boolean | undefined> },
  warehouseYi: undefined as boolean | undefined,
  p4: [] as { date: string; heading: string; yi: boolean | undefined; action: string }[],
  vol10: [] as { date: string; activityId: string; action: string }[],
  // Same-graph helpers handed over by graph(): importing them in the factory would be circular.
  resolveYi: null as null | ((month: string, pillar: string) => { yiEvidence: unknown }),
  canon: null as null | ((h: string) => string),
}))
const SOIL_MONTHS = '辰戌丑未'
// 卷五 立成 as corrected (「今圖依起例改正」): 三子 四寅 四卯; matches 67/67 locked 月表 pages.
const MINGFEI_DUI = new Set('丙子 庚子 壬子 甲寅 丙寅 庚寅 壬寅 乙卯 丁卯 辛卯 癸卯'.split(' '))
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'

function yiFromTrace(trace: { presence: string }[] | undefined): boolean | undefined {
  const states = (trace ?? []).map((t) =>
    t.presence === 'present' ? true : t.presence === 'absent' ? false : undefined,
  )
  return states.includes(true) ? true : states.includes(undefined) ? undefined : false
}
const keepsJi = (pillar: string, heading: string, yi: boolean | undefined) =>
  yi === false && !(S.mode === 'B' && heading === '安葬' && MINGFEI_DUI.has(pillar))

vi.mock('./p4YiDayComposition', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4YiDayComposition')>()
  return {
    ...m,
    resolveP4YiDay: (...a: Parameters<typeof m.resolveP4YiDay>) => {
      const r = m.resolveP4YiDay(...a)
      const ev = r.yiEvidence as unknown as Record<string, { trace?: { presence: string }[] }>
      S.day = {
        key: a[0] + a[1],
        yi: Object.fromEntries(Object.entries(ev).map(([h, e]) => [h, yiFromTrace(e?.trace)])),
      }
      return r
    },
  }
})
vi.mock('./p4Warehouse', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4Warehouse')>()
  return {
    ...m,
    resolveP4WarehouseDay: (...a: Parameters<typeof m.resolveP4WarehouseDay>) => {
      const r = m.resolveP4WarehouseDay(...a)
      S.warehouseYi = r.warehouse.yi
      return r
    },
  }
})
vi.mock('./p4HeadingAnnotation', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4HeadingAnnotation')>()
  return {
    ...m,
    resolveP4Headings: (...a: Parameters<typeof m.resolveP4Headings>) => {
      const r = m.resolveP4Headings(...a)
      if (!S.mode) return r
      const [month, pillar, yi = {}] = a
      const sc = r.scopes['刼煞'] as { clauseEffect?: string; headings?: Record<string, string> }
      // Only the owner-rules composition (production P4 path) sees the candidate.
      const caller = new Error().stack?.split('\n')[2] ?? ''
      if (
        !caller.includes('resolveP4OwnerRulesDay') ||
        !SOIL_MONTHS.includes(month) ||
        sc?.clauseEffect !== 'cancel_both' ||
        !sc.headings
      )
        return r
      const allTrue = Object.values(yi).length > 0 && Object.values(yi).every((v) => v === true)
      if (allTrue && S.day?.key !== month + pillar) throw new Error('stale 宜 stash')
      const headings = { ...sc.headings }
      for (const [h, s] of Object.entries(headings)) {
        if (s !== 'neither_recorded') continue
        const y = allTrue ? (h === '修倉庫' ? S.warehouseYi : S.day!.yi[h]) : yi[h]
        if (keepsJi(pillar, h, y)) headings[h] = 'only_ji'
        if (allTrue)
          S.p4.push({
            date: S.date,
            heading: h,
            yi: y,
            action: keepsJi(pillar, h, y) ? 'keep_ji' : 'stay',
          })
      }
      return { ...r, scopes: { ...r.scopes, 刼煞: { ...sc, headings } } }
    },
  }
})
vi.mock('./xiejiVol10Resolution', async (importOriginal) => {
  const m = await importOriginal<typeof import('./xiejiVol10Resolution')>()
  const jie = (vol10.entries as { id: string; avoid: string }[]).find((e) => e.id === 'jie_sha')!
  const acts = vol11.activityEntries as Record<string, string[]>
  return {
    ...m,
    resolveVol10: (...a: Parameters<typeof m.resolveVol10>) => {
      const items = m.resolveVol10(...a)
      const [day] = a
      const month = BR[day.monthJianBranch]!
      if (!S.mode || !SOIL_MONTHS.includes(month)) return items
      const pillar = ST[day.dayStem]! + BR[day.dayBranch]!
      let yi: Record<string, boolean | undefined> | null = null
      return items.map((it) => {
        if (it.entry !== 'jie_sha' || it.effect !== 'cancel_both' || it.verdict !== 'no_annotation')
          return it
        if (!yi) {
          const ev = S.resolveYi!(month, pillar).yiEvidence as Record<
            string,
            { trace?: { presence: string }[] }
          >
          yi = Object.fromEntries(Object.entries(ev).map(([h, e]) => [h, yiFromTrace(e?.trace)]))
        }
        const listed = new Set(m.splitHeadings(jie.avoid).map(S.canon!))
        const hs = (acts[it.activityId] ?? []).map(S.canon!).filter((h) => listed.has(h))
        const keep = hs.some((h) => keepsJi(pillar, h, yi![h]))
        const unknown = !keep && hs.some((h) => yi![h] === undefined)
        S.vol10.push({
          date: S.date,
          activityId: it.activityId,
          action: keep ? 'avoid' : unknown ? 'unresolved' : 'stay',
        })
        return keep
          ? { ...it, verdict: 'avoid' as const, reason: 'audit OVERLAP: 劫煞 heading without 宜' }
          : it
      })
    },
  }
})

const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10)

type Mode = null | 'A' | 'B'
async function graph(mocked: boolean, mode: Mode = null) {
  vi.resetModules()
  if (!mocked)
    for (const p of [
      './p4YiDayComposition',
      './p4Warehouse',
      './p4HeadingAnnotation',
      './xiejiVol10Resolution',
    ])
      vi.doUnmock(p)
  const provider = await import('./p4AlmanacHeadings') // registers the production provider, as the app does
  const adapter = await import('./p4ScoreAdapter')
  const headings: Record<string, Record<string, { state: string }>> = {}
  // Log-only wrapper around the production provider: output passes through unchanged.
  adapter.setP4HeadingsProvider(
    (date, day) => (headings[date] = provider.getP4DayHeadings(date, day)),
  )
  S.resolveYi = (await import('./p4YiDayComposition')).resolveP4YiDay
  S.canon = (await import('./p4HeadingAnnotation')).canonP4Heading
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const run = <T>(fn: () => T) => {
    S.mode = mode
    try {
      return fn()
    } finally {
      S.mode = null
    }
  }
  return {
    almanac: (date: string) => run(() => getAlmanac(date as never)),
    events: (date: string) =>
      run(() =>
        EVENT_OPTIONS.map(([id]) => {
          const e = evaluateEventDay(date, id, {})
          return { id, score: e.score, classification: e.classification }
        }),
      ),
    headings,
    p4ActivityState: adapter.p4ActivityState,
  }
}

const FULL = process.env.JIESHA_IMPACT_FULL === '1'
const OUT = 'docs/audits/sources/p4-vol10/jiesha-overlap-impact-v1/'

async function sweep(dates: string[]) {
  const { dayCanChi } = await import('./canChi')
  const { jdFromDate } = await import('./julian')
  const base = await graph(true, null)
  const A = await graph(true, 'A')
  const B = await graph(true, 'B')
  const actHeadings = vol11.activityEntries as Record<string, string[]>
  const days: Record<string, unknown>[] = []
  let scanned = 0
  for (const date of dates) {
    const [y, m, d] = date.split('-').map(Number)
    if (!'寅巳申亥'.includes(BR[dayCanChi(jdFromDate(d!, m!, y!)).chi]!)) continue
    scanned++
    S.p4 = []
    S.vol10 = []
    S.date = date
    const a = A.almanac(date)
    if (!S.p4.length && !S.vol10.length) continue
    const p4Log = S.p4
    const vol10Log = S.vol10
    S.vol10 = []
    S.p4 = []
    const b = B.almanac(date)
    const logs = { A: { p4Log, vol10Log }, B: { p4Log: S.p4, vol10Log: S.vol10 } }
    const scen: Record<string, unknown> = {}
    const o = base.almanac(date)
    for (const [name, c, g] of [
      ['A', a, A],
      ['B', b, B],
    ] as const) {
      const acts = o.activityRecommendations.map((r) => {
        const n = c.activityRecommendations.find((x) => x.activityId === r.activityId)!
        // Row identity source:ruleId; a changed row is added, removed or has a different scoreDelta.
        const rows = (x: typeof r) =>
          new Map(x.contributions.map((k) => [`${k.source}:${k.ruleId}`, k.scoreDelta]))
        const before = rows(r)
        const after = rows(n)
        const changedRows = [...new Set([...before.keys(), ...after.keys()])].filter(
          (k) => before.get(k) !== after.get(k),
        ).length
        const hs = g.headings[date] ?? {}
        const bh = base.headings[date] ?? {}
        const stateBase = base.p4ActivityState(r.activityId, bh)
        const stateCand = g.p4ActivityState(r.activityId, hs)
        const annotated =
          (actHeadings[r.activityId] ?? []).some(
            (h) => bh[S.canon!(h)]?.state !== hs[S.canon!(h)]?.state,
          ) ||
          logs[name].vol10Log.some((v) => v.activityId === r.activityId && v.action === 'avoid')
        return {
          activityId: r.activityId,
          annotated,
          p4State: [stateBase, stateCand],
          changedRows,
          score: [r.score, n.score],
          status: [r.status, n.status],
          hardWarning: [r.hardWarning, n.hardWarning],
        }
      })
      const ev = g === A ? A.events(date) : B.events(date)
      const evBase = base.events(date)
      scen[name] = {
        ...logs[name],
        headings: Object.entries(g.headings[date] ?? {})
          .filter(([h, v]) => (base.headings[date] ?? {})[h]?.state !== v.state)
          .map(([h, v]) => ({
            heading: h,
            from: (base.headings[date] ?? {})[h]?.state,
            to: v.state,
          })),
        activities: acts.filter((x) => x.annotated || x.changedRows || x.score[0] !== x.score[1]),
        events: ev
          .map((e, i) => ({ ...e, base: evBase[i]! }))
          .filter((e) => e.score !== e.base.score || e.classification !== e.base.classification)
          .map((e) => ({
            id: e.id,
            score: [e.base.score, e.score],
            classification: [e.base.classification, e.classification],
          })),
      }
    }
    days.push({ date, p4Log, vol10Log, ...scen })
  }
  return { scanned, days }
}

describe('劫煞 OVERLAP impact', () => {
  it(
    'changes 2025-04-30 (辰月己巳, no 德) and only within the scoped clause',
    { timeout: 120_000 },
    async () => {
      const { days } = await sweep(['2025-04-30', '2025-04-18', '2025-12-14'])
      expect(days.map((d) => d.date)).toEqual(['2025-04-30']) // 辰丁巳 has 德; 子丁巳 is not a 土 month
      const a = days[0]!.A as { headings: { heading: string; to: string }[] }
      expect(a.headings.map((h) => h.heading)).toEqual(
        expect.arrayContaining(['祈福', '求嗣', '嫁娶', '安牀']),
      )
    },
  )

  it.runIf(FULL)(
    'sweeps 1900–2100 and writes the impact artifact',
    { timeout: 6 * 3_600_000 },
    async () => {
      const dates: string[] = []
      for (let d = '1900-01-01'; d <= '2100-12-31'; d = addDays(d, 1)) dates.push(d)
      const { scanned, days } = await sweep(dates)
      writeFileSync(
        OUT + 'raw.json',
        JSON.stringify({ range: ['1900-01-01', '2100-12-31'], scanned, days }) + '\n',
      )
      expect(days.length).toBeGreaterThan(0)
    },
  )
})

describe('劫煞 OVERLAP audit variant', () => {
  it(
    'leaves production output untouched when the candidate is off',
    { timeout: 600_000 },
    async () => {
      const dates = ['2025-04-30', '2025-11-02', '2026-01-28', '1950-05-03', '2099-10-20']
      const wrapped = await graph(true)
      const out = (g: Awaited<ReturnType<typeof graph>>) =>
        dates.map((d) => sha([g.almanac(d).activityRecommendations, g.events(d)]))
      const off = out(wrapped)
      // Last: doUnmock removes the wrappers for the rest of this file.
      const plain = await graph(false)
      expect(out(plain)).toEqual(off)
      // Golden v2 bytes stay frozen.
      for (const f of goldenLock.files)
        expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(
          f.sha256,
        )
    },
  )
})
