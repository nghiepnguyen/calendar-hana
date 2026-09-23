import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('chọn theo dương lịch, hiện ngày âm quy đổi', async () => {
    const onSelect = vi.fn()
    render(<DatePicker value="2026-09-23" onSelect={onSelect} onClose={vi.fn()} />)
    expect(screen.getByText('Tức ngày 13/8 âm lịch')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ngày dương lịch'), { target: { value: '2026-09-25' } })
    expect(screen.getByText('Tức ngày 15/8 âm lịch')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Đến ngày này' }))
    expect(onSelect).toHaveBeenCalledWith('2026-09-25')
  })

  it('chọn theo âm lịch, có tháng nhuận, hiện ngày dương quy đổi', async () => {
    const onSelect = vi.fn()
    render(<DatePicker value="2025-07-01" onSelect={onSelect} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Âm lịch' }))
    // 2025 nhuận tháng 6.
    await userEvent.selectOptions(screen.getByLabelText('Tháng'), 'Tháng 6 nhuận')
    await userEvent.selectOptions(screen.getByLabelText('Ngày'), '1')
    expect(screen.getByText('Tức Thứ Sáu, 25/7/2025')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Đến ngày này' }))
    expect(onSelect).toHaveBeenCalledWith('2025-07-25')
  })

  it('báo ngày 30 ở tháng thiếu và không cho chọn', async () => {
    render(<DatePicker value="2026-09-23" onSelect={vi.fn()} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Âm lịch' }))
    // Tìm một tháng âm năm 2026 chỉ có 29 ngày.
    await userEvent.selectOptions(screen.getByLabelText('Ngày'), '30')
    for (const option of ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6']) {
      await userEvent.selectOptions(screen.getByLabelText('Tháng'), option)
      if (screen.queryByText(/chỉ có 29 ngày/)) break
    }
    expect(screen.getByText('Tháng này chỉ có 29 ngày.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đến ngày này' })).toBeDisabled()
  })

  it('đóng khi bấm Esc', async () => {
    const onClose = vi.fn()
    render(<DatePicker value="2026-09-23" onSelect={vi.fn()} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
