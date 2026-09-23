import { describe, expect, it } from 'vitest'
import {
  minutesNowInVietnam,
  minutesToTime,
  timeToMinutes,
  todayInVietnam,
  vietnamDateTimeToDate,
} from './time'

describe('giờ Việt Nam', () => {
  it('hôm nay theo UTC+7, kể cả khi UTC còn ở ngày hôm trước', () => {
    expect(todayInVietnam(new Date('2026-09-22T16:59:00Z'))).toBe('2026-09-22')
    expect(todayInVietnam(new Date('2026-09-22T17:00:00Z'))).toBe('2026-09-23')
  })

  it('số phút hiện tại trong ngày', () => {
    expect(minutesNowInVietnam(new Date('2026-09-23T02:30:00Z'))).toBe(9 * 60 + 30)
  })

  it('đổi giờ và phút', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(-5)).toBe('00:00')
    expect(minutesToTime(24 * 60 + 10)).toBe('23:59')
  })

  it('ngày giờ Việt Nam → thời điểm tuyệt đối', () => {
    expect(vietnamDateTimeToDate('2026-09-23', '08:00').toISOString()).toBe(
      '2026-09-23T01:00:00.000Z',
    )
    expect(vietnamDateTimeToDate('2026-09-23', '03:00').toISOString()).toBe(
      '2026-09-22T20:00:00.000Z',
    )
  })
})
