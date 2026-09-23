import { describe, expect, it } from 'vitest'
import {
  defaultRange,
  extendAfter,
  extendBefore,
  FIRST_DATE,
  isAtEnd,
  isAtStart,
  LAST_DATE,
} from './listRange'

describe('listRange', () => {
  it('mặc định từ 3 tháng trước đến hết 6 tháng sau', () => {
    expect(defaultRange('2026-09-23')).toEqual({ start: '2026-06-01', end: '2027-03-31' })
  })

  it('cộng/trừ tháng qua năm', () => {
    const range = { start: '2026-02-01', end: '2026-11-30' }
    expect(extendBefore(range)).toEqual({ start: '2025-11-01', end: '2026-11-30' })
    expect(extendAfter(range)).toEqual({ start: '2026-02-01', end: '2027-02-28' })
  })

  it('ngày cuối tháng không tràn sang tháng sau', () => {
    expect(extendAfter({ start: '2026-01-01', end: '2026-01-31' }, 1).end).toBe('2026-02-28')
    expect(extendAfter({ start: '2028-01-01', end: '2028-01-31' }, 1).end).toBe('2028-02-29')
  })

  it('kẹp trong 1900–2100', () => {
    const early = extendBefore({ start: '1900-02-01', end: '1900-12-31' })
    expect(early.start).toBe(FIRST_DATE)
    expect(isAtStart(early)).toBe(true)
    const late = extendAfter({ start: '2100-01-01', end: '2100-11-30' })
    expect(late.end).toBe(LAST_DATE)
    expect(isAtEnd(late)).toBe(true)
    expect(isAtStart(defaultRange('2026-09-23'))).toBe(false)
    expect(defaultRange('1900-01-15').start).toBe(FIRST_DATE)
  })
})
