import { buildAnnualContext } from './context'
import { describe, expect, it } from 'vitest'
import { ANNUAL_FIXTURES } from './annual.fixtures'
import { FENG_SHUI_RULES } from '../rules'

describe('annual lunar context', () => {
  it.each(ANNUAL_FIXTURES.context)('matches frozen context $birthDate / $viewDate', (row) => {
    const result = buildAnnualContext(row)
    const { birthDate: _birthDate, viewDate: _viewDate, ...expected } = row
    expect(result).toMatchObject(expected)
    if (row.status !== 'applies') {
      for (const field of [
        'nominalAge',
        'birthLunarYear',
        'viewLunarYear',
        'birthYearChi',
        'viewYearChi',
      ]) {
        expect(result).not.toHaveProperty(field)
      }
    }
  })

  it.each([
    [{ birthDate: '2000-02-05' }, 'missingViewDate'],
    [{ birthDate: '2000-02-05', viewDate: 42 }, 'invalidViewDate'],
    [{ birthDate: 42, viewDate: '2026-02-17' }, 'invalidBirthDate'],
    [{ birthDate: '2000-2-05', viewDate: '2026-02-17' }, 'invalidBirthDate'],
    [{ birthDate: '2000-02-05', viewDate: '2026-02-17T00:00:00Z' }, 'invalidViewDate'],
    [{ birthDate: '2100-02-29', viewDate: '2100-12-31' }, 'invalidBirthDate'],
  ])('rejects missing/invalid dates %o', (input, reasonCode) => {
    expect(buildAnnualContext(input)).toMatchObject({ status: 'insufficientData', reasonCode })
  })

  it('validates malformed dates before range and before-birth comparison', () => {
    expect(buildAnnualContext({ viewDate: '1899-12-31', birthDate: 'bad' })).toMatchObject({
      reasonCode: 'invalidBirthDate',
    })
    expect(buildAnnualContext({ viewDate: '1899-12-31', birthDate: '2000-02-05' })).toMatchObject({
      reasonCode: 'dateOutOfRange',
    })
  })

  it('does not derive years or age when the nominal-age rule is unavailable', () => {
    const definitions = FENG_SHUI_RULES.map((rule) =>
      rule.id === 'annual.nominal-age' ? { ...rule, verificationStatus: 'pending' as const } : rule,
    )
    const context = buildAnnualContext(
      { birthDate: '2000-02-04', viewDate: '2026-02-17' },
      definitions,
    )
    expect(context).toMatchObject({ status: 'unsupported', reasonCode: 'unverifiedRule' })
    expect(context).not.toHaveProperty('nominalAge')
    expect(context).not.toHaveProperty('birthLunarYear')
  })
})
