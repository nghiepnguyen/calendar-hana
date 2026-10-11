import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-baiji-ty-hoi.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const hardWarningStatus = (score: number) =>
  score <= 19 ? 'strong_avoid' : score <= 29 ? 'avoid' : 'consider'

describe('卷十 百忌日: 巳日 出行, 亥日 嫁娶 (golden frozen before code)', () => {
  it('matches every frozen golden case', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const c of golden.cases) {
      const day = getAlmanac(c.date as never)
      expect(BRANCHES[day.dayCanChi.chi], c.date).toBe(c.dayBranch)
      const activity = day.activityRecommendations.find((r) => r.activityId === c.activityId)!
      const row = activity.contributions.find(
        (r) => r.source === 'bad_god' && r.ruleId === c.rule && r.status === 'applied',
      )
      const where = `${c.date} ${c.activityId} ${c.rule}`
      expect(Boolean(row), where).toBe(c.present)
      if (!c.present) continue
      expect(row!.hardWarning, where).toBe(c.hardWarning)
      expect(activity.status, where).not.toBe('recommended')
      expect(activity.status, where).toBe(hardWarningStatus(activity.score))
      const event = evaluateEventDay(c.date as never, c.event as never, { hour: 9 })
      if (c.eventClassification === 'not_recommended')
        expect(event.classification, where).toBe('not_recommended')
      else expect(['not_recommended', 'caution'], where).toContain(event.classification)
    }
  })
})
