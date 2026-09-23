import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReminderInstance } from '@shared/reminders/nextReminder'
import { makeEvent } from '../test/fixtures'
import { LocalScheduler } from './localScheduler'

// 10:00 sáng 23/9/2026 giờ Việt Nam.
const START = new Date('2026-09-23T03:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})
afterEach(() => vi.useRealTimers())

function setup() {
  const shown: ReminderInstance[] = []
  const scheduler = new LocalScheduler({ show: (i) => shown.push(i) })
  return { scheduler, shown }
}

const meeting = makeEvent({
  id: 'meeting',
  title: 'Họp',
  allDay: false,
  startTime: '10:30',
  reminders: [
    { offsetMinutes: 15, channel: 'notification' },
    { offsetMinutes: 5, channel: 'email' },
  ],
})

describe('LocalScheduler', () => {
  it('hiện thông báo đúng giờ, bỏ qua kênh email', () => {
    const { scheduler, shown } = setup()
    scheduler.update([meeting], '08:00')
    vi.advanceTimersByTime(14 * 60_000)
    expect(shown).toHaveLength(0)
    vi.advanceTimersByTime(60_000)
    expect(shown.map((i) => i.event.title)).toEqual(['Họp'])
    vi.advanceTimersByTime(30 * 60_000)
    expect(shown).toHaveLength(1)
    scheduler.dispose()
  })

  it('dữ liệu đổi thì tính lại và không hiện trùng', () => {
    const { scheduler, shown } = setup()
    scheduler.update([meeting], '08:00')
    vi.advanceTimersByTime(15 * 60_000)
    expect(shown).toHaveLength(1)
    // Sửa sự kiện: nhắc đã hiện không hiện lại, nhắc mới được đặt.
    scheduler.update(
      [
        {
          ...meeting,
          reminders: [...meeting.reminders, { offsetMinutes: 0, channel: 'notification' }],
        },
      ],
      '08:00',
    )
    expect(shown).toHaveLength(1)
    vi.advanceTimersByTime(15 * 60_000)
    expect(shown).toHaveLength(2)
    scheduler.dispose()
  })

  it('xóa sự kiện thì hủy nhắc đã đặt', () => {
    const { scheduler, shown } = setup()
    scheduler.update([meeting], '08:00')
    scheduler.update([], '08:00')
    vi.advanceTimersByTime(60 * 60_000)
    expect(shown).toHaveLength(0)
    scheduler.dispose()
  })

  it('nhắc bị lỡ khi tab bị treo được hiện khi tính lại', () => {
    const { scheduler, shown } = setup()
    scheduler.update([meeting], '08:00')
    scheduler.dispose()
    // Tab bị treo, timer không chạy; 20 phút sau tab được mở lại.
    vi.setSystemTime(new Date(START.getTime() + 20 * 60_000))
    scheduler.reschedule()
    expect(shown).toHaveLength(1)
    scheduler.dispose()
  })

  it('sự kiện cả ngày ngày mai nhắc lúc 8:00, tính lại sau mỗi 12 giờ', () => {
    const { scheduler, shown } = setup()
    const giỗ = makeEvent({
      id: 'gio',
      date: '2026-09-25',
      reminders: [{ offsetMinutes: 24 * 60, channel: 'notification' }],
    })
    scheduler.update([giỗ], '08:00')
    // 24/9 8:00 = 22 giờ nữa, nằm trong khoảng 24 giờ đầu.
    vi.advanceTimersByTime(22 * 3600_000)
    expect(shown.map((i) => i.date)).toEqual(['2026-09-25'])
    scheduler.dispose()
  })

  it('nhắc ngoài 24 giờ được đặt ở lần tính lại định kỳ', () => {
    const { scheduler, shown } = setup()
    const later = makeEvent({
      id: 'later',
      date: '2026-09-26',
      reminders: [{ offsetMinutes: 0, channel: 'notification' }],
    })
    scheduler.update([later], '08:00')
    // 26/9 8:00 là 70 giờ nữa.
    vi.advanceTimersByTime(69 * 3600_000)
    expect(shown).toHaveLength(0)
    vi.advanceTimersByTime(3600_000)
    expect(shown).toHaveLength(1)
    scheduler.dispose()
  })
})
