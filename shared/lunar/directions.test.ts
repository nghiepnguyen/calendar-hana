import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/directions-golden-v1.json'
import { getTravelDirections } from './directions'

describe('getTravelDirections — directions-authority-v1', () => {
  it('khớp independent Golden cho đủ 10 Can / 30 cells', () => {
    expect(golden.authorityId).toBe('directions-authority-v1')
    expect(golden.operand).toBe('DAY_STEM')
    expect(golden.cases).toHaveLength(10)

    for (const fixture of golden.cases) {
      expect(getTravelDirections(fixture.dayCan), fixture.stem).toEqual({
        hyThan: fixture.hyThan,
        taiThan: fixture.taiThan,
        phucThan: fixture.phucThan,
      })
    }
  })

  it('khóa case phân biệt Tài Thần và Phúc Thần', () => {
    expect(getTravelDirections(0)).toEqual({
      hyThan: 'Đông Bắc',
      taiThan: 'Đông Bắc',
      phucThan: 'Đông Nam',
    })
    expect(getTravelDirections(8)).toEqual({
      hyThan: 'Nam',
      taiThan: 'Nam',
      phucThan: 'Tây Bắc',
    })
  })

  it('Mậu Tài Thần = Bắc theo 玉匣記 convention, không theo website majority vote', () => {
    expect(getTravelDirections(4)).toEqual({
      hyThan: 'Đông Nam',
      taiThan: 'Bắc',
      phucThan: 'Bắc',
    })
  })

  it('đủ 10 Can và đủ cả ba hướng', () => {
    for (let can = 0; can < 10; can++) {
      const directions = getTravelDirections(can)
      expect(directions.hyThan).toBeTruthy()
      expect(directions.taiThan).toBeTruthy()
      expect(directions.phucThan).toBeTruthy()
    }
  })
})
