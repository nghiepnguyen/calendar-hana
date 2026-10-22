import { describe, expect, it, vi } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import mapping from '../almanac-data/event-mapping.json'
import { EVENT_OPTIONS } from './eventMapping'
import { legacyOpenBusinessMapping } from './legacyEventMapping'

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
        legacyGodsMonthJian: false,
        xiejiVol10JieshaPolicy: 'legacy-cancel-both',
      },
    },
  }
})

// opening (Khai trương) and business (Mở hàng) both map the 協紀 開市 heading, so listing
// business as a supporting activity of open_business counted the same Trực/god evidence
// twice. Removing it is an EXPECTED_AUTHORITY_MIGRATION_CHANGE limited to open_business:
// scores move, and the only conclusion change is recommended → caution on days whose
// surplus came from the duplicate.
describe('open_business no longer double-counts 開市 via business', () => {
  it('changes only open_business, and only recommended → caution', async () => {
    const current = mapping.events.open_business.activities
    expect(current.map((a) => a.activityId)).toEqual(['opening', 'finance'])
    vi.resetModules()
    vi.doMock('../almanac-data/event-mapping.json', () => legacyOpenBusinessMapping(mapping))
    const before = (await import('./eventEvaluation')).evaluateEventDay
    vi.doUnmock('../almanac-data/event-mapping.json')
    vi.resetModules()
    const after = (await import('./eventEvaluation')).evaluateEventDay

    const transitions: Record<string, number> = {}
    let scoreChanged = 0
    expect(baseline.days).toHaveLength(1095)
    for (const { date } of baseline.days) {
      for (const [id] of EVENT_OPTIONS) {
        const a = before(date as never, id, { hour: 9 })
        const b = after(date as never, id, { hour: 9 })
        if (id !== 'open_business') {
          expect(b.score, `${date} ${id}`).toBe(a.score)
          expect(b.classification, `${date} ${id}`).toBe(a.classification)
          continue
        }
        expect(b.contributions.some((row) => row.activityId === 'business')).toBe(false)
        expect(b.contributions).toEqual(
          a.contributions.filter((row) => row.activityId !== 'business'),
        )
        if (a.score !== b.score) scoreChanged++
        if (a.classification !== b.classification) {
          const key = `${a.classification} → ${b.classification}`
          transitions[key] = (transitions[key] ?? 0) + 1
        }
      }
    }
    expect(scoreChanged).toBe(727)
    expect(transitions).toEqual({ 'recommended → caution': 40 })
  }, 600_000)

  it('witness 2025-04-06: one Ngũ Phú +10 no longer counts at ×1.5', () => {
    return import('./eventEvaluation').then(({ evaluateEventDay }) => {
      const result = evaluateEventDay('2025-04-06', 'open_business', { hour: 9 })
      expect(result.score).toBe(63)
      expect(result.classification).toBe('caution')
    })
  })
})
