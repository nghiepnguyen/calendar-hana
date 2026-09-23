import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { monthGridDays } from '../../calendar/range'
import { freezeNow, makeEvent, occurrencesOf, viewProps } from '../../test/fixtures'
import { MonthView } from './MonthView'

beforeEach(() => freezeNow())
afterEach(() => vi.useRealTimers())

const days = monthGridDays('2026-09-23', 1)

describe('MonthView', () => {
  it('hiện lưới 42 ô, mùng 1 âm có kèm tháng, có ngày lễ', () => {
    render(<MonthView {...viewProps({ days })} />)
    const dayButtons = screen.getAllByRole('button', { name: /âm lịch/ })
    expect(dayButtons.filter((b) => !/^Tạo/.test(b.getAttribute('aria-label') ?? ''))).toHaveLength(
      42,
    )
    // Mùng 1 tháng 8 âm là 11/9/2026.
    expect(screen.getByText('1/8')).toBeInTheDocument()
    expect(screen.getByText('Quốc khánh')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Thứ Tư, 23 tháng 9/ })).toHaveAttribute(
      'aria-current',
      'date',
    )
  })

  it('hiện tối đa 3 sự kiện và "+N"', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ title: `Việc ${i + 1}`, date: '2026-09-10' }),
    )
    render(
      <MonthView {...viewProps({ days, occurrences: occurrencesOf(events, days[0], days[41]) })} />,
    )
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Việc 1/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Việc 4/ })).not.toBeInTheDocument()
  })

  it('bấm vào ngày để mở xem Ngày, nút + để tạo sự kiện', async () => {
    const onOpenDay = vi.fn()
    const onCreate = vi.fn()
    render(<MonthView {...viewProps({ days, onOpenDay, onCreate })} />)
    await userEvent.click(screen.getByRole('button', { name: /^Thứ Sáu, 25 tháng 9/ }))
    expect(onOpenDay).toHaveBeenCalledWith('2026-09-25')
    await userEvent.click(screen.getByRole('button', { name: /^Tạo sự kiện ngày Thứ Sáu, 25/ }))
    expect(onCreate).toHaveBeenCalledWith('2026-09-25')
  })

  it('bắt đầu tuần từ Chủ nhật theo cài đặt', () => {
    const settings = { ...viewProps().settings, weekStartsOn: 0 as const }
    const { container } = render(
      <MonthView {...viewProps({ days: monthGridDays('2026-09-23', 0), settings })} />,
    )
    const header = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(within(header).getAllByText(/^(CN|T\d)$/)[0]).toHaveTextContent('CN')
  })
})
