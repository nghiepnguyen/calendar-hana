import { describe, expect, it } from 'vitest'
import * as rulesModule from './rules'
import { dayCanChi, hourCanChi } from '../lunar/canChi'
import { jdFromDate } from '../lunar/julian'
import { getNapAm } from '../lunar/napAm'
import { SOLAR_TERMS } from '../lunar/solarTerms'
import { STARS } from '../lunar/stars.data'
import { starApplies } from '../lunar/stars'

type RulesModule = typeof import('./rules')

async function loadRules(): Promise<RulesModule> {
  return rulesModule
}

describe('rule registry', () => {
  it('provides a registry that blocks required rules without verified evidence', async () => {
    const module = await loadRules()
    const registry = module.createRuleRegistry(
      module.FENG_SHUI_RULES.map((rule) =>
        rule.id === 'annual.hoang-oc' ? { ...rule, verificationStatus: 'pending' } : rule,
      ),
    )
    const result = registry.getReadiness('annual', ['annual.hoang-oc'])
    expect(result.status).toBe('blocked')
    expect(result.unavailable).toEqual([{ id: 'annual.hoang-oc', reason: 'pending' }])
    expect(result.rules).toEqual([])
  })

  it('opens bounded annual calculations only with reviewed sources and the application policy', () => {
    const registry = rulesModule.createRuleRegistry(rulesModule.FENG_SHUI_RULES)
    const ids = [
      'annual.nominal-age',
      'annual.application-policy',
      'annual.kim-lau',
      'annual.hoang-oc',
      'annual.tam-tai',
    ]
    const ready = registry.getReadiness('annual', ids)
    expect(ready.status).toBe('ready')
    expect(ready.rules.map((rule) => rule.id)).toEqual(ids)
    for (const id of ['annual.kim-lau', 'annual.hoang-oc']) {
      expect(ready.rules.find((rule) => rule.id === id)).toMatchObject({
        version: '1.1.0',
        sourceIds: expect.arrayContaining(['batTrachCourse', 'annualSpec']),
      })
    }
    expect(ready.rules.find((rule) => rule.id === 'annual.tam-tai')).toMatchObject({
      version: '1.1.0',
      sourceIds: expect.arrayContaining(['khoiSuExtract', 'annualSpec']),
      reason: expect.stringContaining('Unattributed'),
    })
    expect(ready.rules.find((rule) => rule.id === 'annual.hoang-oc')?.reason).toContain('10–69')
    expect(ready.rules.find((rule) => rule.id === 'annual.nominal-age')?.version).toBe('1.1.0')
    expect(ready.rules.find((rule) => rule.id === 'annual.application-policy')?.version).toBe(
      '1.0.0',
    )
  })

  it('allows only the requested verified rules in the selected scope', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const result = createRuleRegistry(FENG_SHUI_RULES).getReadiness('personalDay', [
      'personal.branch-relations',
      'personal.stem-relations',
    ])
    expect(result.status).toBe('ready')
    expect(result.rules.map((rule) => rule.id)).toEqual([
      'personal.branch-relations',
      'personal.stem-relations',
    ])
    expect(result.unavailable).toEqual([])
  })

  it('blocks the entire assessment when one mandatory group is pending or missing', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const result = createRuleRegistry(FENG_SHUI_RULES).getReadiness('personalDay', [
      'personal.branch-relations',
      'personal.tam-sat',
      'personal.unknown-group',
    ])
    expect(result).toEqual({
      status: 'blocked',
      rules: [],
      unavailable: [
        { id: 'personal.tam-sat', reason: 'pending' },
        { id: 'personal.unknown-group', reason: 'missing' },
      ],
    })
    expect(result).not.toHaveProperty('rating')
  })

  it('never runs a rejected rule', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const result = createRuleRegistry(FENG_SHUI_RULES).getReadiness('personalDay', [
      'personal.attachment-can-xung',
    ])
    expect(result.unavailable).toEqual([{ id: 'personal.attachment-can-xung', reason: 'rejected' }])
    expect(result.rules).toEqual([])
  })

  it('keeps a verified common star out of personal assessments', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const registry = createRuleRegistry(FENG_SHUI_RULES)
    expect(registry.getReadiness('personalDay', ['common.thu-tu']).unavailable).toEqual([
      { id: 'common.thu-tu', reason: 'scopeMismatch' },
    ])
    expect(registry.getReadiness('commonDay', ['common.thu-tu']).status).toBe('ready')
  })

  it('does not certify an engine merely because its angle reference is verified', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const result = createRuleRegistry(FENG_SHUI_RULES).getReadiness('birthTime', [
      'birth.solar-term-angles',
      'birth.term-instant-engine',
    ])
    expect(result.status).toBe('blocked')
    expect(result.rules).toEqual([])
    expect(result.unavailable).toEqual([{ id: 'birth.term-instant-engine', reason: 'pending' }])
  })

  it('rejects duplicate IDs even when versions differ', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const rule = FENG_SHUI_RULES[0]
    expect(() => createRuleRegistry([rule, { ...rule, version: '2.0.0' }])).toThrow(
      /Duplicate rule ID/,
    )
  })

  it('rejects missing or invalid versions', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    for (const version of ['', 'latest', '1', ' 1.0.0 ', '01.0.0']) {
      expect(() => createRuleRegistry([{ ...FENG_SHUI_RULES[0], version }])).toThrow(
        /Invalid rule version/,
      )
    }
  })

  it('requires traceable source, review date and an audit reason', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const base = FENG_SHUI_RULES[0]
    for (const patch of [
      { sourceIds: [] },
      { sourceIds: ['not-a-source'] },
      { reviewedOn: '2026-02-30' },
      { reason: '' },
      { inputs: [] },
      { boundary: '' },
      { calendar: '' },
      { purposes: [] },
      { roles: [] },
    ]) {
      expect(() => createRuleRegistry([{ ...base, ...patch }])).toThrow()
    }
  })

  it('does not interpret an empty request as a complete assessment', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    expect(() => createRuleRegistry(FENG_SHUI_RULES).getReadiness('personalDay', [])).toThrow(
      /Required rule IDs/,
    )
  })

  it('keeps the reviewed registry immutable after creation', async () => {
    const { createRuleRegistry, FENG_SHUI_RULES } = await loadRules()
    const input = { ...FENG_SHUI_RULES[0], inputs: [...FENG_SHUI_RULES[0].inputs] }
    const registry = createRuleRegistry([input])
    input.verificationStatus = 'rejected'
    input.inputs.length = 0
    const result = registry.getReadiness('personalDay', [input.id])
    expect(result.status).toBe('ready')
    expect(result.rules[0].inputs.length).toBeGreaterThan(0)
    expect(Object.isFrozen(result.rules[0])).toBe(true)
    expect(Object.isFrozen(result.rules[0].sourceIds)).toBe(true)
  })
})

describe('reviewed reference fixtures (tasks/feng-shui-rule-audit.md)', () => {
  it('matches the monthly Thụ Tử reference across all month/branch combinations', () => {
    // 選擇紀要/上編: 披麻・紅紗・受死. Independent month 1..12 fixture.
    const expectedChi = [10, 4, 11, 5, 0, 6, 1, 7, 2, 8, 3, 9]
    const star = STARS.find((item) => item.name === 'Thụ Tử')
    expect(star).toBeDefined()
    for (let month = 1; month <= 12; month++) {
      for (let chi = 0; chi < 12; chi++) {
        expect(
          starApplies(star!.rule, {
            lunarMonth: month,
            lunarDay: 1,
            can: 0,
            chi,
            canChi: 0,
            officer: 0,
            mansion: 0,
          }),
        ).toBe(chi === expectedChi[month - 1])
      }
    }
  })

  it('preserves the existing Sát Chủ table instead of replacing it with the attachment', () => {
    const expected = [5, 0, 7, 3, 8, 10, 1, 11, 6, 9, 2, 4]
    const star = STARS.find((item) => item.name === 'Sát Chủ')
    expect(star?.rule.byMonth?.map((row) => row?.chi?.[0])).toEqual(expected)
    expect(expected.filter((chi, monthIndex) => chi !== monthIndex)).toHaveLength(10)
  })

  it('matches all ten day-stem groups for the varying Tý hour stem', () => {
    // 選擇紀要/上編: 五鼠遁時例. Day stems Giáp..Quý, never a fixed Canh.
    const expectedCan = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]
    const start = jdFromDate(10, 2, 2024)
    for (let offset = 0; offset < 10; offset++) {
      expect(dayCanChi(start + offset).can).toBe(offset)
      expect(hourCanChi(start + offset, 0)).toMatchObject({ can: expectedCan[offset], chi: 0 })
    }
  })

  it('matches the nạp âm element sequence for all 60 valid Can Chi', () => {
    // 選擇紀要/上編: 六十花甲子; names may vary, the element for each pair does not here.
    const elements = [
      'Kim',
      'Hỏa',
      'Mộc',
      'Thổ',
      'Kim',
      'Hỏa',
      'Thủy',
      'Thổ',
      'Kim',
      'Mộc',
      'Thủy',
      'Thổ',
      'Hỏa',
      'Mộc',
      'Thủy',
      'Kim',
      'Hỏa',
      'Mộc',
      'Thổ',
      'Kim',
      'Hỏa',
      'Thủy',
      'Thổ',
      'Kim',
      'Mộc',
      'Thủy',
      'Thổ',
      'Hỏa',
      'Mộc',
      'Thủy',
    ]
    for (let index = 0; index < 60; index++) {
      expect(getNapAm({ can: index % 10, chi: index % 12 }).element).toBe(
        elements[Math.floor(index / 2)],
      )
    }
  })

  it('keeps the common calendar names aligned with the HKO angle reference', () => {
    // HKO Table 1: λ=0 Xuân Phân, 15 Thanh Minh, 315 Lập Xuân, 345 Kinh Trập.
    expect(SOLAR_TERMS[0]).toBe('Xuân phân')
    expect(SOLAR_TERMS[1]).toBe('Thanh minh')
    expect(SOLAR_TERMS[21]).toBe('Lập xuân')
    expect(SOLAR_TERMS[23]).toBe('Kinh trập')
  })
})
