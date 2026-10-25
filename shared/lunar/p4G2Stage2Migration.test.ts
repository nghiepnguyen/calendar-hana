import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, writeSync } from 'node:fs'
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

  if (DUMP) return

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
  })
})
