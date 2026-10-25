import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Audit only: G2 Stage 1 (docs/audits/p4-g2-score-lookup.md). Measures current production for contract /
// transaction (卷十 立劵交易, 卷十一 heading 立劵交易, activity map 立券交易) and two candidate models, each in its
// own module graph, by mocking a data file at import time. No runtime file is touched.
//   current        production as shipped (canonical-v1).
//   vol10-text     卷十 list text read as 立券交易 (models the narrow alias / source correction on the 卷十 side).
//   alias-table    one explicit 卷十 headingAliases entry 立劵交易 → [立券交易] (narrow alias, no text change).
// (An activity-map respelling to 立劵交易 was tried and rejected: P4 data keyed 立券交易 no longer splits.)
// The two candidates reach the same matching by different mechanisms (cross-check). npm test: sampled;
// G2_FULL=1: 1,095 domain days + 3 outside controls + 2028 (outside sample); G2_WRITE=1 rewrites the JSON.
// weishen-avoid: vol10-text with the disputed 未-戊申 contract/transaction cells set to avoid, only to measure
// which rows depend on that cell (owner ruling 2026-10-25 keeps it blank; it is not a candidate).
type Model = 'current' | 'vol10-text' | 'alias-table' | 'weishen-avoid'
// vi.doMock per model (a hoisted vi.mock factory result survives vi.resetModules, so it cannot switch).
const fix = (v: unknown) => (typeof v === 'string' ? v.replaceAll('立劵交易', '立券交易') : v)
const fixEntry = (e: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(e).map(([k, v]) => [
      k,
      Array.isArray(v)
        ? v.map((x) =>
            x && typeof x === 'object'
              ? Object.fromEntries(Object.entries(x).map(([a, b]) => [a, fix(b)]))
              : fix(x),
          )
        : fix(v),
    ]),
  )
// G2 Stage 2 shipped the alias and authority v2; every model starts from the pre-G2 rollback (g2Rollback.ts):
// alias removed, authority v1 served at the path production imports (v3 since G1 glyph Stage 2). The frozen Stage 1 artifacts reproduce from that base.
const VOL10 = '../almanac-data/xiejibianfangshu-vol10-yiji.json'
const AUTH = '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
function mockModel(model: Model) {
  vi.doUnmock(VOL10)
  vi.doUnmock(AUTH)
  // Both candidates reach contract / transaction in 卷十 劫煞; authority v1 marks them UNREACHABLE and throws.
  // Modelled in memory as APPLIED with their approved v1 cells (authority v1 on disk is unchanged).
  vi.doMock(AUTH, async () => {
    const real = (await import('./g2Rollback')).jieshaAuthorityV1().default as unknown as {
      runtimeCoverage: { activities: Record<string, unknown> }
      cells: Record<string, Record<string, string>>
      counts: { avoid: number; blank: number }
    }
    if (model === 'current') return { default: real }
    const avoid = model === 'weishen-avoid'
    return {
      default: {
        ...real,
        ...(avoid && {
          cells: {
            ...real.cells,
            未戊申: { ...real.cells['未戊申'], contract: 'avoid', transaction: 'avoid' },
          },
          counts: { ...real.counts, avoid: real.counts.avoid + 2, blank: real.counts.blank - 2 },
        }),
        runtimeCoverage: {
          ...real.runtimeCoverage,
          activities: {
            ...real.runtimeCoverage.activities,
            contract: { status: 'APPLIED' },
            transaction: { status: 'APPLIED' },
          },
        },
      },
    }
  })
  vi.doMock(VOL10, async (load) => {
    const real = (await import('./g2Rollback')).withoutG2Alias(await load()).default as unknown as {
      entries: Record<string, unknown>[]
      headingAliases: Record<string, string[]>
    }
    if (model === 'vol10-text' || model === 'weishen-avoid')
      return { default: { ...real, entries: real.entries.map(fixEntry) } }
    if (model === 'alias-table')
      return {
        default: { ...real, headingAliases: { ...real.headingAliases, 立劵交易: ['立券交易'] } },
      }
    return { default: real }
  })
}

const FULL = process.env.G2_FULL === '1'
// G2_EVENTS_FULL=1 with G2_RANGE=1: events on every day too (range-impact-events.json).
const EVENTS_FULL = process.env.G2_EVENTS_FULL === '1'
const RANGE_FILE = EVENTS_FULL ? 'range-impact-events.json' : 'range-impact.json'
const WRITE = process.env.G2_WRITE === '1'
const OUT = 'docs/audits/sources/p4-vol10/g2-stage1/'
const G2 = ['contract', 'transaction']
const OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}
const DOMAIN = days('2025-01-01', '2027-12-31')
const OUTSIDE_SAMPLE = days('2028-01-02', '2028-12-31')
const pick = (xs: string[]) => (FULL ? xs : xs.filter((_, i) => i % 15 === 0))
const SETS = {
  domain: pick(DOMAIN),
  outsideControls: OUTSIDE,
  outsideSample2028: pick(OUTSIDE_SAMPLE),
}

type Rec = {
  activityId: string
  score: number
  status: string
  hardWarning: boolean
  contributions: {
    source: string
    ruleId: string
    status: string
    classical?: { verdict?: string }
  }[]
}
async function load(model: Model) {
  vi.resetModules()
  mockModel(model)
  await (await import('./g1GlyphRollback')).assertJieshaAuthority('xieji-vol10-jiesha-faithful-v1')
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { p4ActivityState } = await import('./p4ScoreAdapter')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  return {
    getAlmanac,
    evaluateEventDay,
    eventOutput,
    EVENT_HOURS,
    EVENT_OPTIONS,
    p4ActivityState,
    getP4DayHeadings,
  }
}
type Engine = Awaited<ReturnType<typeof load>>
function day(e: Engine, date: string, withEvents = true) {
  const a = e.getAlmanac(date as never)
  const recs = a.activityRecommendations as unknown as Rec[]
  const op = {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  }
  const heads = e.getP4DayHeadings(date, op)
  const events: Record<string, string> = !withEvents
    ? {}
    : Object.fromEntries(
        e.EVENT_OPTIONS.flatMap(([id]) =>
          e.EVENT_HOURS.map((h) => [
            `${id}@${h ?? ''}`,
            JSON.stringify(e.eventOutput(e.evaluateEventDay, date, id, h)),
          ]),
        ),
      )
  return {
    recs: new Map(recs.map((r) => [r.activityId, r])),
    p4: Object.fromEntries(G2.map((a) => [a, e.p4ActivityState(a, heads)])),
    keys: Object.keys(heads).filter((k) => k.includes('交易')),
    events,
  }
}
type Day = ReturnType<typeof day>
async function engine(model: Model) {
  const e = await load(model)
  // The model must reach the 卷十 matcher: 劫煞 lists contract only when the spellings meet.
  const R = await import('./xiejiVol10Resolution')
  const jieDay = {
    monthJianBranch: 4,
    dayStem: 5,
    dayBranch: 5,
    officerId: 'tru',
    presentGods: new Set(['kiep_sat']),
    unknownGods: new Set<string>(),
  }
  const jie = R.resolveVol10(jieDay, ['contract']).find((r) => r.entry === 'jie_sha')!.verdict
  expect(jie, model).toBe(model === 'current' ? 'not_listed' : 'no_annotation') // 辰-己巳 cell is blank
  return e
}
async function run(model: Model) {
  const e = await engine(model)
  const out: Record<string, Day> = {}
  for (const date of Object.values(SETS).flat()) out[date] = day(e, date)
  return out
}

const verdicts = (r: Rec) =>
  r.contributions
    .filter((c) => c.classical?.verdict)
    .map((c) => `${c.ruleId}:${c.status}:${c.classical!.verdict}`)
    .sort()
    .join(' ')
function compare(base: Record<string, Day>, cand: Record<string, Day>, dates: string[]) {
  const c = {
    days: dates.length,
    evidenceOrStateChanged: 0,
    scoreChanged: 0,
    scoreLower: 0,
    scoreHigher: 0,
    statusChanged: 0,
    hardWarningChanged: 0,
    conclusionChanged: 0,
    p4StateChanged: 0,
    otherActivityChanged: 0,
    eventChanged: 0,
    eventScoreChanged: 0,
    eventClassificationChanged: 0,
    eventEvidenceOnly: 0,
    statusTransitions: {} as Record<string, number>,
  }
  const rows: string[][] = []
  for (const d of dates) {
    for (const [id, a] of base[d]!.recs) {
      const b = cand[d]!.recs.get(id)!
      if (!G2.includes(id)) {
        if (
          a.score !== b.score ||
          a.status !== b.status ||
          a.hardWarning !== b.hardWarning ||
          verdicts(a) !== verdicts(b)
        )
          c.otherActivityChanged++
        continue
      }
      const evid =
        verdicts(a) !== verdicts(b) ||
        JSON.stringify(a.contributions.map((x) => [x.ruleId, x.status])) !==
          JSON.stringify(b.contributions.map((x) => [x.ruleId, x.status]))
      const p4 = JSON.stringify(base[d]!.p4[id]) !== JSON.stringify(cand[d]!.p4[id])
      const sc = a.score !== b.score
      const st = a.status !== b.status
      const hw = a.hardWarning !== b.hardWarning
      if (evid || p4 || sc || st || hw) c.evidenceOrStateChanged++
      if (p4) c.p4StateChanged++
      if (sc) (c.scoreChanged++, b.score < a.score ? c.scoreLower++ : c.scoreHigher++)
      if (st)
        (c.statusChanged++,
          (c.statusTransitions[`${a.status}>${b.status}`] =
            (c.statusTransitions[`${a.status}>${b.status}`] ?? 0) + 1))
      if (hw) c.hardWarningChanged++
      if (sc || st || hw) c.conclusionChanged++
      if (evid || p4 || sc || st || hw)
        rows.push([
          d,
          id,
          base[d]!.p4[id]!.state,
          cand[d]!.p4[id]!.state,
          String(a.score),
          String(b.score),
          a.status,
          b.status,
          String(a.hardWarning),
          String(b.hardWarning),
          verdicts(a),
          verdicts(b),
        ])
    }
    for (const [k, v] of Object.entries(base[d]!.events)) {
      const w = cand[d]!.events[k]
      if (w === undefined || w === v) continue
      c.eventChanged++
      const [x, y] = [JSON.parse(v), JSON.parse(w)] as { score: unknown; classification: unknown }[]
      if (x!.score !== y!.score) c.eventScoreChanged++
      if (x!.classification !== y!.classification) c.eventClassificationChanged++
      if (x!.score === y!.score && x!.classification === y!.classification) c.eventEvidenceOnly++
    }
  }
  return { counts: c, rows }
}

describe('G2 Stage 1 audit (contract / transaction)', () => {
  it(
    'measures current production and the two candidate models',
    { timeout: 3_600_000 },
    async () => {
      const cur = await run('current')
      const v10 = await run('vol10-text')
      const act = await run('alias-table')
      const wav = await run('weishen-avoid')
      // Current production facts (measured, not inferred).
      const sample = cur[SETS.domain[0]!]!
      expect(sample.keys).toEqual(['立券交易']) // provider key, canonical
      const p4States = Object.fromEntries(
        G2.map((a) => [
          a,
          Object.entries(
            SETS.domain.reduce<Record<string, number>>((m, d) => {
              const s = cur[d]!.p4[a]!.state
              m[s] = (m[s] ?? 0) + 1
              return m
            }, {}),
          ).sort(),
        ]),
      )
      const vol10Verdicts = Object.fromEntries(
        G2.map((a) => [
          a,
          [
            ...new Set(
              Object.values(cur).flatMap((d) =>
                verdicts(d.recs.get(a)!).split(' ').filter(Boolean),
              ),
            ),
          ].sort(),
        ]),
      )
      const impact = Object.fromEntries(
        Object.entries(SETS).map(([name, dates]) => [
          name,
          {
            vol10Text: compare(cur, v10, dates).counts,
            aliasTable: compare(cur, act, dates).counts,
            // Rows whose outcome depends on the disputed 未-戊申 cell (blank vs avoid).
            dependsOnWeishenCell: compare(v10, wav, dates).counts,
          },
        ]),
      )
      // Cross-check: both candidate mechanisms give the same conclusions on every date and activity.
      const conclusions = (m: Record<string, Day>) =>
        Object.entries(m).map(([d, x]) =>
          [
            d,
            ...[...x.recs.values()].map(
              (r) => `${r.activityId}:${r.score}:${r.status}:${r.hardWarning}`,
            ),
          ].join('|'),
        )
      expect(conclusions(v10)).toEqual(conclusions(act))
      const changeRows = (['domain', 'outsideControls', 'outsideSample2028'] as const).flatMap(
        (set) =>
          compare(cur, v10, SETS[set]).rows.map((r) => {
            const [d, id] = r as [string, string]
            const x = v10[d]!.recs.get(id)!
            const y = wav[d]!.recs.get(id)!
            const dep = x.score !== y.score || x.status !== y.status || verdicts(x) !== verdicts(y)
            return [set, ...r, String(dep)]
          }),
      )
      const out = {
        version: 'g2-stage1-impact-v2',
        full: FULL,
        currentProduction: {
          providerKeys: sample.keys,
          p4StatesDomain: p4States,
          vol10VerdictsSeen: vol10Verdicts,
        },
        impact,
        candidateMechanismsAgree: true,
      }
      if (!FULL) return
      const header =
        'set\tdate\tactivity\tp4_old\tp4_new\tscore_old\tscore_new\tstatus_old\tstatus_new\thard_old\thard_new\tvol10_old\tvol10_new\tweishen_cell_dependent'
      const tsv = [header, ...changeRows.map((r) => r.join('\t'))].join('\n') + '\n'
      const json = JSON.stringify(out, null, 1) + '\n'
      if (WRITE) {
        writeFileSync(OUT + 'candidate-impact.json', json)
        writeFileSync(OUT + 'candidate-impact.tsv', tsv)
      }
      expect(json).toBe(readFileSync(OUT + 'candidate-impact.json', 'utf8'))
      expect(tsv).toBe(readFileSync(OUT + 'candidate-impact.tsv', 'utf8'))
    },
  )

  it.skipIf(process.env.G2_RANGE !== '1')(
    'supported range 1900–2100: activities every day, events every 30th day',
    { timeout: 14_400_000 },
    async () => {
      const cur = await engine('current')
      const cand = await engine('vol10-text')
      const wav = await engine('weishen-avoid')
      const dep: Record<string, ReturnType<typeof compare>['counts']> = {}
      const all = days('1900-01-01', '2100-12-31')
      const totals: Record<string, ReturnType<typeof compare>['counts']> = {}
      const byYear: Record<string, number> = {}
      all.forEach((d, i) => {
        const ev = EVENTS_FULL || i % 30 === 0
        const cd = day(cand, d, ev)
        const c = compare({ [d]: day(cur, d, ev) }, { [d]: cd }, [d]).counts
        const set = DOMAIN.includes(d) ? 'domain' : 'outside'
        const w = compare({ [d]: cd }, { [d]: day(wav, d, ev) }, [d]).counts
        const u = (dep[set] ??= { ...w, days: 0, statusTransitions: {} })
        for (const [k, v] of Object.entries(w))
          if (typeof v === 'number')
            (u as unknown as Record<string, number>)[k]! += k === 'days' ? 1 : v
        const t = (totals[set] ??= { ...c, days: 0, statusTransitions: {} })
        for (const [k, v] of Object.entries(c))
          if (typeof v === 'number')
            (t as unknown as Record<string, number>)[k]! += k === 'days' ? 1 : v
          else
            for (const [s2, n] of Object.entries(v))
              t.statusTransitions[s2] = (t.statusTransitions[s2] ?? 0) + n
        if (c.conclusionChanged) byYear[d.slice(0, 4)] = (byYear[d.slice(0, 4)] ?? 0) + 1
      })
      const out =
        JSON.stringify(
          {
            version: 'g2-stage1-range-v2',
            range: ['1900-01-01', '2100-12-31'],
            days: all.length,
            eventSampling: EVENTS_FULL ? 'every day' : 'every 30th day',
            totals,
            conclusionChangedDaysByYear: byYear,
            dependsOnWeishenCell: dep,
          },
          null,
          1,
        ) + '\n'
      if (WRITE) writeFileSync(OUT + RANGE_FILE, out)
      expect(out).toBe(readFileSync(OUT + RANGE_FILE, 'utf8'))
    },
  )
})
