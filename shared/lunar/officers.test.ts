import { describe, expect, it } from 'vitest'
import { dayCanChi } from './canChi'
import { solarStringToJd } from './julian'
import { getOfficer } from './officers'

const officerOf = (date: string) => {
  const jd = solarStringToJd(date)
  return getOfficer(jd, dayCanChi(jd).chi).name
}

describe('getOfficer', () => {
  it.each([
    ['2026-09-25', 'Chấp'],
    ['2026-09-26', 'Phá'],
    ['2025-10-08', 'Kiến'],
    ['2025-11-07', 'Chấp'],
    ['2025-01-05', 'Thâu'],
  ])('%s là trực %s (theo licham.vn)', (date, name) => {
    expect(officerOf(date)).toBe(name)
  })

  it('ngày bắt đầu tiết lặp lại trực của ngày trước (Bạch lộ 7/9/2026)', () => {
    expect(officerOf('2026-09-07')).toBe(officerOf('2026-09-06'))
    expect(officerOf('2026-09-08')).not.toBe(officerOf('2026-09-07'))
  })

  it.each([
    ['2025-02-03', 'Trừ'],
    ['2025-09-07', 'Phá'],
    ['2026-06-05', 'Định'],
    ['2026-10-08', 'Chấp'],
  ])('ngày bắt đầu tiết %s là trực %s (khớp thoigian.com.vn)', (date, name) => {
    expect(officerOf(date)).toBe(name)
  })
})
