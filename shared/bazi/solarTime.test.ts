import { describe, expect, it } from 'vitest'
import { calculateTrueSolarTime } from './solarTime'

describe('calculateTrueSolarTime', () => {
  it('matches the frozen JPL apparent-solar-time fixture', () => {
    const result = calculateTrueSolarTime('2024-02-04T08:00:00.000Z', 106.66, 420)
    expect(
      Math.abs(Date.parse(`${result.tstDateTime}Z`) - Date.parse('2024-02-04T14:52:50.094Z')),
    ).toBeLessThan(1000)
    expect(result.engineErrorBoundSeconds).toBe(30)
    expect(result.engineVersion).toBe('astronomy-engine@2.1.19')
  })

  it('is invariant to the civil offset representation of the same instant', () => {
    const a = calculateTrueSolarTime('2024-06-05T04:10:00.000Z', 102.15, 420)
    const b = calculateTrueSolarTime('2024-06-05T04:10:00.000Z', 102.15, 480)
    expect(a.tstDateTime).toBe(b.tstDateTime)
    expect(a.totalCorrectionSeconds).not.toBe(b.totalCorrectionSeconds)
  })
})
