import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { DailyActivitySection } from './DailyActivitySection'

describe('daily activity modes', () => {
  it('merges empty factors and restores overview when selection clears', async () => {
    render(<DailyActivitySection date="2026-09-18" />)
    expect(screen.queryByRole('region', { name: 'Kết luận mục tiêu' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Việc không nên làm trong ngày' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
    await userEvent.click(screen.getByText(/^Hoạt động khác/))
    await userEvent.click(screen.getByRole('button', { name: 'Ký kết / Lập khế ước' }))
    const verdict = screen.getByRole('region', { name: 'Kết luận mục tiêu' })
    expect(verdict).toHaveTextContent('Chưa đủ dữ liệu')
    expect(screen.getByRole('note', { name: 'Yếu tố trong ngày' })).toHaveTextContent(
      'Chưa có yếu tố được tính điểm',
    )
    expect(screen.queryByRole('region', { name: 'Yếu tố thuận' })).not.toBeInTheDocument()
    expect(within(verdict).queryByRole('link')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Về tổng quan' }))
    expect(screen.queryByRole('region', { name: 'Kết luận mục tiêu' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Việc nên làm trong ngày' })).toBeInTheDocument()
  })
  it('treats a low-severity event without taboos as neutral instead of insufficient', async () => {
    // 18/09/2026 is Trực Khai: Hiệp Kỷ neither favours nor forbids haircuts on that day.
    render(<DailyActivitySection date="2026-09-18" />)
    await userEvent.click(screen.getByText(/^Hoạt động khác/))
    await userEvent.click(screen.getByRole('button', { name: 'Cắt tóc' }))
    const verdict = screen.getByRole('region', { name: 'Kết luận mục tiêu' })
    expect(verdict).toHaveTextContent('Cân nhắc')
    expect(verdict).toHaveTextContent('Không gặp ngày kỵ nào.')
    expect(screen.getByRole('note', { name: 'Yếu tố trong ngày' })).toHaveTextContent(
      'Không có yếu tố thuận hay bất lợi.',
    )
  })
})

it('merges a rule that touches several activities into one factor', async () => {
  // 05/10/2026, Cưới hỏi: Trực Bình and Thiên Lại hit both wedding and engagement.
  render(<DailyActivitySection date="2026-10-05" />)
  await userEvent.click(screen.getByRole('button', { name: 'Cưới hỏi' }))
  const unfavorable = screen.getByRole('region', { name: 'Yếu tố bất lợi' })
  expect(within(unfavorable).getAllByText('Trực Bình')).toHaveLength(1)
  expect(within(unfavorable).getAllByText('Thiên Lại')).toHaveLength(1)
  expect(screen.queryByText(/Đánh giá theo Trực/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Chưa đánh giá đầy đủ/)).not.toBeInTheDocument()
})
