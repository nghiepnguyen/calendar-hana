import { assessAnnualFengShui } from './index'
import { describe, expect, it } from 'vitest'
import { ANNUAL_FIXTURES } from './annual.fixtures'
import { FENG_SHUI_RULES } from '../rules'

const profile = { birthDate: '2000-02-04', viewDate: '2026-02-17' }
const construction = { ...profile, purpose: 'construction', role: 'owner' }

describe('annual assessment application policy', () => {
  for (const [purpose, rows] of Object.entries(ANNUAL_FIXTURES.matrix.supportedPurposeRows)) {
    it.each(
      rows.map((expected, index) => ({ expected, role: ANNUAL_FIXTURES.matrix.roleOrder[index] })),
    )(`${purpose} / $role`, ({ expected, role }) => {
      const result = assessAnnualFengShui({ ...profile, purpose, role })
      expect(result.specVersion).toBe('1.0.0')
      expect(result.results.map((row) => row.ruleId)).toEqual(ANNUAL_FIXTURES.matrix.ruleOrder)
      expect(result.results.map((row) => row.status)).toEqual(
        expected.map(
          (code) =>
            ANNUAL_FIXTURES.matrix.legend[code as keyof typeof ANNUAL_FIXTURES.matrix.legend],
        ),
      )
      for (const row of result.results.filter((row) => row.status !== 'applies')) {
        expect(row).not.toHaveProperty('value')
        expect(row).not.toHaveProperty('hit')
      }
      expect(result).not.toHaveProperty('rating')
    })
  }
  for (const purpose of ANNUAL_FIXTURES.matrix.unsupportedPurposes) {
    it.each(ANNUAL_FIXTURES.matrix.roleOrder)(`${purpose} / %s remains unsupported`, (role) => {
      for (const row of assessAnnualFengShui({ ...profile, purpose, role }).results) {
        expect(row).toMatchObject({ status: 'unsupported', reasonCode: 'purposeUnsupported' })
        expect(row).not.toHaveProperty('value')
      }
    })
  }
  it.each([
    null,
    undefined,
    [],
    {},
    { ...profile, purpose: 'unknown', role: 'self' },
    { ...profile, purpose: 'general', role: 'unknown' },
  ])('fails closed on malformed or unknown context %o', (input) => {
    expect(
      assessAnnualFengShui(input).results.every(
        (row) => row.status === 'unsupported' && row.reasonCode === 'unknownContext',
      ),
    ).toBe(true)
  })
  it('reports purpose exclusion without demanding a birth date', () => {
    const result = assessAnnualFengShui({
      viewDate: '2026-02-17',
      purpose: 'general',
      role: 'self',
    })
    expect(result.results.map((row) => row.reasonCode)).toEqual([
      'purposeExcluded',
      'purposeExcluded',
      'missingBirthDate',
    ])
  })
  it('does not substitute self for a missing owner or principal', () => {
    for (const role of ['self', 'other', 'unspecified']) {
      expect(
        assessAnnualFengShui({ ...profile, purpose: 'construction', role }).results.every(
          (row) => row.reasonCode === 'targetRoleRequired',
        ),
      ).toBe(true)
    }
  })
  it('does not infer bride from personal data or issue a couple verdict', () => {
    const result = assessAnnualFengShui({
      ...profile,
      purpose: 'wedding',
      role: 'unspecified',
      gender: 'female',
      name: 'Cô dâu',
    })
    expect(result.results.map((row) => row.status)).toEqual([
      'insufficientData',
      'notApplicable',
      'applies',
    ])
    expect(result.results[2].reason).toContain('Chưa xét người còn lại')
    expect(result).not.toHaveProperty('couple')
  })
})

describe('annual assessment values and independent states', () => {
  it('returns typed values, operands and source/policy versions', () => {
    const result = assessAnnualFengShui(construction)
    expect(result.context).toMatchObject({
      nominalAge: 28,
      birthLunarYear: 1999,
      viewLunarYear: 2026,
    })
    expect(result.results[0]).toMatchObject({
      scope: 'annual',
      ruleVersion: '1.1.0',
      verificationStatus: 'verified',
      status: 'applies',
      operands: { nominalAge: 28, remainder: 1 },
      value: { hit: true, kind: 'than', remainder: 1 },
      sourceIds: expect.arrayContaining(['batTrachCourse', 'annualSpec']),
      requiredRules: expect.arrayContaining([
        expect.objectContaining({ id: 'annual.nominal-age', version: '1.1.0' }),
        expect.objectContaining({ id: 'annual.application-policy', version: '1.0.0' }),
      ]),
    })
    expect(result.results[1]).toMatchObject({
      value: { hit: false, palace: 4, palaceId: 'tuTanTai', decade: 2, units: 8 },
    })
    expect(result.results[2]).toMatchObject({
      value: { hit: true, stage: 2 },
      operands: { birthYearChi: 3, viewYearChi: 6 },
    })
    expect(
      result.results[2].requiredRules.find((rule) => rule.id === 'annual.tam-tai')?.reason,
    ).toContain('Unattributed')
  })
  it.each(ANNUAL_FIXTURES.context.filter((row) => row.status !== 'applies'))(
    'propagates invalid date context without fabricated results $reasonCode',
    (row) => {
      const result = assessAnnualFengShui({ ...row, purpose: 'construction', role: 'owner' })
      for (const item of result.results) {
        expect(item).toMatchObject({ status: row.status, reasonCode: row.reasonCode, operands: {} })
        expect(item).not.toHaveProperty('value')
      }
    },
  )
  it.each([
    { birthDate: '2026-02-17', age: 1 },
    { birthDate: '2018-02-16', age: 9 },
    { birthDate: '1957-01-31', age: 70 },
    { birthDate: '1900-01-01', viewDate: '2100-12-31', age: 202 },
  ])('keeps other rules available outside Hoang Ốc domain (age $age)', (row) => {
    const result = assessAnnualFengShui({ ...construction, ...row })
    expect(result.context).toMatchObject({ nominalAge: row.age })
    expect(result.results.map((item) => item.status)).toEqual(['applies', 'unsupported', 'applies'])
    expect(result.results[1]).toMatchObject({ reasonCode: 'ageOutOfRange' })
    expect(result.results[1]).not.toHaveProperty('value')
  })
  it('returns stable results within a lunar year and changes across Tet', () => {
    const result = assessAnnualFengShui(construction)
    expect(assessAnnualFengShui({ ...construction, viewDate: '2026-09-01' }).results).toEqual(
      result.results,
    )
    expect(
      assessAnnualFengShui({ ...construction, viewDate: '2026-02-16' }).results[0],
    ).toMatchObject({ value: { hit: false, kind: null, remainder: 0 } })
  })
  it('does not reuse derived results after removal or replacement of birth data', () => {
    assessAnnualFengShui(construction)
    const removed = assessAnnualFengShui({ ...construction, birthDate: undefined })
    expect(removed.results.every((row) => row.status === 'insufficientData')).toBe(true)
    const beforeBirth = assessAnnualFengShui({ ...construction, birthDate: '2026-05-01' })
    expect(beforeBirth.results.every((row) => row.reasonCode === 'beforeBirth')).toBe(true)
  })
})

describe('annual assessment verification gates', () => {
  const requiredIds = [
    'annual.nominal-age',
    'annual.application-policy',
    'annual.kim-lau',
    'annual.hoang-oc',
    'annual.tam-tai',
  ]
  for (const id of requiredIds) {
    it.each(ANNUAL_FIXTURES.readiness)(`${id} fails closed for $condition`, (row) => {
      const definitions =
        row.condition === 'missing'
          ? FENG_SHUI_RULES.filter((rule) => rule.id !== id)
          : FENG_SHUI_RULES.map((rule) => {
              if (rule.id !== id) return rule
              return row.condition === 'scopeMismatch'
                ? { ...rule, scope: 'personalDay' as const }
                : { ...rule, verificationStatus: row.condition as 'pending' | 'rejected' }
            })
      const result = assessAnnualFengShui(construction, definitions)
      for (const item of result.results) {
        if (
          id === 'annual.nominal-age' ||
          id === 'annual.application-policy' ||
          item.ruleId === id
        ) {
          expect(item).toMatchObject({ status: 'unsupported', reasonCode: row.reasonCode })
          expect(item).not.toHaveProperty('value')
        } else expect(item.status).toBe('applies')
      }
      if (id === 'annual.nominal-age') expect(result.context).not.toHaveProperty('nominalAge')
      if (row.condition === 'missing') {
        const missing = result.results.find((item) => item.ruleId === id)
        if (missing)
          expect(missing).toMatchObject({
            ruleVersion: null,
            verificationStatus: null,
            sourceIds: [],
          })
      }
    })
  }
  it('returns a metadata snapshot without mutating input or sharing source arrays', () => {
    const input = Object.freeze({ ...construction })
    const definitions = FENG_SHUI_RULES.map((rule) => ({ ...rule, sourceIds: [...rule.sourceIds] }))
    const result = assessAnnualFengShui(input, definitions)
    definitions.find((rule) => rule.id === 'annual.tam-tai')!.sourceIds.length = 0
    expect(result.results[2].sourceIds).toContain('khoiSuExtract')
    expect(input).toEqual(construction)
  })
})
