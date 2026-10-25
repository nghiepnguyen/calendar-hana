import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// G1 glyph Stage 1 (docs/audits/p4-g1-demolition-glyph-authority.md): AUDIT ONLY, production files untouched.
// Each model gets its own module graph (vi.doMock + vi.resetModules), as in p4G2Stage2Migration.test.ts:
//   forward    pre-G1-glyph production (authority v2, demolition EXCLUDED_PENDING_GLYPH_AUDIT); since G1 glyph
//              Stage 2 ships v3 this is the v2 rollback pin (g1GlyphRollback.ts), so Stage 1 evidence stays frozen.
//   fit        v2 + demolition APPLIED, soil-absent cell (g1-glyph-stage1/candidate-authority-fit.json).
//   inwindow   v2 + demolition APPLIED, soil-present cell, avoid 16/16 (candidate-authority-inwindow.json).
//   m-*        malformed authorities: production must fail loudly, never apply an unapproved cell.
// The date-faithful candidate is composed per day by compare.py (inwindow inside 土王用事, fit outside).
// npm test: focused checks. G1GS1_DUMP=<models> G1GS1_OUT / G1GS1_FROM / G1GS1_TO: per-row dump of every
// day (no sampling) that g1-glyph-stage1/compare.py turns into the committed envelope.
type Model =
  'forward' | 'fit' | 'inwindow' | 'm-applied-no-cells' | 'm-cells-while-excluded' | 'm-no-coverage'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v3.json'
const DIR = 'docs/audits/sources/p4-vol10/g1-glyph-stage1/'
const V2_ID = 'xieji-vol10-jiesha-faithful-v2'
const FIT_ID = 'xieji-vol10-jiesha-faithful-v3-candidate-g1'
const IN_ID = FIT_ID + '-inwindow'
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>
type Auth = {
  version: string
  activities: string[]
  cells: Record<string, Record<string, string>>
  counts: Record<string, number>
  runtimeCoverage: { activities: Record<string, Record<string, string>> }
}

function mockModel(model: Model) {
  vi.doUnmock(AUTH)
  if (model === 'forward')
    return vi.doMock(AUTH, async () => (await import('./g1GlyphRollback')).jieshaAuthorityV2())
  if (model === 'fit' || model === 'inwindow')
    return vi.doMock(AUTH, () => ({
      default: read(`${DIR}candidate-authority-${model}.json`),
    }))
  vi.doMock(AUTH, async () => {
    const a = structuredClone(
      (await import('./g1GlyphRollback')).jieshaAuthorityV2().default as unknown as Auth,
    )
    const cov = a.runtimeCoverage.activities
    if (model === 'm-applied-no-cells') cov.demolition = { status: 'APPLIED' }
    if (model === 'm-cells-while-excluded') {
      // Cells present, coverage still EXCLUDED: the table must be rejected on import.
      const fit = read(`${DIR}candidate-authority-fit.json`) as unknown as Auth
      a.cells = fit.cells
      a.activities = fit.activities
      a.counts = fit.counts
    }
    if (model === 'm-no-coverage') delete cov.demolition
    return { default: a }
  })
}

async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  if (!model.startsWith('m-'))
    await (
      await import('./g1GlyphRollback')
    ).assertJieshaAuthority(model === 'fit' ? FIT_ID : model === 'inwindow' ? IN_ID : V2_ID)
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
const sha = (s: string) => createHash('sha256').update(s).digest('hex')
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

/** One day as dump lines. D: context (month Jian + pillar), 土王用事 flag, demolition's 劫煞 (kiep_sat)
 * classical verdict or '-'. A: every activity (score, status, hard warning, record sha; demolition also the
 * 卷十 verdicts, contribution ids and P4 state). E: every event × hour, sha with the authority id
 * normalized to v2 (`nsha`) and raw (`rsha`): a candidate id is a version stamp, not a semantic diff. */
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
          h16(raw.replaceAll(IN_ID, V2_ID).replaceAll(FIT_ID, V2_ID)),
          h16(raw),
        ].join('\t'),
      )
    }
  return out
}

const DUMP = process.env.G1GS1_DUMP

// 辰 己巳 收日 with 劫煞 and no 德: inside the authority scope, demolition listed via NORM 壞→壊.
const jieDay = (monthJianBranch: number, dayStem: number, dayBranch: number) => ({
  monthJianBranch,
  dayStem,
  dayBranch,
  officerId: 'tru',
  presentGods: new Set(['kiep_sat']),
  unknownGods: new Set<string>(),
})
const jie = (e: Engine, d: ReturnType<typeof jieDay>, ids = ['demolition']) =>
  e.R.resolveVol10(d, ids)
    .filter((r) => r.entry === 'jie_sha')
    .map((r) => ({
      a: r.activityId,
      verdict: r.verdict,
      authority: r.authority ?? null,
      exclusion: r.authorityExclusion ?? null,
    }))

describe('G1 glyph Stage 1 audit (破屋壞垣 / 破屋壊垣, demolition × 劫煞 authority)', () => {
  it.skipIf(!DUMP)(
    'dumps every day of the range per model (G1GS1_DUMP)',
    { timeout: 36_000_000 },
    async () => {
      const dir = process.env.G1GS1_OUT!
      mkdirSync(dir, { recursive: true })
      const range = days(
        process.env.G1GS1_FROM ?? '1900-01-01',
        process.env.G1GS1_TO ?? '2100-12-31',
      )
      for (const [i, model] of (DUMP!.split(',') as Model[]).entries()) {
        const e = await load(model)
        const fd = openSync(`${dir}/${i}-${model}.tsv`, 'w')
        for (const d of range) writeSync(fd, dumpDay(e, d).join('\n') + '\n')
        closeSync(fd)
      }
    },
  )

  if (DUMP) return

  it('versions and policies: the audit starts from shipped G1-b + G2 production', async () => {
    const m = read('shared/almanac-data/manifest.json') as {
      datasetVersion: string
      policies: Record<string, unknown>
    }
    expect(m.datasetVersion).toBe('1.2.1')
    expect(m.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
    // Policy name and authority file are two different things: the policy string stays faithful-v1,
    // the statically imported authority is v2.
    expect(m.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    const e = await load('forward')
    expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V2_ID)
    expect((await import('./p4ScoreAdapter')).P4_SCORE_ADAPTER_VERSION).toBe('p4-score-adapter-v1')
  })

  it('character / heading layer: NORM folds 壞→壊 only; activity map keeps the source glyph', async () => {
    const e = await load('forward')
    expect(e.R.splitHeadings('破屋壞垣')).toEqual(['破屋壊垣'])
    expect(e.R.splitHeadings('破屋壊垣')).toEqual(['破屋壊垣'])
    expect(e.R.canonicalP4HeadingKey('破屋壞垣')).toBe('破屋壊垣')
    expect('破屋壞垣'.normalize('NFKC')).not.toBe('破屋壊垣')
    const vol11 = read('shared/almanac-data/xiejibianfangshu-yiji.json') as {
      activityEntries: Record<string, string[]>
    }
    // Activity identity: demolition is exactly one heading, and no other activity uses 壞/壊.
    expect(vol11.activityEntries.demolition).toEqual(['破屋壞垣'])
    const other = Object.entries(vol11.activityEntries).filter(
      ([a, hs]) => a !== 'demolition' && hs.some((h) => /[壞壊]/.test(h)),
    )
    expect(other).toEqual([])
  })

  it('collision: in the 卷十 source set 壞/壊 occur only inside 破屋?垣; folding collapses nothing else', () => {
    const vol10 = readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8')
    const vol11 = readFileSync('docs/audits/sources/p4-vol10/yi-sources-v1/vol11.raw.txt', 'utf8')
    const count = (s: string, re: RegExp) => (s.match(re) ?? []).length
    expect([count(vol10, /壞/g), count(vol10, /壊/g)]).toEqual([15, 3])
    expect([count(vol11, /壞/g), count(vol11, /壊/g)]).toEqual([0, 3])
    for (const s of [vol10, vol11]) expect(count(s, /[壞壊]/g)).toBe(count(s, /破屋[壞壊]垣/g))
    const json = readFileSync('shared/almanac-data/xiejibianfangshu-vol10-yiji.json', 'utf8')
    expect(count(json, /[壞壊]/g)).toBe(count(json, /破屋[壞壊]垣/g))
  })

  it('current production access: demolition reachable, EXCLUDED_PENDING_GLYPH_AUDIT, legacy verdict kept', async () => {
    const e = await load('forward')
    expect(e.A.getVol10JieshaRuntime('辰', '己巳', 'demolition')).toMatchObject({
      status: 'EXCLUDED_PENDING_GLYPH_AUDIT',
    })
    for (const a of ['contract', 'transaction'])
      expect(e.A.getVol10JieshaRuntime('辰', '己巳', a)).toEqual({
        status: 'APPLIED',
        cell: 'blank',
      })
    // 辰-己巳: resolver reaches demolition (NORM), the authority excludes it, verdict stays no_annotation.
    const [r] = jie(e, jieDay(4, 5, 5))
    expect(r).toMatchObject({ a: 'demolition', verdict: 'no_annotation', authority: V2_ID })
    expect(r!.exclusion).toMatch(/^EXCLUDED_PENDING_GLYPH_AUDIT: /)
    // G2 alias and the 壞→壊 fold cannot bypass coverage: contract applied by cell, demolition excluded.
    expect(jie(e, jieDay(4, 5, 5), ['contract', 'transaction', 'demolition'])).toEqual([
      { a: 'contract', verdict: 'no_annotation', authority: V2_ID, exclusion: null },
      { a: 'transaction', verdict: 'no_annotation', authority: V2_ID, exclusion: null },
      expect.objectContaining({ a: 'demolition', verdict: 'no_annotation' }),
    ])
  })

  it('candidates differ from v2 only in demolition; production graph never loads them', async () => {
    const v2 = read('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json') as unknown as Auth
    for (const which of ['fit', 'inwindow'] as const) {
      const c = read(`${DIR}candidate-authority-${which}.json`) as unknown as Auth
      for (const [ctx, row] of Object.entries(c.cells)) {
        const { demolition, ...rest } = row
        expect(rest, ctx).toEqual(v2.cells[ctx])
        expect(['avoid', 'blank']).toContain(demolition)
      }
    }
    const src = (p: string) => readFileSync(p, 'utf8')
    expect(src('shared/lunar/xiejiVol10JieshaAuthority.ts')).not.toMatch(/candidate|g1-glyph/)
    expect(src('shared/lunar/xiejiVol10Resolution.ts')).not.toMatch(/candidate|g1-glyph/)
    const e = await load('forward')
    expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V2_ID)
  })

  it('candidate models: fit and inwindow apply the frozen cells', async () => {
    const t = read(`${DIR}authority-candidate.json`) as {
      contexts: Record<string, { cellSoilAbsent: string; cellSoilPresent: string }>
    }
    const fit = await load('fit')
    const inw = await load('inwindow')
    for (const [ctx, x] of Object.entries(t.contexts)) {
      const [m, p] = [ctx[0]!, ctx.slice(2)]
      expect(fit.A.getVol10JieshaRuntime(m, p, 'demolition'), ctx).toEqual({
        status: 'APPLIED',
        cell: x.cellSoilAbsent,
      })
      expect(inw.A.getVol10JieshaRuntime(m, p, 'demolition'), ctx).toEqual({
        status: 'APPLIED',
        cell: x.cellSoilPresent,
      })
    }
    // 辰-己巳 avoid: the 劫煞 忌 is kept; 丑-壬寅 (soil-absent blank) stays unannotated under fit.
    expect(jie(fit, jieDay(4, 5, 5))[0]).toMatchObject({ verdict: 'avoid', authority: FIT_ID })
    expect(jie(fit, jieDay(1, 8, 2))[0]).toMatchObject({
      verdict: 'no_annotation',
      authority: FIT_ID,
    })
    expect(jie(inw, jieDay(1, 8, 2))[0]).toMatchObject({ verdict: 'avoid', authority: IN_ID })
  })

  it('fail loud: malformed demolition coverage never silently applies a cell', async () => {
    const outcome: Record<string, string> = {}
    for (const m of ['m-applied-no-cells', 'm-cells-while-excluded', 'm-no-coverage'] as const) {
      try {
        const e = await load(m)
        e.R.resolveVol10(jieDay(4, 5, 5), ['demolition'])
        outcome[m] = 'no error'
      } catch (err) {
        outcome[m] = String((err as Error).message).replace(/\{.*\}/, '{…}')
      }
    }
    expect(outcome).toEqual({
      'm-applied-no-cells': `invalid ${V2_ID}: {…}`,
      'm-cells-while-excluded': `invalid ${V2_ID}: {…}`,
      'm-no-coverage': `${V2_ID}: no coverage for demolition`,
    })
    if (process.env.G1GS1_WRITE === '1')
      writeFileSync(DIR + 'mutation-results.json', JSON.stringify(outcome, null, 1) + '\n')
    expect(read(DIR + 'mutation-results.json')).toEqual(outcome)
  })

  it('committed Stage 1 artifacts and pinned inputs equal their lock', () => {
    const lock = read(DIR + 'lock.json') as {
      files: { path: string; sha256: string }[]
      inputs: { path: string; sha256: string }[]
    }
    for (const f of [...lock.files, ...lock.inputs])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
  })

  it('frozen candidate envelope: P4 domain empty, outside −15 only, no other activity, no event semantics', () => {
    type T = Record<string, number | Record<string, number>>
    const r = read(DIR + 'range-impact.json') as {
      candidates: Record<'fit' | 'faithful', Record<'domain' | 'outside', T>>
      faithfulVsFit: Record<'domain' | 'outside', T>
    }
    const pick = (t: T) =>
      [
        t.demolitionChangedDays,
        t.scoreChanged,
        t.scoreLower,
        t.statusChanged,
        t.hardWarningChanged,
        t.evidenceOnly,
        t.p4StateChanged,
        t.otherActivityChanged,
        t.g2ActivityChanged,
      ] as number[]
    for (const c of ['fit', 'faithful'] as const)
      expect(pick(r.candidates[c].domain), c).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(pick(r.candidates.fit.outside)).toEqual([1119, 1119, 1119, 1119, 0, 0, 0, 0, 0])
    expect(r.candidates.fit.outside.statusTransitions).toEqual({
      'neutral→watch': 464,
      'watch→avoid': 655,
    })
    expect(pick(r.candidates.faithful.outside)).toEqual([1417, 1417, 1417, 1417, 0, 0, 0, 0, 0])
    expect(r.candidates.faithful.outside.statusTransitions).toEqual({
      'neutral→watch': 464,
      'watch→avoid': 953,
    })
    expect(pick(r.faithfulVsFit.outside)).toEqual([298, 298, 298, 298, 0, 0, 0, 0, 0])
    for (const c of ['fit', 'faithful'] as const)
      expect(r.candidates[c].outside.scoreDeltas).toEqual({ '-15': c === 'fit' ? 1119 : 1417 })
    const e = read(DIR + 'range-impact-events.json') as {
      candidates: Record<string, Record<string, Record<string, number>>>
    }
    for (const c of ['fit', 'faithful'])
      for (const [set, stamp] of [
        ['domain', 462],
        ['outside', 35_530],
      ] as const)
        expect(
          [e.candidates[c]![set]!.semanticChanged, e.candidates[c]![set]!.authorityStampOnly],
          `${c} ${set}`,
        ).toEqual([0, stamp])
    const ind = read(DIR + 'independent-verification.json') as Record<string, unknown>
    expect(ind).toMatchObject({
      scopeDatesProduction: 1_636,
      scopeEqualsPuzhu17ScopeDates: true,
      soilSplitEqualsG1aEngineFull: true,
      p4HandledAllInDomain: true,
      predictedChangedDaysEqualMeasured: { fit: true, faithful: true },
    })
  })
})
