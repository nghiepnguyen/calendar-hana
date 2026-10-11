import { describe, expect, it, vi } from 'vitest'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { EVENT_OPTIONS } from './eventMapping'
import { YUE_PO_STILL_AVOID } from './yuePoStillAvoidPolicy'

const CHANGED_DATES = [
  '2025-07-06',
  '2025-07-19',
  '2025-09-06',
  '2026-07-01',
  '2026-07-14',
  '2026-09-01',
  '2027-01-03',
  '2027-06-26',
  '2027-07-09',
  '2027-08-27',
  '2027-12-29',
]

// 月破 子午未申 with 德 仍忌解除求醫療病破屋壞垣. The old resolver kept only 月破's base list, so
// medical (求醫療病) and demolition (破屋壞垣) read not_listed and kept Trực Phá's +25. Fixing it is
// an EXPECTED_AUTHORITY_MIGRATION_CHANGE limited to those two activities on 11 of 1095 days.
describe('月破 仍忌 headings outside its base list', () => {
  it('quotes the clause it implements', () => {
    const yuePo = vol10.entries.find((e) => e.id === 'yue_po')!
    const clause = yuePo.clauses.find((c) => c.months.includes('子') && c.effect === 'still_avoid')!
    expect(clause.months).toEqual([...YUE_PO_STILL_AVOID.months])
    expect(clause.quote).toContain(YUE_PO_STILL_AVOID.quote)
  })

  it('changes only medical and demolition, on 11 days, and no event', async () => {
    vi.resetModules()
    vi.doMock('./yuePoStillAvoidPolicy', async (orig) => ({
      ...(await orig<typeof import('./yuePoStillAvoidPolicy')>()),
      LEGACY_STILL_AVOID_BASE_ONLY: true,
    }))
    const before = (await import('./almanac')).getAlmanac
    const beforeEvent = (await import('./eventEvaluation')).evaluateEventDay
    vi.doUnmock('./yuePoStillAvoidPolicy')
    vi.resetModules()
    const after = (await import('./almanac')).getAlmanac
    const afterEvent = (await import('./eventEvaluation')).evaluateEventDay

    expect(baseline.days).toHaveLength(1095)
    const transitions: Record<string, number> = {}
    const dates = new Set<string>()
    for (const { date } of baseline.days) {
      const a = before(date as never).activityRecommendations
      const b = after(date as never).activityRecommendations
      for (const ra of a) {
        const rb = b.find((x) => x.activityId === ra.activityId)!
        if (ra.score === rb.score && ra.status === rb.status) continue
        expect(['medical', 'demolition'], `${date} ${ra.activityId}`).toContain(ra.activityId)
        expect(rb.score - ra.score, `${date} ${ra.activityId}`).toBe(-50)
        dates.add(date)
        const key = `${ra.activityId}: ${ra.status} → ${rb.status}`
        transitions[key] = (transitions[key] ?? 0) + 1
      }
      for (const [id] of EVENT_OPTIONS) {
        const x = beforeEvent(date as never, id, { hour: 9 })
        const y = afterEvent(date as never, id, { hour: 9 })
        expect([y.score, y.classification], `${date} ${id}`).toEqual([x.score, x.classification])
      }
    }
    expect([...dates].sort()).toEqual(CHANGED_DATES)
    expect(transitions).toEqual({
      'medical: recommended → watch': 5,
      'medical: watch → watch': 6,
      'demolition: recommended → avoid': 5,
      'demolition: watch → strong_avoid': 6,
    })
  }, 900_000)

  it('witness 2025-07-06: Trực Phá +25 flips under the 月破 chain', async () => {
    const { getAlmanac } = await import('./almanac')
    const medical = getAlmanac('2025-07-06' as never).activityRecommendations.find(
      (r) => r.activityId === 'medical',
    )!
    const truc = medical.contributions.find((c) => c.ruleId === 'pha:medical')!
    expect(truc.scoreDelta).toBe(-25)
    expect(truc.classical).toMatchObject({ entry: 'yue_po', verdict: 'avoid' })
  })
})
