import { describe, expect, it } from 'vitest'
import { resolveDayRuleGods } from './godMapping'
import { getActivityAvoidances, getActivityRecommendations } from './activityRecommendations'

describe('getActivityRecommendations', () => {
  it('scores cut hair as its own activity instead of proxying to cleaning', () => {
    const result = getActivityRecommendations({ officerId: 'tru', presentGoodGods: [] })

    expect(result.find((item) => item.activityId === 'cut_hair')).toMatchObject({
      label: 'Cắt tóc',
      status: 'recommended',
      evidence: ['Trực Trừ'],
    })
    expect(result.find((item) => item.activityId === 'cleaning')?.activityId).toBe('cleaning')
  })

  it('combines mansion text with compatible Trực activity rules', () => {
    const result = getActivityRecommendations({
      officerId: 'tru',
      mansion: {
        name: 'Vị',
        shouldDo:
          'Khởi công tạo tác. Tốt nhất là xây cất, cưới gả, chôn cất, dọn cỏ phá đất, gieo trồng, lấy giống.',
        shouldAvoid: 'Đi thuyền.',
      },
    })

    expect(result.find((item) => item.activityId === 'medical')?.status).toBe('recommended')
    expect(result.find((item) => item.activityId === 'cut_hair')?.status).toBe('recommended')
    // Mansion text is informational only, so it cannot add wedding evidence Trực Trừ lacks.
    expect(result.find((item) => item.activityId === 'wedding')?.status).toBe('no_evidence')
  })

  it('keeps compatible Trực recommendations when mansion text has no activity match', () => {
    const result = getActivityRecommendations({
      officerId: 'khai',
      mansion: { name: 'Vị', shouldDo: 'Đi thuyền.', shouldAvoid: 'Đi thuyền.' },
      presentGoodGods: [],
      presentBadGods: [],
    })

    expect(result.find((item) => item.activityId === 'opening')).toMatchObject({
      status: 'recommended',
      evidence: ['Trực Khai'],
    })
  })

  it('uses the normalized Trực rules to recommend activities', () => {
    const result = getActivityRecommendations({ officerId: 'khai', presentGoodGods: [] })

    expect(result.find((item) => item.activityId === 'opening')).toMatchObject({
      label: 'Khai trương',
      status: 'recommended',
    })
  })

  it('keeps resolved mansion candidates informational while disabled', () => {
    const input = {
      officerId: 'nguy',
      mansion: {
        name: 'Quỷ',
        shouldDo: 'Phát cỏ phá đất.',
        shouldAvoid: 'Xây nhà, cưới gả, động thổ.',
      },
    }

    expect(
      getActivityRecommendations(input).find((item) => item.activityId === 'groundbreaking')
        ?.status,
    ).toBe('no_evidence')
    expect(
      getActivityAvoidances(input).find((item) => item.activityId === 'groundbreaking'),
    ).toBeUndefined()
  })

  it('uses the Hiệp Kỷ vol. 11 mapping for Trực Trừ (除日, 吉期)', () => {
    const result = getActivityRecommendations({ officerId: 'tru', presentGoodGods: [] })
    const status = (id: string) => result.find((item) => item.activityId === id)?.status

    expect(status('travel')).toBe('recommended')
    expect(status('cleaning')).toBe('recommended')
    expect(status('wedding')).toBe('no_evidence')
    expect(status('construction')).toBe('no_evidence')
    expect(status('burial')).toBe('no_evidence')
  })

  it('does not score 28 Tú by its nature in v1', () => {
    const score = (mansionNature?: 'bad') =>
      getActivityRecommendations({ officerId: 'khai', presentGoodGods: [], mansionNature }).find(
        (item) => item.activityId === 'study',
      )?.score

    expect(score('bad')).toBe(score())
  })

  it('applies a critical bad god after positive rules', () => {
    const result = getActivityRecommendations({
      officerId: 'khai',
      presentGoodGods: ['thien_duc'],
      presentBadGods: ['nguyet_pha'],
    })

    expect(result.find((item) => item.activityId === 'opening')).toMatchObject({
      status: 'consider',
      score: 50,
    })
  })
})

describe('getActivityAvoidances', () => {
  it('returns activity-specific avoidances from Trực', () => {
    const result = getActivityAvoidances({ officerId: 'pha' })
    expect(result.find((item) => item.activityId === 'opening')).toMatchObject({
      label: 'Khai trương',
      status: 'avoid',
      score: 25,
    })
  })

  it('keeps strong positive and negative evidence as consider', () => {
    const result = getActivityAvoidances({
      officerId: 'pha',
      presentGoodGods: ['thien_duc', 'thien_hy'],
      presentBadGods: ['nguyet_pha'],
    })
    expect(result.find((item) => item.activityId === 'wedding')).toMatchObject({
      status: 'consider',
    })
  })
})

describe('mapping/scoring specification regressions', () => {
  it('keeps disabled mansion text out of scores and recommendations', () => {
    const baseline = getActivityRecommendations({
      officerId: 'chap',
      presentGoodGods: [],
      presentBadGods: [],
    })
    const withMansion = getActivityRecommendations({
      officerId: 'chap',
      presentGoodGods: [],
      presentBadGods: [],
      mansion: { name: 'Tất', shouldDo: 'Xuất hành.', shouldAvoid: 'Đi thuyền.' },
    })
    expect(withMansion.map((row) => [row.activityId, row.score, row.status])).toEqual(
      baseline.map((row) => [row.activityId, row.score, row.status]),
    )
    const avoidIds = (mansion?: { name: string; shouldDo: string; shouldAvoid: string }) =>
      getActivityAvoidances({ officerId: 'chap', mansion }).map((row) => row.activityId)
    expect(avoidIds({ name: 'Tất', shouldDo: 'Xuất hành.', shouldAvoid: 'Đi thuyền.' })).toEqual(
      avoidIds(),
    )
    expect(avoidIds()).not.toContain('water_travel')
  })
  it('returns no evidence for Trực Chấp rather than neutral', () => {
    // 執日 only suits 捕捉 (capture) in Hiệp Kỷ; no app activity maps to it.
    expect(
      getActivityRecommendations({
        officerId: 'chap',
        presentGoodGods: [],
        presentBadGods: [],
      }).every((row) => String(row.status) === 'no_evidence'),
    ).toBe(true)
  })
  it('does not count gods that always coincide with the Trực a second time', () => {
    const wedding = getActivityRecommendations({
      officerId: 'thanh',
      presentGoodGods: ['tam_hop', 'thien_hy'],
      presentBadGods: [],
    }).find((row) => row.activityId === 'wedding')!
    expect(wedding.positiveMagnitude).toBe(20)
    expect(
      wedding.contributions.filter((row) => row.source === 'good_god').map((row) => row.status),
    ).toEqual(['informational', 'informational'])
    const monthBreak = getActivityRecommendations({
      officerId: 'pha',
      presentGoodGods: [],
      presentBadGods: ['nguyet_pha'],
    }).find((row) => row.activityId === 'wedding')!
    expect(monthBreak.negativeMagnitude).toBe(25)
    expect(monthBreak.hardWarning).toBe(true)
    const dinhWedding = getActivityRecommendations({
      officerId: 'dinh',
      presentGoodGods: ['tam_hop'],
      presentBadGods: [],
    }).find((row) => row.activityId === 'wedding')!
    expect(dinhWedding.positiveMagnitude).toBe(15)
  })
  it('caps gods per source and preserves month-break warning', () => {
    const row = getActivityRecommendations({
      officerId: 'thanh',
      presentGoodGods: ['thien_duc', 'nguyet_duc', 'thien_duc_hop', 'nguyet_duc_hop'],
      presentBadGods: ['nguyet_pha'],
    }).find((row) => row.activityId === 'wedding')!
    expect(row.score).toBe(70)
    expect(
      row.contributions
        .filter((item) => item.source === 'good_god')
        .reduce((sum, item) => sum + item.scoreDelta, 0),
    ).toBe(25)
    expect(row.status).not.toBe('recommended')
  })
})

it('keeps canonical scopes on non-mansion contributions', () => {
  const travel = getActivityRecommendations({
    officerId: 'chap',
    presentGoodGods: [],
    presentBadGods: [],
  }).find((row) => row.activityId === 'travel')!
  expect(travel.contributions[0].scope).toBe('travel_general')
})

describe('haircut day rules (Hiệp Kỷ vol. 10–11)', () => {
  const cutHair = (input: Parameters<typeof getActivityRecommendations>[0]) =>
    getActivityRecommendations(input).find((row) => row.activityId === 'cut_hair')!

  it('resolves day-defined gods from stem, branch and lunar day', () => {
    expect(resolveDayRuleGods({ can: 3, chi: 8, lunarDay: 12 })).toEqual({
      presentGoodGods: ['tru_than'],
      presentBadGods: ['dinh_nhat', 'nhan_than_toc'],
    })
    expect(resolveDayRuleGods({ can: 0, chi: 0, lunarDay: 1 })).toEqual({
      presentGoodGods: [],
      presentBadGods: [],
    })
  })
  it('never marks a Đinh day favourable for a haircut, even on Trực Trừ', () => {
    const row = cutHair({ officerId: 'tru', presentGoodGods: [], presentBadGods: ['dinh_nhat'] })
    expect(row.hardWarning).toBe(true)
    expect(row.status).not.toBe('recommended')
  })
  it('treats Bình and Thu as explicitly not taboo for haircuts', () => {
    for (const officerId of ['binh', 'thu']) {
      const row = cutHair({ officerId, presentGoodGods: [], presentBadGods: [] })
      expect(row.status).toBe('neutral')
      expect(row.score).toBe(50)
    }
  })
})
