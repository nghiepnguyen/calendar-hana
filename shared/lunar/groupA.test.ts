/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as calendar from './index'
import { solarTermsForYear } from './solarTerms'
import { todayInVietnam } from '../time'
import { parseSolarDate, addDays } from './julian'
import { solarToLunar } from './lunar'

const ids = ['yue-ji', 'four-separations', 'four-extinctions'] as const
const evaluate = (instant: string) => calendar.evaluateGroupAAtInstant(instant, 'Asia/Ho_Chi_Minh')
for (const id of ids) {
  const fixture = JSON.parse(readFileSync(`golden-v3/${id}.json`, 'utf8')) as {
    records: {
      id: string
      input: { instant: string; timezone: string }
      expected: { matched: boolean }
    }[]
  }
  describe(`frozen Golden V3 ${id}`, () => {
    for (const record of fixture.records)
      it(record.id, () => {
        expect(evaluate(record.input.instant).rules.find((r) => r.id === id)?.matched).toBe(
          record.expected.matched,
        )
      })
  })
}
it('all civil and exact term boundaries 1900–2100', () => {
  const groups = { 'four-separations': [0, 90, 180, 270], 'four-extinctions': [315, 45, 135, 225] }
  for (let year = 1900; year <= 2100; year++) {
    for (const term of solarTermsForYear(year)) {
      const d = todayInVietnam(new Date(term.instantUtc))
      const samples = [-2, -1, 0].flatMap((offset) =>
        ['00:00:00', '12:00:00', '23:59:59'].map((time) => `${addDays(d, offset)}T${time}+07:00`),
      )
      samples.push(
        ...[-60000, 0, 60000].map((delta) =>
          new Date(Date.parse(term.instantUtc) + delta).toISOString(),
        ),
      )
      for (const instant of samples) {
        const result = evaluate(instant)
        for (const [id, longitudes] of Object.entries(groups)) {
          const expected =
            longitudes.includes(term.longitude) &&
            todayInVietnam(new Date(instant)) === addDays(d, -1)
          expect(
            result.rules.find((r) => r.id === id)?.matched,
            `${id} ${instant} ${term.longitude}`,
          ).toBe(expected)
        }
      }
    }
  }
}, 120000)
it('lunar day only, including every civil day 1900–2100 and leap months', () => {
  for (let date = '1900-01-01'; date <= '2100-12-31'; date = addDays(date, 1)) {
    const { day, month, year } = parseSolarDate(date)
    const lunar = solarToLunar(day, month, year)
    expect(evaluate(`${date}T12:00:00+07:00`).rules[0].matched, date).toBe(
      [5, 14, 23].includes(lunar.day),
    )
  }
}, 120000)
it('canonical aliases, provenance and scoped effects', () => {
  for (const [alias, id] of [
    ['月忌日', 'yue-ji'],
    ['Tứ Ly', 'four-separations'],
    ['四絕', 'four-extinctions'],
  ])
    expect(calendar.normalizeGroupARuleId(alias)).toBe(id)
  expect(calendar.normalizeGroupARuleId('Tam Nương')).toBeUndefined()
  for (const instant of ['2024-02-14T12:00:00+07:00', '2014-03-19T12:00:00+07:00']) {
    const output = evaluate(instant)
    expect(output).toEqual(evaluate(new Date(instant).toISOString()))
    expect(output.rules.map((r) => r.id)).toEqual(ids)
    for (const rule of output.rules) {
      expect(rule.sourceId).toBe('XJBF_QD')
      expect(rule.ruleVersion).toBe('3.0.0')
      expect(rule.sourceEvidence.length).toBeGreaterThan(0)
    }
    expect(Object.keys(output.activities).every((id) => id === 'travel')).toBe(true)
    expect(output.rules[0].effects).toEqual([])
  }
  expect(evaluate('2014-03-19T12:00:00+07:00').activities.travel?.reasons).toEqual([
    'four-separations',
  ])
  expect(evaluate('2024-02-14T12:00:00+07:00').activities).toEqual({})
})
it('rejects implicit instants, unsupported zones and out-of-range civil dates', () => {
  for (const instant of ['2024-02-14T12:00:00', 'invalid', '1899-12-31T12:00:00+07:00'])
    expect(() => evaluate(instant)).toThrow(RangeError)
  expect(() => calendar.evaluateGroupAAtInstant('2024-02-14T12:00:00Z', 'Asia/Hong_Kong')).toThrow(
    RangeError,
  )
})
