import { describe, expect, it } from 'vitest'
import { FENG_SHUI_RULES } from './rules'
import fixtures from '../../tasks/fixtures/personal-feng-shui-stars.v1.json'

import * as api from './day'
function engine() {
  return api
}

describe('personal day and hour policy', () => {
  it('covers all directed branch pairs with six clashes and six combinations', () => {
    const { branchRelation } = engine()
    const matches = [
      [0, 1],
      [2, 11],
      [3, 10],
      [4, 9],
      [5, 8],
      [6, 7],
    ]
    for (let a = 0; a < 12; a++)
      for (let b = 0; b < 12; b++) {
        const expected =
          a === b
            ? 'same'
            : Math.abs(a - b) === 6
              ? 'clash'
              : matches.some((p) => p.includes(a) && p.includes(b))
                ? 'combination'
                : [
                      [0, 4, 8],
                      [2, 6, 10],
                      [3, 7, 11],
                      [1, 5, 9],
                    ].some((group) => group.includes(a) && group.includes(b))
                  ? 'trine'
                  : 'none'
        expect(branchRelation(a, b).kind).toBe(expected)
      }
  })
  it('covers 25 directed element pairs and all 100 stems, giving combinations precedence', () => {
    const { elementRelation, stemRelation } = engine()
    const elements = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'] as const
    for (let a = 0; a < 5; a++)
      for (let b = 0; b < 5; b++) {
        expect(elementRelation(elements[a], elements[b]).kind).toBe(
          ['same', 'generates', 'overcomes', 'overcomeBy', 'generatedBy'][(b - a + 5) % 5],
        )
      }
    for (let a = 0; a < 10; a++)
      for (let b = 0; b < 10; b++) {
        const r = stemRelation(a, b)
        expect(r.combined).toBe(Math.abs(a - b) === 5)
        if (r.combined) expect(r.tone).toBe('favorable')
        expect(r.text).not.toContain('Can xung')
      }
    expect(stemRelation(0, 5).element.kind).toBe('overcomes')
    expect(stemRelation(0, 5).tone).toBe('favorable')
  })
  it.each(['same', 'generates', 'generatedBy', 'overcomes', 'overcomeBy'] as const)(
    'nap am relation %s has its own tone',
    (kind) => {
      const { elementRelation } = engine()
      const r = elementRelation(
        'Mộc',
        { same: 'Mộc', generates: 'Hỏa', generatedBy: 'Thủy', overcomes: 'Thổ', overcomeBy: 'Kim' }[
          kind
        ] as 'Mộc',
      )
      expect(r.tone).toBe(
        kind === 'same' || kind === 'generates'
          ? 'favorable'
          : kind === 'generatedBy'
            ? 'neutral'
            : 'caution',
      )
    },
  )
  it.each([
    ['1990-07-01', 'none', 'Lộ Bàng Thổ', 'caution'],
    ['1991-07-01', 'none', 'Lộ Bàng Thổ', 'caution'],
    ['1992-07-01', 'none', 'Kiếm Phong Kim', 'caution'],
    ['1993-07-01', 'same', 'Kiếm Phong Kim', 'caution'],
    ['1994-07-01', 'none', 'Sơn Đầu Hỏa', 'favorable'],
    ['1995-07-01', 'none', 'Sơn Đầu Hỏa', 'favorable'],
    ['1996-07-01', 'none', 'Giản Hạ Thủy', 'caution'],
    ['1997-07-01', 'trine', 'Giản Hạ Thủy', 'caution'],
    ['1998-07-01', 'none', 'Thành Đầu Thổ', 'favorable'],
    ['1999-07-01', 'clash', 'Thành Đầu Thổ', 'caution'],
    ['2000-07-01', 'combination', 'Bạch Lạp Kim', 'caution'],
    ['2001-07-01', 'trine', 'Bạch Lạp Kim', 'caution'],
  ])('independent Dinh Dau fixture %s → %s', (birthDate, expected, napAm, summary) => {
    const result = engine().assessPersonalDay({
      viewDate: '2026-09-20',
      birthDate,
      today: '2026-10-01',
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.day.name).toBe('Đinh Dậu')
    expect(result.branch.kind).toBe(expected)
    expect(result.profileNapAm.name).toBe(napAm)
    expect(result.summary).toBe(summary)
    expect(result.hours).toHaveLength(12)
    for (const hour of result.hours) {
      if (hour.group !== 'excluded') {
        expect(hour.isGood).toBe(true)
        expect(hour.branch.kind).not.toBe('clash')
        expect(hour.stem.tone).not.toBe('caution')
      } else expect(hour.exclusions.length).toBeGreaterThan(0)
    }
    if (expected === 'clash') expect(result.summary).toBe('caution')
  })
  it('changes birth year at Tet and never caches the birth date in the common calendar', () => {
    const before = engine().assessPersonalDay({
      viewDate: '2026-09-20',
      birthDate: '1990-01-26',
      today: '2026-10-01',
    })
    const after = engine().assessPersonalDay({
      viewDate: '2026-09-20',
      birthDate: '1990-01-27',
      today: '2026-10-01',
    })
    expect(before.status === 'ready' && before.profile.name).toBe('Kỷ Tỵ')
    expect(after.status === 'ready' && after.profile.name).toBe('Canh Ngọ')
  })
  it.each([
    [undefined, 'missing'],
    ['2020-02-30', 'invalid'],
    ['2027-01-01', 'invalid'],
    ['1899-01-01', 'unsupported'],
  ])('does not rate unavailable profile %s', (birthDate, status) => {
    expect(
      engine().assessPersonalDay({ viewDate: '2026-09-20', birthDate, today: '2026-10-01' }).status,
    ).toBe(status)
  })
  it('blocks pending, rejected and missing rules rather than returning a neutral rating', () => {
    for (const status of ['pending', 'rejected'] as const) {
      const rules = FENG_SHUI_RULES.map((r) =>
        r.id === 'personal.hour-policy' ? { ...r, verificationStatus: status } : r,
      )
      expect(
        engine().assessPersonalDay(
          { viewDate: '2026-09-20', birthDate: '1990-07-01', today: '2026-10-01' },
          rules,
        ).status,
      ).toBe('unsupported')
    }
    expect(
      engine().assessPersonalDay(
        { viewDate: '2026-09-20', birthDate: '1990-07-01', today: '2026-10-01' },
        [],
      ).status,
    ).toBe('unsupported')
  })

  it('adds reviewed stem clash as separate evidence without changing the MVP summary', () => {
    const result = engine().assessPersonalDay({
      viewDate: '2026-09-20', // Đinh Dậu
      birthDate: '1993-07-01', // Quý Dậu
      today: '2026-10-01',
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.stem.text).toContain('Thủy khắc Hỏa')
    expect(result.summary).toBe('caution')
    expect(result.personalStars.stemClash).toMatchObject({
      hit: true,
      affectsDaySummary: false,
    })
  })

  it('matches the same-day, different-profile P2 fixtures', () => {
    for (const fixture of fixtures.dateProfileCases) {
      const result = engine().assessPersonalDay({
        viewDate: fixture.viewDate,
        birthDate: fixture.birthDate,
        today: '2026-10-01',
      })
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') continue
      expect(result.day.name).toBe(fixture.dayName)
      expect(result.profile.name).toBe(fixture.birthYearName)
      expect(result.personalStars.status).toBe('ready')
      if (result.personalStars.status === 'ready') {
        expect(result.personalStars.stemClash.hit).toBe(fixture.hit)
      }
    }
  })

  it('keeps the MVP assessment available when the optional P2 rule is blocked', () => {
    const rules = FENG_SHUI_RULES.map((rule) =>
      rule.id === 'personal.can-xung' ? { ...rule, verificationStatus: 'pending' as const } : rule,
    )
    const result = engine().assessPersonalDay(
      { viewDate: '2026-09-20', birthDate: '1993-07-01', today: '2026-10-01' },
      rules,
    )
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.personalStars).toMatchObject({
      status: 'unsupported',
      reasonCode: 'unverifiedRule',
    })
  })
})
