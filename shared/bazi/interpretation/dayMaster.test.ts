import { describe, expect, it } from 'vitest'
import { CAN, CHI } from '../../lunar/canChi'
import { dayMasterOf, elementDistribution, INTERPRETATION_VERSIONS } from './dayMaster'

const pillar = (can: (typeof CAN)[number], chi: (typeof CHI)[number]) => ({
  can: CAN.indexOf(can),
  chi: CHI.indexOf(chi),
})

// Bộ 8 chữ của ví dụ đầu ra trong bazi_calculation_engine_spec.md mục 2.2, chỉ dùng để kiểm phép
// đếm. Đây KHÔNG phải lá số đúng của 15/08/1990 08:30: theo công thức JDN của chính spec (mục 4,
// bước 2) ngày đó là Nhâm Tý và giờ là Giáp Thìn (xem pillars.test.ts).
const SPEC_EXAMPLE = {
  year: pillar('Canh', 'Ngọ'),
  month: pillar('Giáp', 'Thân'),
  day: pillar('Bính', 'Dần'),
  hour: pillar('Nhâm', 'Thìn'),
}

describe('dayMasterOf', () => {
  it('takes the day stem with its element and polarity (spec 3.1)', () => {
    expect(dayMasterOf(SPEC_EXAMPLE)).toEqual({
      can: 2,
      name: 'Bính',
      element: 'Hỏa',
      polarity: 'Dương',
      sourcePillar: 'day',
      version: INTERPRETATION_VERSIONS.dayMaster,
    })
  })

  it.each([
    ['Giáp', 'Mộc', 'Dương'],
    ['Ất', 'Mộc', 'Âm'],
    ['Bính', 'Hỏa', 'Dương'],
    ['Đinh', 'Hỏa', 'Âm'],
    ['Mậu', 'Thổ', 'Dương'],
    ['Kỷ', 'Thổ', 'Âm'],
    ['Canh', 'Kim', 'Dương'],
    ['Tân', 'Kim', 'Âm'],
    ['Nhâm', 'Thủy', 'Dương'],
    ['Quý', 'Thủy', 'Âm'],
  ] as const)('maps %s to %s %s', (can, element, polarity) => {
    const result = dayMasterOf({ ...SPEC_EXAMPLE, day: pillar(can, 'Tý') })
    expect(result).toMatchObject({ name: can, element, polarity })
  })

  it('ignores nạp âm and other pillars', () => {
    const other = { ...SPEC_EXAMPLE, year: pillar('Quý', 'Hợi') }
    expect(dayMasterOf(other).name).toBe('Bính')
  })

  it('rejects stems outside 0–9', () => {
    expect(() => dayMasterOf({ ...SPEC_EXAMPLE, day: { can: 10, chi: 0 } })).toThrow()
  })
})

describe('elementDistribution', () => {
  it('counts four stems and four branch main elements (spec 2.2, 5.1)', () => {
    const result = elementDistribution(SPEC_EXAMPLE)
    expect(result.total).toBe(8)
    expect(Object.fromEntries(result.entries.map((e) => [e.element, e.count]))).toEqual({
      Kim: 2,
      Mộc: 2,
      Thủy: 1,
      Hỏa: 2,
      Thổ: 1,
    })
    expect(Object.fromEntries(result.entries.map((e) => [e.element, e.percentage]))).toEqual({
      Kim: 25,
      Mộc: 25,
      Thủy: 12.5,
      Hỏa: 25,
      Thổ: 12.5,
    })
  })

  it('keeps the position of every counted character', () => {
    const kim = elementDistribution(SPEC_EXAMPLE).entries.find((e) => e.element === 'Kim')!
    expect(kim.positions).toEqual([
      { pillar: 'year', part: 'can', name: 'Canh' },
      { pillar: 'month', part: 'chi', name: 'Thân' },
    ])
  })

  it('returns zero, not a missing key, for an absent element', () => {
    const allWater = {
      year: pillar('Nhâm', 'Tý'),
      month: pillar('Quý', 'Hợi'),
      day: pillar('Nhâm', 'Tý'),
      hour: pillar('Quý', 'Hợi'),
    }
    const result = elementDistribution(allWater)
    expect(result.entries.map((e) => e.count)).toEqual([0, 0, 8, 0, 0])
    expect(result.entries.reduce((sum, e) => sum + e.percentage, 0)).toBe(100)
  })
})
