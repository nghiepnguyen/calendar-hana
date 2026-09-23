import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSettings } from '../../data/defaultCategories'
import { freezeNow, makeEvent, occurrencesOf, viewProps } from '../../test/fixtures'
import { DayView } from './DayView'

beforeEach(() => freezeNow())
afterEach(() => vi.useRealTimers())

describe('DayView', () => {
  it('hiện thẻ ngày có ngày âm, Can Chi, hoàng đạo và giờ tốt', () => {
    render(<DayView {...viewProps()} />)
    const card = screen.getByRole('region', { name: 'Thông tin ngày' })
    expect(within(card).getByText('23')).toBeInTheDocument()
    expect(within(card).getByText('Thứ Tư')).toBeInTheDocument()
    expect(within(card).getByText('Hôm nay')).toBeInTheDocument()
    expect(within(card).getByText('13')).toBeInTheDocument()
    expect(within(card).getByText(/Tháng 8\s*âm lịch/)).toBeInTheDocument()
    expect(within(card).getByText('Năm Bính Ngọ')).toBeInTheDocument()
    expect(within(card).getByText('Đinh Dậu')).toBeInTheDocument()
    expect(within(card).getByText('Tiết Thu phân')).toBeInTheDocument()
    expect(within(card).getByText('Giờ hoàng đạo')).toBeInTheDocument()
    expect(within(card).getAllByRole('listitem').length).toBeGreaterThanOrEqual(6)
  })

  it('ẩn hoàng đạo và ngày lễ theo cài đặt', () => {
    const settings = { ...createDefaultSettings(''), showAuspicious: false, showHolidays: false }
    render(<DayView {...viewProps({ date: '2026-09-02', days: ['2026-09-02'], settings })} />)
    expect(screen.queryByText('Giờ hoàng đạo')).not.toBeInTheDocument()
    expect(screen.queryByText('Quốc khánh')).not.toBeInTheDocument()
  })

  it('hiện ngày lễ', () => {
    render(<DayView {...viewProps({ date: '2026-09-25', days: ['2026-09-25'] })} />)
    expect(screen.getByText('Tết Trung Thu')).toBeInTheDocument()
  })

  it('hiện sự kiện cả ngày và có giờ, bấm để mở chi tiết', async () => {
    const onOpenEvent = vi.fn()
    const events = [
      makeEvent({ title: 'Rằm tháng 8', allDay: true }),
      makeEvent({ title: 'Họp team', allDay: false, startTime: '09:00', endTime: '10:00' }),
    ]
    render(
      <DayView
        {...viewProps({
          occurrences: occurrencesOf(events, '2026-09-23', '2026-09-23'),
          onOpenEvent,
        })}
      />,
    )
    expect(screen.getByText('Cả ngày')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Họp team, 9:00-10:00/ }))
    expect(onOpenEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ title: 'Họp team' }) }),
    )
  })

  it('báo khi chưa có sự kiện', () => {
    render(<DayView {...viewProps()} />)
    expect(screen.getByText(/Chưa có sự kiện nào/)).toBeInTheDocument()
  })
})
