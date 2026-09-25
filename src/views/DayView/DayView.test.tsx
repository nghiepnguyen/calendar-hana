import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSettings } from '../../data/defaultCategories'
import { freezeNow, makeEvent, occurrencesOf, viewProps } from '../../test/fixtures'
import { DayView } from './DayView'

beforeEach(() => freezeNow())
afterEach(() => vi.useRealTimers())

describe('DayView', () => {
  it('hiện thẻ ngày có ngày âm, Can Chi, hoàng đạo', () => {
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
    expect(within(card).getByText('Ngày hoàng đạo')).toBeInTheDocument()
    // Giờ tốt đã chuyển sang khối Lịch vạn niên.
    expect(within(card).queryByText('Giờ hoàng đạo')).not.toBeInTheDocument()
  })

  it('khối Lịch vạn niên nằm sau danh sách sự kiện', () => {
    render(<DayView {...viewProps()} />)
    const events = screen.getByRole('region', { name: 'Sự kiện trong ngày' })
    const almanac = screen.getByRole('region', { name: 'Lịch vạn niên' })
    expect(events.compareDocumentPosition(almanac) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(almanac).getAllByRole('listitem', { name: /^Giờ / })).toHaveLength(12)
  })

  it('ẩn hoàng đạo và ngày lễ theo cài đặt', () => {
    const settings = { ...createDefaultSettings(''), showAuspicious: false, showHolidays: false }
    render(<DayView {...viewProps({ date: '2026-09-02', days: ['2026-09-02'], settings })} />)
    expect(screen.queryByText(/Ngày (hoàng|hắc) đạo/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Lịch vạn niên' })).not.toBeInTheDocument()
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
    const list = screen.getByRole('region', { name: 'Sự kiện trong ngày' })
    expect(within(list).getByRole('button', { name: /^Rằm tháng 8, Cả ngày/ })).toBeInTheDocument()
    await userEvent.click(within(list).getByRole('button', { name: /^Họp team, 9:00 – 10:00/ }))
    expect(onOpenEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ title: 'Họp team' }) }),
    )
  })

  it('báo khi chưa có sự kiện', () => {
    render(<DayView {...viewProps()} />)
    expect(screen.getByText(/Chưa có sự kiện nào/)).toBeInTheDocument()
  })
})
