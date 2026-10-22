import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import scopeDates from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json'

// Migration proof for the 卷十 劫煞 authority (faithful-v1 projection) against legacy cancel_both, with an
// independent simulator-style check: legacy runtime + a resolveVol10 wrapper that flips 劫煞 cancel_both
// no_annotation items from the approved audit candidate (no production branch involved). npm test runs one
// date per context; JIESHA_MIGRATION_FULL=1 runs every scope date 1900–2100 and every 2025–2027 day and
// writes the migration artifact.
const DIR = 'docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1'
const CANDIDATE = 'docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json'
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'
type Side = 'legacy' | 'production' | 'simulator'

async function graph(side: Side) {
  vi.resetModules()
  vi.doUnmock('./xiejiVol10Resolution')
  vi.doMock('../almanac-data/manifest.json', async (orig) => {
    const real = (await orig<{ default: { policies: object } }>()).default
    const policy = side === 'production' ? 'faithful-v1' : 'legacy-cancel-both'
    return { default: { ...real, policies: { ...real.policies, xiejiVol10JieshaPolicy: policy } } }
  })
  if (side === 'simulator') {
    const cells = (
      JSON.parse(readFileSync(CANDIDATE, 'utf8')) as {
        cells: Record<string, Record<string, string>>
      }
    ).cells
    vi.doMock('./xiejiVol10Resolution', async (orig) => {
      const m = await orig<typeof import('./xiejiVol10Resolution')>()
      return {
        ...m,
        resolveVol10: (...a: Parameters<typeof m.resolveVol10>) => {
          const [d] = a
          const key = BR[d.monthJianBranch]! + ST[d.dayStem]! + BR[d.dayBranch]!
          return m
            .resolveVol10(...a)
            .map((it) =>
              it.entry === 'jie_sha' &&
              it.effect === 'cancel_both' &&
              it.verdict === 'no_annotation' &&
              '辰戌丑未'.includes(BR[d.monthJianBranch]!) &&
              cells[key]?.[it.activityId] === 'avoid'
                ? { ...it, verdict: 'avoid' as const }
                : it,
            )
        },
      }
    })
  }
  await import('./p4AlmanacHeadings') // registers the production provider, as the app does
  const { getAlmanac } = await import('./almanac')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  return (date: string) => {
    const al = getAlmanac(date as never)
    return {
      acts: Object.fromEntries(
        al.activityRecommendations.map((r) => [
          r.activityId,
          {
            score: r.score,
            status: r.status,
            hardWarning: Boolean(r.hardWarning),
            rows: r.contributions
              .map((c) => `${c.source}:${c.ruleId}:${c.scoreDelta}:${c.status}`)
              .join('|'),
          },
        ]),
      ),
      events: Object.fromEntries(
        EVENT_OPTIONS.map(([id]) => {
          const e = evaluateEventDay(date as never, id, {})
          return [id, `${e.score}:${e.classification}`]
        }),
      ),
    }
  }
}

async function run(dates: string[]) {
  const out = {} as Record<Side, Record<string, ReturnType<Awaited<ReturnType<typeof graph>>>>>
  for (const side of ['legacy', 'production', 'simulator'] as const) {
    const g = await graph(side)
    out[side] = Object.fromEntries(dates.map((d) => [d, g(d)]))
  }
  vi.doUnmock('./xiejiVol10Resolution')
  vi.doUnmock('../almanac-data/manifest.json')
  return out
}

function diff(a: ReturnType<Awaited<ReturnType<typeof graph>>>, b: typeof a) {
  const acts = Object.keys(a.acts).flatMap((id) => {
    const x = a.acts[id]!
    const y = b.acts[id]!
    return x.rows === y.rows &&
      x.score === y.score &&
      x.status === y.status &&
      x.hardWarning === y.hardWarning
      ? []
      : [{ activity: id, from: x, to: y }]
  })
  const events = Object.keys(a.events).flatMap((id) =>
    a.events[id] === b.events[id] ? [] : [{ event: id, from: a.events[id]!, to: b.events[id]! }],
  )
  return { acts, events }
}

const SCOPE = scopeDates as Record<string, string[]>
const CELLS = (
  JSON.parse(readFileSync('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json', 'utf8')) as {
    cells: Record<string, Record<string, string>>
  }
).cells

describe('卷十 劫煞 faithful-v1 migration', () => {
  it('one date per context: production equals the independent simulator; changes only in scope', async () => {
    const dates = Object.values(SCOPE).map((ds) => ds.find((d) => d >= '2025') ?? ds[0]!)
    const r = await run(dates)
    for (const d of dates)
      expect(diff(r.production[d]!, r.simulator[d]!), d).toEqual({ acts: [], events: [] })
    expect(dates.some((d) => diff(r.legacy[d]!, r.production[d]!).acts.length)).toBe(true)
  }, 900_000)

  it.skipIf(!process.env.JIESHA_MIGRATION_FULL)(
    'full range: every scope date 1900–2100 and every 2025–2027 day',
    async () => {
      const scope = new Map(
        Object.entries(SCOPE).flatMap(([ctx, ds]) => ds.map((d) => [d, ctx] as const)),
      )
      const window: string[] = []
      for (let t = Date.UTC(2025, 0, 1); t <= Date.UTC(2027, 11, 31); t += 86_400_000)
        window.push(new Date(t).toISOString().slice(0, 10))
      const dates = [...new Set([...scope.keys(), ...window])].sort()
      const r = await run(dates)
      const rows: unknown[] = []
      const mismatch: string[] = []
      for (const d of dates) {
        const sim = diff(r.production[d]!, r.simulator[d]!)
        if (sim.acts.length || sim.events.length) mismatch.push(d)
        const m = diff(r.legacy[d]!, r.production[d]!)
        if (!scope.has(d) && (m.acts.length || m.events.length)) mismatch.push(`outside:${d}`)
        const ctx = scope.get(d)
        for (const x of m.acts)
          rows.push({
            date: d,
            context: ctx,
            activity: x.activity,
            cell: ctx ? (CELLS[ctx.replace('-', '')]?.[x.activity] ?? null) : null,
            score: [x.from.score, x.to.score],
            status: [x.from.status, x.to.status],
            hardWarning: [x.from.hardWarning, x.to.hardWarning],
            rowsChanged: x.from.rows !== x.to.rows,
          })
        for (const x of m.events)
          rows.push({ date: d, context: ctx, event: x.event, result: [x.from, x.to] })
      }
      writeFileSync(
        `${DIR}/migration-rows.json`,
        JSON.stringify({ dates: dates.length, scopeDates: scope.size, rows }, null, 1) + '\n',
      )
      expect(mismatch).toEqual([])
    },
    7_200_000,
  )
})
