import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// G1-SOIL Stage 1 (docs/audits/p4-g1-soil-authority.md): AUDIT ONLY, production files untouched.
// Models (own module graph each, vi.doMock at the authority path production imports):
//   forward   shipped production (authority v3: 5 demolition contexts EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY).
//   avoid5    v3 with the 5 contexts APPLIED, cell avoid (g1-soil-stage1/candidate-authority-avoid5.json).
//   blank5    v3 with the 5 contexts APPLIED, cell blank (R1 static-blank counterfactual).
//   *-sk      the same with p4ScoreHeadingLookup source-key-v1 (G1-b counterfactual #3, 2025–2027 only).
// R2 (date-aware) is composed per day by g1-soil-stage1/compare.py: avoid5 inside 土王用事, forward outside.
// npm test: focused checks. G1SOIL_DUMP=<models> G1SOIL_OUT: per-row dump of every day 1900–2100 (no sampling),
// the G1 glyph Stage 2 row format. G1SOIL_G1B=1: counterfactual #3.
type Model = 'forward' | 'avoid5' | 'blank5' | 'forward-sk' | 'avoid5-sk'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v3.json'
const MANIFEST = '../almanac-data/manifest.json'
const DIR = 'docs/audits/sources/p4-vol10/g1-soil-stage1/'
const V3_ID = 'xieji-vol10-jiesha-faithful-v3'
const ID = (c: string) => `xieji-vol10-jiesha-faithful-v4-candidate-soil-${c}5`
const EXCLUDED = ['丑甲寅', '丑丙寅', '丑壬寅', '丑戊寅', '未戊申']

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
  const base = model.replace('-sk', '')
  if (base === 'avoid5' || base === 'blank5')
    vi.doMock(AUTH, () => ({
      default: JSON.parse(readFileSync(`${DIR}candidate-authority-${base}.json`, 'utf8')),
    }))
}

async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  const base = model.replace('-sk', '')
  await (
    await import('./g1GlyphRollback')
  ).assertJieshaAuthority(base === 'forward' ? V3_ID : ID(base.slice(0, 5)))
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { p4ActivityState } = await import('./p4ScoreAdapter')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { isThoVuongDungSu, thoVuongDungSuPeriods } = await import('./thoVuongDungSu')
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
    thoVuongDungSuPeriods,
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
          h16(raw.replace(/xieji-vol10-jiesha-faithful-v4-candidate-soil-(avoid|blank)5/g, V3_ID)),
          h16(raw),
        ].join('\t'),
      )
    }
  return out
}

const DUMP = process.env.G1SOIL_DUMP
const G1B = process.env.G1SOIL_G1B === '1'
const jie = (e: Engine, key: string) => {
  const i = Array.from({ length: 60 }, (_, k) => k).find(
    (k) => ST[k % 10]! + BR[k % 12]! === key.slice(1),
  )!
  return e.R.resolveVol10(
    {
      monthJianBranch: BR.indexOf(key[0]!),
      dayStem: i % 10,
      dayBranch: i % 12,
      officerId: 'tru',
      presentGods: new Set(['kiep_sat']),
      unknownGods: new Set<string>(),
    },
    ['demolition'],
  ).find((r) => r.entry === 'jie_sha')!
}

describe('G1-SOIL Stage 1 audit (5 excluded demolition contexts × 土王用事)', () => {
  it.skipIf(!DUMP)(
    'dumps every day of the range per model (G1SOIL_DUMP)',
    { timeout: 36_000_000 },
    async () => {
      const dir = process.env.G1SOIL_OUT!
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

  it.skipIf(!G1B)(
    'G1-b counterfactual #3: canonical-v1 vs source-key-v1 under R2, every 2025–2027 day (G1SOIL_G1B)',
    { timeout: 3_600_000 },
    async () => {
      const { P4_DOMAIN_DATES } = await import('./p4AdapterBaselineRows')
      const row = (e: Engine, d: string) => {
        const r = (e.getAlmanac(d as never).activityRecommendations as unknown as Rec[]).find(
          (x) => x.activityId === 'demolition',
        )!
        return [r.score, r.status, r.hardWarning] as const
      }
      const grid: Record<string, (readonly [number, string, boolean])[]> = {}
      for (const m of ['forward', 'avoid5', 'forward-sk', 'avoid5-sk'] as const) {
        const e = await load(m)
        grid[m] = P4_DOMAIN_DATES.map((d) => row(e, d))
      }
      const soil = (await load('forward')).isThoVuongDungSu
      // R2 per day: avoid5 inside 土王用事, v3 outside (blank ≡ legacy output).
      const r2 = (canon: boolean, i: number, d: string) =>
        grid[(soil(d) ? 'avoid5' : 'forward') + (canon ? '' : '-sk')]![i]!
      const count = (
        a: (i: number, d: string) => readonly [number, string, boolean],
        b: typeof a,
      ) => {
        const out = {
          changedDemolitionDays: 0,
          scoreChanges: 0,
          statusChanges: 0,
          hardWarningChanges: 0,
        }
        P4_DOMAIN_DATES.forEach((d, i) => {
          const [x, y] = [a(i, d), b(i, d)]
          if (x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2]) out.changedDemolitionDays++
          out.scoreChanges += x[0] !== y[0] ? 1 : 0
          out.statusChanges += x[1] !== y[1] ? 1 : 0
          out.hardWarningChanges += x[2] !== y[2] ? 1 : 0
        })
        return out
      }
      const v3TwoMode = count(
        (i) => grid.forward![i]!,
        (i) => grid['forward-sk']![i]!,
      )
      const r2TwoMode = count(
        (i, d) => r2(true, i, d),
        (i, d) => r2(false, i, d),
      )
      const skDelta = P4_DOMAIN_DATES.filter(
        (d, i) => JSON.stringify(r2(false, i, d)) !== JSON.stringify(grid['forward-sk']![i]),
      )
      const canonDelta = P4_DOMAIN_DATES.filter(
        (d, i) => JSON.stringify(r2(true, i, d)) !== JSON.stringify(grid.forward![i]),
      )
      const out =
        JSON.stringify(
          {
            version: 'g1-soil-stage1-g1b-counterfactual-3-v1',
            note: 'third counterfactual; G1-b history (authority v2, 353 / 320 / 337 / 0) and the v3 counterfactual (342 / 309 / 326 / 0) are not redefined',
            v3TwoMode,
            r2TwoMode,
            r2VsV3: {
              canonicalV1ChangedDays: canonDelta.length,
              sourceKeyV1ChangedDays: skDelta.length,
              sourceKeyV1Dates: skDelta,
            },
          },
          null,
          1,
        ) + '\n'
      if (process.env.G1SOIL_WRITE === '1') writeFileSync(DIR + 'g1b-counterfactual-3.json', out)
      expect(out).toBe(readFileSync(DIR + 'g1b-counterfactual-3.json', 'utf8'))
    },
  )

  if (DUMP) return

  it('baseline: production is authority v3 with the 5 demolition contexts excluded', async () => {
    const e = await load('forward')
    expect(e.A.VOL10_JIESHA_AUTHORITY_ID).toBe(V3_ID)
    for (const k of EXCLUDED)
      expect(e.A.getVol10JieshaRuntime(k[0]!, k.slice(1), 'demolition').status, k).toBe(
        'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY',
      )
    const m = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
      datasetVersion: string
      policies: Record<string, unknown>
    }
    expect([m.datasetVersion, m.policies.p4ScoreHeadingLookup]).toEqual(['1.2.1', 'canonical-v1'])
  })

  it('calendar parity: production thoVuongDungSu = the independent JPL-row derivation, 1900–2100', async () => {
    const e = await load('forward')
    const all: string[] = []
    for (let y = 1900; y <= 2100; y++)
      for (const p of e.thoVuongDungSuPeriods(y))
        for (let t = Date.parse(p.onset); t <= Date.parse(p.eve); t += 864e5)
          all.push(new Date(t).toISOString().slice(0, 10))
    all.sort()
    const cal = JSON.parse(readFileSync(DIR + 'soil-calendar.json', 'utf8')) as {
      totalDays: number
      datesSha256: string
      windows: Record<string, { li: string; onset: string; eve: string }[]>
    }
    expect(all.length).toBe(cal.totalDays)
    expect(sha(all.join('\n'))).toBe(cal.datesSha256)
    for (let y = 1900; y <= 2100; y++)
      expect(
        e.thoVuongDungSuPeriods(y).map((p) => [p.li, p.onset, p.eve]),
        String(y),
      ).toEqual(cal.windows[String(y)]!.map((w) => [w.li, w.onset, w.eve]))
  })

  it('candidate models: avoid5 / blank5 apply their cell; forward keeps the exclusion', async () => {
    const fwd = await load('forward')
    const av = await load('avoid5')
    const bl = await load('blank5')
    for (const k of EXCLUDED) {
      expect(jie(fwd, k).authorityExclusion, k).toMatch(
        /^EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY/,
      )
      expect(jie(av, k).verdict, k).toBe('avoid')
      expect([jie(bl, k).verdict, jie(bl, k).authorityExclusion], k).toEqual([
        'no_annotation',
        undefined,
      ])
    }
    const src = readFileSync('shared/lunar/xiejiVol10JieshaAuthority.ts', 'utf8')
    expect(src).not.toMatch(/candidate|soil/)
  })

  it('frozen audit envelope: R2 vs v3 domain 0, outside 298 (−15, watch→avoid); stake 303 / 199 / 298', () => {
    type T = Record<string, number | Record<string, number>>
    const r = JSON.parse(readFileSync(DIR + 'r2-impact.json', 'utf8')) as {
      R2: Record<'domain' | 'outside', T>
      stake: Record<string, unknown>
      independent: Record<string, unknown>
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
        t.otherActivityChanged,
        t.g2ActivityChanged,
        t.eventSemanticChanged,
      ] as number[]
    expect(pick(r.R2.domain)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(pick(r.R2.outside)).toEqual([298, 298, 298, 0, 298, 0, 0, 0, 0, 0])
    expect(r.R2.outside.statusTransitions).toEqual({ 'watch→avoid': 298 })
    expect(r.R2.outside.scoreDeltas).toEqual({ '-15': 298 })
    expect(r.stake).toMatchObject({
      occurrences: 502,
      inside: 303,
      outside: 199,
      insideInP4Domain: 5,
      staticBlankWrong: 303,
      staticAvoidWrong: 199,
      staticBlankWrongObservable: 298,
    })
    expect(Object.entries(r.independent).filter(([, v]) => v === false)).toEqual([])
    const c = JSON.parse(readFileSync(DIR + 'counterfactuals.json', 'utf8')) as {
      R1_staticBlank: Record<'domain' | 'outside', T>
    }
    expect([
      c.R1_staticBlank.domain.demolitionChangedDays,
      c.R1_staticBlank.outside.demolitionChangedDays,
    ]).toEqual([0, 0])
    const g = JSON.parse(readFileSync(DIR + 'g1b-counterfactual-3.json', 'utf8')) as {
      v3TwoMode: Record<string, number>
      r2TwoMode: Record<string, number>
      r2VsV3: { canonicalV1ChangedDays: number; sourceKeyV1ChangedDays: number }
    }
    expect(g.v3TwoMode).toEqual({
      changedDemolitionDays: 342,
      scoreChanges: 309,
      statusChanges: 326,
      hardWarningChanges: 0,
    })
    expect(g.r2TwoMode).toEqual({
      changedDemolitionDays: 337,
      scoreChanges: 304,
      statusChanges: 321,
      hardWarningChanges: 0,
    })
    expect([g.r2VsV3.canonicalV1ChangedDays, g.r2VsV3.sourceKeyV1ChangedDays]).toEqual([0, 5])
  })

  it('committed Stage 1 artifacts and pinned inputs equal their lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
      inputs: { path: string; sha256: string }[]
    }
    for (const f of [...lock.files, ...lock.inputs])
      expect(sha(readFileSync(f.path)), f.path).toBe(f.sha256)
  })
})
