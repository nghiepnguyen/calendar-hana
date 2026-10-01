import { describe, expect, it } from 'vitest'
import { resolveZiPolicy } from './ziPolicy'

describe('resolveZiPolicy', () => {
  it.each([
    ['2024-02-04T22:59:00.000', 'splitZi', '2024-02-04', '2024-02-04', 11],
    ['2024-02-04T23:00:00.000', 'splitZi', '2024-02-04', '2024-02-05', 0],
    ['2024-02-04T23:59:00.000', 'dayStartsAt23', '2024-02-05', '2024-02-05', 0],
    ['2024-02-05T00:00:00.000', 'splitZi', '2024-02-05', '2024-02-05', 0],
    ['2024-02-05T00:59:00.000', 'splitZi', '2024-02-05', '2024-02-05', 0],
    ['2024-02-05T01:00:00.000', 'splitZi', '2024-02-05', '2024-02-05', 1],
  ] as const)('resolves %s under %s', (tst, policy, dayPillarDate, hourStemDate, hourChi) => {
    expect(resolveZiPolicy(tst, policy)).toEqual({ dayPillarDate, hourStemDate, hourChi, policy })
  })

  it('rejects an unsupported policy', () => {
    expect(() => resolveZiPolicy('2024-02-04T12:00:00.000', 'other' as never)).toThrow()
  })
})
