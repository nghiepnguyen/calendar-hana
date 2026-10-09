import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { freezeNow } from '../../test/fixtures'
import { AlmanacPanel } from './AlmanacPanel'
import { hourIndexAt } from './hourIndex'

afterEach(() => vi.useRealTimers())

describe('AlmanacPanel', () => {
  it('shows Vietnamese crossing time only on the transition day', () => {
    const { unmount } = render(<AlmanacPanel date="2026-09-07" isToday={false} />)
    expect(screen.getByText(/Bắt đầu lúc \d{2}:\d{2} · giờ Việt Nam/)).toBeInTheDocument()
    unmount()
    render(<AlmanacPanel date="2026-09-08" isToday={false} />)
    expect(screen.queryByText(/Bắt đầu lúc/)).not.toBeInTheDocument()
  })

  it('hiện đủ thông tin ngày mẫu 25/9/2026', () => {
    render(<AlmanacPanel date="2026-09-25" isToday={false} />)
    const panel = screen.getByRole('region', { name: 'Lịch vạn niên' })
    for (const text of ['Thu phân', 'Kim Bạch Kim', 'Hung Tú', 'Ngưu (Trâu)']) {
      expect(within(panel).getByText(text)).toBeInTheDocument()
    }
    // directions-authority-v1: ngày Nhâm có cả Hỷ Thần và Tài Thần cùng hướng Nam.
    // Dùng getAllByText để không giả định direction values phải unique trong panel.
    expect(within(panel).getAllByText('Nam')).toHaveLength(2)
    // Can Chi ngày ở đầu khối (giờ Dần của ngày này cũng là Nhâm Dần).
    expect(within(panel).getAllByText('Nhâm Dần')[0].closest('p')).toHaveTextContent(
      'Ngày Nhâm Dần',
    )
    const dayClashes = within(panel).getByRole('list', { name: 'Tuổi xung ngày' })
    expect(
      within(dayClashes)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Canh Thân', 'Bính Thân', 'Bính Dần'])
    expect(within(panel).getByText(/Can sinh Chi \(Thủy sinh Mộc\)/)).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: /^Sao Ngưu, Hung Tú/ })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: /^Trực Chấp, tốt/ })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Thiên Đức' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Hoàng Sa' })).toBeInTheDocument()

    const hours = within(panel).getAllByRole('listitem', { name: /^Giờ / })
    expect(hours).toHaveLength(12)
    expect(hours.filter((h) => h.getAttribute('aria-label')?.includes('giờ tốt'))).toHaveLength(6)
    expect(hours[0]).toHaveAccessibleName('Giờ Tý, 23 giờ đến 1 giờ, Canh Tý, Thanh Long, giờ tốt')
  })

  it('đánh dấu giờ hiện tại khi xem hôm nay', () => {
    freezeNow('2026-09-25T03:00:00Z') // 10h sáng giờ Việt Nam: giờ Tỵ
    render(<AlmanacPanel date="2026-09-25" isToday />)
    const now = screen.getByRole('listitem', { current: 'time' })
    expect(now).toHaveAccessibleName(/^Giờ Tỵ, .*bây giờ$/)
  })

  it('không đánh dấu giờ nào khi xem ngày khác hôm nay', () => {
    freezeNow('2026-09-25T03:00:00Z')
    render(<AlmanacPanel date="2026-09-26" isToday={false} />)
    expect(screen.queryByRole('listitem', { current: 'time' })).not.toBeInTheDocument()
  })

  it('bấm chip sao mở giải thích, Esc đóng và trả focus về chip', async () => {
    const user = userEvent.setup()
    render(<AlmanacPanel date="2026-09-25" isToday={false} />)
    const chip = screen.getByRole('button', { name: 'Thiên Đức' })
    await user.click(chip)
    expect(screen.getByRole('dialog', { name: 'Sao Thiên Đức' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Sao Thiên Đức' })).not.toBeInTheDocument()
    expect(chip).toHaveFocus()
  })

  it('bấm trực mở hộp có Nên làm / Nên kiêng', async () => {
    const user = userEvent.setup()
    render(<AlmanacPanel date="2026-09-25" isToday={false} />)
    await user.click(screen.getByRole('button', { name: /^Trực Chấp, tốt/ }))
    const dialog = screen.getByRole('dialog', { name: 'Trực Chấp' })
    expect(within(dialog).getByText('Nên làm')).toBeInTheDocument()
    expect(within(dialog).getByText('Nên kiêng')).toBeInTheDocument()
  })
})

describe('hourIndexAt', () => {
  it('phút 0 thuộc giờ 0', () => expect(hourIndexAt(0)).toBe(0))
  it('phút 59 thuộc giờ 0', () => expect(hourIndexAt(59)).toBe(0))
  it('phút 60 thuộc giờ 1', () => expect(hourIndexAt(60)).toBe(1))
  it('phút 600 thuộc giờ 5', () => expect(hourIndexAt(600)).toBe(5))
  it('phút 1379 thuộc giờ 11', () => expect(hourIndexAt(1379)).toBe(11))
  it('phút 1380 thuộc giờ 0', () => expect(hourIndexAt(1380)).toBe(0))
})
