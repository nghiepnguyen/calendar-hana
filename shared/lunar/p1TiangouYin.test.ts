import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import type { Almanac } from './almanac'

// P1 天狗寅日 「不註宜求福祈嗣」 (tasks/prd-p1-tiangou-yin.md). Golden frozen before code in 338b8dc.
const GOLDEN_PATH = 'shared/almanac-data/golden-p1-tiangou-yin.json'
const GOLDEN_SHA256 = '9c8afc06db2db3bd6e7538236d5837f84613e5b21ee9d0f83ad790c18f0b3ca5'
const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8')) as {
  marker: { classicalVersion: string; entry: string; verdict: string }
  cases: {
    date: string
    activityId: string
    p4State: string | null
    appliedPositiveRows: number | null
    p1Rows: 'none' | 'none_p4_lifted' | 'only_lifted_positives'
    statusNotRecommended: boolean
  }[]
}

type Config = { name: string; policies: Record<string, boolean> }
const CONFIGS: Config[] = [
  { name: 'shipped manifest', policies: {} },
  { name: 'P4 flag OFF (D3)', policies: { xiejiVol10BalancingEnabled: false } },
  { name: 'tiangouYinNoYi false (FR-7)', policies: { tiangouYinNoYi: false } },
]

/** Fresh module graph per config, so memoized almanacs never cross configs. */
async function almanacFor(policies: Record<string, boolean>) {
  vi.resetModules()
  vi.doMock('../almanac-data/manifest.json', async (load) => {
    const real = ((await load()) as { default: { policies: object } }).default
    return { default: { ...real, policies: { ...real.policies, ...policies } } }
  })
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  vi.doUnmock('../almanac-data/manifest.json')
  return getAlmanac as (date: string) => Almanac
}

describe('P1 天狗寅日 Golden v1', () => {
  it('Golden bytes are the frozen ones', () => {
    expect(createHash('sha256').update(readFileSync(GOLDEN_PATH)).digest('hex')).toBe(GOLDEN_SHA256)
  })

  it('manifest ships tiangouYinNoYi = true', async () => {
    const manifest = (await import('../almanac-data/manifest.json')).default as {
      policies: Record<string, unknown>
    }
    expect(manifest.policies.tiangouYinNoYi).toBe(true)
  })

  for (const config of CONFIGS)
    it(`${config.name}: every case`, async () => {
      const getAlmanac = await almanacFor(config.policies)
      const p1On = config.policies.tiangouYinNoYi !== false
      const p4On = config.policies.xiejiVol10BalancingEnabled !== false
      const marked: Record<string, number> = {}
      for (const c of golden.cases) {
        const a = getAlmanac(c.date).activityRecommendations.find(
          (r) => r.activityId === c.activityId,
        )!
        const id = `${c.date} ${c.activityId}`
        const rows = a.contributions
        const p1 = rows.filter((r) => r.classical?.version === golden.marker.classicalVersion)
        const applied = rows.filter((r) => r.status === 'applied')
        if (!p1On) {
          expect(p1, id).toEqual([])
          continue
        }
        if (c.appliedPositiveRows === 0)
          expect(
            applied.filter((r) => r.rawDelta > 0).map((r) => r.ruleId),
            id,
          ).toEqual([])
        const expectRows =
          c.p1Rows === 'none_p4_lifted' && !p4On ? 'only_lifted_positives' : c.p1Rows
        if (expectRows === 'only_lifted_positives') {
          for (const r of p1) {
            expect(r.rawDelta, id).toBeGreaterThan(0)
            expect([r.status, r.scoreDelta, r.classical?.entry, r.classical?.verdict], id).toEqual([
              'informational',
              0,
              golden.marker.entry,
              golden.marker.verdict,
            ])
          }
          marked[c.activityId] = (marked[c.activityId] ?? 0) + p1.length
        } else expect(p1, id).toEqual([])
        if (c.statusNotRecommended) expect(a.status, id).not.toBe('recommended')
        // FR-3: score from the remaining applied rows; all lifted and nothing applied → neutral.
        const sum = applied.reduce((s, r) => s + r.scoreDelta, 0)
        expect(a.score, id).toBe(Math.max(0, Math.min(100, 50 + sum)))
        if (!applied.length && p1.length) expect(a.status, id).toBe('neutral')
      }
      // Non-vacuous: P1 lifts something for both activities.
      if (p1On)
        expect(
          Object.keys(marked)
            .filter((k) => marked[k]! > 0)
            .sort(),
        ).toEqual(['pray_blessing', 'pray_children'])
    }, 120_000)
})
