import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { weekDays } from '../../calendar/range'
import { freezeNow, makeEvent, occurrencesOf, viewProps } from '../../test/fixtures'
import { WeekView } from './WeekView'

beforeEach(() => freezeNow())
afterEach(() => vi.useRealTimers())

describe('WeekView', () => {
  const days = weekDays('2026-09-23', 1)

  it('hiện 7 ngày từ Thứ Hai, có ngày âm, đánh dấu hôm nay', () => {
    render(<WeekView {...viewProps({ days })} />)
    const heads = screen.getAllByRole('button', { name: /Mở xem ngày/ })
    expect(heads).toHaveLength(7)
    expect(heads[0]).toHaveAccessibleName(/^Thứ Hai, 21 tháng 9 năm 2026, ngày 11 tháng 8 âm lịch/)
    expect(heads[2]).toHaveAttribute('aria-current', 'date')
    // Trung Thu 25/9/2026.
    expect(screen.getByText('Tết Trung Thu')).toBeInTheDocument()
  })

  it('bấm đầu cột để mở xem Ngày', async () => {
    const onOpenDay = vi.fn()
    render(<WeekView {...viewProps({ days, onOpenDay })} />)
    await userEvent.click(screen.getAllByRole('button', { name: /Mở xem ngày/ })[4])
    expect(onOpenDay).toHaveBeenCalledWith('2026-09-25')
  })

  it('hiện sự kiện lặp hằng tuần', () => {
    const event = makeEvent({
      title: 'Họp team',
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      recurrence: { freq: 'weekly', calendar: 'solar' },
    })
    render(
      <WeekView {...viewProps({ days, occurrences: occurrencesOf([event], days[0], days[6]) })} />,
    )
    expect(screen.getAllByRole('button', { name: /Họp team/ })).toHaveLength(1)
  })
})
