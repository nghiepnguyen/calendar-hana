import { describe, expect, it } from 'vitest'
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
        shouldDo: 'Khởi công tạo tác. Tốt nhất là xây cất, cưới gả, chôn cất, dọn cỏ phá đất, gieo trồng, lấy giống.',
        shouldAvoid: 'Đi thuyền.',
      },
    })

    expect(result.find((item) => item.activityId === 'construction')?.status).toBe('recommended')
    expect(result.find((item) => item.activityId === 'wedding')?.status).toBe('recommended')
    expect(result.find((item) => item.activityId === 'medical')?.status).toBe('recommended')
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

  it('does not put a conflicted mansion activity in both lists', () => {
    const input = {
      officerId: 'nguy',
      mansion: {
        name: 'Quỷ',
        shouldDo: 'Phát cỏ phá đất.',
        shouldAvoid: 'Xây nhà, cưới gả, động thổ.',
      },
    }

    expect(getActivityRecommendations(input).find((item) => item.activityId === 'groundbreaking')?.status).toBe('neutral')
    expect(getActivityAvoidances(input).find((item) => item.activityId === 'groundbreaking')?.status).toBe('consider')
  })

  it('uses the source-specific Trực Trừ mapping', () => {
    const result = getActivityRecommendations({ officerId: 'tru', presentGoodGods: [] })

    expect(result.find((item) => item.activityId === 'wedding')?.status).toBe('recommended')
    expect(result.find((item) => item.activityId === 'construction')?.status).toBe('recommended')
    expect(result.find((item) => item.activityId === 'burial')?.status).toBe('recommended')
  })

  it('does not score 28 Tú by its nature in v1', () => {
    const result = getActivityRecommendations({ officerId: 'khai', presentGoodGods: [], mansionNature: 'bad' })

    expect(result.find((item) => item.activityId === 'study')?.score).toBe(50)
  })

  it('applies a critical bad god after positive rules', () => {
    const result = getActivityRecommendations({
      officerId: 'khai',
      presentGoodGods: ['thien_duc'],
      presentBadGods: ['nguyet_pha'],
    })

    expect(result.find((item) => item.activityId === 'opening')).toMatchObject({
      status: 'neutral',
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
    expect(result.find((item) => item.activityId === 'wedding')).toMatchObject({ status: 'consider' })
  })
})
