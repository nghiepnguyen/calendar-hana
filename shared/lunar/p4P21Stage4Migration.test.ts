import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import eligibility from '../../docs/audits/sources/p4-vol10/p21-stage3/eligibility.json'
import lock from '../../docs/audits/sources/p4-vol10/p21-stage4/lock.json'
import puzhu21 from '../almanac-data/p4-puzhu21-v1.json'
import { committedWithDigest } from './lockAnchor'

// P21 Stage 4 (docs/audits/p21-stage4-partial-migration.md): production diff of p4-puzhu21-v1. Each model gets its
// own module graph (vi.doMock + vi.resetModules), as in p4F1WuliStage2Impact.test.ts:
//   pre   p4-puzhu21-v1 mocked to the pre-P21 rollback (p21Rollback.ts: no eligible context, N-A everywhere)
//   post  production as shipped
// npm test: the 8 Stage 3 dates + a control date. P21S4_DUMP=1: every day of 2025–2027 (activities, events,
// hard warnings, heading states) written to p21-stage4/migration-diff.json; the default test checks the freeze.
type Model = 'pre' | 'post'
const OUT = 'docs/audits/sources/p4-vol10/p21-stage4/migration-diff.json'
const PATH = '../almanac-data/p4-puzhu21-v1.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const ALL = Array.from(
  { length: (Date.parse('2027-12-31') - Date.parse('2025-01-01')) / 864e5 + 1 },
  (_, i) => new Date(Date.parse('2025-01-01') + i * 864e5).toISOString().slice(0, 10),
)
const by = (s: string) => eligibility.rows.filter((r) => r.eligibility === s).map((r) => r.date)

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PATH)
  if (model === 'pre') vi.doMock(PATH, async () => (await import('./p21Rollback')).puzhu21Off())
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  return { getAlmanac, getP4DayHeadings, evaluateEventDay, eventOutput, EVENT_HOURS, EVENT_OPTIONS }
}
type Engine = Awaited<ReturnType<typeof load>>
type Rec = { activityId: string; score: number; status: string; hardWarning: boolean }

function snapshot(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const heads = e.getP4DayHeadings(date, {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  })
  const context = `${BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]}-${STEMS[a.dayCanChi.can]}${BRANCHES[a.dayCanChi.chi]}`
  const acts = Object.fromEntries(
    (a.activityRecommendations as unknown as Rec[]).map((r) => [
      r.activityId,
      { score: r.score, status: r.status, hardWarning: r.hardWarning },
    ]),
  )
  const events: Record<string, { score: unknown; classification: string }> = {}
  for (const [id] of e.EVENT_OPTIONS)
    for (const h of e.EVENT_HOURS) {
      const ev = e.eventOutput(e.evaluateEventDay, date, id, h) as {
        score: unknown
        classification: string
      }
      events[`${id}@${h ?? ''}`] = { score: ev.score, classification: ev.classification }
    }
  return { context, heads, acts, events }
}

async function compare(dates: readonly string[]) {
  const pre = await load('pre')
  const a = new Map(dates.map((d) => [d, snapshot(pre, d)]))
  const post = await load('post')
  const heading: unknown[] = []
  const activity: {
    date: string
    context: string
    activity: string
    before: Rec | object
    after: Rec | object
  }[] = []
  const event: { date: string; event: string; before: unknown; after: unknown }[] = []
  for (const d of dates) {
    const x = a.get(d)!
    const y = snapshot(post, d)
    for (const h of new Set([...Object.keys(x.heads), ...Object.keys(y.heads)]))
      if (JSON.stringify(x.heads[h]) !== JSON.stringify(y.heads[h]))
        heading.push({
          date: d,
          context: x.context,
          heading: h,
          before: x.heads[h],
          after: y.heads[h],
        })
    for (const [id, p] of Object.entries(x.acts))
      if (JSON.stringify(p) !== JSON.stringify(y.acts[id]))
        activity.push({ date: d, context: x.context, activity: id, before: p, after: y.acts[id]! })
    for (const [k, p] of Object.entries(x.events))
      if (JSON.stringify(p) !== JSON.stringify(y.events[k]))
        event.push({ date: d, event: k, before: p, after: y.events[k] })
  }
  vi.resetModules()
  vi.doUnmock(PATH)
  return { heading, activity, event }
}

function summarize(r: Awaited<ReturnType<typeof compare>>) {
  const acts = r.activity as { date: string; before: Rec; after: Rec }[]
  const evs = r.event as {
    date: string
    before: { classification: string }
    after: { classification: string }
  }[]
  return {
    dates: [...new Set(acts.map((x) => x.date))].sort(),
    headingRows: r.heading.length,
    activityRows: acts.length,
    scoreDelta: [...new Set(acts.map((x) => x.after.score - x.before.score))],
    hardWarningChanges: acts.filter((x) => x.before.hardWarning !== x.after.hardWarning).length,
    eventRecords: evs.length,
    eventClassificationChanges: evs.filter(
      (x) => x.before.classification !== x.after.classification,
    ).length,
  }
}

describe('P21 Stage 4 partial migration (p4-puzhu21-v1)', () => {
  it('lock pins the evidence, the authority, the code and both Golden successors', () => {
    const DIR = 'docs/audits/sources/p4-vol10/p21-stage4/'
    const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
    for (const [path, hash] of Object.entries(lock.files))
      if (path.startsWith(DIR)) expect(sha(path), path).toBe(hash)
      else expect(sha(path) === hash || committedWithDigest(path, hash), path).toBe(true)
  })

  it('rollback boundary: no production module imports p21Rollback', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      )
    const prod = [...files('shared'), ...files('src')].filter(
      (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('p21Rollback.ts'),
    )
    expect(prod.filter((f) => readFileSync(f, 'utf8').includes('p21Rollback'))).toEqual([])
  })

  it('authority: eligible contexts are the Stage 3 MIGRATE contexts, 亥-癸酉 included', () => {
    expect(puzhu21.eligibleContexts).toEqual(['亥-丁酉', '亥-癸酉'])
    const migrate = Object.entries(eligibility.contexts)
      .filter(([, k]) => k.eligibility === 'MIGRATE')
      .map(([c]) => c)
      .sort()
    expect([...puzhu21.eligibleContexts].sort()).toEqual(migrate)
    expect(puzhu21.provenance.witnesses).toEqual(['P21S2-06067696-n82', 'P21S2-06067696-n106'])
  })

  it('MIGRATE dates move exactly; HOLD, QUARANTINE and a control date do not', async () => {
    const r = await compare([...by('MIGRATE'), ...by('HOLD'), ...by('QUARANTINE'), '2025-01-01'])
    const changed = new Set(r.activity.map((x) => x.date))
    for (const d of [...by('HOLD'), ...by('QUARANTINE'), '2025-01-01'])
      expect(changed.has(d), d).toBe(false)
    expect(r.activity.map((x) => [x.date, x.context, x.activity, x.before, x.after])).toEqual(
      by('MIGRATE').flatMap((d) =>
        ['contract', 'transaction'].map((a) => [
          d,
          '亥-丁酉',
          a,
          { score: 50, status: 'neutral', hardWarning: false },
          { score: 20, status: 'avoid', hardWarning: false },
        ]),
      ),
    )
    expect(r.heading).toEqual(
      by('MIGRATE').map((d) => ({
        date: d,
        context: '亥-丁酉',
        heading: '立券交易',
        before: { state: 'neither_recorded' },
        after: { state: 'only_ji' },
      })),
    )
    expect(summarize(r)).toMatchObject({ activityRows: 6, eventRecords: 27, hardWarningChanges: 0 })
  }, 600_000)

  it.runIf(process.env.P21S4_DUMP === '1')(
    'dumps the full 2025–2027 diff',
    async () => {
      const r = await compare(ALL)
      writeFileSync(
        OUT,
        JSON.stringify(
          { harness: 'shared/lunar/p4P21Stage4Migration.test.ts', summary: summarize(r), ...r },
          null,
          1,
        ) + '\n',
      )
    },
    3_600_000,
  )

  it('the frozen full diff touches MIGRATE dates only', () => {
    const f = JSON.parse(readFileSync(OUT, 'utf8')) as {
      summary: ReturnType<typeof summarize>
      heading: { heading: string }[]
      activity: { activity: string }[]
    }
    // puzhu:22 boundary: no 開倉庫出貨財 (or any heading other than 立券交易) moves.
    expect(new Set(f.heading.map((h) => h.heading))).toEqual(new Set(['立券交易']))
    expect(new Set(f.activity.map((a) => a.activity))).toEqual(new Set(['contract', 'transaction']))
    expect(f.summary).toEqual({
      dates: by('MIGRATE'),
      headingRows: 3,
      activityRows: 6,
      scoreDelta: [-30],
      hardWarningChanges: 0,
      eventRecords: 27,
      eventClassificationChanges: 18,
    })
  })
})
