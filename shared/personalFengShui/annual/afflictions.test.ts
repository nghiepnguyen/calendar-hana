import { describe, expect, it } from 'vitest'
import {
  assessAnnualAfflictions,
  assessPersonalAnnualAfflictions,
  evaluateSatChu,
  SAT_CHU_AM,
  SAT_CHU_DUONG,
} from './afflictions'

describe('personal annual afflictions', () => {
  it.each([
    [6, ['truc', 'hinh'], false, false], // Ngọ gặp Ngọ
    [0, ['xung'], true, true], // Tý gặp Ngọ: vừa Xung vừa Tam Sát
    [1, ['hai'], false, false], // Sửu gặp Ngọ
    [3, ['pha'], false, false], // Mão gặp Ngọ
    [8, [], false, true], // Thân gặp Ngọ: Tam Sát
    [4, [], false, true], // Thìn gặp Ngọ: Tam Sát
    [10, [], false, false], // Tuất gặp Ngọ: tam hợp
  ] as const)(
    'assesses birth branch %i against the 2026 Ngọ year',
    (birthYearChi, thaiTue, tuePha, tamSat) => {
      const result = assessAnnualAfflictions(birthYearChi, 6)
      expect(result.thaiTue).toEqual(thaiTue)
      expect(result.tuePha).toBe(tuePha)
      expect(result.tamSat.hit).toBe(tamSat)
    },
  )

  it('uses the lunar birth year for a person born before Tết', () => {
    const result = assessPersonalAnnualAfflictions('1991-01-15', '2026-09-23')
    expect(result).toMatchObject({
      status: 'ready',
      birthLunarYear: 1990,
      birthYearChi: 6,
      viewYearChi: 6,
      thaiTue: ['truc', 'hinh'],
    })
  })

  it('changes the viewed year at Tết instead of January 1', () => {
    expect(assessPersonalAnnualAfflictions('1990-07-01', '2026-02-16')).toMatchObject({
      status: 'ready',
      viewLunarYear: 2025,
      viewYearChi: 5,
    })
    expect(assessPersonalAnnualAfflictions('1990-07-01', '2026-02-17')).toMatchObject({
      status: 'ready',
      viewLunarYear: 2026,
      viewYearChi: 6,
    })
  })
})

describe('Sát Chủ of the viewed day', () => {
  it('matches the audited 12-month Sát Chủ Âm table', () => {
    expect(SAT_CHU_AM).toEqual([5, 0, 7, 3, 8, 10, 11, 1, 6, 9, 2, 4])
  })

  it('matches the selected 12-month Sát Chủ Dương table', () => {
    expect(SAT_CHU_DUONG).toEqual([0, 1, 1, 10, 4, 4, 1, 4, 1, 4, 7, 4])
  })

  it('keeps the corrected month 7 and 8 Sát Chủ Âm entries', () => {
    expect(evaluateSatChu(7, 11)).toMatchObject({ am: true, duong: false })
    expect(evaluateSatChu(7, 1)).toMatchObject({ am: false, duong: true })
    expect(evaluateSatChu(8, 1)).toMatchObject({ am: true, duong: false })
    expect(evaluateSatChu(8, 11)).toMatchObject({ am: false, duong: false })
  })

  it('distinguishes Tỵ from Tý in month 1', () => {
    expect(evaluateSatChu(1, 5)).toMatchObject({ am: true, duong: false })
    expect(evaluateSatChu(1, 0)).toMatchObject({ am: false, duong: true })
  })

  it('identifies the documented 21/7/2023 Sát Chủ Dương date', () => {
    const result = assessPersonalAnnualAfflictions('1990-07-01', '2023-07-21')
    expect(result).toMatchObject({
      status: 'ready',
      satChu: { lunarMonth: 6, dayBranch: 4, am: false, duong: true },
    })
  })
})
