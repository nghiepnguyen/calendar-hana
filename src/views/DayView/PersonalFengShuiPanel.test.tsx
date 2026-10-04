import { screen, within } from '@testing-library/react'
import { render } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/authContext'
import { DayView } from './DayView'
import { findNextGoodEventDate } from '@shared/lunar/eventRecommendations'
import { viewProps } from '../../test/fixtures'
import { createDefaultSettings } from '../../data/defaultCategories'
import { sanitizeSettings } from '../../data/exportImport'

function props(birthDate: string | null = '1990-07-01') {
  return viewProps({ settings: { ...createDefaultSettings(''), birthDate } })
}
describe('personal panel integration', () => {
  it('finds the next good date for a selected event', () => {
    expect(findNextGoodEventDate('2026-09-23', 'cut_hair', 30)).toBeTruthy()
    expect(findNextGoodEventDate('2026-09-23', 'cut_hair', 30)).not.toBe('2026-09-23')
  })

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
  it('shows the annual overview and clears saved birth results', async () => {
    const p = props()
    const { rerender } = render(<DayView {...p} />)
    const personal = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    const label = within(personal).getByTestId('personal-day-summary').textContent
    const annual = within(personal).getByRole('region', { name: 'Hạn theo năm' })
    expect(within(annual).getByText(/tuổi mụ 37/)).toBeInTheDocument()
    expect(within(annual).getByText('Yếu tố vận hạn')).toBeInTheDocument()
    expect(within(annual).getByText('Sao chiếu mệnh')).toBeInTheDocument()
    expect(within(annual).queryByText('Lời khuyên hành sự trong năm')).not.toBeInTheDocument()
    expect(within(annual).getByRole('radio', { name: 'Nam mạng' })).toBeChecked()
    expect(within(annual).getByText('La Hầu')).toBeInTheDocument()
    expect(within(annual).getByRole('radio', { name: 'Nữ mạng' })).not.toBeChecked()
    await userEvent.click(within(annual).getByRole('radio', { name: 'Nữ mạng' }))
    expect(within(annual).getByRole('radio', { name: 'Nữ mạng' })).toBeChecked()
    expect(within(annual).getByText('Kế Đô')).toBeInTheDocument()
    expect(within(personal).getByTestId('personal-day-summary').textContent).toBe(label)
    rerender(<DayView {...p} settings={{ ...p.settings, birthDate: null }} />)
    // Chưa có ngày sinh: ẩn toàn bộ kết quả, chỉ còn lời mời nhập.
    expect(screen.queryByRole('region', { name: 'Hạn theo năm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tứ Trụ theo giờ sinh' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('personal-day-summary')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tuổi mụ: 37/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nhập ngày sinh' })).toHaveAttribute(
      'href',
      '/settings#birth-info',
    )
  })
  it('keeps the hour result concise and links to the separate explanation page', () => {
    const p = props()
    const { rerender } = render(<DayView {...p} />)
    const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    expect(within(panel).getByLabelText('Giờ ưu tiên')).toHaveTextContent('05:00–07:00')
    expect(within(panel).queryByText('Xem đủ 12 giờ và lý do')).not.toBeInTheDocument()
    expect(
      within(panel).getByRole('link', { name: 'Tìm hiểu cách tính và nguồn tham khảo' }),
    ).toHaveAttribute('href', '/settings#feng-shui-guide')
    rerender(<DayView {...props('1990-02-30')} />)
    expect(screen.getByText('Ngày sinh không hợp lệ. Hãy sửa trong Cài đặt.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sửa ngày sinh' })).toBeInTheDocument()
  })

  it('prioritizes the personal-day summary with labeled relation cards and compact hour groups', () => {
    render(<DayView {...props()} />)
    const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    expect(within(panel).getByLabelText('Tóm tắt ngày cá nhân')).toBeInTheDocument()
    expect(within(panel).getByLabelText('Quan hệ Địa chi')).toBeInTheDocument()
    expect(within(panel).getByLabelText('Quan hệ Thiên can')).toBeInTheDocument()
    expect(within(panel).getByLabelText('Quan hệ Nạp âm')).toBeInTheDocument()
    expect(within(panel).getByLabelText('Giờ cá nhân trong ngày')).toBeInTheDocument()
    const personalHours = within(panel).getByLabelText('Giờ cá nhân trong ngày')
    const recommendations = within(panel).getByRole('region', {
      name: 'Việc nên làm trong ngày',
    })
    expect(personalHours.compareDocumentPosition(recommendations) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      within(panel).queryByText('Đang xem theo tuổi và nạp âm năm sinh'),
    ).not.toBeInTheDocument()
  })

  it('filters activity boxes by selected event', async () => {
    render(<DayView {...props()} />)
    const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
    const selector = within(panel).getByRole('combobox', { name: 'Mục tiêu trong ngày' })
    expect(selector).toHaveValue('')
    await userEvent.selectOptions(selector, 'open_business')
    expect(selector).toHaveValue('open_business')
    expect(within(panel).getByRole('region', { name: 'Việc nên làm trong ngày' })).toBeInTheDocument()
    expect(within(panel).getByRole('region', { name: 'Kết luận mục tiêu' })).toHaveTextContent(
      /Event đang chọn:\s*Khai trương/,
    )
    expect(within(panel).getByRole('region', { name: 'Kết luận mục tiêu' })).toHaveTextContent(
      /Nên làm|Không nên làm|Cân nhắc/,
    )
    expect(within(panel).getByRole('region', { name: 'Kết luận mục tiêu' })).not.toHaveTextContent('Có ít nhất một hoạt động')
  })
})

it('refreshes year at Tet and birth profile independently of the hour or day summary', () => {
  const p = props('2000-02-04')
  const { rerender } = render(<DayView {...p} date="2026-02-16" />)
  expect(screen.getByText(/Năm âm lịch 2025, tuổi mụ 27/)).toBeInTheDocument()
  rerender(<DayView {...p} date="2026-02-17" />)
  expect(screen.getByText(/Năm âm lịch 2026, tuổi mụ 28/)).toBeInTheDocument()
  rerender(<DayView {...props('1990-07-01')} date="2026-02-17" />)
  expect(screen.getByText(/Năm âm lịch 2026, tuổi mụ 37/)).toBeInTheDocument()
})

it('shows reviewed stem clash separately and does not duplicate common stars', () => {
  const p = props('1993-07-01')
  render(<DayView {...p} date="2026-09-20" />)
  const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
  const extended = within(panel).getByRole('region', { name: 'Quan hệ cá nhân mở rộng' })
  expect(within(extended).getByText('Thiên can xung')).toBeInTheDocument()
  expect(within(extended).getByText(/Can ngày Đinh xung với Can tuổi Quý/)).toBeInTheDocument()
  expect(within(panel).getByTestId('personal-day-summary')).toHaveTextContent('Có yếu tố cần lưu ý')
  expect(within(extended).queryByText(/Thụ Tử và Sát Chủ vẫn là sao chung/)).not.toBeInTheDocument()
})

it('shows four pillars only from a complete saved birth profile', () => {
  const p = props('2024-02-04')
  render(
    <DayView
      {...p}
      settings={{
        ...p.settings,
        birthDate: '2024-02-04',
        birthTime: '15:30',
        birthTimePrecision: 'exact',
        birthTimeUncertaintyMinutes: 0,
        birthPlace: {
          countryCode: 'VN',
          subdivisionCode: 'VN-SG',
          label: 'TP. Hồ Chí Minh',
          latitude: 10.76,
          longitude: 106.66,
          coordinateSource: 'bundledGazetteer',
          coordinateAccuracyKm: 10,
        },
        birthTimezoneId: 'Asia/Ho_Chi_Minh',
        birthTimezoneSource: 'bundledMapping',
        birthConfirmedOffsetMinutes: null,
        birthZiPolicy: 'splitZi',
      }}
    />,
  )
  const bazi = screen.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })
  // Can và Chi là hai chữ riêng (mỗi chữ một màu ngũ hành) nên kiểm theo nội dung ô.
  expect(bazi).toHaveTextContent('Giáp Thìn')
  expect(bazi).toHaveTextContent('Bính Dần')
  expect(within(bazi).getAllByText(/TST/).length).toBeGreaterThan(0)
  expect(within(bazi).queryByText(/Astronomy Engine 2.1.19/)).not.toBeInTheDocument()
  const insight = within(bazi).getByRole('region', { name: 'Nhật Nguyên và ngũ hành' })
  expect(within(insight).getByText('Nhật Nguyên')).toBeInTheDocument()
  const counts = within(
    within(insight).getByRole('list', { name: 'Số chữ theo ngũ hành' }),
  ).getAllByRole('listitem')
  expect(counts.map((item) => item.textContent?.match(/^(\d)/)?.[1])).toHaveLength(5)
  expect(
    counts.reduce((sum, item) => sum + Number(item.textContent?.match(/^(\d)/)?.[1] ?? 0), 0),
  ).toBe(8)
  const strength = within(insight).getByRole('region', { name: 'Độ vượng suy' })
  expect(strength).toHaveTextContent(/Thân (Vượng|Nhược)/)
  expect(strength).toHaveTextContent(/\d+\/100/)
})

it('shows only the birth invite without a profile and offers sign-in to guests', () => {
  const auth = (signedIn: boolean): AuthContextValue => ({
    available: true,
    loading: false,
    user: signedIn ? { uid: 'a', email: null, displayName: null, photoURL: null } : null,
    signIn: async () => {},
    signOut: async () => {},
    deleteAccount: async () => {},
  })
  const p = props(null)
  const { rerender } = render(
    <AuthContext.Provider value={auth(false)}>
      <DayView {...p} />
    </AuthContext.Provider>,
  )
  const panel = screen.getByRole('region', { name: 'Phong thủy cá nhân' })
  expect(within(panel).getByRole('link', { name: 'Nhập ngày sinh' })).toHaveAttribute(
    'href',
    '/settings#birth-info',
  )
  expect(within(panel).getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
    'href',
    '/settings#account',
  )
  expect(within(panel).queryByRole('region', { name: 'Hạn theo năm' })).not.toBeInTheDocument()
  expect(within(panel).queryByRole('link', { name: /Tìm hiểu cách tính/ })).not.toBeInTheDocument()
  rerender(
    <AuthContext.Provider value={auth(true)}>
      <DayView {...p} />
    </AuthContext.Provider>,
  )
  expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Nhập ngày sinh' })).toBeInTheDocument()
})
