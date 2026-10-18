import { describe, expect, it, vi } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getMansionContent } from './mansionContentAuthority'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

// Added after the baseline commit (interpretation review v2).
const ADDED_ACTIVITIES = ['door_opening', 'waterworks']

describe('28 mansion content migration, 2025–2027 frozen pre-migration decisions', () => {
  it('changes explanations without changing any activity score/status or event verdict', () => {
    expect(baseline.commit).toBe('adfd3b598545be067182654f4a1fdb2c54b7b974')
    expect(baseline.days).toHaveLength(1095)
    for (const { date } of baseline.days) {
      const a = getAlmanac(date)
      expect(a.mansion.content).toEqual(getMansionContent(a.mansion.index))
      // Catalog activities added later have no Trực/thần rules: no evidence, never a score.
      const added = a.activityRecommendations.filter((r) => ADDED_ACTIVITIES.includes(r.activityId))
      expect(added.map((r) => [r.activityId, r.status])).toEqual(
        ADDED_ACTIVITIES.map((id) => [id, 'no_evidence']),
      )
      // Exact baseline hashes (activities + event verdicts) are proven in
      // xiejiConditionalMigration.test.ts against the pre-fix catalog; dataset 1.2.1 changed only
      // warehouse (協紀 修倉庫 conditional clause).
      expect(
        a.activityRecommendations
          .flatMap((r) => r.contributions)
          .filter((r) => r.source === 'mansion')
          .every((r) => r.status === 'informational' && r.scoreDelta === 0 && r.rawDelta === 0),
      ).toBe(true)
    }
  }, 60000)
})
