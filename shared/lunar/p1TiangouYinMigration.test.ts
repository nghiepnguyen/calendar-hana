import { appendFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import type { Almanac } from './almanac'
import type { evaluateEventDay as EvaluateEventDay } from './eventEvaluation'
import { eventRows, recSha } from './p4AdapterBaselineRows'

// P1 migration proof (tasks/prd-p1-tiangou-yin.md §6): P1 off vs on, P4 flag ON and OFF, 2024–2028.
// npm test: every 寅 day + every 10th date, no events; P1_MIGRATION_FULL=1: all dates and events (~4 min).
const FULL = process.env.P1_MIGRATION_FULL === '1'
const TARGET = new Set(['pray_blessing', 'pray_children'])
const YIN = 2 // 2000-01-07 = 甲子
const isYin = (d: string) =>
  ((((Date.parse(d) - Date.UTC(2000, 0, 7)) / 864e5) % 12) + 12) % 12 === YIN
const DATES: string[] = []
for (let t = Date.UTC(2024, 0, 1), i = 0; t <= Date.UTC(2028, 11, 31); t += 864e5, i++) {
  const d = new Date(t).toISOString().slice(0, 10)
  if (FULL || isYin(d) || i % 10 === 0) DATES.push(d)
}

async function load(policies: Record<string, boolean>) {
  vi.resetModules()
  vi.doMock('../almanac-data/manifest.json', async (importOriginal) => {
    const real = ((await importOriginal()) as { default: { policies: object } }).default
    return { default: { ...real, policies: { ...real.policies, ...policies } } }
  })
  await import('./p4AlmanacHeadings')
  const getAlmanac = (await import('./almanac')).getAlmanac as (d: string) => Almanac
  const evaluate = (await import('./eventEvaluation')).evaluateEventDay as typeof EvaluateEventDay
  vi.doUnmock('../almanac-data/manifest.json')
  return { getAlmanac, evaluate }
}

describe('P1 天狗寅日 migration (P1 off → on)', () => {
  for (const p4 of [true, false])
    it(`P4 flag ${p4 ? 'ON' : 'OFF'}: only pray_blessing/pray_children on 寅 days change`, async () => {
      const pre = await load({ xiejiVol10BalancingEnabled: p4, tiangouYinNoYi: false })
      const post = await load({ xiejiVol10BalancingEnabled: p4, tiangouYinNoYi: true })
      const unexpected: string[] = []
      const moves: Record<string, number> = {}
      for (const date of DATES) {
        const a = pre.getAlmanac(date).activityRecommendations
        const b = post.getAlmanac(date).activityRecommendations
        expect(b.map((r) => r.activityId)).toEqual(a.map((r) => r.activityId))
        a.forEach((x, i) => {
          const y = b[i]!
          if (recSha(x) === recSha(y)) return
          const id = `${date} ${x.activityId}`
          if (!TARGET.has(x.activityId) || !isYin(date)) return unexpected.push(id)
          // Negatives (and hard warnings) are untouched; only applied positives were lifted.
          const neg = (r: typeof x) =>
            r.contributions
              .filter((c) => c.rawDelta < 0)
              .map((c) => [c.ruleId, c.status, c.scoreDelta])
          if (JSON.stringify(neg(x)) !== JSON.stringify(neg(y)) || x.hardWarning !== y.hardWarning)
            unexpected.push(`${id} negatives`)
          if (y.contributions.some((c) => c.status === 'applied' && c.rawDelta > 0))
            unexpected.push(`${id} positive left`)
          const year = date.slice(0, 4)
          const key = `${year >= '2025' && year <= '2027' ? 'in' : 'out'}\t${x.activityId}\t${x.status} → ${y.status}`
          moves[key] = (moves[key] ?? 0) + 1
        })
      }
      expect(unexpected.slice(0, 10)).toEqual([])
      expect(Object.keys(moves).length).toBeGreaterThan(0)
      // No event profile uses the two activities: every event row stays byte-equal.
      if (FULL) expect(eventRows(post.evaluate, DATES)).toBe(eventRows(pre.evaluate, DATES))
      if (process.env.REPORT_FILE)
        appendFileSync(
          process.env.REPORT_FILE,
          Object.entries(moves)
            .sort()
            .map(([k, n]) => `P4 ${p4 ? 'ON' : 'OFF'}\t${k}\t${n}\n`)
            .join(''),
        )
    }, 900_000)
})
