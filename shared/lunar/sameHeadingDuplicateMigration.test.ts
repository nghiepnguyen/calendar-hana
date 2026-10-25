import { describe, expect, it, vi } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import mapping from '../almanac-data/event-mapping.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { legacySameHeadingMapping } from './legacyEventMapping'

// Frozen before G2 Stage 2 (立劵交易 alias + 劫煞 authority v2): pinned to the pre-G2 rollback (g2Rollback.ts).
vi.mock('../almanac-data/xiejibianfangshu-vol10-yiji.json', async (load) =>
  (await import('./g2Rollback')).withoutG2Alias(await load()),
)
vi.mock('../almanac-data/xieji-vol10-jiesha-authority-v4.json', async () =>
  (await import('./g2Rollback')).jieshaAuthorityV1(),
)
await vi.hoisted(async () => (await import('./g2Rollback')).reloadUnderG2Pins())

// Captured before the 14 legacy gods moved to Month Jian (legacyGodsMonthJian, legacyGodsMonthJian.test.ts).
// Frozen before the 卷十 劫煞 faithful-v1 migration (2026-10-22): pinned to legacy-cancel-both.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const { default: current } = await importOriginal<{
    default: typeof import('../almanac-data/manifest.json')
  }>()
  return {
    default: {
      ...current,
      policies: {
        ...current.policies,
        xiejiVol10BalancingEnabled: false,
        legacyGodsMonthJian: false,
        xiejiVol10JieshaPolicy: 'legacy-cancel-both',
      },
    },
  }
})

// Same defect as kaishiDoubleCountMigration: contract/transaction both map 立券交易, and
// construction maps 興造動土 (+ 營建宮室) like groundbreaking. Each pair shares every Trực weight
// and god, so the ×0.5 supporting activity only repeated the primary's evidence. Dropping it is
// an EXPECTED_AUTHORITY_MIGRATION_CHANGE limited to sign_contract and groundbreaking.
const DROPPED = {
  sign_contract: ['contract', 'transaction'],
  groundbreaking: ['groundbreaking', 'construction'],
} as const
const signature = (rows: { source: string; ruleId: string; scoreDelta: number }[], id: string) =>
  rows
    .filter((r) => r.scoreDelta !== 0)
    .map((r) => `${r.source}|${r.ruleId.replace(`:${id}`, '')}|${r.scoreDelta}`)
    .sort()

describe('events no longer count a same-heading supporting activity', () => {
  it('the dropped supporting activity never carried evidence of its own (2025–2027)', () => {
    for (const { date } of baseline.days) {
      const recs = getAlmanac(date as never).activityRecommendations
      for (const [primary, supporting] of Object.values(DROPPED)) {
        const rows = (id: string) => recs.find((r) => r.activityId === id)!.contributions
        expect(signature(rows(supporting), supporting), `${date} ${supporting}`).toEqual(
          signature(rows(primary), primary),
        )
      }
    }
  }, 600_000)

  it('changes only sign_contract and groundbreaking, and only recommended → caution', async () => {
    expect(mapping.events.sign_contract.activities.map((a) => a.activityId)).toEqual(['contract'])
    expect(mapping.events.groundbreaking.activities.map((a) => a.activityId)).toEqual([
      'groundbreaking',
    ])
    vi.resetModules()
    vi.doMock('../almanac-data/event-mapping.json', () => legacySameHeadingMapping(mapping))
    const before = (await import('./eventEvaluation')).evaluateEventDay
    vi.doUnmock('../almanac-data/event-mapping.json')
    vi.resetModules()
    const after = (await import('./eventEvaluation')).evaluateEventDay

    const transitions: Record<string, number> = {}
    const scoreChanged: Record<string, number> = {}
    for (const { date } of baseline.days) {
      for (const [id] of EVENT_OPTIONS) {
        const a = before(date as never, id, { hour: 9 })
        const b = after(date as never, id, { hour: 9 })
        if (!(id in DROPPED)) {
          expect(b.score, `${date} ${id}`).toBe(a.score)
          expect(b.classification, `${date} ${id}`).toBe(a.classification)
          continue
        }
        const dropped = DROPPED[id as keyof typeof DROPPED][1]
        expect(b.contributions).toEqual(a.contributions.filter((row) => row.activityId !== dropped))
        if (a.score !== b.score) scoreChanged[id] = (scoreChanged[id] ?? 0) + 1
        if (a.classification !== b.classification) {
          const key = `${id} ${a.classification} → ${b.classification}`
          transitions[key] = (transitions[key] ?? 0) + 1
        }
      }
    }
    expect(scoreChanged).toEqual({ sign_contract: 770, groundbreaking: 816 })
    expect(transitions).toEqual({
      'sign_contract recommended → caution': 80,
      'groundbreaking recommended → caution': 6,
    })
  }, 600_000)

  it.each([
    ['2025-01-03', 'sign_contract'],
    ['2025-01-02', 'groundbreaking'],
  ] as const)('witness %s %s: 65 recommended → 60 caution', (date, event) => {
    const result = evaluateEventDay(date, event, { hour: 9 })
    expect(result.score).toBe(60)
    expect(result.classification).toBe('caution')
  })
})
