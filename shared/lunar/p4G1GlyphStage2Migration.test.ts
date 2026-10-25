import { createHash } from 'node:crypto'
import {
  closeSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// G1 glyph Stage 2 (docs/audits/p4-g1-glyph-stage2-spec.md, owner ruling R3): 劫煞 authority v3, demolition
// APPLIED in 11 contexts, 5 date-dependent contexts EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY (no cell).
// Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4G2Stage2Migration.test.ts:
//   forward    G1 glyph Stage 2 state: authority v3 (pinned at the v4 path since G1-SOIL Stage 2).
//   rollback   authority v2 at the path production imports (g1GlyphRollback.ts) = shipped f3c68c6.
//   pre        no mock, authority v2 expected: only for a dump on an f3c68c6 worktree (pre-G1-glyph main).
//   m-*        malformed authority v3: must fail on import, never apply or invent a cell.
// npm test: focused checks. G1GS2_DUMP=<models> G1GS2_OUT / G1GS2_FROM / G1GS2_TO: per-row dump of every day
// (no sampling), same row format as the Stage 1 harness; g1-glyph-stage2/compare.py builds the evidence.
// G1GS2_STAMP=1: exhaustive event classification (raw = semantic + stamp-only), writes authority-stamp.json.
type Model =
  | 'forward'
  | 'rollback'
  | 'pre'
  | 'rollback-sk'
  | 'forward-sk'
  | 'm-excluded-avoid'
  | 'm-excluded-blank'
  | 'm-excluded-applied'
  | 'm-excluded-approved'
  | 'm-applied-no-cell'
  | 'm-applied-unapproved'
  | 'm-context-missing'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
const MANIFEST = '../almanac-data/manifest.json'
const OUT = 'docs/audits/sources/p4-vol10/g1-glyph-stage2/'
const V2_ID = 'xieji-vol10-jiesha-faithful-v2'
const V3_ID = 'xieji-vol10-jiesha-faithful-v3'
const EXCLUDED = ['丑丙寅', '丑壬寅', '丑戊寅', '丑甲寅', '未戊申']
const EXCLUDED_STATUS = 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY'
type Auth = {
  version: string
  cells: Record<string, Record<string, string>>
  runtimeCoverage: {
    activities: Record<
      string,
      { status: string; contexts?: Record<string, Record<string, unknown>> }
    >
  }
}

function mockModel(model: Model) {
  vi.doUnmock(AUTH)
  vi.doUnmock(MANIFEST)
  // G1-b counterfactual: the source-key-v1 lookup (G1-b rollback configuration) on each authority.
  if (model.endsWith('-sk'))
    vi.doMock(MANIFEST, async (orig) => {
      const real = (await orig<{ default: { policies: object } }>()).default
      return {
        default: { ...real, policies: { ...real.policies, p4ScoreHeadingLookup: 'source-key-v1' } },
      }
    })
  if (model === 'pre') return
  // G1-SOIL Stage 2 shipped authority v4: this frozen G1 glyph evidence pins its forward graph to v3.
  if (model === 'forward' || model === 'forward-sk')
    return vi.doMock(AUTH, async () => (await import('./g1GlyphRollback')).jieshaAuthorityV3())
  if (model === 'rollback' || model === 'rollback-sk')
    return vi.doMock(AUTH, async () => (await import('./g1GlyphRollback')).jieshaAuthorityV2())
  vi.doMock(AUTH, async () => {
    const a = structuredClone(
      (await import('./g1GlyphRollback')).jieshaAuthorityV3().default as unknown as Auth,
    )
    const ctx = a.runtimeCoverage.activities.demolition!.contexts!
    if (model === 'm-excluded-avoid') a.cells['丑壬寅']!.demolition = 'avoid'
    if (model === 'm-excluded-blank') a.cells['丑壬寅']!.demolition = 'blank'
    if (model === 'm-excluded-applied') ctx['丑壬寅']!.status = 'APPLIED'
    if (model === 'm-excluded-approved') ctx['丑壬寅']!.productionApproved = true
    if (model === 'm-applied-no-cell') delete a.cells['辰乙巳']!.demolition
    if (model === 'm-applied-unapproved') ctx['辰乙巳']!.productionApproved = false
    if (model === 'm-context-missing') delete ctx['辰乙巳']
    return { default: a }
  })
}

async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  if (!model.startsWith('m-'))
    await (
      await import('./g1GlyphRollback')
    ).assertJieshaAuthority(model === 'forward' || model === 'forward-sk' ? V3_ID : V2_ID)
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { p4ActivityState } = await import('./p4ScoreAdapter')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { isThoVuongDungSu } = await import('./thoVuongDungSu')
  const R = await import('./xiejiVol10Resolution')
  const A = await import('./xiejiVol10JieshaAuthority')
  return {
    getAlmanac,
    evaluateEventDay,
    eventOutput,
    EVENT_HOURS,
    EVENT_OPTIONS,
    p4ActivityState,
    getP4DayHeadings,
    isThoVuongDungSu,
    R,
    A,
  }
}
type Engine = Awaited<ReturnType<typeof load>>

type Rec = {
  activityId: string
  score: number
  status: string
  hardWarning: boolean
  contributions: {
    ruleId: string
    status: string
    classical?: { verdict?: string; entry?: string }
  }[]
}
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex')
const h16 = (s: string) => sha(s).slice(0, 16)
const verdicts = (r: Rec) =>
  r.contributions
    .filter((c) => c.classical?.verdict)
    .map((c) => `${c.ruleId}:${c.status}:${c.classical!.verdict}`)
    .sort()
    .join(' ')
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'

/** Stage 1 row format (p4G1GlyphStage1Audit.test.ts dumpDay), so rows compare across stages. E lines carry the
 * whole event sha with the authority id normalized to v2 (`nsha`) and raw (`rsha`). */
function dumpDay(e: Engine, date: string): string[] {
  const a = e.getAlmanac(date as never)
  const sc = a.selectionContext
  const heads = e.getP4DayHeadings(date, {
    monthJianBranch: sc.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: sc.LUNAR_DAY!,
  })
  const recs = a.activityRecommendations as unknown as Rec[]
  const demo = recs.find((r) => r.activityId === 'demolition')!
  const out: string[] = [
    [
      'D',
      date,
      BR[sc.MONTH_JIAN_BRANCH!]! + '-' + ST[a.dayCanChi.can]! + BR[a.dayCanChi.chi]!,
      e.isThoVuongDungSu(date) ? 'soil' : '-',
      demo.contributions.find((c) => c.ruleId === 'kiep_sat')?.classical?.verdict ?? '-',
    ].join('\t'),
  ]
  for (const r of recs) {
    const json = JSON.stringify(r)
    if (json.includes('xieji-vol10-jiesha-faithful'))
      throw new Error(`authority stamp on activity ${date} ${r.activityId}`)
    out.push(
      [
        'A',
        date,
        r.activityId,
        r.score,
        r.status,
        r.hardWarning,
        h16(json),
        ...(r.activityId === 'demolition'
          ? [
              verdicts(r) || '-',
              h16(JSON.stringify(r.contributions.map((x) => [x.ruleId, x.status]))),
              JSON.stringify(e.p4ActivityState(r.activityId, heads)),
            ]
          : []),
      ].join('\t'),
    )
  }
  for (const [id] of e.EVENT_OPTIONS)
    for (const h of e.EVENT_HOURS) {
      const ev = e.eventOutput(e.evaluateEventDay, date, id, h) as {
        score: unknown
        classification: string
      }
      const raw = JSON.stringify(ev)
      out.push(
        [
          'E',
          date,
          `${id}@${h ?? ''}`,
          ev.score ?? '',
          ev.classification,
          h16(raw.replaceAll(V3_ID, V2_ID)),
          h16(raw),
        ].join('\t'),
      )
    }
  return out
}

type Ev = { classicalResolution?: { items?: { authority?: string }[] } } & Record<string, unknown>
/** The one field normalized: classicalResolution.items[].authority (v3 → v2). Any other occurrence of the v3 id
 * survives and throws, so nothing else can be hidden. */
function normalizeStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? [])
    if (it.authority === V3_ID) it.authority = V2_ID
  const out = JSON.stringify(c)
  if (out.includes(V3_ID))
    throw new Error('authority v3 id outside classicalResolution.items[].authority')
  return out
}
/** The same output with the authority field removed outright (second, independent equality). */
function withoutStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? []) delete it.authority
  return JSON.stringify(c)
}
type Kind = 'unchanged' | 'stampOnly' | 'semantic'
/** pre-G1-glyph (v2 stamp) vs Stage 2 (v3 stamp): canonical serialized equality, no field subset. */
function classify(pre: Ev, post: Ev): Kind {
  const raw = JSON.stringify(pre) !== JSON.stringify(post)
  const semantic = JSON.stringify(pre) !== normalizeStamp(post)
  if (!raw && semantic) throw new Error('normalization created a difference')
  if (raw && !semantic && withoutStamp(pre) !== withoutStamp(post))
    throw new Error('stamp-only row differs once the stamp is removed')
  return !raw ? 'unchanged' : semantic ? 'semantic' : 'stampOnly'
}

const DUMP = process.env.G1GS2_DUMP
const G1B = process.env.G1GS2_G1B === '1'
const STAMP = process.env.G1GS2_STAMP === '1'
const jieDay = (monthJianBranch: number, dayStem: number, dayBranch: number) => ({
  monthJianBranch,
  dayStem,
  dayBranch,
  officerId: 'tru',
  presentGods: new Set(['kiep_sat']),
  unknownGods: new Set<string>(),
})
const ctxDay = (key: string) => {
  const i = Array.from({ length: 60 }, (_, k) => k).find(
    (k) => ST[k % 10]! + BR[k % 12]! === key.slice(1),
  )!
  return jieDay(BR.indexOf(key[0]!), i % 10, i % 12)
}
const demolitionJie = (e: Engine, key: string) =>
  e.R.resolveVol10(ctxDay(key), ['demolition']).find((r) => r.entry === 'jie_sha')!

describe('G1 glyph Stage 2 migration (劫煞 authority v3, R3)', () => {
  it.skipIf(!DUMP)(
    'dumps every day of the range per model (G1GS2_DUMP)',
    { timeout: 36_000_000 },
    async () => {
      const dir = process.env.G1GS2_OUT!
      mkdirSync(dir, { recursive: true })
      const range = days(
        process.env.G1GS2_FROM ?? '1900-01-01',
        process.env.G1GS2_TO ?? '2100-12-31',
      )
      // Several models in one process run in order (rollback,forward = re-enable after rollback).
      for (const [i, model] of (DUMP!.split(',') as Model[]).entries()) {
        const e = await load(model)
        const fd = openSync(`${dir}/${i}-${model}.tsv`, 'w')
        for (const d of range) writeSync(fd, dumpDay(e, d).join('\n') + '\n')
        closeSync(fd)
      }
    },
  )

  it.skipIf(!STAMP)(
    'authority stamp gate: every event, every day 1900–2100, raw = semantic + stamp-only (G1GS2_STAMP)',
    { timeout: 36_000_000 },
    async () => {
      const pre = await load('rollback')
      const post = await load('forward')
      const { resolveEventActivities } = await import('./eventMapping')
      const g2Profile = (id: string) =>
        resolveEventActivities(id).some((a) => a === 'contract' || a === 'transaction')
      const scope = new Set(
        Object.values(
          JSON.parse(
            readFileSync(
              'docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json',
              'utf8',
            ),
          ) as Record<string, string[]>,
        ).flat(),
      )
      const zero = () => ({
        evaluations: 0,
        rawChanged: 0,
        semanticChanged: 0,
        semanticScore: 0,
        semanticClassification: 0,
        semanticEvidenceOnly: 0,
        authorityStampOnly: 0,
        intersection: 0,
        unclassifiedRawChanges: 0,
      })
      const t = { domain: zero(), outside: zero() }
      const stampByEvent: Record<string, number> = {}
      const stampDates = new Set<string>()
      let stampOutsideScope = 0
      let stampOnG2Profile = 0
      for (const d of days('1900-01-01', '2100-12-31')) {
        const c = t[d >= '2025-01-01' && d <= '2027-12-31' ? 'domain' : 'outside']
        for (const [id] of post.EVENT_OPTIONS)
          for (const h of post.EVENT_HOURS) {
            const a = pre.eventOutput(pre.evaluateEventDay, d, id, h) as Ev
            const b = post.eventOutput(post.evaluateEventDay, d, id, h) as Ev
            const k = classify(a, b)
            const raw = JSON.stringify(a) !== JSON.stringify(b)
            const sem = k === 'semantic'
            const stamp = k === 'stampOnly'
            c.evaluations++
            c.rawChanged += raw ? 1 : 0
            c.intersection += sem && stamp ? 1 : 0
            c.unclassifiedRawChanges += raw && !sem && !stamp ? 1 : 0
            if (sem) {
              c.semanticChanged++
              const [x, y] = [a, b] as unknown as { score: unknown; classification: unknown }[]
              if (x!.score !== y!.score) c.semanticScore++
              if (x!.classification !== y!.classification) c.semanticClassification++
              if (x!.score === y!.score && x!.classification === y!.classification)
                c.semanticEvidenceOnly++
            }
            if (stamp) {
              c.authorityStampOnly++
              stampByEvent[id] = (stampByEvent[id] ?? 0) + 1
              stampDates.add(d)
              if (!scope.has(d)) stampOutsideScope++
              if (g2Profile(id)) stampOnG2Profile++
              if (!JSON.stringify(a).includes(V2_ID))
                throw new Error(`stamp-only without a v2 stamp: ${d} ${id}`)
            }
          }
      }
      const out =
        JSON.stringify(
          {
            version: 'g1-glyph-stage2-authority-stamp-v1',
            range: ['1900-01-01', '2100-12-31'],
            sampling: 'none: every day × every event × {no hour, hour 9}',
            pre: 'rollback graph (authority v2 at the imported path) = shipped f3c68c6 (rollback.json)',
            post: 'shipped G1 glyph Stage 2 (authority v3, R3)',
            normalized:
              'classicalResolution.items[].authority only, v3 → v2; the v3 id anywhere else throws',
            equality:
              'JSON.stringify of the whole event output (canonical serialized equality); stamp-only rows are also equal with the authority field deleted on both sides',
            counts: t,
            total: {
              rawChanged: t.domain.rawChanged + t.outside.rawChanged,
              semanticChanged: t.domain.semanticChanged + t.outside.semanticChanged,
              authorityStampOnly: t.domain.authorityStampOnly + t.outside.authorityStampOnly,
            },
            stampOnly: {
              byEvent: Object.fromEntries(Object.entries(stampByEvent).sort()),
              dates: stampDates.size,
              datesOutsideJieshaAuthorityScope: stampOutsideScope,
              onContractTransactionProfileEvents: stampOnG2Profile,
            },
          },
          null,
          1,
        ) + '\n'
      if (process.env.G1GS2_WRITE === '1') writeFileSync(OUT + 'authority-stamp.json', out)
      expect(out).toBe(readFileSync(OUT + 'authority-stamp.json', 'utf8'))
    },
  )

  it.skipIf(!G1B)(
    'G1-b counterfactual: source-key-v1 on authority v3 vs v2, every 2025–2027 day (G1GS2_G1B)',
    { timeout: 3_600_000 },
    async () => {
      const { P4_DOMAIN_DATES } = await import('./p4AdapterBaselineRows')
      const row = (e: Engine, d: string) => {
        const a = e.getAlmanac(d as never)
        const sc = a.selectionContext
        const r = (a.activityRecommendations as unknown as Rec[]).find(
          (x) => x.activityId === 'demolition',
        )!
        const ctx = BR[sc.MONTH_JIAN_BRANCH!]! + ST[a.dayCanChi.can]! + BR[a.dayCanChi.chi]!
        return { ctx, score: r.score, status: r.status, hw: r.hardWarning, v: verdicts(r) }
      }
      // Two-mode comparisons (canonical-v1 vs source-key-v1) per authority, G1-b day definition: a day
      // changes when demolition's score, status or hard warning differs.
      const modes = async (canon: Model, sk: Model) => {
        const a = await load(canon)
        const ca = P4_DOMAIN_DATES.map((d) => row(a, d))
        const b = await load(sk)
        const sb = P4_DOMAIN_DATES.map((d) => row(b, d))
        let days = 0
        let score = 0
        let status = 0
        let hw = 0
        ca.forEach((x, i) => {
          const y = sb[i]!
          if (x.score !== y.score || x.status !== y.status || x.hw !== y.hw) days++
          score += x.score !== y.score ? 1 : 0
          status += x.status !== y.status ? 1 : 0
          hw += x.hw !== y.hw ? 1 : 0
        })
        return {
          changedDemolitionDays: days,
          scoreChanges: score,
          statusChanges: status,
          hardWarningChanges: hw,
        }
      }
      const historical = await modes('rollback', 'rollback-sk')
      const crossVersion = await modes('forward', 'forward-sk')
      const v2 = await load('rollback-sk')
      const before = P4_DOMAIN_DATES.map((d) => row(v2, d))
      const v3 = await load('forward-sk')
      const rows: Record<string, unknown>[] = []
      let other = 0
      P4_DOMAIN_DATES.forEach((d, i) => {
        const b = row(v3, d)
        const a = before[i]!
        if (JSON.stringify(a) === JSON.stringify(b)) return
        rows.push({
          date: d,
          context: a.ctx,
          before: `${a.score} ${a.status}`,
          after: `${b.score} ${b.status}`,
          kiepBefore: a.v.split(' ').find((x) => x.startsWith('kiep_sat:')) ?? '-',
          kiepAfter: b.v.split(' ').find((x) => x.startsWith('kiep_sat:')) ?? '-',
          hardWarning: [a.hw, b.hw],
        })
        if (a.hw !== b.hw) other++
      })
      const out =
        JSON.stringify(
          {
            version: 'g1-glyph-stage2-g1b-counterfactual-v1',
            question:
              'G1-b rollback configuration (p4ScoreHeadingLookup source-key-v1) on authority v3 vs v2, 2025–2027',
            production: 'not affected: production runs canonical-v1 (summary.json domain delta 0)',
            ruling:
              'owner 2026-10-25: G1-b history is pinned to authority v2; the v3 figures are a cross-version counterfactual and never redefine it',
            historicalG1b: {
              authority: V2_ID,
              comparison: 'canonical-v1 vs source-key-v1',
              ...historical,
            },
            crossVersion: {
              authority: V3_ID,
              comparison: 'canonical-v1 vs source-key-v1',
              ...crossVersion,
            },
            rollbackOrder:
              'authority v3 → roll back G1 glyph to authority v2 → roll back G1-b canonical-v1 → source-key-v1; rolling back G1-b alone on v3 does not reproduce pre-G1-b output',
            days: P4_DOMAIN_DATES.length,
            changed: rows.length,
            hardWarningChanges: other,
            contexts: Object.fromEntries(
              [...new Set(rows.map((r) => r.context as string))]
                .sort()
                .map((c) => [c, rows.filter((r) => r.context === c).length]),
            ),
            rows,
          },
          null,
          1,
        ) + '\n'
      if (process.env.G1GS2_WRITE === '1') writeFileSync(OUT + 'g1b-counterfactual.json', out)
      expect(out).toBe(readFileSync(OUT + 'g1b-counterfactual.json', 'utf8'))
    },
  )

  if (DUMP) return

  it('stamp normalizer: only the authority field; real changes stay semantic', () => {
    const pre = {
      score: 50,
      classification: 'caution',
      contributions: [{ ruleId: 'kiep_sat', status: 'applied', scoreDelta: -15 }],
      classicalResolution: {
        items: [{ entry: 'jie_sha', activityId: 'wedding', verdict: 'avoid', authority: V2_ID }],
      },
    }
    const post = (f: (x: typeof pre) => void = () => {}) => {
      const x = structuredClone(pre)
      x.classicalResolution.items[0]!.authority = V3_ID
      f(x)
      return x
    }
    expect(classify(pre, structuredClone(pre))).toBe('unchanged')
    expect(classify(pre, post())).toBe('stampOnly')
    for (const f of [
      (x: typeof pre) => void (x.score = 35),
      (x: typeof pre) => void (x.classification = 'not_recommended'),
      (x: typeof pre) => void (x.classicalResolution.items[0]!.verdict = 'no_annotation'),
      (x: typeof pre) => void (x.contributions[0]!.status = 'informational'),
      (x: typeof pre) => void (x.contributions[0]!.scoreDelta = 0),
    ])
      expect(classify(pre, post(f))).toBe('semantic')
    // A stamp added or dropped is not a version bump: semantic.
    expect(
      classify(
        {
          ...pre,
          classicalResolution: {
            items: [{ ...pre.classicalResolution.items[0]!, authority: undefined as never }],
          },
        },
        post(),
      ),
    ).toBe('semantic')
    expect(() =>
      classify(
        pre,
        post((x) => Object.assign(x, { note: V3_ID })),
      ),
    ).toThrow(/outside/)
    expect(() =>
      classify(
        pre,
        post((x) => void (x.classicalResolution.items[0]!.verdict = V3_ID)),
      ),
    ).toThrow(/outside/)
  })

  it('versions: authority v3 shipped; policy string, dataset, adapter and lookup unchanged', async () => {
    const m = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
      datasetVersion: string
      policies: Record<string, unknown>
    }
    expect(m.datasetVersion).toBe('1.2.1')
    expect(m.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
    expect(m.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    const e = await load('forward')
    expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V3_ID)
    expect((await import('./p4ScoreAdapter')).P4_SCORE_ADAPTER_VERSION).toBe('p4-score-adapter-v1')
    for (const [p, h] of [
      [
        'shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
        '13ba27ee6ba5ebc0611b771982bd3da2f6540b5abee6d310584bc2a3c12259e3',
      ],
      [
        'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json',
        '4184778d9f4dea8c9e446b29f6c45f6f26c2002477ceec64606d42460eac8baf',
      ],
    ] as const)
      expect(sha(readFileSync(p)), p).toBe(h)
  })

  it('production access matrix: 395 APPLIED + exactly the 5 excluded demolition contexts', async () => {
    const e = await load('forward')
    const a = JSON.parse(
      readFileSync('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json', 'utf8'),
    ) as Auth & { activities: string[] }
    const seen: Record<string, string[]> = {}
    for (const key of Object.keys(a.cells))
      for (const act of a.activities) {
        const r = e.A.getVol10JieshaRuntime(key[0]!, key.slice(1), act)
        ;(seen[r.status] ??= []).push(`${act}@${key}`)
      }
    expect(Object.keys(seen).sort()).toEqual(['APPLIED', EXCLUDED_STATUS])
    expect(seen.APPLIED!.length).toBe(395)
    expect(seen[EXCLUDED_STATUS]!.sort()).toEqual(EXCLUDED.map((k) => `demolition@${k}`).sort())
  })

  it('excluded contexts: authority application throws; normal evaluation keeps the legacy verdict', async () => {
    const e = await load('forward')
    for (const key of EXCLUDED) {
      // Path 1: authority access. The runtime is an exclusion without a cell; the cell accessor throws.
      const r = e.A.getVol10JieshaRuntime(key[0]!, key.slice(1), 'demolition')
      expect(r, key).toMatchObject({ status: EXCLUDED_STATUS })
      expect(r).not.toHaveProperty('cell')
      expect(() => e.A.vol10JieshaCell(r), key).toThrow(new RegExp(EXCLUDED_STATUS))
      // Path 2: normal evaluation. Reachable via NORM 壞→壊, still no_annotation (never avoid), marked.
      const j = demolitionJie(e, key)
      expect([j.verdict, j.authority], key).toEqual(['no_annotation', V3_ID])
      expect(j.authorityExclusion, key).toMatch(new RegExp(`^${EXCLUDED_STATUS}: `))
    }
    // The 11 APPLIED contexts read their cell through the guard: avoid.
    for (const key of ['辰乙巳', '辰己巳', '辰癸巳', '辰辛巳', '未丙申', '未壬申', '未庚申'])
      expect(demolitionJie(e, key).verdict, key).toBe('avoid')
    for (const key of ['戌丁亥', '戌乙亥', '戌己亥', '戌癸亥'])
      expect(demolitionJie(e, key).verdict, key).toBe('avoid')
  })

  it('reachability ≠ applicability: NORM, aliases and resolver reach cannot bypass context coverage', async () => {
    const e = await load('forward')
    expect(e.R.splitHeadings('破屋壞垣')).toEqual(['破屋壊垣'])
    expect(e.R.canonicalP4HeadingKey('破屋壞垣')).toBe('破屋壊垣')
    const vol10 = JSON.parse(
      readFileSync('shared/almanac-data/xiejibianfangshu-vol10-yiji.json', 'utf8'),
    ) as { headingAliases: Record<string, string[]> }
    // No alias targets the demolition heading; demolition reaches 劫煞 only through NORM.
    expect(
      Object.entries(vol10.headingAliases).filter(([k, v]) =>
        [k, ...v].some((h) => /[壞壊]/.test(h)),
      ),
    ).toEqual([])
    // Reached in all 16 contexts; applied in exactly 11.
    const keys = [
      ...EXCLUDED,
      ...['辰乙巳', '辰己巳', '辰癸巳', '辰辛巳', '未丙申', '未壬申', '未庚申'],
      ...['戌丁亥', '戌乙亥', '戌己亥', '戌癸亥'],
    ]
    const res = keys.map((k) => demolitionJie(e, k))
    expect(res.every((r) => r.authority === V3_ID && r.verdict !== 'not_listed')).toBe(true)
    expect(res.filter((r) => r.verdict === 'avoid').length).toBe(11)
    expect(res.filter((r) => r.authorityExclusion).length).toBe(5)
  })

  it('fail loud: malformed v3 demolition coverage is rejected on import', async () => {
    const outcome: Record<string, string> = {}
    for (const m of [
      'm-excluded-avoid',
      'm-excluded-blank',
      'm-excluded-applied',
      'm-excluded-approved',
      'm-applied-no-cell',
      'm-applied-unapproved',
      'm-context-missing',
    ] as const) {
      try {
        const e = await load(m)
        e.R.resolveVol10(ctxDay('丑壬寅'), ['demolition'])
        outcome[m] = 'no error'
      } catch (err) {
        outcome[m] = String((err as Error).message).replace(/\{.*\}/, '{…}')
      }
    }
    for (const [m, v] of Object.entries(outcome)) expect(v, m).toBe(`invalid ${V3_ID}: {…}`)
    if (process.env.G1GS2_WRITE === '1')
      writeFileSync(OUT + 'mutation-results.json', JSON.stringify(outcome, null, 1) + '\n')
    expect(JSON.parse(readFileSync(OUT + 'mutation-results.json', 'utf8'))).toEqual(outcome)
  })

  it('G2 invariants: contract / transaction identical to v2; 未-戊申 blank (I1); alias unchanged', async () => {
    const fwd = await load('forward')
    const rb = await load('rollback')
    for (const key of ['未戊申', '未壬申', '辰乙巳', '丑壬寅'])
      for (const a of ['contract', 'transaction'])
        expect(fwd.A.getVol10JieshaRuntime(key[0]!, key.slice(1), a), `${key} ${a}`).toEqual(
          rb.A.getVol10JieshaRuntime(key[0]!, key.slice(1), a),
        )
    expect(fwd.A.getVol10JieshaRuntime('未', '戊申', 'contract')).toEqual({
      status: 'APPLIED',
      cell: 'blank',
    })
    expect(fwd.R.splitHeadings('立劵交易')).toEqual(['立券交易'])
  })

  it(
    'witnesses and controls: rollback → forward exact (Stage 1 witnesses.json)',
    { timeout: 300_000 },
    async () => {
      const W: [string, number, string, number, string][] = [
        ['2024-07-07', 50, 'neutral', 35, 'watch'],
        ['2028-04-14', 50, 'neutral', 35, 'watch'],
        ['2024-10-26', 35, 'watch', 20, 'avoid'],
        ['2028-04-26', 35, 'watch', 20, 'avoid'],
        ['2023-01-20', 35, 'watch', 35, 'watch'], // 丑-戊寅 excluded, in window: unchanged
        ['2028-01-18', 35, 'watch', 35, 'watch'], // 丑-壬寅 excluded, in window: unchanged
        ['2028-01-01', 50, 'no_evidence', 50, 'no_evidence'],
        ['2028-01-06', 50, 'neutral', 50, 'neutral'],
        ['2029-01-12', 50, 'neutral', 50, 'neutral'],
        ['2025-04-06', 50, 'neutral', 50, 'neutral'],
        ['2025-04-30', 20, 'avoid', 20, 'avoid'],
        // G1-b witnesses stay only_ji / 20 / avoid.
        ['2025-02-02', 20, 'avoid', 20, 'avoid'],
        ['2026-01-28', 20, 'avoid', 20, 'avoid'],
        ['2027-01-23', 20, 'avoid', 20, 'avoid'],
        ['2026-08-02', 20, 'avoid', 20, 'avoid'],
        ['2027-07-28', 20, 'avoid', 20, 'avoid'],
      ]
      const at = async (m: Model) => {
        const e = await load(m)
        return W.map(([d]) => {
          const r = (e.getAlmanac(d as never).activityRecommendations as unknown as Rec[]).find(
            (x) => x.activityId === 'demolition',
          )!
          return [d, r.score, r.status, r.hardWarning] as const
        })
      }
      expect(await at('rollback')).toEqual(W.map(([d, s, st]) => [d, s, st, false]))
      expect(await at('forward')).toEqual(W.map(([d, , , s, st]) => [d, s, st, false]))
    },
  )

  it('guard: every authority mock targets the path production imports', () => {
    const src = readFileSync('shared/lunar/xiejiVol10JieshaAuthority.ts', 'utf8')
    const imported = src.match(
      /from '(\.\.\/almanac-data\/xieji-vol10-jiesha-authority-v\d+\.json)'/,
    )![1]
    expect(imported).toBe(AUTH)
    const bad: string[] = []
    for (const f of readdirSync('shared/lunar').filter((x) => x.endsWith('.ts'))) {
      const s = readFileSync(`shared/lunar/${f}`, 'utf8')
      for (const m of s.matchAll(
        /vi\.(?:do)?[mM]ock\(\s*'(\.\.\/almanac-data\/xieji-vol10-jiesha-authority-v\d+\.json)'/g,
      ))
        if (m[1] !== imported) bad.push(`${f}: ${m[1]}`)
      for (const m of s.matchAll(
        /const AUTH = '(\.\.\/almanac-data\/xieji-vol10-jiesha-authority-v\d+\.json)'/g,
      ))
        if (m[1] !== imported) bad.push(`${f}: AUTH ${m[1]}`)
    }
    expect(bad).toEqual([])
  })

  it('frozen envelope: domain 0; outside 1,119 / −15 / 464 / 655; events 0 semantic; rollback raw-equal', () => {
    type T = Record<string, number | Record<string, number>>
    const s = JSON.parse(readFileSync(OUT + 'summary.json', 'utf8')) as {
      migration: Record<'domain' | 'outside', T>
      checks: Record<string, boolean>
      unexpected: number
    }
    const pick = (t: T) =>
      [
        t.demolitionChangedDays,
        t.scoreChanged,
        t.scoreLower,
        t.scoreHigher,
        t.statusChanged,
        t.hardWarningChanged,
        t.p4StateChanged,
        t.evidenceOnly,
        t.otherActivityChanged,
        t.g2ActivityChanged,
        t.excludedContextRowsChanged,
        t.eventSemanticChanged,
      ] as number[]
    expect(pick(s.migration.domain)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(pick(s.migration.outside)).toEqual([1119, 1119, 1119, 0, 1119, 0, 0, 0, 0, 0, 0, 0])
    expect(s.migration.outside.statusTransitions).toEqual({
      'neutral→watch': 464,
      'watch→avoid': 655,
    })
    expect(s.migration.outside.scoreDeltas).toEqual({ '-15': 1119 })
    expect(Object.values(s.checks).every(Boolean)).toBe(true)
    expect(s.unexpected).toBe(0)
    const r = JSON.parse(readFileSync(OUT + 'rollback.json', 'utf8')) as {
      dumpSha256: Record<string, string>
      rollbackEqualsPreG1GlyphMain: boolean
      reEnableEqualsForward: boolean
    }
    expect([r.rollbackEqualsPreG1GlyphMain, r.reEnableEqualsForward]).toEqual([true, true])
    expect(r.dumpSha256.stage2Rollback).toBe(r.dumpSha256.preG1GlyphMain)
    expect(r.dumpSha256.stage2ReEnable).toBe(r.dumpSha256.stage2Forward)
    const a = JSON.parse(readFileSync(OUT + 'authority-stamp.json', 'utf8')) as {
      counts: Record<'domain' | 'outside', Record<string, number>>
      stampOnly: { dates: number; datesOutsideJieshaAuthorityScope: number }
    }
    for (const [set, stamp] of [
      ['domain', 462],
      ['outside', 35_530],
    ] as const) {
      const c = a.counts[set]
      expect([c.rawChanged, c.semanticChanged, c.authorityStampOnly], set).toEqual([
        stamp,
        0,
        stamp,
      ])
      expect([c.intersection, c.unclassifiedRawChanges], set).toEqual([0, 0])
    }
    expect(a.stampOnly).toMatchObject({ dates: 1_636, datesOutsideJieshaAuthorityScope: 0 })
    const m = JSON.parse(readFileSync(OUT + 'jiesha-mutation-results.json', 'utf8')) as {
      mutations: number
      caught: number
      restored: boolean
    }
    expect([m.caught, m.restored]).toEqual([m.mutations, true])
    // G1-b counterfactual (owner decision): source-key-v1 on v3 vs v2 = the 15 domain scope dates of the
    // APPLIED contexts, all −15, no hard warning. Production (canonical-v1) is not affected.
    const g = JSON.parse(readFileSync(OUT + 'g1b-counterfactual.json', 'utf8')) as {
      changed: number
      hardWarningChanges: number
      historicalG1b: Record<string, unknown>
      crossVersion: Record<string, unknown>
      rows: { date: string; context: string; kiepAfter: string }[]
    }
    expect([g.changed, g.hardWarningChanges]).toEqual([15, 0])
    // Historical G1-b (authority v2) vs cross-version counterfactual (authority v3), recorded separately.
    expect(g.historicalG1b).toMatchObject({
      authority: V2_ID,
      changedDemolitionDays: 353,
      scoreChanges: 320,
      statusChanges: 337,
      hardWarningChanges: 0,
    })
    expect(g.crossVersion).toMatchObject({
      authority: V3_ID,
      changedDemolitionDays: 342,
      scoreChanges: 309,
      statusChanges: 326,
      hardWarningChanges: 0,
    })
    expect(g.rows.every((r) => r.kiepAfter === 'kiep_sat:applied:avoid')).toBe(true)
    const scope = JSON.parse(
      readFileSync('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json', 'utf8'),
    ) as Record<string, string[]>
    const applied = Object.entries(scope)
      .filter(([k]) => !EXCLUDED.includes(k.replace('-', '')))
      .flatMap(([, ds]) => ds.filter((d) => d >= '2025-01-01' && d <= '2027-12-31'))
      .sort()
    expect(g.rows.map((r) => r.date)).toEqual(applied)
  })

  it('committed Stage 2 artifacts equal their lock', () => {
    const lock = JSON.parse(readFileSync(OUT + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
      inputs: { path: string; sha256: string }[]
      outputs?: { path: string; sha256: string }[]
    }
    for (const f of [...lock.files, ...(lock.outputs ?? []), ...lock.inputs])
      expect(sha(readFileSync(f.path)), f.path).toBe(f.sha256)
  })
})
