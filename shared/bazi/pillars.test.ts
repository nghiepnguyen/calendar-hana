import { describe, expect, it } from 'vitest'
import { dayCanChi } from '../lunar/canChi'
import { solarStringToJd } from '../lunar/julian'
import { calculatePillars } from './pillars'

describe('calculatePillars', () => {
  it('derives the Tý-hour stem for all ten day stems', () => {
    for (let day = 1; day <= 10; day += 1) {
      const date = `2024-03-${String(day).padStart(2, '0')}`
      const dayStem = dayCanChi(solarStringToJd(date)).can
      const result = calculatePillars('2024-03-05T12:00:00.000Z', `${date}T00:30:00.000`, 'splitZi')
      expect(result.pillars.hour.chi).toBe(0)
      expect(result.pillars.hour.can).toBe((dayStem % 5) * 2)
    }
  })
})
