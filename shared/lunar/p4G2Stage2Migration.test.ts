import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// G2 Stage 2 (docs/audits/p4-g2-stage2-migration.md): 卷十 headingAliases 立劵交易 → [立券交易] + 劫煞 authority v2.
// Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4G2Stage1Audit.test.ts:
//   forward    shipped Stage 2 files.
//   rollback   alias removed + authority v1 (g2Rollback.ts) = pre-G2 production.
//   text       independent mechanism: no alias, the 卷十 avoid lists themselves read 立券交易; authority v2.
//   weishen    text with the 未-戊申 contract/transaction cells set to avoid (dependency measurement only).
//   alias-v1   alias with authority v1: must fail loudly (an alias landing without its authority revision).
// npm test: focused checks and witnesses. G2S2_DUMP=<models> G2S2_FROM / G2S2_TO / G2S2_OUT: per-row dump
// (activities + events, every day, no sampling) that g2-stage2/compare.py turns into the committed diff.
type Model = 'forward' | 'rollback' | 'text' | 'weishen' | 'alias-v1'
const VOL10 = '../almanac-data/xiejibianfangshu-vol10-yiji.json'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v2.json'
const V1_ID = 'xieji-vol10-jiesha-faithful-v1'
const V2_ID = 'xieji-vol10-jiesha-faithful-v2'
const G2 = ['contract', 'transaction']

function mockModel(model: Model) {
  vi.doUnmock(VOL10)
  vi.doUnmock(AUTH)
  if (model === 'forward') return
  if (model === 'rollback' || model === 'alias-v1')
    vi.doMock(AUTH, async () => (await import('./g2Rollback')).jieshaAuthorityV1())
  if (model === 'rollback' || model === 'text' || model === 'weishen')
    vi.doMock(VOL10, async (load) => {
      const { withoutG2Alias } = await import('./g2Rollback')
      const real = withoutG2Alias(await load()).default as unknown as {
        entries: { avoid: string; extraAvoid?: { avoid: string }[] }[]
      }
      if (model === 'rollback') return { default: real }
      // Only the avoid lists are respelled; quotes and every other field stay byte-identical.
      const fix = (s: string) => s.replaceAll('立劵交易', '立券交易')
      return {
        default: {
          ...real,
          entries: real.entries.map((e) => ({
            ...e,
            avoid: fix(e.avoid),
            ...(e.extraAvoid && {
              extraAvoid: e.extraAvoid.map((x) => ({ ...x, avoid: fix(x.avoid) })),
            }),
          })),
        },
      }
    })
  if (model === 'weishen')
    vi.doMock(AUTH, async (load) => {
      const real = (
        (await load()) as {
          default: {
            cells: Record<string, Record<string, string>>
            counts: { avoid: number; blank: number }
          }
        }
      ).default
      return {
        default: {
          ...real,
          cells: {
            ...real.cells,
            未戊申: { ...real.cells['未戊申'], contract: 'avoid', transaction: 'avoid' },
          },
          counts: { ...real.counts, avoid: real.counts.avoid + 2, blank: real.counts.blank - 2 },
        },
      }
    })
}

async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { p4ActivityState } = await import('./p4ScoreAdapter')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
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
const sha = (s: string) => createHash('sha256').update(s).digest('hex')
// Dump rows: 64-bit prefixes keep 1900–2100 × 54 rows per day small; a collision would hide a diff, not add one.
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

/** One day as dump lines. A: every activity (score, status, hard warning, record sha; for contract / transaction
 * also the 卷十 verdicts, contribution ids and P4 state). E: every event × hour, sha taken with the authority id
 * normalized to v1 (`nsha`) and raw (`rsha`): v2 is a new id, and a version stamp alone is not a diff. */
function dumpDay(e: Engine, date: string): string[] {
  const a = e.getAlmanac(date as never)
  const heads = e.getP4DayHeadings(date, {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  })
  const out: string[] = []
  for (const r of a.activityRecommendations as unknown as Rec[]) {
    const json = JSON.stringify(r)
    if (json.includes('xieji-vol10-jiesha-faithful'))
      throw new Error(`authority stamp on activity ${date} ${r.activityId}`)
    const g2 = G2.includes(r.activityId)
    out.push(
      [
        'A',
        date,
        r.activityId,
        r.score,
        r.status,
        r.hardWarning,
        h16(json),
        ...(g2
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
          h16(raw.replaceAll(V2_ID, V1_ID)),
          h16(raw),
        ].join('\t'),
      )
    }
  return out
}

const OUT = 'docs/audits/sources/p4-vol10/g2-stage2/'
const DUMP = process.env.G2S2_DUMP
const STAMP = process.env.G2S2_STAMP === '1'

type Ev = { classicalResolution?: { items?: { authority?: string }[] } } & Record<string, unknown>
/** The one field normalized: classicalResolution.items[].authority (v2 → v1). Any other occurrence of
 * the v2 id would survive and fail the check below, so nothing else can be hidden. */
function normalizeStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? [])
    if (it.authority === V2_ID) it.authority = V1_ID
  const out = JSON.stringify(c)
  if (out.includes(V2_ID))
    throw new Error('authority v2 id outside classicalResolution.items[].authority')
  return out
}
/** The same output with the authority field removed outright (second, independent equality). */
function withoutStamp(ev: Ev) {
  const c = structuredClone(ev)
  for (const it of c.classicalResolution?.items ?? []) delete it.authority
  return JSON.stringify(c)
}
type Kind = 'unchanged' | 'stampOnly' | 'semantic'
/** pre-G2 (v1 stamp) vs Stage 2 (v2 stamp): canonical serialized equality, no field subset. */
function classify(pre: Ev, post: Ev): Kind {
  const raw = JSON.stringify(pre) !== JSON.stringify(post)
  const semantic = JSON.stringify(pre) !== normalizeStamp(post)
  if (!raw && semantic) throw new Error('normalization created a difference')
  if (raw && !semantic && withoutStamp(pre) !== withoutStamp(post))
    throw new Error('stamp-only row differs once the stamp is removed')
  return !raw ? 'unchanged' : semantic ? 'semantic' : 'stampOnly'
}

describe('G2 Stage 2 migration (立劵交易 → 立券交易, 劫煞 authority v2)', () => {
  it.skipIf(!DUMP)(
    'dumps every day of the range per model (G2S2_DUMP)',
    { timeout: 36_000_000 },
    async () => {
      const dir = process.env.G2S2_OUT!
      mkdirSync(dir, { recursive: true })
      const range = days(process.env.G2S2_FROM ?? '1900-01-01', process.env.G2S2_TO ?? '2100-12-31')
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
    'authority stamp gate: every event, every day 1900–2100, raw = semantic + stamp-only (G2S2_STAMP)',
    { timeout: 36_000_000 },
    async () => {
      const pre = await load('rollback') // = pre-G2 main, raw (rollback.json)
      const post = await load('forward')
      const { resolveEventActivities } = await import('./eventMapping')
      const g2Profile = (id: string) => resolveEventActivities(id).some((a) => G2.includes(a))
      const scope = new Map(
        Object.entries(
          JSON.parse(
            readFileSync(
              'docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json',
              'utf8',
            ),
          ) as Record<string, string[]>,
        ).flatMap(([ctx, ds]) => ds.map((d) => [d, ctx] as const)),
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
              if (!JSON.stringify(a).includes(V1_ID))
                throw new Error(`stamp-only without a v1 stamp: ${d} ${id}`)
            }
          }
      }
      const out =
        JSON.stringify(
          {
            version: 'g2-stage2-authority-stamp-v1',
            range: ['1900-01-01', '2100-12-31'],
            sampling: 'none: every day × 11 events × {no hour, hour 9}',
            pre: 'rollback graph (alias removed + authority v1) = pre-G2 main byte for byte (rollback.json)',
            post: 'shipped Stage 2 (alias + authority v2)',
            normalized:
              'classicalResolution.items[].authority only, v2 → v1; the v2 id anywhere else throws',
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
      if (process.env.G2S2_WRITE === '1') writeFileSync(OUT + 'authority-stamp.json', out)
      expect(out).toBe(readFileSync(OUT + 'authority-stamp.json', 'utf8'))
    },
  )

  if (DUMP) return

  it('stamp normalizer: only the authority field; real changes stay semantic', () => {
    const pre = {
      score: 50,
      classification: 'caution',
      contributions: [{ ruleId: 'kiep_sat', status: 'applied', scoreDelta: -15 }],
      classicalResolution: {
        items: [{ entry: 'jie_sha', activityId: 'wedding', verdict: 'avoid', authority: V1_ID }],
      },
    }
    const post = (f: (x: typeof pre) => void = () => {}) => {
      const x = structuredClone(pre)
      x.classicalResolution.items[0]!.authority = V2_ID
      f(x)
      return x
    }
    expect(classify(pre, structuredClone(pre))).toBe('unchanged')
    expect(classify(pre, post())).toBe('stampOnly')
    expect(
      classify(
        pre,
        post((x) => void (x.score = 35)),
      ),
    ).toBe('semantic')
    expect(
      classify(
        pre,
        post((x) => void (x.classification = 'not_recommended')),
      ),
    ).toBe('semantic')
    expect(
      classify(
        pre,
        post((x) => void (x.classicalResolution.items[0]!.verdict = 'no_annotation')),
      ),
    ).toBe('semantic')
    expect(
      classify(
        pre,
        post((x) => void (x.contributions[0]!.status = 'informational')),
      ),
    ).toBe('semantic')
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
    // Any other field carrying the v2 id is never normalized.
    expect(() =>
      classify(
        pre,
        post((x) => Object.assign(x, { note: V2_ID })),
      ),
    ).toThrow(/outside/)
    expect(() =>
      classify(
        pre,
        post((x) => void (x.classicalResolution.items[0]!.verdict = V2_ID)),
      ),
    ).toThrow(/outside/)
  })

  it('alias: exactly one new 卷十 headingAliases entry, source text untouched', async () => {
    const vol10 = JSON.parse(
      readFileSync('shared/almanac-data/xiejibianfangshu-vol10-yiji.json', 'utf8'),
    ) as {
      headingAliases: Record<string, string[]>
      entries: { avoid: string }[]
    }
    expect(vol10.headingAliases).toEqual({
      補垣: ['補垣塞穴'],
      宣布政事: ['宣政事', '布政事'],
      求醫療目: ['療目'],
      補捉: ['捕捉'],
      立劵交易: ['立券交易'],
    })
    // Every 劵 alias target is 立券交易 and only 立劵交易 maps there.
    const to = Object.entries(vol10.headingAliases).filter(([, v]) =>
      v.some((x) => x.includes('券')),
    )
    expect(to).toEqual([['立劵交易', ['立券交易']]])
    // The transcription keeps 劵 (6 avoid lists); no list was respelled to 券.
    expect(vol10.entries.filter((x) => x.avoid.includes('立劵交易')).length).toBe(6)
    expect(vol10.entries.filter((x) => x.avoid.includes('立券交易')).length).toBe(0)
    const e = await load('forward')
    // No global fold: NORM leaves 劵 alone everywhere else; the alias is a whole-heading entry.
    const src = readFileSync('shared/lunar/xiejiVol10Resolution.ts', 'utf8')
    expect(src).not.toMatch(/劵:/)
    expect(e.R.splitHeadings('立劵交易')).toEqual(['立券交易'])
    expect(e.R.splitHeadings('開市立劵交易納財')).toEqual(['開市', '立券交易', '納財'])
    expect(e.R.splitHeadings('破屋壞垣')).toEqual(['破屋壊垣'])
  })

  it('source integrity: transcriptions and data bytes = Stage 1 lock, plus exactly the alias line', () => {
    const stage1 = JSON.parse(
      readFileSync('docs/audits/sources/p4-vol10/g2-stage1/lock.json', 'utf8'),
    ) as { inputs: { path: string; sha256: string }[] }
    const at = new Map(stage1.inputs.map((f) => [f.path, f.sha256]))
    for (const p of [
      'docs/audits/sources/p4-vol10/vol10.raw.txt',
      'docs/audits/sources/p4-vol10/yi-sources-v1/vol11.raw.txt',
      'shared/almanac-data/xiejibianfangshu-yiji.json',
      'shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
    ])
      expect(createHash('sha256').update(readFileSync(p)).digest('hex'), p).toBe(at.get(p))
    const VOL10_JSON = 'shared/almanac-data/xiejibianfangshu-vol10-yiji.json'
    const now = readFileSync(VOL10_JSON, 'utf8')
    const line = ',\n    "立劵交易": ["立券交易"]'
    expect(now.split(line).length).toBe(2)
    expect(sha(now.replace(line, ''))).toBe(at.get(VOL10_JSON))
  })

  it(
    'contract and transaction reach 卷十 (forward) and do not on rollback',
    { timeout: 120_000 },
    async () => {
      // 辰 己巳 收日 with 劫煞: the 辰-己巳 cell is blank.
      const jieDay = {
        monthJianBranch: 4,
        dayStem: 5,
        dayBranch: 5,
        officerId: 'tru',
        presentGods: new Set(['kiep_sat']),
        unknownGods: new Set<string>(),
      }
      const v = (e: Engine) =>
        e.R.resolveVol10(jieDay, G2)
          .filter((r) => r.entry === 'jie_sha')
          .map((r) => [r.activityId, r.verdict, r.authority ?? null])
      expect(v(await load('forward'))).toEqual([
        ['contract', 'no_annotation', V2_ID],
        ['transaction', 'no_annotation', V2_ID],
      ])
      expect(v(await load('rollback'))).toEqual([
        ['contract', 'not_listed', null],
        ['transaction', 'not_listed', null],
      ])
      expect(v(await load('text'))).toEqual(v(await load('forward')))
    },
  )

  it(
    'authority v2 applies contract / transaction; v1 frozen; 未-戊申 blank (I1)',
    { timeout: 120_000 },
    async () => {
      const lock = (p: string) => sha(readFileSync(p, 'utf8'))
      expect(lock('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json')).toBe(
        '13ba27ee6ba5ebc0611b771982bd3da2f6540b5abee6d310584bc2a3c12259e3',
      )
      const e = await load('forward')
      expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V2_ID)
      for (const a of G2) {
        expect(e.A.getVol10JieshaRuntime('未', '戊申', a)).toEqual({
          status: 'APPLIED',
          cell: 'blank',
        })
        expect(e.A.getVol10JieshaRuntime('未', '壬申', a)).toEqual({
          status: 'APPLIED',
          cell: 'avoid',
        })
      }
      // I1: once reached, the blank removes 劫煞's penalty (no_annotation), the old not_listed is gone.
      const weishen = {
        monthJianBranch: 7,
        dayStem: 4,
        dayBranch: 8,
        officerId: 'tru',
        presentGods: new Set(['kiep_sat']),
        unknownGods: new Set<string>(),
      }
      const jie = (m: Engine) =>
        m.R.resolveVol10(weishen, G2)
          .filter((r) => r.entry === 'jie_sha')
          .map((r) => r.verdict)
      expect(jie(e)).toEqual(['no_annotation', 'no_annotation'])
      expect(jie(await load('rollback'))).toEqual(['not_listed', 'not_listed'])
      expect(jie(await load('weishen'))).toEqual(['avoid', 'avoid'])
      // The alias without its authority revision fails loudly (v1 marks the two UNREACHABLE).
      const bad = await load('alias-v1')
      expect(() => bad.R.resolveVol10(weishen, G2)).toThrow(/contract is UNREACHABLE.*reached/)
    },
  )

  it('P4 lookup, policies and versions unchanged', async () => {
    const m = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
      datasetVersion: string
      policies: Record<string, unknown>
    }
    expect(m.datasetVersion).toBe('1.2.1')
    expect(m.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
    expect(m.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    expect((await import('./p4ScoreAdapter')).P4_SCORE_ADAPTER_VERSION).toBe('p4-score-adapter-v1')
  })

  // docs/audits/p4-g2-vol10-heading-match.md §10 (2028-07-22 stays with the 未-戊申 authority item).
  const WITNESSES: [string, number, string, number, string][] = [
    ['2025-11-11', 20, 'avoid', 50, 'neutral'],
    ['2025-07-14', 35, 'watch', 50, 'neutral'],
    ['2026-05-03', 35, 'watch', 50, 'neutral'],
    ['2028-02-22', 50, 'no_evidence', 25, 'avoid'],
    ['2028-02-08', 40, 'watch', 70, 'recommended'],
    ['2028-03-10', 30, 'watch', 45, 'watch'],
    ['2028-09-26', 35, 'watch', 35, 'watch'],
  ]
  it(
    'witnesses: rollback → forward exact, transaction = contract, hard warning off',
    { timeout: 300_000 },
    async () => {
      const at = async (model: Model) => {
        const e = await load(model)
        return WITNESSES.map(([d]) => {
          const recs = e.getAlmanac(d as never).activityRecommendations as unknown as Rec[]
          const r = (id: string) => recs.find((x) => x.activityId === id)!
          const c = r('contract')
          const t = r('transaction')
          expect([t.score, t.status, verdicts(t).replaceAll('transaction', '')], d).toEqual([
            c.score,
            c.status,
            verdicts(c).replaceAll('contract', ''),
          ])
          return [d, c.score, c.status, c.hardWarning, verdicts(c)] as const
        })
      }
      const before = await at('rollback')
      const after = await at('forward')
      expect(before.map(([d, s, st, hw]) => [d, s, st, hw])).toEqual(
        WITNESSES.map(([d, s, st]) => [d, s, st, false]),
      )
      expect(after.map(([d, s, st, hw]) => [d, s, st, hw])).toEqual(
        WITNESSES.map(([d, , , s, st]) => [d, s, st, false]),
      )
      // 2028-09-26: score and status equal, the 劫煞 cell (avoid) now decides.
      expect(before[6]![4]).not.toBe(after[6]![4])
      expect(after[6]![4]).toMatch(/kiep_sat:applied:avoid/)
    },
  )

  it('committed Stage 2 artifacts equal their lock and the frozen Stage 1 envelope', () => {
    const lock = JSON.parse(readFileSync(OUT + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
    type Counts = Record<'domain' | 'outside', Record<string, unknown>>
    const s = JSON.parse(readFileSync(OUT + 'summary.json', 'utf8')) as {
      migration: Counts
      dependsOnWeishenCell: Counts
      eventChangedTotal: number
      domainRowsEqualFrozenStage1: boolean
      independentTextModel: { rowsDifferingFromForward: number }
      unexpected: number
    }
    const frozen = JSON.parse(
      readFileSync('docs/audits/sources/p4-vol10/g2-stage1/range-impact-events.json', 'utf8'),
    ) as { totals: Counts; dependsOnWeishenCell: Counts }
    for (const set of ['domain', 'outside'] as const) {
      for (const [k, v] of Object.entries(frozen.totals[set]))
        expect(s.migration[set][k], `${set} ${k}`).toEqual(v)
      // Stage 1 never accumulated transitions for the dependency counts.
      for (const [k, v] of Object.entries(frozen.dependsOnWeishenCell[set]))
        if (k !== 'statusTransitions')
          expect(s.dependsOnWeishenCell[set][k], `未戊申 ${set} ${k}`).toBe(v)
    }
    expect(s.eventChangedTotal).toBe(4_330 + 289_270)
    expect(s.domainRowsEqualFrozenStage1).toBe(true)
    expect(s.independentTextModel.rowsDifferingFromForward).toBe(0)
    expect(s.unexpected).toBe(0)
    // Rollback = pre-G2 main and re-enable = forward, as whole-range dump bytes.
    const r = JSON.parse(readFileSync(OUT + 'rollback.json', 'utf8')) as {
      dumpSha256: Record<string, string>
    } & Record<string, unknown>
    expect([
      r.rollbackEqualsPreG2Main,
      r.reEnableEqualsForward,
      r.independentTextEqualsForward,
    ]).toEqual([true, true, true])
    expect(r.dumpSha256.stage2Rollback).toBe(r.dumpSha256.preG2Main)
    expect(r.dumpSha256.stage2ReEnable).toBe(r.dumpSha256.stage2Forward)
    // Authority stamp gate (authority-stamp.json, G2S2_STAMP=1): raw = semantic ∪ stamp-only, disjoint.
    const a = JSON.parse(readFileSync(OUT + 'authority-stamp.json', 'utf8')) as {
      counts: Record<'domain' | 'outside', Record<string, number>>
      total: Record<string, number>
      stampOnly: {
        dates: number
        datesOutsideJieshaAuthorityScope: number
        onContractTransactionProfileEvents: number
      }
    }
    const sum = s as unknown as { authorityStampOnly: Record<'domain' | 'outside', number> }
    for (const [set, raw, sem, stamp] of [
      ['domain', 4_582, 4_330, 252],
      ['outside', 308_650, 289_270, 19_380],
    ] as const) {
      const c = a.counts[set]
      expect([c.rawChanged, c.semanticChanged, c.authorityStampOnly], set).toEqual([
        raw,
        sem,
        stamp,
      ])
      expect(c.rawChanged).toBe(c.semanticChanged + c.authorityStampOnly)
      expect([c.intersection, c.unclassifiedRawChanges], set).toEqual([0, 0])
      expect(
        [c.semanticChanged, c.semanticScore, c.semanticClassification, c.semanticEvidenceOnly],
        set,
      ).toEqual(
        (
          [
            'eventChanged',
            'eventScoreChanged',
            'eventClassificationChanged',
            'eventEvidenceOnly',
          ] as const
        ).map((k) => s.migration[set][k]),
      )
      expect(c.authorityStampOnly).toBe(sum.authorityStampOnly[set])
    }
    expect(a.total).toEqual({
      rawChanged: 313_232,
      semanticChanged: 293_600,
      authorityStampOnly: 19_632,
    })
    // 1,636 劫煞 authority scope dates × 6 events outside the contract / transaction profile × 2 hours.
    expect(a.stampOnly).toMatchObject({
      dates: 1_636,
      datesOutsideJieshaAuthorityScope: 0,
      onContractTransactionProfileEvents: 0,
    })
  })
})
