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

  // bazi_calculation_engine_spec.md mục 2.2 ghi Bính Dần/Nhâm Thìn, nhưng công thức JDN của chính spec
  // cho JDN 2448119: (JDN+9) mod 10 = 8 (Nhâm), (JDN+1) mod 12 = 0 (Tý); giờ Thìn ngày Nhâm là Giáp.
  it('matches the spec formula for 1990-08-15 08:30 UTC+7, not its illustrative output', () => {
    const result = calculatePillars('1990-08-15T01:30:00.000Z', '1990-08-15T08:30:00', 'splitZi')
    expect(Object.values(result.pillars).map((pillar) => pillar.name)).toEqual([
      'Canh Ngọ',
      'Giáp Thân',
      'Nhâm Tý',
      'Giáp Thìn',
    ])
  })
})
