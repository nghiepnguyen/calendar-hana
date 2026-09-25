import { describe, expect, it } from 'vitest'
import { dayCanChi } from './canChi'
import { canElement, chiElement, getCanChiRelation } from './elements'
import { solarStringToJd } from './julian'

const cc = (can: number, chi: number) => ({ can, chi, name: '' })

describe('ngũ hành Can, Chi', () => {
  it('Nhâm là Thủy, Dần là Mộc, Thìn là Thổ', () => {
    expect(canElement(8)).toBe('Thủy')
    expect(chiElement(2)).toBe('Mộc')
    expect(chiElement(4)).toBe('Thổ')
  })
})

describe('getCanChiRelation', () => {
  it('ngày mẫu 25/9/2026 (Nhâm Dần) là Can sinh Chi, bảo nhật', () => {
    const r = getCanChiRelation(dayCanChi(solarStringToJd('2026-09-25')))
    expect(r.kind).toBe('canSinhChi')
    expect(r.text).toBe('Can sinh Chi (Thủy sinh Mộc), là ngày cát (bảo nhật).')
  })

  it.each([
    [cc(8, 2), 'canSinhChi', 'bảo nhật'], // Nhâm Dần: Thủy sinh Mộc
    [cc(0, 0), 'chiSinhCan', 'nghĩa nhật'], // Giáp Tý: Thủy sinh Mộc
    [cc(0, 4), 'canKhacChi', 'chế nhật'], // Giáp Thìn: Mộc khắc Thổ
    [cc(0, 8), 'chiKhacCan', 'phạt nhật'], // Giáp Thân: Kim khắc Mộc
    [cc(0, 2), 'dongHanh', 'chuyên nhật'], // Giáp Dần: cùng Mộc
  ] as const)('%j là %s', (canChi, kind, dayName) => {
    const r = getCanChiRelation(canChi)
    expect(r.kind).toBe(kind)
    expect(r.dayName).toBe(dayName)
  })

  it('Chi khắc Can ghi hành của Chi trước', () => {
    expect(getCanChiRelation(cc(0, 8)).text).toBe(
      'Chi khắc Can (Kim khắc Mộc), là ngày hung (phạt nhật).',
    )
    expect(getCanChiRelation(cc(0, 2)).text).toBe(
      'Can Chi tương đồng (cùng Mộc), là ngày cát (chuyên nhật).',
    )
  })
})
