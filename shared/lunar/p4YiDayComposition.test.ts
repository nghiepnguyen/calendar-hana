import { describe, expect, it } from 'vitest'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'

describe('P4-C 5.3 opt-in assembly contract', () => {
  it('builds all eleven stable provider traces before heading classification', () => {
    const day = resolveP4YiDay('寅', '甲辰')
    expect(day.version).toBe('p4-yi-day-composition-v1')
    expect(day.yiOperands).toHaveLength(11)
    expect(day.yiOperands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ han: '福德', presence: 'present', traceId: 'p4yi:fu-de' }),
        expect.objectContaining({ han: '天巫', presence: 'present', traceId: 'p4yi:tian-wu' }),
        expect.objectContaining({
          han: '母倉',
          presence: 'unknown',
          reason: 'MISSING_REQUIRED_INPUT',
        }),
      ]),
    )
    // These assertions observe classified pre-propagation output, not a patched final map.
    // 福德/天巫 月建前二辰: 寅 + 2 = 辰; their DIRECT_YI scopes are frozen.
    expect(day.prePropagationHeadings['祭祀']).toMatchObject({ yi: true, state: 'only_yi' })
    expect(day.prePropagationHeadings['宴會']).toMatchObject({ yi: true, state: 'only_yi' })
    expect(day.yiEvidence).toMatchObject({
      修宮室: {
        yi: true,
        p4cTraceIds: ['p4yi:fu-de'],
        headingSourceReferences: [{ traceId: 'p4yi:fu-de', sourceRefs: [4] }],
      },
      祭祀: { yi: true, p4cTraceIds: ['p4yi:tian-wu'] },
      修倉庫: { deferred: 'P5', yi: undefined },
    })
  })

  it('retains unresolved 母倉 evidence even when a legacy present proves 納財', () => {
    // Source-locked 天赦: spring 戊寅; 母倉 still needs its separate soil authority.
    const day = resolveP4YiDay('寅', '戊寅')
    expect(day.yiEvidence).toMatchObject({
      納財: { yi: true, unresolvedTraceIds: ['p4yi:mu-cang'] },
    })
  })

  it.each([
    ['MONTH_JIAN_BRANCH', '卯'],
    ['DAY_BRANCH', '巳'],
    ['DAY_PILLAR', '乙巳'],
  ])('rejects duplicate derived context mismatch %s', (key, value) => {
    expect(() => resolveP4YiDay('寅', '甲辰', { yiInputs: { [key]: value } })).toThrow(RangeError)
  })

  it('does not reuse the P4-B soil operand as 母倉 authority', () => {
    const day = resolveP4YiDay('寅', '甲子', {
      soil: getP4SoilPresence('2025-01-20'),
      yiInputs: { MONTH_JIAN_BRANCH: '寅', DAY_BRANCH: '子', DAY_PILLAR: '甲子' },
      yiProviderStates: { MONTH_JIAN_BRANCH: 'outside' },
    })
    expect(day.yiOperands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          han: '福德',
          presence: 'unknown',
          reason: 'OUTSIDE_PROVIDER_COVERAGE',
        }),
        expect.objectContaining({ han: '天恩', presence: 'present' }),
        expect.objectContaining({ han: '除神', presence: 'absent' }),
        expect.objectContaining({
          han: '母倉',
          presence: 'unknown',
          reason: 'MISSING_REQUIRED_INPUT',
        }),
      ]),
    )
  })
})
