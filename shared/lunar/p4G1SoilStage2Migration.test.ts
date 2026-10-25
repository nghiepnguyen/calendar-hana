import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// G1-SOIL Stage 2 (docs/audits/p4-g1-soil-stage2-spec.md, owner ruling 2026-10-25): 劫煞 authority v4, the 5
// demolition contexts APPLIED_DATE_DEPENDENT (selector tho-vuong-dung-su-rule-v1: inside 土王用事 avoid, outside
// blank). Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4G1GlyphStage2Migration:
//   forward    shipped Stage 2 files (authority v4).
//   rollback   authority v3 at the path production imports (g1GlyphRollback.ts) = shipped d5c005f.
//   pre        no mock, authority v3 expected: only for a dump on a d5c005f worktree (pre-G1-SOIL main).
//   *-sk       p4ScoreHeadingLookup source-key-v1 (counterfactual #3 on the real authorities).
//   m-*        malformed authority v4: must fail on import or on lookup, never invent a cell.
// npm test: focused checks. G1SOIL2_DUMP=<models> G1SOIL2_OUT: per-row dump of every day 1900–2100 (no sampling),
// the G1 glyph Stage 2 row format. G1SOIL2_STAMP=1: exhaustive event classification. G1SOIL2_G1B=1:
// counterfactual #3 on v4.
type Model =
  | 'forward'
  | 'rollback'
  | 'pre'
  | 'forward-sk'
  | 'rollback-sk'
  | 'm-static-cell'
  | 'm-unknown-selector'
  | 'm-selector-cells'
  | 'm-unapproved'
  | 'm-plain-applied'
  | 'm-reason-kept'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
const MANIFEST = '../almanac-data/manifest.json'
const OUT = 'docs/audits/sources/p4-vol10/g1-soil-stage2/'
const V3_ID = 'xieji-vol10-jiesha-faithful-v3'
const V4_ID = 'xieji-vol10-jiesha-faithful-v4'
const SOIL = ['丑丙寅', '丑壬寅', '丑戊寅', '丑甲寅', '未戊申']
const SOIL_DATES: Record<string, { inside: string; outside: string }> = {
  丑甲寅: { inside: '2028-01-30', outside: '2031-01-14' },
  丑丙寅: { inside: '2030-01-31', outside: '2033-01-15' },
  丑壬寅: { inside: '2028-01-18', outside: '2029-01-12' },
  丑戊寅: { inside: '2032-02-02', outside: '2036-01-12' },
  未戊申: { inside: '2028-07-22', outside: '2029-07-17' },
}
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
  if (model.endsWith('-sk'))
    vi.doMock(MANIFEST, async (orig) => {
      const real = (await orig<{ default: { policies: object } }>()).default
      return {
        default: { ...real, policies: { ...real.policies, p4ScoreHeadingLookup: 'source-key-v1' } },
      }
    })
  if (model === 'forward' || model === 'pre' || model === 'forward-sk') return
  if (model === 'rollback' || model === 'rollback-sk')
    return vi.doMock(AUTH, async () => (await import('./g1GlyphRollback')).jieshaAuthorityV3())
  vi.doMock(AUTH, async (load) => {
    const a = structuredClone(((await load()) as { default: Auth }).default)
    const ctx = a.runtimeCoverage.activities.demolition!.contexts!
    const e = ctx['丑壬寅']!
    if (model === 'm-static-cell') a.cells['丑壬寅']!.demolition = 'avoid'
    if (model === 'm-unknown-selector') e.selector = 'tho-vuong-dung-su-rule-v2'
    if (model === 'm-selector-cells') e.cells = { inside: 'avoid' }
    if (model === 'm-unapproved') e.productionApproved = false
    if (model === 'm-plain-applied') {
      e.status = 'APPLIED'
      e.cell = 'avoid'
    }
    if (model === 'm-reason-kept') e.reason = 'excluded'
    return { default: a }
  })
}

async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  if (!model.startsWith('m-'))
    await (
      await import('./g1GlyphRollback')
    ).assertJieshaAuthority(model === 'forward' || model === 'forward-sk' ? V4_ID : V3_ID)
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
          h16(raw.replaceAll(V4_ID, V3_ID)),
          h16(raw),
        ].join('\t'),
      )
    }
  return out
}

type Ev = { classicalResolution?: { items?: { authority?: string }[] } } & Record<string, unknown>
/** The one field normalized: classicalResolution.items[].authority (v3 → v2). Any other occurrence of the v4 id
 * survives and throws, so nothing else can be hidden. */
function normalizeStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? [])
    if (it.authority === V4_ID) it.authority = V3_ID
  const out = JSON.stringify(c)
  if (out.includes(V4_ID))
    throw new Error('authority v4 id outside classicalResolution.items[].authority')
  return out
}
/** The same output with the authority field removed outright (second, independent equality). */
function withoutStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? []) delete it.authority
  return JSON.stringify(c)
}
type Kind = 'unchanged' | 'stampOnly' | 'semantic'
/** pre-G1-glyph (v3 stamp) vs Stage 2 (v3 stamp): canonical serialized equality, no field subset. */
function classify(pre: Ev, post: Ev): Kind {
  const raw = JSON.stringify(pre) !== JSON.stringify(post)
  const semantic = JSON.stringify(pre) !== normalizeStamp(post)
  if (!raw && semantic) throw new Error('normalization created a difference')
  if (raw && !semantic && withoutStamp(pre) !== withoutStamp(post))
    throw new Error('stamp-only row differs once the stamp is removed')
  return !raw ? 'unchanged' : semantic ? 'semantic' : 'stampOnly'
}

const DUMP = process.env.G1SOIL2_DUMP
const STAMP = process.env.G1SOIL2_STAMP === '1'
const G1B = process.env.G1SOIL2_G1B === '1'
const ctxDay = (key: string, civilDate?: string) => {
  const i = Array.from({ length: 60 }, (_, k) => k).find(
    (k) => ST[k % 10]! + BR[k % 12]! === key.slice(1),
  )!
  return {
    monthJianBranch: BR.indexOf(key[0]!),
    dayStem: i % 10,
    dayBranch: i % 12,
    officerId: 'tru',
    presentGods: new Set(['kiep_sat']),
    unknownGods: new Set<string>(),
    ...(civilDate ? { civilDate } : {}),
  }
}
const demolitionJie = (e: Engine, key: string, civilDate?: string) =>
  e.R.resolveVol10(ctxDay(key, civilDate), ['demolition']).find((r) => r.entry === 'jie_sha')!

describe('G1-SOIL Stage 2 migration (劫煞 authority v4, R2)', () => {
  it.skipIf(!DUMP)(
    'dumps every day of the range per model (G1SOIL2_DUMP)',
    { timeout: 36_000_000 },
    async () => {
      const dir = process.env.G1SOIL2_OUT!
      mkdirSync(dir, { recursive: true })
      const range = days('1900-01-01', '2100-12-31')
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
              if (!JSON.stringify(a).includes(V3_ID))
                throw new Error(`stamp-only without a v3 stamp: ${d} ${id}`)
            }
          }
      }
      const out =
        JSON.stringify(
          {
            version: 'g1-soil-stage2-authority-stamp-v1',
            range: ['1900-01-01', '2100-12-31'],
            sampling: 'none: every day × every event × {no hour, hour 9}',
            pre: 'rollback graph (authority v3 at the imported path) = shipped d5c005f (rollback.json)',
            post: 'shipped G1-SOIL Stage 2 (authority v4, R2)',
            normalized:
              'classicalResolution.items[].authority only, v4 → v3; the v4 id anywhere else throws',
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
      if (process.env.G1SOIL2_WRITE === '1') writeFileSync(OUT + 'authority-stamp.json', out)
      expect(out).toBe(readFileSync(OUT + 'authority-stamp.json', 'utf8'))
    },
  )

  it.skipIf(!G1B)(
    'counterfactual #3 on the real authorities: canonical-v1 vs source-key-v1 under v4 (G1SOIL2_G1B)',
    { timeout: 3_600_000 },
    async () => {
      const { P4_DOMAIN_DATES } = await import('./p4AdapterBaselineRows')
      const rows = async (m: Model) => {
        const e = await load(m)
        return P4_DOMAIN_DATES.map((d) => {
          const r = (e.getAlmanac(d as never).activityRecommendations as unknown as Rec[]).find(
            (x) => x.activityId === 'demolition',
          )!
          return [r.score, r.status, r.hardWarning] as const
        })
      }
      const count = (a: (readonly [number, string, boolean])[], b: typeof a) => {
        const out = {
          changedDemolitionDays: 0,
          scoreChanges: 0,
          statusChanges: 0,
          hardWarningChanges: 0,
        }
        a.forEach((x, i) => {
          const y = b[i]!
          if (x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2]) out.changedDemolitionDays++
          out.scoreChanges += x[0] !== y[0] ? 1 : 0
          out.statusChanges += x[1] !== y[1] ? 1 : 0
          out.hardWarningChanges += x[2] !== y[2] ? 1 : 0
        })
        return out
      }
      const [f, fsk, r, rsk] = [
        await rows('forward'),
        await rows('forward-sk'),
        await rows('rollback'),
        await rows('rollback-sk'),
      ]
      const out =
        JSON.stringify(
          {
            version: 'g1-soil-stage2-g1b-counterfactual-3-v1',
            note: 'counterfactual #3 measured on the shipped authority v4 (Stage 1 measured it on the audit composition); G1-b history (v2 353 / 320 / 337 / 0) and the v3 counterfactual (342 / 309 / 326 / 0) are not redefined',
            v4TwoMode: count(f, fsk),
            v3TwoMode: count(r, rsk),
            v4VsV3: {
              canonicalV1ChangedDays: P4_DOMAIN_DATES.filter(
                (_, i) => JSON.stringify(f[i]) !== JSON.stringify(r[i]),
              ).length,
              sourceKeyV1Dates: P4_DOMAIN_DATES.filter(
                (_, i) => JSON.stringify(fsk[i]) !== JSON.stringify(rsk[i]),
              ),
            },
          },
          null,
          1,
        ) + '\n'
      if (process.env.G1SOIL2_WRITE === '1') writeFileSync(OUT + 'g1b-counterfactual-3.json', out)
      expect(out).toBe(readFileSync(OUT + 'g1b-counterfactual-3.json', 'utf8'))
    },
  )

  if (DUMP) return

  it('stamp normalizer: only the authority field; real changes stay semantic', () => {
    const pre = {
      score: 50,
      classification: 'caution',
      contributions: [{ ruleId: 'kiep_sat', status: 'applied', scoreDelta: -15 }],
      classicalResolution: {
        items: [{ entry: 'jie_sha', activityId: 'wedding', verdict: 'avoid', authority: V3_ID }],
      },
    }
    const post = (f: (x: typeof pre) => void = () => {}) => {
      const x = structuredClone(pre)
      x.classicalResolution.items[0]!.authority = V4_ID
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
        post((x) => Object.assign(x, { note: V4_ID })),
      ),
    ).toThrow(/outside/)
    expect(() =>
      classify(
        pre,
        post((x) => void (x.classicalResolution.items[0]!.verdict = V4_ID)),
      ),
    ).toThrow(/outside/)
  })

  it('versions: authority v4 shipped with rule tho-vuong-dung-su-rule-v1; dataset, adapter, lookup unchanged', async () => {
    const m = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
      datasetVersion: string
      policies: Record<string, unknown>
    }
    expect(m.datasetVersion).toBe('1.2.1')
    expect(m.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
    expect(m.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    const e = await load('forward')
    expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V4_ID)
    expect((await import('./thoVuongDungSuRule')).THO_VUONG_DUNG_SU_RULE_ID).toBe(
      'tho-vuong-dung-su-rule-v1',
    )
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
      [
        'shared/almanac-data/xieji-vol10-jiesha-authority-v3.json',
        '4b6d2c7c241c521a719fb1733ddffd6cbd2a283da441a3324158a4476b8446fe',
      ],
    ] as const)
      expect(sha(readFileSync(p)), p).toBe(h)
  })

  it('rule identity: tho-vuong-dung-su-rule-v1 = the frozen 1900–2100 calendar (sha c2af8374…)', async () => {
    const { thoVuongDungSuState } = await import('./thoVuongDungSuRule')
    const inside: string[] = []
    for (const d of days('1900-01-01', '2100-12-31'))
      if (thoVuongDungSuState(d) === 'inside') inside.push(d)
    const cal = JSON.parse(
      readFileSync('docs/audits/sources/p4-vol10/g1-soil-stage1/soil-calendar.json', 'utf8'),
    ) as {
      totalDays: number
      datesSha256: string
    }
    expect(inside.length).toBe(cal.totalDays)
    expect(sha(inside.join('\n'))).toBe(cal.datesSha256)
    for (const bad of ['1899-12-31', '2101-01-01', '2028-02-30', '20280118', ''])
      expect(() => thoVuongDungSuState(bad), bad).toThrow()
  })

  it('production access matrix: 395 static APPLIED + 5 date-dependent (both soil states), 0 excluded', async () => {
    const e = await load('forward')
    const a = JSON.parse(
      readFileSync('shared/almanac-data/xieji-vol10-jiesha-authority-v4.json', 'utf8'),
    ) as Auth & {
      activities: string[]
    }
    const seen: Record<string, string[]> = {}
    for (const key of Object.keys(a.cells))
      for (const act of a.activities) {
        const dates =
          act === 'demolition' && SOIL.includes(key)
            ? Object.entries(SOIL_DATES[key]!)
            : [['static', undefined]]
        for (const [state, d] of dates) {
          const r = e.A.getVol10JieshaRuntime(key[0]!, key.slice(1), act, d)
          const tag =
            r.status === 'APPLIED' && 'soilState' in r && r.soilState
              ? `APPLIED:${r.soilState}:${r.cell}`
              : r.status
          ;(seen[tag] ??= []).push(`${act}@${key}${d ? `@${state}` : ''}`)
        }
      }
    expect(Object.keys(seen).sort()).toEqual([
      'APPLIED',
      'APPLIED:inside:avoid',
      'APPLIED:outside:blank',
    ])
    expect(seen.APPLIED!.length).toBe(395)
    expect(seen['APPLIED:inside:avoid']!.sort()).toEqual(
      SOIL.map((k) => `demolition@${k}@inside`).sort(),
    )
    expect(seen['APPLIED:outside:blank']!.sort()).toEqual(
      SOIL.map((k) => `demolition@${k}@outside`).sort(),
    )
  })

  it('date-dependent contexts: date decides the cell; no date / unsupported date fails loud', async () => {
    const e = await load('forward')
    for (const key of SOIL) {
      const { inside, outside } = SOIL_DATES[key]!
      expect(() => demolitionJie(e, key), key).toThrow(/needs a civil date/)
      expect(() => demolitionJie(e, key, '2101-01-01'), key).toThrow(/1900–2100/)
      const a = demolitionJie(e, key, inside)
      const b = demolitionJie(e, key, outside)
      expect([a.verdict, a.authority, a.authorityExclusion], key).toEqual([
        'avoid',
        V4_ID,
        undefined,
      ])
      expect([b.verdict, b.authority, b.authorityExclusion], key).toEqual([
        'no_annotation',
        V4_ID,
        undefined,
      ])
    }
    // The 11 static contexts need no date and ignore it.
    expect(demolitionJie(e, '辰乙巳').verdict).toBe('avoid')
    expect(demolitionJie(e, '辰乙巳', '2029-01-12').verdict).toBe('avoid')
  })

  it('fail loud: malformed v4 date-dependent coverage is rejected on import', async () => {
    const outcome: Record<string, string> = {}
    for (const m of [
      'm-static-cell',
      'm-unknown-selector',
      'm-selector-cells',
      'm-unapproved',
      'm-plain-applied',
      'm-reason-kept',
    ] as const) {
      try {
        const e = await load(m)
        e.R.resolveVol10(ctxDay('丑壬寅', '2028-01-18'), ['demolition'])
        outcome[m] = 'no error'
      } catch (err) {
        outcome[m] = String((err as Error).message).replace(/\{.*\}/, '{…}')
      }
    }
    for (const [m, v] of Object.entries(outcome)) expect(v, m).toBe(`invalid ${V4_ID}: {…}`)
    if (process.env.G1SOIL2_WRITE === '1')
      writeFileSync(OUT + 'mutation-results.json', JSON.stringify(outcome, null, 1) + '\n')
    expect(JSON.parse(readFileSync(OUT + 'mutation-results.json', 'utf8'))).toEqual(outcome)
  })

  it('G2 invariants: contract / transaction identical to v3; 未-戊申 blank (I1); alias unchanged', async () => {
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
        ['2028-01-18', 35, 'watch', 20, 'avoid'], // 丑-壬寅 inside
        ['2029-01-12', 50, 'neutral', 50, 'neutral'], // 丑-壬寅 outside: blank = v3 legacy output
        ['1914-07-21', 35, 'watch', 20, 'avoid'], // 未-戊申, entry day of the window
        ['1915-02-04', 35, 'watch', 20, 'avoid'], // 丑-丙寅, final day (立 − 1)
        ['2023-01-20', 35, 'watch', 20, 'avoid'], // 丑-戊寅, last change before the domain
        ['2025-02-02', 20, 'avoid', 20, 'avoid'], // P4-masked inside day
        ['2026-08-02', 20, 'avoid', 20, 'avoid'], // P4-masked inside day
        ['2025-04-06', 50, 'neutral', 50, 'neutral'], // static APPLIED context
        ['2028-04-14', 50, 'neutral', 35, 'watch'], // 辰-己巳 static avoid (unchanged by G1-SOIL: G1 glyph)
        ['2028-01-01', 50, 'no_evidence', 50, 'no_evidence'], // no 劫煞
        ['2028-01-06', 50, 'neutral', 50, 'neutral'], // 劫煞 with 德
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
      expect(await at('rollback')).toEqual(
        W.map(([d, s, st, s2, st2]) => [
          d,
          d === '2028-04-14' ? s2 : s,
          d === '2028-04-14' ? st2 : st,
          false,
        ]),
      )
      expect(await at('forward')).toEqual(W.map(([d, , , s, st]) => [d, s, st, false]))
    },
  )

  it('guard: every authority mock targets the path production imports', () => {
    const src = readFileSync('shared/lunar/xiejiVol10JieshaAuthority.ts', 'utf8')
    const imported = src.match(
      /from '(\.\.\/almanac-data\/xieji-vol10-jiesha-authority-v\d+\.json)'/,
    )![1]
    expect(imported).toBe(AUTH)
  })

  it('frozen envelope: domain 0; outside 298, −15, watch→avoid; events 0 semantic; rollback raw-equal; #3', () => {
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
        t.outsideSoilRowsChanged,
        t.eventSemanticChanged,
      ] as number[]
    expect(pick(s.migration.domain)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(pick(s.migration.outside)).toEqual([298, 298, 298, 0, 298, 0, 0, 0, 0, 0, 0, 0])
    expect(s.migration.outside.statusTransitions).toEqual({ 'watch→avoid': 298 })
    expect(s.migration.outside.scoreDeltas).toEqual({ '-15': 298 })
    expect(s.migration.outside.byContext).toEqual({
      '丑-丙寅': 61,
      '丑-壬寅': 58,
      '丑-戊寅': 59,
      '丑-甲寅': 60,
      '未-戊申': 60,
    })
    expect(Object.values(s.checks).every(Boolean)).toBe(true)
    expect(s.unexpected).toBe(0)
    const r = JSON.parse(readFileSync(OUT + 'rollback.json', 'utf8')) as {
      dumpSha256: Record<string, string>
      rollbackEqualsPreG1SoilMain: boolean
      reEnableEqualsForward: boolean
    }
    expect([r.rollbackEqualsPreG1SoilMain, r.reEnableEqualsForward]).toEqual([true, true])
    expect(r.dumpSha256.stage2Rollback).toBe(r.dumpSha256.preG1SoilMain)
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
    const g = JSON.parse(readFileSync(OUT + 'g1b-counterfactual-3.json', 'utf8')) as {
      v4TwoMode: Record<string, number>
      v3TwoMode: Record<string, number>
      v4VsV3: { canonicalV1ChangedDays: number; sourceKeyV1Dates: string[] }
    }
    expect(g.v4TwoMode).toEqual({
      changedDemolitionDays: 337,
      scoreChanges: 304,
      statusChanges: 321,
      hardWarningChanges: 0,
    })
    expect(g.v3TwoMode).toEqual({
      changedDemolitionDays: 342,
      scoreChanges: 309,
      statusChanges: 326,
      hardWarningChanges: 0,
    })
    expect(g.v4VsV3.canonicalV1ChangedDays).toBe(0)
    expect(g.v4VsV3.sourceKeyV1Dates).toEqual([
      '2025-02-02',
      '2026-01-28',
      '2026-08-02',
      '2027-01-23',
      '2027-07-28',
    ])
    const m = JSON.parse(readFileSync(OUT + 'jiesha-mutation-results.json', 'utf8')) as {
      mutations: number
      caught: number
      restored: boolean
    }
    expect([m.caught, m.restored]).toEqual([m.mutations, true])
  })

  it('committed Stage 2 artifacts equal their lock', () => {
    const lock = JSON.parse(readFileSync(OUT + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
      outputs?: { path: string; sha256: string }[]
      inputs: { path: string; sha256: string }[]
    }
    for (const f of [...lock.files, ...(lock.outputs ?? []), ...lock.inputs])
      expect(sha(readFileSync(f.path)), f.path).toBe(f.sha256)
  })
})
