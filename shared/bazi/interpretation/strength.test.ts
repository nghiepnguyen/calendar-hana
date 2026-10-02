import { describe, expect, it } from 'vitest'
import { CAN, CHI } from '../../lunar/canChi'
import { POSITION_WEIGHTS, assessStrength } from './strength'

const pillar = (can: (typeof CAN)[number], chi: (typeof CHI)[number]) => ({
  can: CAN.indexOf(can),
  chi: CHI.indexOf(chi),
})

// Bộ 8 chữ minh họa của bazi_calculation_engine_spec.md mục 2.2 (chỉ dùng kiểm phép tính).
const SPEC_EXAMPLE = {
  year: pillar('Canh', 'Ngọ'),
  month: pillar('Giáp', 'Thân'),
  day: pillar('Bính', 'Dần'),
  hour: pillar('Nhâm', 'Thìn'),
}

describe('POSITION_WEIGHTS', () => {
  it('sums to exactly 100 over the seven non-day-stem positions', () => {
    expect(Object.values(POSITION_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100)
    expect(Object.keys(POSITION_WEIGHTS)).not.toContain('day.can')
  })

  it('keeps every weight inside the range given by spec 5.2', () => {
    expect(POSITION_WEIGHTS['month.chi']).toBeGreaterThanOrEqual(30)
    expect(POSITION_WEIGHTS['month.chi']).toBeLessThanOrEqual(40)
    expect(POSITION_WEIGHTS['day.chi']).toBeGreaterThanOrEqual(12)
    expect(POSITION_WEIGHTS['day.chi']).toBeLessThanOrEqual(15)
    expect(POSITION_WEIGHTS['year.can']).toBeGreaterThanOrEqual(5)
    expect(POSITION_WEIGHTS['year.can']).toBeLessThanOrEqual(6)
  })
})

describe('assessStrength', () => {
  // Nhật Nguyên Bính Hỏa; trợ lực = Hỏa (Tỷ/Kiếp) + Mộc (Ấn).
  // Ngọ chi năm 10 + Giáp can tháng 12 + Dần chi ngày 15 = 37 < 50.
  it('scores the spec example as Thân Nhược with 37/100', () => {
    const result = assessStrength(SPEC_EXAMPLE)
    expect(result.supportElements).toEqual(['Hỏa', 'Mộc'])
    expect(result.score).toBe(37)
    expect(result.strength).toBe('Thân Nhược')
    expect(result.weightedScores).toEqual({ Kim: 41, Mộc: 27, Thủy: 12, Hỏa: 10, Thổ: 10 })
  })

  it('lists exactly the supporting positions with their weight', () => {
    expect(
      assessStrength(SPEC_EXAMPLE)
        .contributions.filter((c) => c.supports)
        .map((c) => `${c.position}:${c.name}:${c.weight}`),
    ).toEqual(['year.chi:Ngọ:10', 'month.can:Giáp:12', 'day.chi:Dần:15'])
  })

  // Đinh Hỏa; Ngọ chi năm 10 + Ngọ chi tháng 35 + Mão chi ngày 15 + Giáp can giờ 12 = 72.
  it('scores a chart with month-command support as Thân Vượng', () => {
    const result = assessStrength({
      year: pillar('Canh', 'Ngọ'),
      month: pillar('Nhâm', 'Ngọ'),
      day: pillar('Đinh', 'Mão'),
      hour: pillar('Giáp', 'Thìn'),
    })
    expect(result.score).toBe(72)
    expect(result.strength).toBe('Thân Vượng')
  })

  it('treats exactly 50 as Thân Vượng (spec 5.3: ≥ 50%)', () => {
    // Ất Mộc; trợ lực Mộc + Thủy. Hợi chi tháng 35 + Mão chi ngày 15 = 50.
    // Lá số hợp lệ: năm Canh → tháng Hợi là Đinh (Ngũ Hổ Độn); ngày Ất → giờ Tỵ là Tân (Ngũ Thử Độn).
    const result = assessStrength({
      year: pillar('Canh', 'Thân'),
      month: pillar('Đinh', 'Hợi'),
      day: pillar('Ất', 'Mão'),
      hour: pillar('Tân', 'Tỵ'),
    })
    expect(result.score).toBe(50)
    expect(result.strength).toBe('Thân Vượng')
  })

  it('does not count the day stem itself', () => {
    const result = assessStrength(SPEC_EXAMPLE)
    expect(result.contributions.map((c) => c.position)).not.toContain('day.can')
  })
})
