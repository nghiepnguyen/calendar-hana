import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { getMansionContent } from './mansionContentAuthority'

// Added after the baseline commit (interpretation review v2); the frozen hashes cover the rest.
const ADDED_ACTIVITIES = ['door_opening', 'waterworks']

describe('28 mansion content migration, 2025–2027 frozen pre-migration decisions', () => {
  it('changes explanations without changing any activity score/status or event verdict', () => {
    expect(baseline.commit).toBe('adfd3b598545be067182654f4a1fdb2c54b7b974')
    expect(baseline.days).toHaveLength(1095)
    for (const { date, sha256 } of baseline.days) {
      const a = getAlmanac(date)
      expect(a.mansion.content).toEqual(getMansionContent(a.mansion.index))
      // Catalog activities added later have no Trực/thần rules: no evidence, never a score.
      const added = a.activityRecommendations.filter((r) => ADDED_ACTIVITIES.includes(r.activityId))
      expect(added.map((r) => [r.activityId, r.status])).toEqual(
        ADDED_ACTIVITIES.map((id) => [id, 'no_evidence']),
      )
      const payload = {
        activities: a.activityRecommendations
          .filter((r) => !ADDED_ACTIVITIES.includes(r.activityId))
          .map((r) => [r.activityId, r.score, r.status]),
        events: EVENT_OPTIONS.map(([id]) => {
          const r = evaluateEventDay(date, id, { hour: 9 })
          return [id, r.score, r.classification]
        }),
      }
      expect(createHash('sha256').update(JSON.stringify(payload)).digest('hex'), date).toBe(sha256)
      expect(
        a.activityRecommendations
          .flatMap((r) => r.contributions)
          .filter((r) => r.source === 'mansion')
          .every((r) => r.status === 'informational' && r.scoreDelta === 0 && r.rawDelta === 0),
      ).toBe(true)
    }
  }, 60000)
})
