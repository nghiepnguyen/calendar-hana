import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { DayView } from './DayView'
import { viewProps } from '../../test/fixtures'
import { createDefaultSettings } from '../../data/defaultCategories'
import { sanitizeSettings } from '../../data/exportImport'

function props(birthDate: string | null = '1990-07-01') {
  return viewProps({ settings: { ...createDefaultSettings(''), birthDate } })
}
describe('personal panel integration', () => {
  it('keeps event → personal → almanac order and independent toggles', () => {
    const p = props()
    const { rerender } = render(<DayView {...p} />)
    const personal = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    expect(within(personal).getByRole('link', { name: 'Sửa thông tin sinh' })).toHaveAttribute(
      'href',
      '/settings#birth-info',
    )
    expect(
      screen.getByRole('region', { name: 'Sự kiện trong ngày' }).compareDocumentPosition(personal) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      personal.compareDocumentPosition(screen.getByRole('region', { name: 'Lịch vạn niên' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    rerender(<DayView {...p} settings={{ ...p.settings, showAuspicious: false }} />)
    expect(screen.getByRole('region', { name: 'Phong thủy cá nhân' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Lịch vạn niên' })).not.toBeInTheDocument()
    rerender(<DayView {...p} settings={{ ...p.settings, showPersonalFengShui: false }} />)
    expect(screen.queryByRole('region', { name: 'Phong thủy cá nhân' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Lịch vạn niên' })).toBeInTheDocument()
  })
  it('preserves false in JSON and defaults old settings to enabled', () => {
    expect(createDefaultSettings('').showPersonalFengShui).toBe(true)
    expect(sanitizeSettings({ showPersonalFengShui: false })).toEqual({
      showPersonalFengShui: false,
    })
    expect(sanitizeSettings({ showPersonalFengShui: 'false' })).toEqual({})
  })
  it('requires explicit role, leaves the day rating unchanged and clears saved birth results', async () => {
    const p = props()
    const { rerender } = render(<DayView {...p} />)
    const personal = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    const label = within(personal).getByTestId('personal-day-summary').textContent
    const annual = within(personal).getByRole('region', { name: 'Hạn theo năm' })
    expect(within(annual).getByText(/Tuổi mụ: 37/)).toBeInTheDocument()
    await userEvent.selectOptions(
      within(annual).getByLabelText('Mục đích xem hạn năm'),
      'construction',
    )
    expect(within(annual).getByLabelText('Vai trò của bạn')).toHaveValue('unspecified')
    expect(within(annual).getAllByText('Chưa đủ dữ liệu')).toHaveLength(3)
    await userEvent.selectOptions(within(annual).getByLabelText('Vai trò của bạn'), 'owner')
    expect(within(annual).getByText('Tứ Tấn Tài')).toBeInTheDocument()
    expect(within(personal).getByTestId('personal-day-summary').textContent).toBe(label)
    await userEvent.selectOptions(within(annual).getByLabelText('Mục đích xem hạn năm'), 'general')
    expect(within(annual).getByLabelText('Vai trò của bạn')).toHaveValue('self')
    await userEvent.selectOptions(within(annual).getByLabelText('Mục đích xem hạn năm'), 'repair')
    expect(within(annual).getAllByText('Chưa hỗ trợ')).toHaveLength(3)
    rerender(<DayView {...p} settings={{ ...p.settings, birthDate: null }} />)
    expect(screen.getByLabelText('Mục đích xem hạn năm')).toHaveValue('general')
    expect(screen.getByLabelText('Vai trò của bạn')).toHaveValue('self')
    expect(screen.queryByTestId('personal-day-summary')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tuổi mụ: 37/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nhập ngày sinh' })).toHaveAttribute(
      'href',
      '/settings#birth-info',
    )
  })
  it('distinguishes invalid data and shows all 12 hours with split Ty interval', () => {
    const p = props()
    const { rerender } = render(<DayView {...p} />)
    const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    expect(within(panel).getByText('00:00–01:00 và 23:00–24:00')).toBeInTheDocument()
    expect(within(panel).getByText(/^Ưu tiên:/).parentElement).toHaveTextContent('05:00–07:00')
    expect(
      within(panel)
        .getAllByRole('listitem', { hidden: true })
        .filter((n) => n.getAttribute('data-personal-hour') !== null),
    ).toHaveLength(12)
    rerender(<DayView {...props('1990-02-30')} />)
    expect(screen.getByText('Ngày sinh không hợp lệ. Hãy sửa trong Cài đặt.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sửa ngày sinh' })).toBeInTheDocument()
  })
})

it('refreshes year at Tet and birth profile independently of the hour or day summary', () => {
  const p = props('2000-02-04')
  const { rerender } = render(<DayView {...p} date="2026-02-16" />)
  expect(screen.getByText(/Năm âm lịch đang xem: 2025 · Tuổi mụ: 27/)).toBeInTheDocument()
  rerender(<DayView {...p} date="2026-02-17" />)
  expect(screen.getByText(/Năm âm lịch đang xem: 2026 · Tuổi mụ: 28/)).toBeInTheDocument()
  rerender(<DayView {...props('1990-07-01')} date="2026-02-17" />)
  expect(screen.getByText(/Năm âm lịch đang xem: 2026 · Tuổi mụ: 37/)).toBeInTheDocument()
})

it('shows reviewed stem clash separately and does not duplicate common stars', () => {
  const p = props('1993-07-01')
  render(<DayView {...p} date="2026-09-20" />)
  const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
  const extended = within(panel).getByRole('region', { name: 'Quan hệ cá nhân mở rộng' })
  expect(within(extended).getByText('Thiên can xung')).toBeInTheDocument()
  expect(within(extended).getByText(/Can ngày Đinh xung với Can tuổi Quý/)).toBeInTheDocument()
  expect(within(extended).getByText(/không làm đổi kết luận ngày/)).toBeInTheDocument()
  expect(within(panel).getByTestId('personal-day-summary')).toHaveTextContent('Có yếu tố cần lưu ý')
  expect(within(extended).getByText(/Thụ Tử và Sát Chủ vẫn là sao chung/)).toBeInTheDocument()
  expect(within(extended).queryByText('Thái Tuế')).not.toBeInTheDocument()
})
