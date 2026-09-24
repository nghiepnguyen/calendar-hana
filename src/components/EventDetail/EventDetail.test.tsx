import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeEvent, occurrencesOf } from '../../test/fixtures'
import { EventDetail } from './EventDetail'

function renderDetail(location: string) {
  const event = makeEvent({ title: 'Cà phê', location })
  const [occurrence] = occurrencesOf([event], '2026-09-23', '2026-09-23')
  render(
    <EventDetail
      occurrence={occurrence}
      baseEvent={event}
      category={undefined}
      allDayReminderTime="08:00"
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onClose={vi.fn()}
    />,
  )
}

describe('EventDetail', () => {
  it('link bản đồ trong địa điểm bấm được, mở tab mới', () => {
    renderDetail('Quán Ngon https://maps.app.goo.gl/abc123')
    const link = screen.getByRole('link', { name: 'Google Maps' })
    expect(link).toHaveAttribute('href', 'https://maps.app.goo.gl/abc123')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(/Quán Ngon/)).toBeInTheDocument()
  })

  it('địa điểm không có link thì chỉ là chữ', () => {
    renderDetail('Nhà văn hoá quận')
    expect(screen.getByText('Nhà văn hoá quận')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
