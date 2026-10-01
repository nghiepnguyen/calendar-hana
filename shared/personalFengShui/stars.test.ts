import { describe, expect, it } from 'vitest'
import { FENG_SHUI_RULES } from './rules'
import fixtures from '../../tasks/fixtures/personal-feng-shui-stars.v1.json'

const modules = import.meta.glob('./stars.ts', { eager: true })
const api = modules['./stars.ts'] as typeof import('./stars') | undefined

function engine() {
  expect(api, 'personal stars engine must exist').toBeDefined()
  return api!
}

const validCanChi = Array.from({ length: 60 }, (_, index) => ({
  can: index % 10,
  chi: index % 12,
}))

describe('personal P2 rules', () => {
  it('matches the independently transcribed fixture', () => {
    const { assessPersonalStars } = engine()
    for (const fixture of fixtures.stemClashCases) {
      const birthYear = validCanChi.find((item) => item.can === fixture.birthCan)!
      const viewedDay = validCanChi.find((item) => item.can === fixture.dayCan)!
      const result = assessPersonalStars({ birthYear, viewedDay, lunarMonth: 1 })
      expect(result.status, fixture.label).toBe('ready')
      if (result.status === 'ready') expect(result.stemClash.hit, fixture.label).toBe(fixture.hit)
    }
  })

  it('matches exactly four symmetric stem-clash pairs and leaves Mậu/Kỷ without a clash', () => {
    const { assessPersonalStars } = engine()
    const expected = new Set(['0:6', '6:0', '1:7', '7:1', '2:8', '8:2', '3:9', '9:3'])

    for (let birthCan = 0; birthCan < 10; birthCan++) {
      for (let dayCan = 0; dayCan < 10; dayCan++) {
        const birthYear = validCanChi.find((item) => item.can === birthCan)!
        const viewedDay = validCanChi.find((item) => item.can === dayCan)!
        const result = assessPersonalStars({ birthYear, viewedDay, lunarMonth: 1 })
        expect(result.status).toBe('ready')
        if (result.status !== 'ready') continue
        expect(result.stemClash.hit).toBe(expected.has(`${birthCan}:${dayCan}`))
      }
    }
  })

  it('keeps stem clash separate from the MVP stem tone and summary', () => {
    const result = engine().assessPersonalStars({
      birthYear: { can: 0, chi: 0 },
      viewedDay: { can: 6, chi: 6 },
      lunarMonth: 1,
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.stemClash).toMatchObject({
      hit: true,
      ruleId: 'personal.can-xung',
      version: '1.0.0',
      affectsDaySummary: false,
    })
    expect(result.stemClash.reason).toContain('Canh')
    expect(result.stemClash.reason).toContain('Giáp')
  })

  it.each([
    [{ viewedDay: { can: 0, chi: 0 }, lunarMonth: 1 }, 'missingBirthYear'],
    [{ birthYear: { can: 0, chi: 0 }, lunarMonth: 1 }, 'missingViewedDay'],
    [{ birthYear: { can: 0, chi: 0 }, viewedDay: { can: 0, chi: 0 } }, 'missingLunarMonth'],
  ])('reports missing runtime input %#', (input, reasonCode) => {
    expect(engine().assessPersonalStars(input)).toMatchObject({
      status: 'insufficientData',
      reasonCode,
    })
  })

  it.each([
    [{ can: -1, chi: 0 }, { can: 0, chi: 0 }, 1, 'invalidBirthYear'],
    [{ can: 0, chi: 1 }, { can: 0, chi: 0 }, 1, 'invalidBirthYear'],
    [{ can: 0, chi: 0 }, { can: 10, chi: 0 }, 1, 'invalidViewedDay'],
    [{ can: 0, chi: 0 }, { can: 0, chi: 1 }, 1, 'invalidViewedDay'],
    [{ can: 0, chi: 0 }, { can: 0, chi: 0 }, 0, 'invalidLunarMonth'],
    [{ can: 0, chi: 0 }, { can: 0, chi: 0 }, 13, 'invalidLunarMonth'],
  ])(
    'rejects invalid sexagenary/month input %#',
    (birthYear, viewedDay, lunarMonth, reasonCode) => {
      expect(engine().assessPersonalStars({ birthYear, viewedDay, lunarMonth })).toMatchObject({
        status: 'insufficientData',
        reasonCode,
      })
    },
  )

  it.each([
    ['pending', 'unverifiedRule'],
    ['rejected', 'rejectedRule'],
  ] as const)(
    'does not calculate when the selected rule is %s',
    (verificationStatus, reasonCode) => {
      const rules = FENG_SHUI_RULES.map((rule) =>
        rule.id === 'personal.can-xung' ? { ...rule, verificationStatus } : rule,
      )
      expect(
        engine().assessPersonalStars(
          {
            birthYear: { can: 0, chi: 0 },
            viewedDay: { can: 6, chi: 6 },
            lunarMonth: 1,
          },
          rules,
        ),
      ).toMatchObject({ status: 'unsupported', reasonCode })
    },
  )

  it('reports the four deferred P2 proposals without calculating them', () => {
    const result = engine().assessPersonalStars({
      birthYear: { can: 0, chi: 0 },
      viewedDay: { can: 6, chi: 6 },
      lunarMonth: 1,
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.deferred.map((item) => item.ruleId)).toEqual([
      'personal.thai-tue',
      'personal.tue-pha',
      'personal.tam-sat',
      'personal.sat-chu',
    ])
    expect(result.deferred.every((item) => item.status === 'unsupported')).toBe(true)
  })
})
