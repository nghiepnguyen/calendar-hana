import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import scopeDates from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json'

// Audit only: 未-戊申 納財 宜 premise and its puzhu:21 consequence. Prelude copied from
// p4Puzhu17Audit.test.ts (vi.mock must live in the test file); every run uses puzhu:17 = P17-A.
//   N-A  engine as is: 納財 宜 from 四相 → 相抵 with 劫煞 → puzhu:21 to 開市 / 立券交易;
//   N-B  page literal: 納財 has no 宜 on 未-戊申 (四相 removed from 納財's 宜 trace there only).
// npm test: freeze over the 16 contexts; NACAI_FULL=1 re-runs every 未-戊申 scope date 1900–2100.
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
  p17: null as null | 'A' | 'B' | 'C',
  line17: null as null | { from: string[] },
  jq: [] as string[],
  n: null as null | 'B',
  nc: [] as string[],
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
      const r0 = m.resolveP4YiDay(...a)
      type Tr = { han: string; presence: string }[]
      const ev0 = r0.yiEvidence as unknown as Record<string, { trace?: Tr }>
      const present = (ev0['嫁娶']?.trace ?? []).filter((x) => x.presence === 'present')
      S.jq = present.map((x) => x.han)
      const has = S.jq.includes('不將')
      const only = has && S.jq.every((g) => g === '不將')
      const block = S.p17 === 'B' ? has : S.p17 ? only : false
      if (S.line17) S.line17.from = block ? [] : ['嫁娶']
      const jq = ev0['嫁娶']
      const ev: Record<string, { trace?: Tr }> =
        S.p17 === 'C' && only && jq
          ? { ...ev0, 嫁娶: { ...jq, trace: jq.trace!.filter((x) => x.han !== '不將') } }
          : { ...ev0 }
      S.nc = (ev0['納財']?.trace ?? []).filter((x) => x.presence === 'present').map((x) => x.han)
      const nc = ev['納財']
      if (S.n === 'B' && a[0] + a[1] === '未戊申' && nc)
        (ev as Record<string, { trace?: Tr }>)['納財'] = {
          ...nc,
          trace: nc.trace!.filter((x) => x.han !== '四相'),
        }
      const r =
        S.p17 !== 'C' && !(S.n === 'B' && a[0] + a[1] === '未戊申')
          ? r0
          : { ...r0, yiEvidence: { ...ev } as unknown as typeof r0.yiEvidence }
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

type Row = {
  state: string
  yi?: boolean
  propagatedFrom?: string
  puzhu06?: string
  trace?: { ji: string[] }
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
  return (date: string, month: string, pillar: string, mode: null | 'F' = 'F') => {
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
            S.mode = mode
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
    return { activities: out, all: strict[0]!, runs: strict, unknownOps }
  }
}

const DIR = 'docs/audits/sources/p4-vol10/weishen-nacai-puzhu21-v1'
const REP: Record<string, string> = {
  '丑-丙寅': '1904-02-02',
  '丑-壬寅': '2025-02-02',
  '丑-戊寅': '2025-01-09',
  '丑-甲寅': '1902-01-31',
  '戌-丁亥': '2027-11-04',
  '戌-乙亥': '2025-11-02',
  '戌-己亥': '1903-11-07',
  '戌-癸亥': '2025-10-21',
  '未-丙申': '2025-07-26',
  '未-壬申': '1904-08-06',
  '未-庚申': '1902-08-05',
  '未-戊申': '2026-08-02',
  '辰-乙巳': '2025-04-06',
  '辰-己巳': '2025-04-30',
  '辰-癸巳': '1903-05-05',
  '辰-辛巳': '2027-05-02',
}
const VARIANTS = [null, 'B'] as const
const vName = (v: (typeof VARIANTS)[number]) => `N-${v ?? 'A'}`
const MONEY = ['納財', '開市', '立券交易', '開倉庫出貨財']

async function setup() {
  vi.resetModules()
  S.resolveYi = (await import('./p4YiDayComposition')).resolveP4YiDay
  S.canon = (await import('./p4HeadingAnnotation')).canonP4Heading
  const art = (await import('../almanac-data/p4-vol10-day-composition-v2.json')).default as {
    propagation: { lines: { id: string; from?: string[] }[] }
  }
  S.line17 = art.propagation.lines.find((l) => l.id === 'puzhu:17') as { from: string[] }
  const F = await faithfulEngine()
  const run = <T>(v: (typeof VARIANTS)[number], f: () => T) => {
    S.p17 = 'A'
    S.n = v
    try {
      return f()
    } finally {
      S.p17 = null
      S.n = null
      S.line17!.from = ['嫁娶']
    }
  }
  return { F, run }
}
const cells = (f: { activities: Record<string, { verdict: string; status: string }> }) =>
  Object.fromEntries(
    Object.entries(f.activities)
      .filter(([, x]) => x.verdict !== 'not_listed')
      .map(([a, x]) => [a, `${x.status}:${x.verdict}`]),
  )

describe('未-戊申 納財 / puzhu:21 audit', () => {
  it('freezes N-A / N-B over the 16 contexts', { timeout: 600_000 }, async () => {
    const { F, run } = await setup()
    const out: Record<string, unknown> = {}
    for (const [ctx, date] of Object.entries(REP)) {
      const [month, pillar] = ctx.split('-') as [string, string]
      const per: Record<string, unknown> = { date }
      for (const v of VARIANTS) {
        const f = run(v, () => F(date, month, pillar))
        per[vName(v)] = {
          nacaiYi: S.nc,
          cells: cells(f),
          rows: Object.fromEntries(
            MONEY.filter((h) => f.all[h]).map((h) => {
              const r = f.all[h]! as Row & { puzhu06?: string }
              return [
                h,
                {
                  state: r.state,
                  yi: r.yi,
                  ji: r.trace?.ji,
                  propagatedFrom: r.propagatedFrom,
                  puzhu06: r.puzhu06,
                },
              ]
            }),
          ),
        }
      }
      out[ctx] = per
    }
    writeFileSync(`${DIR}/freeze.json`, JSON.stringify(out, null, 1) + '\n')
    expect(Object.keys(out)).toHaveLength(16)
  })

  it.skipIf(!process.env.NACAI_FULL)(
    'recomputes 未-戊申 on every scope date under N-A and N-B',
    { timeout: 3_600_000 },
    async () => {
      const { F, run } = await setup()
      const dates = (scopeDates as Record<string, string[]>)['未-戊申']!
      const out: Record<string, Record<string, string[]>> = {}
      for (const v of VARIANTS) {
        const seen: Record<string, Set<string>> = {}
        for (const date of dates)
          for (const [a, c] of Object.entries(cells(run(v, () => F(date, '未', '戊申')))))
            (seen[a] ??= new Set()).add(c)
        out[vName(v)] = Object.fromEntries(Object.entries(seen).map(([a, s]) => [a, [...s].sort()]))
      }
      writeFileSync(
        `${DIR}/full.json`,
        JSON.stringify({ dates: dates.length, ...out }, null, 1) + '\n',
      )
      expect(Object.keys(out)).toHaveLength(2)
    },
  )

  it.skipIf(!process.env.NACAI_FULL)(
    'sensitivity: N-B against N-A on every 未-戊申 scope date (activities, ratings, events)',
    { timeout: 3_600_000 },
    async () => {
      const dates = (scopeDates as Record<string, string[]>)['未-戊申']!
      // One module graph per side: getAlmanac caches by date.
      const sideAll = async (v: (typeof VARIANTS)[number]) => {
        const { F, run } = await setup()
        await import('./p4AlmanacHeadings') // registers the production provider, as the app does
        const { getAlmanac } = await import('./almanac')
        const { evaluateEventDay } = await import('./eventEvaluation')
        const { EVENT_OPTIONS } = await import('./eventMapping')
        return Object.fromEntries(
          dates.map((date) => [
            date,
            run(v, () => {
              const f = F(date, '未', '戊申')
              S.fv = Object.fromEntries(
                Object.entries(f.activities).map(([a, x]) => [a, x.verdict]),
              )
              S.mode = 'F'
              S.date = date
              try {
                const al = getAlmanac(date as never)
                return {
                  acts: Object.fromEntries(
                    al.activityRecommendations.map((r) => [r.activityId, [r.score, r.status]]),
                  ),
                  events: EVENT_OPTIONS.map(([id]) => [
                    id,
                    evaluateEventDay(date, id, {}).classification,
                  ]),
                }
              } finally {
                S.mode = null
                S.fv = {}
              }
            }),
          ]),
        )
      }
      const A = await sideAll(null)
      const B = await sideAll('B')
      const side = (v: (typeof VARIANTS)[number], date: string) => (v ? B : A)[date]!
      const rows: unknown[] = []
      for (const date of dates) {
        const a = side(null, date)
        const b = side('B', date)
        for (const [id, x] of Object.entries(a.acts)) {
          const y = b.acts[id]!
          if (x[0] !== y[0] || x[1] !== y[1]) rows.push({ date, activity: id, from: x, to: y })
        }
        a.events.forEach(([id, c], k) => {
          if (c !== b.events[k]![1]) rows.push({ date, event: id, from: c, to: b.events[k]![1] })
        })
      }
      writeFileSync(
        `${DIR}/sensitivity.json`,
        JSON.stringify({ dates: dates.length, rows }, null, 1) + '\n',
      )
      expect(rows.length).toBeGreaterThan(0)
    },
  )
})
