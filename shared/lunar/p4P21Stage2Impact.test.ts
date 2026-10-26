import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { solarTermCacheStore } from '../astronomy/solarTerms/cache'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { EVENT_HOURS, eventOutput } from './p4AdapterBaselineRows'
import { getP4DayHeadings } from './p4AlmanacHeadings'
import { setP4HeadingsProvider } from './p4ScoreAdapter'

// Audit only: P21 Stage 2 (docs/audits/p21-stage2-discriminating-witness.md). Preliminary, read-only impact of
// N-C (H2) on the 8 Stage 1 dates: the P4 provider is wrapped in this test only so that 立券交易 reads
// only_ji (五離 kept), as the Stage 1 projection gives. Production code and data are untouched; the provider
// is restored after the run. P21S2_IMPACT_DUMP=1 rewrites impact.json; npm test checks the freeze.
const OUT = 'docs/audits/sources/p4-vol10/p21-stage2/impact.json'
const STAGE1 = 'docs/audits/sources/p4-vol10/p21-stage1/projection.json'

type Rec = { activityId: string; score: number; status: string; hardWarning: boolean }

function snapshot(date: string) {
  solarTermCacheStore('almanac').clear()
  const a = getAlmanac(date as never)
  const acts = Object.fromEntries(
    (a.activityRecommendations as unknown as Rec[]).map((r) => [
      r.activityId,
      { score: r.score, status: r.status, hardWarning: r.hardWarning },
    ]),
  )
  const events: Record<string, { score: unknown; classification: string }> = {}
  for (const [id] of EVENT_OPTIONS)
    for (const h of EVENT_HOURS) {
      const ev = eventOutput(evaluateEventDay, date, id, h) as {
        score: unknown
        classification: string
      }
      events[`${id}@${h ?? ''}`] = { score: ev.score, classification: ev.classification }
    }
  return { acts, events }
}

function measure() {
  const dates = (
    JSON.parse(readFileSync(STAGE1, 'utf8')) as {
      dated2025_2027: { cells: { date: string; line: string }[] }
    }
  ).dated2025_2027.cells
    .filter((c) => c.line === 'puzhu:21')
    .map((c) => c.date)
  const before = new Map(dates.map((d) => [d, snapshot(d)]))
  setP4HeadingsProvider((date, day) => {
    const h = getP4DayHeadings(date, day)
    return dates.includes(date) && h['立券交易'] ? { ...h, 立券交易: { state: 'only_ji' } } : h
  })
  const activity: unknown[] = []
  const event: unknown[] = []
  try {
    for (const d of dates) {
      const x = before.get(d)!
      const y = snapshot(d)
      for (const [id, p] of Object.entries(x.acts))
        if (JSON.stringify(p) !== JSON.stringify(y.acts[id]))
          activity.push({ date: d, activityId: id, nA: p, nC: y.acts[id] })
      for (const [k, p] of Object.entries(x.events))
        if (JSON.stringify(p) !== JSON.stringify(y.events[k]))
          event.push({ date: d, event: k, nA: p, nC: y.events[k] })
    }
  } finally {
    setP4HeadingsProvider(getP4DayHeadings)
    solarTermCacheStore('almanac').clear()
  }
  return { dates, activity, event }
}

// Frozen before P21 Stage 4 (p4-puzhu21-v1, puzhu:21 contribution-scoped on 亥-丁酉/亥-癸酉): pinned to the
// pre-P21 rollback (p21Rollback.ts, puzhu:21 heading-wide everywhere).
vi.mock('../almanac-data/p4-puzhu21-v1.json', async () =>
  (await import('./p21Rollback')).puzhu21Off(),
)
await vi.hoisted(async () => (await import('./p21Rollback')).reloadUnderP21Pin())

describe('P21 Stage 2 preliminary N-C impact (audit only)', () => {
  it.runIf(process.env.P21S2_IMPACT_DUMP === '1')('dumps the impact', { timeout: 600_000 }, () => {
    writeFileSync(
      OUT,
      JSON.stringify({ harness: 'shared/lunar/p4P21Stage2Impact.test.ts', ...measure() }, null, 2) +
        '\n',
    )
  })

  it('matches the frozen impact', { timeout: 600_000 }, () => {
    const { harness: _, ...frozen } = JSON.parse(readFileSync(OUT, 'utf8'))
    expect(measure()).toEqual(frozen)
  })
})
