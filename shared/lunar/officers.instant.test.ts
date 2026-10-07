import { expect, test } from 'vitest'
import * as officers from './officers'
import * as solarTerms from './solarTerms'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'

const zone = 'Asia/Ho_Chi_Minh'

test('instant-aware APIs exist', () => {
  expect(solarTerms.getSolarMonth).toBeTypeOf('function')
  expect(officers.getOfficerAtInstant).toBeTypeOf('function')
})

test('crossing day retains previous month at midnight and changes exactly at crossing', () => {
  const crossing = solarTerms.solarTermsForYear(2026).find((t) => t.longitude === 165)!
  const ms = Date.parse(crossing.instantUtc)
  const date = '2026-09-07'
  expect(solarTerms.getSolarMonth(date + 'T00:00:00+07:00', zone)).toBe(8)
  for (const [delta, month] of [
    [-60000, 8],
    [0, 9],
    [60000, 9],
  ]) {
    const instant = new Date(ms + delta).toISOString()
    expect(solarTerms.getSolarMonth(instant, zone)).toBe(month)
    const chi = dayCanChi(solarStringToJd(date)).chi
    expect(officers.getOfficerAtInstant(instant, zone).index).toBe((chi - month + 12) % 12)
  }
  expect(
    officers.getOfficer(solarStringToJd(date), dayCanChi(solarStringToJd(date)).chi).index,
  ).toBe((dayCanChi(solarStringToJd(date)).chi - 9 + 12) % 12)
})

test('same absolute instant uses civil day in explicitly supplied timezone', () => {
  const instant = '2026-09-01T17:00:00Z'
  expect(solarTerms.getSolarMonth(instant, zone)).toBe(solarTerms.getSolarMonth(instant, 'UTC'))
  const month = 8
  for (const [tz, date] of [
    [zone, '2026-09-02'],
    ['UTC', '2026-09-01'],
  ]) {
    expect(officers.getOfficerAtInstant(instant, tz).index).toBe(
      (dayCanChi(solarStringToJd(date)).chi - month + 12) % 12,
    )
  }
  expect(officers.getOfficerAtInstant(instant, zone)).toEqual(
    officers.getOfficerAtInstant('2026-09-02T00:00:00+07:00', zone),
  )
})

test('rejects ambiguous instants and invalid or absent timezones', () => {
  for (const api of [solarTerms.getSolarMonth, officers.getOfficerAtInstant]) {
    expect(() => api('2026-09-07T12:00:00', zone)).toThrow(RangeError)
    expect(() => api('invalidZ', zone)).toThrow(RangeError)
    expect(() => api('2026-09-07T12:00:00Z', '')).toThrow(RangeError)
    expect(() => api('2026-09-07T12:00:00Z', 'Invalid/Zone')).toThrow(RangeError)
  }
})

test('Vietnam civil calendar uses spec UTC+7 even before historical timezone reforms', () => {
  // 23:54 local under the project convention; historical tzdb would give the next day.
  const instant = '1907-05-06T16:54:43.621Z'
  expect(officers.getOfficerAtInstant(instant, zone).name).toBe('Khai')
})
