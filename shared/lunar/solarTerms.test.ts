import reference from '../../tasks/fixtures/solar-terms-hko.v1.json'
import { describe, expect, it } from 'vitest'
import { jdFromDate, solarStringToJd } from './julian'
import { getSolarTerm, getSolarTermAt, solarTermsForYear, solarTermMonthChi } from './solarTerms'

describe('getSolarTerm', () => {
  // Ngày bắt đầu tiết khí năm 2026 theo giờ Việt Nam.
  it.each([
    [4, 2, 'Lập xuân'],
    [20, 3, 'Xuân phân'],
    [21, 6, 'Hạ chí'],
    [23, 9, 'Thu phân'],
    [22, 12, 'Đông chí'],
  ])('%i/%i/2026 bắt đầu tiết %s', (day, month, name) => {
    const jd = jdFromDate(day, month, 2026)
    expect(getSolarTerm(jd)).toMatchObject({ name, startsToday: true })
    // Ngày hôm trước vẫn thuộc tiết khí cũ.
    const previous = getSolarTerm(jd - 1)
    expect(previous.name).not.toBe(name)
    expect(previous.startsToday).toBe(false)
    // Ngày hôm sau vẫn là tiết khí này nhưng không phải ngày bắt đầu.
    expect(getSolarTerm(jd + 1)).toMatchObject({ name, startsToday: false })
  })

  it('mỗi năm có đúng 24 ngày bắt đầu tiết khí', () => {
    let count = 0
    for (let jd = jdFromDate(1, 1, 2026); jd <= jdFromDate(31, 12, 2026); jd++) {
      if (getSolarTerm(jd).startsToday) count++
    }
    expect(count).toBe(24)
  })
})

describe('solarTermMonthChi', () => {
  it('tiết giao lúc nào trong ngày thì ngày đó đã sang tháng mới', () => {
    // Lập xuân 2026 giao khoảng 3h sáng 4/2; Bạch lộ 2026 giao khoảng 21h45 ngày 7/9.
    expect(solarTermMonthChi(solarStringToJd('2026-02-03'))).toBe(1) // Sửu
    expect(solarTermMonthChi(solarStringToJd('2026-02-04'))).toBe(2) // Dần
    expect(solarTermMonthChi(solarStringToJd('2026-09-06'))).toBe(8) // Thân
    expect(solarTermMonthChi(solarStringToJd('2026-09-07'))).toBe(9) // Dậu
    expect(solarTermMonthChi(solarStringToJd('2026-12-31'))).toBe(0) // Tý (sau Đại tuyết)
  })
})

describe('exact solar terms', () => {
  it.each([1900, 2024, 2025, 2026, 2100])('returns 24 ordered crossings for %i', (year) => {
    const terms = solarTermsForYear(year)
    expect(terms).toHaveLength(24)
    expect(new Set(terms.map((t) => t.id)).size).toBe(24)
    expect(terms.every((t) => new Date(t.instantUtc).getUTCFullYear() === year)).toBe(true)
    for (let i = 1; i < terms.length; i++) {
      expect(Date.parse(terms[i].instantUtc)).toBeGreaterThan(Date.parse(terms[i - 1].instantUtc))
    }
  })
  it('changes exactly at each crossing', () => {
    for (const term of solarTermsForYear(2026)) {
      const t = Date.parse(term.instantUtc)
      expect(getSolarTermAt(new Date(t - 1).toISOString()).index).not.toBe(term.index)
      expect(getSolarTermAt(term.instantUtc)).toEqual(term)
      expect(getSolarTermAt(new Date(t + 1).toISOString())).toEqual(term)
    }
  })
  it('exposes the crossing time while preserving the new term for the whole calendar day', () => {
    const term = solarTermsForYear(2026).find((t) => t.name === 'Bạch lộ')!
    const day = getSolarTerm(solarStringToJd('2026-09-07'))
    expect(day).toMatchObject({ name: 'Bạch lộ', startsToday: true, startsAtUtc: term.instantUtc })
    expect(getSolarTermAt('2026-09-07T00:00:00Z').name).toBe('Xử thử')
  })
  it('handles both supported calendar edges and rejects invalid instants', () => {
    expect(getSolarTerm(solarStringToJd('1900-01-01')).name).toBe('Đông chí')
    expect(getSolarTerm(solarStringToJd('2100-12-31')).name).toBe('Đông chí')
    expect(() => getSolarTermAt('invalid')).toThrow(RangeError)
    expect(() => solarTermsForYear(2026.5)).toThrow(RangeError)
  })
})

describe('solar term reference and range checks', () => {
  it.each(reference.cases)(
    'matches HKO at $reference within 60 seconds',
    ({ longitude, reference }) => {
      const term = solarTermsForYear(new Date(reference).getUTCFullYear()).find(
        (t) => t.longitude === longitude,
      )!
      expect(Math.abs(Date.parse(term.instantUtc) - Date.parse(reference))).toBeLessThanOrEqual(
        60_000,
      )
    },
  )
  it('keeps all 24 transitions and Vietnam day labels consistent across 1900–2100', () => {
    for (let year = 1900; year <= 2100; year++) {
      for (const term of solarTermsForYear(year)) {
        const vietnamDay = new Date(Date.parse(term.instantUtc) + 7 * 3600000)
          .toISOString()
          .slice(0, 10)
        expect(getSolarTerm(solarStringToJd(vietnamDay))).toMatchObject({
          index: term.index,
          startsToday: true,
        })
      }
    }
  })
  it('does not leak mutated cache data and recomputes consistently after eviction', () => {
    const first = solarTermsForYear(2026)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first[0])).toBe(true)
    for (let year = 1950; year < 1970; year++) solarTermsForYear(year)
    expect(solarTermsForYear(2026)).toEqual(first)
  })
  it('handles a late-evening crossing in Vietnamese time', () => {
    // Tiểu thử 2024: 21:20 UTC+7, so still the old term at noon.
    const day = getSolarTerm(solarStringToJd('2024-07-06'))
    expect(day).toMatchObject({ name: 'Tiểu thử', startsToday: true })
    expect(getSolarTermAt('2024-07-06T12:00:00+07:00').name).toBe('Hạ chí')
    expect(() => getSolarTermAt('2024-07-06T12:00:00')).toThrow(RangeError)
  })
})
