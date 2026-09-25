import { describe, expect, it } from 'vitest'
import { getTravelDirections } from './directions'

describe('getTravelDirections', () => {
  it('ngày Nhâm: Hỷ Thần Nam, Tài Thần Tây', () => {
    expect(getTravelDirections(8)).toEqual({ hyThan: 'Nam', taiThan: 'Tây' })
  })

  it('ngày Mậu: Tài Thần Bắc (3/4 nguồn); ngày Quý: Tài Thần Tây', () => {
    expect(getTravelDirections(4).taiThan).toBe('Bắc')
    expect(getTravelDirections(9).taiThan).toBe('Tây')
  })

  it('đủ 10 Can', () => {
    for (let can = 0; can < 10; can++) expect(getTravelDirections(can).hyThan).toBeTruthy()
  })
})
