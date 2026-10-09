import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/directions-golden-v1.json'
import { getTravelDirections } from './directions'

type Directions = ReturnType<typeof getTravelDirections>
type DirectionTable = readonly Directions[]

const authorityTable: DirectionTable = golden.cases.map(({ hyThan, taiThan, phucThan }) => ({
  hyThan,
  taiThan,
  phucThan,
}))

function mismatches(table: DirectionTable) {
  return golden.cases.filter((fixture) => {
    const actual = table[fixture.dayCan]
    return (
      actual.hyThan !== fixture.hyThan ||
      actual.taiThan !== fixture.taiThan ||
      actual.phucThan !== fixture.phucThan
    )
  })
}

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

  it('mutation gate: 5 regression classes đều bị independent Golden giết', () => {
    const legacyTaiThan = [
      'Đông Nam',
      'Đông Nam',
      'Đông',
      'Đông',
      'Bắc',
      'Nam',
      'Tây Nam',
      'Tây Nam',
      'Tây',
      'Tây',
    ] as const

    const mutants: readonly { name: string; table: DirectionTable; minKilledCells: number }[] = [
      {
        name: 'legacy mislabeled Tài table',
        table: authorityTable.map((row, i) => ({ ...row, taiThan: legacyTaiThan[i] })),
        minKilledCells: 9,
      },
      {
        name: 'Mậu Tài = Nam',
        table: authorityTable.map((row, i) => (i === 4 ? { ...row, taiThan: 'Nam' } : row)),
        minKilledCells: 1,
      },
      {
        name: 'Kỷ Tài = Nam',
        table: authorityTable.map((row, i) => (i === 5 ? { ...row, taiThan: 'Nam' } : row)),
        minKilledCells: 1,
      },
      {
        name: 'Nhâm Phúc = Tây',
        table: authorityTable.map((row, i) => (i === 8 ? { ...row, phucThan: 'Tây' } : row)),
        minKilledCells: 1,
      },
      {
        name: 'DAY_STEM row shifted +1',
        table: authorityTable.map((_, i) => authorityTable[(i + 1) % authorityTable.length]),
        minKilledCells: 1,
      },
    ]

    expect(mutants).toHaveLength(5)
    for (const mutant of mutants) {
      expect(mismatches(mutant.table).length, `${mutant.name} must be killed`).toBeGreaterThanOrEqual(
        mutant.minKilledCells,
      )
    }
  })
})
