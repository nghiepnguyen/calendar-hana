import { describe, expect, it } from 'vitest'
import fixture from '../../../tasks/fixtures/bazi-interpretation.v1.json'
import { CAN } from '../../lunar/canChi'
import { TEN_GOD_VERSION, tenGodOf } from './tenGods'

// Suy ra độc lập, không dùng code engine hay elements.ts, từ quy tắc trong 三命通會 quyển 5 và 7:
// đồng ngã là Tỷ/Kiếp, sinh ngã là Ấn, ngã sinh là Thực/Thương, ngã khắc là Tài, khắc ngã là Quan/Sát;
// cùng âm dương là "thiên" (Tỷ Kiên, Thực Thần, Thiên Tài, Thất Sát, Thiên Ấn), khác là "chính".
const CYCLE = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'] // mỗi hành sinh hành kế tiếp
const stemElement = (can: number) => CYCLE[Math.floor(can / 2)]
function derive(dayMaster: number, other: number): string {
  const step = (CYCLE.indexOf(stemElement(other)) - CYCLE.indexOf(stemElement(dayMaster)) + 5) % 5
  const same = dayMaster % 2 === other % 2
  return [
    same ? 'Tỷ Kiên' : 'Kiếp Tài', // 0: cùng hành
    same ? 'Thực Thần' : 'Thương Quan', // 1: ta sinh
    same ? 'Thiên Tài' : 'Chính Tài', // 2: ta khắc
    same ? 'Thất Sát' : 'Chính Quan', // 3: khắc ta
    same ? 'Thiên Ấn' : 'Chính Ấn', // 4: sinh ta
  ][step]
}

describe('fixture tenGodMatrix', () => {
  it('uses the same stem order as the app', () => {
    expect(fixture.stemOrder).toEqual([...CAN])
    expect(fixture.tenGodMatrix.columns).toEqual([...CAN])
  })

  it('agrees with an independent derivation for all 100 cells', () => {
    for (const row of fixture.tenGodMatrix.rows) {
      const dayMaster = CAN.indexOf(row.dayMaster as (typeof CAN)[number])
      expect(row.expected).toEqual(CAN.map((_, other) => derive(dayMaster, other)))
    }
    expect(fixture.tenGodMatrix.rows).toHaveLength(10)
  })
})

describe('tenGodOf', () => {
  it('matches the fixture for all 100 directed pairs', () => {
    for (const row of fixture.tenGodMatrix.rows) {
      const dayMaster = CAN.indexOf(row.dayMaster as (typeof CAN)[number])
      expect(CAN.map((_, other) => tenGodOf(dayMaster, other).name)).toEqual(row.expected)
    }
  })

  it('is directed: Đinh sees Nhâm as Chính Quan, Nhâm sees Đinh as Chính Tài', () => {
    expect(tenGodOf(3, 8)).toMatchObject({ name: 'Chính Quan', relation: 'controlledBy' })
    expect(tenGodOf(8, 3)).toMatchObject({ name: 'Chính Tài', relation: 'controls' })
  })

  it('carries polarity and version for the explanation', () => {
    expect(tenGodOf(3, 6)).toEqual({
      name: 'Chính Tài',
      relation: 'controls',
      samePolarity: false,
      version: TEN_GOD_VERSION,
    })
  })

  it('rejects stems outside 0–9', () => {
    expect(() => tenGodOf(10, 0)).toThrow(RangeError)
    expect(() => tenGodOf(0, -1)).toThrow(RangeError)
  })
})
