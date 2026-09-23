import { describe, expect, it } from 'vitest'
import { dayCanChi, hourCanChi, monthCanChi, yearCanChi } from './canChi'
import { jdFromDate } from './julian'

describe('yearCanChi', () => {
  it.each([
    [1945, 'Ất Dậu'],
    [2000, 'Canh Thìn'],
    [2024, 'Giáp Thìn'],
    [2025, 'Ất Tỵ'],
    [2026, 'Bính Ngọ'],
  ])('năm %i là %s', (year, name) => {
    expect(yearCanChi(year).name).toBe(name)
  })
})

describe('monthCanChi', () => {
  it('tháng Giêng năm Giáp Thìn 2024 là Bính Dần', () => {
    expect(monthCanChi({ month: 1, year: 2024 }).name).toBe('Bính Dần')
  })

  it('tháng Giêng năm Bính Ngọ 2026 là Canh Dần, tháng Chạp là Tân Sửu', () => {
    expect(monthCanChi({ month: 1, year: 2026 }).name).toBe('Canh Dần')
    expect(monthCanChi({ month: 12, year: 2026 }).name).toBe('Tân Sửu')
  })
})

describe('dayCanChi', () => {
  it('1/1/2000 là ngày Mậu Ngọ', () => {
    expect(dayCanChi(jdFromDate(1, 1, 2000)).name).toBe('Mậu Ngọ')
  })

  it('Tết 10/2/2024 là ngày Giáp Thìn', () => {
    expect(dayCanChi(jdFromDate(10, 2, 2024)).name).toBe('Giáp Thìn')
  })

  it('60 ngày lặp lại một vòng', () => {
    const jd = jdFromDate(23, 9, 2026)
    expect(dayCanChi(jd + 60)).toEqual(dayCanChi(jd))
    expect(dayCanChi(jd + 1).name).not.toBe(dayCanChi(jd).name)
  })
})

describe('hourCanChi', () => {
  it('ngày Giáp thì giờ Tý là Giáp Tý, ngày Ất thì giờ Tý là Bính Tý', () => {
    const giapDay = jdFromDate(10, 2, 2024)
    expect(hourCanChi(giapDay, 0).name).toBe('Giáp Tý')
    expect(hourCanChi(giapDay + 1, 0).name).toBe('Bính Tý')
    expect(hourCanChi(giapDay, 11).name).toBe('Ất Hợi')
  })
})
