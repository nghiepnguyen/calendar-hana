import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import goldenLock from '../../docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'

// Audit only: faithful 卷十 劫煞 simulator (docs/audits/p4-jiesha-faithful-vol10.md). Not production.
// Wrappers as in p4JieshaOverlapImpact.test.ts (the locked upper-bound harness, copied, not imported:
// vi.mock must live in the test file). Modes: null = production; 'B' = upper bound (P4 candidate +
// 卷十 per-activity 宜 check); 'F' = faithful (P4 candidate + 卷十 劫煞 verdict taken from the P4
// composition engine per date: 劫煞's 忌 survives on a heading after 宜, 鋪註 pairs and puzhu:06).
// 鳴吠對 enters only as 宜 啟攢 (internal heading) + 鋪註 「凡吉凶相抵有宜啟攢不註忌安葬」.
// npm test: invariance + samples; JIESHA_FAITHFUL_FULL=1 sweeps 1900–2100 and writes raw.json.
const S = vi.hoisted(() => ({
  mode: null as null | 'B' | 'F',
  fv: {} as Record<string, string>,
  chain: [] as { date: string; heading: string; via: string; source: string }[],
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
// 鳴吠對 宜 啟攢 (卷十 offset 7284); 啟攢 has 宜, so 「有宜啟攢不註忌安葬」 withholds 安葬.
const viaQizan = (pillar: string, heading: string) => heading === '安葬' && MINGFEI_DUI.has(pillar)
const keepsJi = (pillar: string, heading: string, yi: boolean | undefined) =>
  yi === false && !viaQizan(pillar, heading)

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
        // 鋪註05 「凡吉凶相抵不註宜亦不註忌者如遇徳猶忌之事則仍註忌」: 求醫療病 is in 劫煞's 止忌 list
        // (still avoided with 德), so the faithful candidate keeps it whatever its 宜.
        if (S.mode === 'F' && h === '求醫療病') {
          headings[h] = 'only_ji'
          if (allTrue) S.chain.push({ date: S.date, heading: h, via: '鋪註05', source: '遇徳猶忌' })
        } else if (keepsJi(pillar, h, y)) headings[h] = 'only_ji'
        else if (allTrue && y === false && viaQizan(pillar, h))
          S.chain.push({ date: S.date, heading: h, via: '啟攢', source: '鳴吠對' })
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
      if (S.mode === 'F')
        return items.map((it) =>
          it.entry === 'jie_sha' &&
          it.effect === 'cancel_both' &&
          it.verdict === 'no_annotation' &&
          S.fv[it.activityId] === 'avoid'
            ? { ...it, verdict: 'avoid' as const, reason: 'audit faithful: 劫煞 忌 survives' }
            : it,
        )
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
const WRAPPED = [
  './p4YiDayComposition',
  './p4Warehouse',
  './p4HeadingAnnotation',
  './xiejiVol10Resolution',
]
type Mode = null | 'B' | 'F'
type Row = { state: string; yi?: boolean; propagatedFrom?: string; trace?: { ji: string[] } }

async function graph(mocked: boolean, mode: Mode = null) {
  vi.resetModules()
  if (!mocked) for (const p of WRAPPED) vi.doUnmock(p)
  await import('./p4AlmanacHeadings') // registers the production provider, as the app does
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
  }
}

/** Faithful 劫煞 verdict per activity from the P4 composition engine, enumerating unknown operands. */
async function faithfulEngine() {
  const own = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiSoil')
  const { solarToLunar } = await import('./lunar')
  const { thoVuongDungSuPeriods } = await import('./thoVuongDungSu')
  const { splitHeadings } = await import('./xiejiVol10Resolution')
  const jie = (vol10.entries as { id: string; avoid: string }[]).find((e) => e.id === 'jie_sha')!
  const listed = new Set(splitHeadings(jie.avoid).map(S.canon!))
  const acts = vol11.activityEntries as Record<string, string[]>
  // 母倉 provenance is validated, so enumerated states use real in-coverage 2025 inputs.
  const p25 = thoVuongDungSuPeriods(2025)[0]!
  const muRef = { present: getP4MuCangSoil(p25.onset), absent: getP4MuCangSoil('2025-06-15') }
  if (muRef.present.state !== 'present' || muRef.absent.state !== 'absent')
    throw new Error('母倉 ref')
  return (date: string, month: string, pillar: string) => {
    const [y, m, d] = date.split('-').map(Number)
    const lunarDay = solarToLunar(d!, m!, y!).day
    const phase = getP4MoonPhase(date)
    const soil = getP4SoilPresence(date)
    const mu = getP4MuCangSoil(date)
    // Owner soil convention extended beyond its adopted coverage (SOURCE_DEPENDENT only).
    const ext = thoVuongDungSuPeriods(y!).some((p) => date >= p.onset && date <= p.eve)
      ? 'present'
      : 'absent'
    const phases = phase.phase === 'unknown' ? ['none', 'New Moon'] : [phase.phase]
    const twoWay = (known: string, unknown: boolean) => (unknown ? ['present', 'absent'] : [known])
    const runs = (extend: boolean) =>
      phases.flatMap((ph) =>
        (extend ? [ext] : twoWay(soil.presence, soil.presence === 'unknown')).flatMap((so) =>
          (extend ? [ext] : twoWay(mu.state, mu.state === 'unknown')).map((ms) => {
            const muObj = ms === mu.state ? mu : muRef[ms as 'present' | 'absent']
            // A 2025 母倉 stand-in may not share a civil date with the day's own evidence.
            const undate = <T extends { date?: string }>(o: T) => {
              if (muObj.date === date) return o
              const { date: _d, ...rest } = o
              return rest as T // the engine reads date only for its same-day check
            }
            S.mode = 'F'
            S.date = date
            try {
              return own.resolveP4OwnerRulesDay(month, pillar, {
                lunarDay,
                phase: undate({ ...phase, phase: ph }),
                soil: undate({ ...soil, presence: so }),
                yiInputs: { SOIL_REIGN_STATE: muObj },
              }) as Record<string, Row>
            } finally {
              S.mode = null
            }
          }),
        ),
      )
    const verdict = (rows: Record<string, Row>, a: string) => {
      const hs = (acts[a] ?? []).map(S.canon!).filter((h) => listed.has(h))
      if (!hs.length) return 'not_listed'
      const keep = (h: string) =>
        ['only_ji', 'both_present'].includes(rows[h]?.state ?? '') &&
        Boolean(rows[h]?.trace?.ji.includes('刼煞'))
      if (hs.some(keep)) return 'avoid'
      return hs.some((h) => rows[h]?.state === 'undetermined') ? 'undetermined' : 'blank'
    }
    const strict = runs(false)
    const unknownOps = strict.length > 1
    const extended = unknownOps ? runs(true) : strict
    const out: Record<string, { verdict: string; status: string; headings: Record<string, Row> }> =
      {}
    for (const a of Object.keys(acts)) {
      const vs = new Set(strict.map((r) => verdict(r, a)))
      const ve = new Set(extended.map((r) => verdict(r, a)))
      const one = (s: Set<string>) => (s.size === 1 ? [...s][0]! : null)
      const v = one(vs)
      const e = one(ve)
      const status =
        v && v !== 'undetermined'
          ? 'CONFIRMED'
          : e && e !== 'undetermined'
            ? 'SOURCE_DEPENDENT'
            : 'UNRESOLVED'
      const pick = status === 'CONFIRMED' ? v! : status === 'SOURCE_DEPENDENT' ? e! : 'unresolved'
      const rows = (status === 'SOURCE_DEPENDENT' ? extended : strict)[0]!
      const hs = (acts[a] ?? []).map(S.canon!).filter((h) => listed.has(h))
      out[a] = {
        verdict: pick,
        status,
        headings: Object.fromEntries(
          hs.map((h) => [
            h,
            {
              state: rows[h]?.state ?? '',
              yi: rows[h]?.yi,
              propagatedFrom: rows[h]?.propagatedFrom,
              trace: rows[h]?.trace,
            },
          ]),
        ),
      }
    }
    return { activities: out, all: strict[0]!, unknownOps }
  }
}

async function sweep(dates: string[]) {
  const { dayCanChi } = await import('./canChi')
  const { jdFromDate } = await import('./julian')
  const base = await graph(true, null)
  const B = await graph(true, 'B')
  const F = await graph(true, 'F')
  const engine = await faithfulEngine()
  const days: Record<string, unknown>[] = []
  let scanned = 0
  for (const date of dates) {
    const [y, m, d] = date.split('-').map(Number)
    const cc = dayCanChi(jdFromDate(d!, m!, y!))
    if (!'寅巳申亥'.includes(BR[cc.chi]!)) continue
    scanned++
    S.p4 = []
    S.vol10 = []
    S.chain = []
    S.date = date
    const b = B.almanac(date)
    if (!S.p4.length && !S.vol10.length) continue
    const ubLog = S.vol10.filter((v) => v.action === 'avoid').map((v) => v.activityId)
    const month = { 巳: '辰', 亥: '戌', 申: '未', 寅: '丑' }[BR[cc.chi]!]!
    const pillar = ST[cc.can]! + BR[cc.chi]!
    S.chain = []
    const fe = engine(date, month, pillar)
    const chain = S.chain
    S.fv = Object.fromEntries(Object.entries(fe.activities).map(([a, x]) => [a, x.verdict]))
    S.date = date
    const f = F.almanac(date)
    S.fv = {}
    const o = base.almanac(date)
    const cmp = (c: typeof o, ev: ReturnType<typeof base.events>) => {
      const evBase = base.events(date)
      return {
        activities: o.activityRecommendations
          .map((r) => {
            const n = c.activityRecommendations.find((x) => x.activityId === r.activityId)!
            const rows = (x: typeof r) =>
              new Map(x.contributions.map((k) => [`${k.source}:${k.ruleId}`, k.scoreDelta]))
            const before = rows(r)
            const after = rows(n)
            const changedRows = [...new Set([...before.keys(), ...after.keys()])].filter(
              (k) => before.get(k) !== after.get(k),
            ).length
            return {
              activityId: r.activityId,
              changedRows,
              score: [r.score, n.score],
              status: [r.status, n.status],
              hardWarning: [r.hardWarning, n.hardWarning],
            }
          })
          .filter((x) => x.changedRows || x.score[0] !== x.score[1]),
        events: ev
          .map((e, i) => ({ ...e, base: evBase[i]! }))
          .filter((e) => e.score !== e.base.score || e.classification !== e.base.classification)
          .map((e) => ({
            id: e.id,
            classification: [e.base.classification, e.classification],
          })),
      }
    }
    days.push({
      date,
      month,
      pillar,
      ub: { avoid: ubLog, ...cmp(b, B.events(date)) },
      f: {
        verdicts: Object.fromEntries(
          Object.entries(fe.activities).map(([a, x]) => [a, [x.verdict, x.status]]),
        ),
        headings: Object.fromEntries(
          Object.entries(fe.activities).map(([a, x]) => [a, x.headings]),
        ),
        unknownOps: fe.unknownOps,
        chain,
        ...cmp(f, F.events(date)),
      },
      ...(date >= '2025-01-01' && date <= '2027-12-31'
        ? {
            rows: Object.fromEntries(
              Object.entries(fe.all).map(([h, r]) => [
                h,
                { state: r.state, ji: r.trace?.ji, propagatedFrom: r.propagatedFrom },
              ]),
            ),
          }
        : {}),
    })
  }
  return { scanned, days }
}

const FULL = process.env.JIESHA_FAITHFUL_FULL === '1'
const OUT = 'docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/'

describe('faithful 卷十 劫煞 simulator', () => {
  it(
    'decides 2025-04-30 (辰己巳) and routes 鳴吠對 through 啟攢 on 2026-01-28 (丑壬寅)',
    { timeout: 300_000 },
    async () => {
      const { days } = await sweep(['2025-04-30', '2026-01-28'])
      const [chen, chou] = days as {
        f: { verdicts: Record<string, string[]>; chain: { heading: string; via: string }[] }
      }[]
      expect(chen!.f.verdicts.pray_blessing).toEqual(['avoid', 'CONFIRMED'])
      expect(chen!.f.verdicts.burial![0]).toBe('avoid')
      expect(chen!.f.verdicts.medical).toEqual(['avoid', 'CONFIRMED']) // 鋪註05 遇徳猶忌
      expect(chou!.f.chain).toContainEqual(
        expect.objectContaining({ heading: '安葬', via: '啟攢' }),
      )
      expect(chou!.f.verdicts.burial![0]).toBe('blank')
    },
  )

  it.runIf(FULL)(
    'sweeps 1900–2100 three ways and writes raw.json',
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

describe('faithful simulator safety', () => {
  it('leaves production output untouched when no mode is set', { timeout: 600_000 }, async () => {
    const dates = ['2025-04-30', '2025-11-02', '2026-01-28', '1950-05-03', '2099-10-20']
    const out = (g: Awaited<ReturnType<typeof graph>>) =>
      dates.map((d) => sha([g.almanac(d).activityRecommendations, g.events(d)]))
    const off = out(await graph(true))
    // Last: doUnmock removes the wrappers for the rest of this file.
    expect(out(await graph(false))).toEqual(off)
    for (const f of goldenLock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
  })
})
