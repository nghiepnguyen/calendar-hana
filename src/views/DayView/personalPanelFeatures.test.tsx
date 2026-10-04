import { screen, within } from '@testing-library/react'
import { render } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Occurrence } from '@shared/recurrence/recurrence'
import { createDefaultSettings } from '../../data/defaultCategories'
import { PersonalFengShuiPanel } from './PersonalFengShuiPanel'

const settings = (extra = {}) => ({
  ...createDefaultSettings(''),
  birthDate: '1990-07-01',
  ...extra,
})

function at(vietnamTime: string) {
  // Giờ Việt Nam UTC+7 ngày 23/9/2026.
  vi.setSystemTime(new Date(`2026-09-23T${vietnamTime}:00+07:00`))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('personal panel features', () => {
  it('shows personal Thái Tuế and Tam Sát results inside the annual section', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const annual = screen.getByRole('region', { name: 'Hạn theo năm' })
    const afflictions = within(annual).getByRole('region', { name: 'Phạm theo tuổi' })
    expect(afflictions).toHaveTextContent('Trực Thái Tuế')
    expect(afflictions).toHaveTextContent('Tự Hình Thái Tuế')
    expect(afflictions).toHaveTextContent('Không phạm Tuế Phá')
    expect(afflictions).toHaveTextContent('Không phạm Tam Sát')
  })

  it('shows Sát Chủ separately as a day rule rather than an age rule', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2023-07-21" settings={settings()} />)
    const satChu = screen.getByRole('region', { name: 'Sát Chủ của ngày' })
    expect(satChu).toHaveTextContent('Sát Chủ Dương')
    expect(satChu).toHaveTextContent('tính theo ngày, không theo tuổi')
    expect(
      within(screen.getByRole('region', { name: 'Phạm theo tuổi' })).queryByText(/Sát Chủ/),
    ).not.toBeInTheDocument()
  })

  it('uses the saved gender for the annual view', () => {
    at('10:00')
    render(
      <PersonalFengShuiPanel date="2026-09-23" settings={settings({ birthGender: 'female' })} />,
    )
    const annual = screen.getByRole('region', { name: 'Hạn theo năm' })
    expect(within(annual).getByRole('radio', { name: 'Nữ mạng' })).toBeChecked()
    expect(within(annual).getByText('Kế Đô')).toBeInTheDocument()
    expect(within(annual).queryByRole('link', { name: /Lưu giới tính/ })).not.toBeInTheDocument()
  })

  it('suggests saving gender when the profile has none', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    expect(screen.getByRole('link', { name: 'Lưu giới tính trong hồ sơ sinh' })).toHaveAttribute(
      'href',
      '/settings#birth-info',
    )
  })

  it('states the deciding factor in the summary', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    expect(screen.getByRole('region', { name: 'Tóm tắt ngày cá nhân' })).toHaveTextContent(
      'Vì Địa chi xung tuổi (Ngọ xung Tý).',
    )
  })

  it('opens an explanation for a relation tile', async () => {
    at('10:00')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    await user.click(screen.getByRole('button', { name: 'Giải thích Địa chi' }))
    const dialog = screen.getByRole('dialog', { name: 'Địa chi' })
    expect(dialog).toHaveTextContent('Lưu ý')
    expect(dialog).toHaveTextContent(/lục xung/)
  })

  it('opens an explanation for an annual factor', async () => {
    at('10:00')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    await user.click(screen.getByRole('button', { name: 'Giải thích Hạn Kim Lâu' }))
    expect(screen.getByRole('dialog', { name: 'Hạn Kim Lâu' })).toHaveTextContent(/chia 9/)
  })

  it('marks the current hour when viewing today', () => {
    at('05:30') // giờ Mão, nhóm ưu tiên của tuổi Canh Ngọ ngày Canh Tý
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const priority = screen.getByLabelText('Giờ ưu tiên')
    const now = within(priority).getByText('Bây giờ').closest('li')!
    expect(now).toHaveTextContent('Mão')
    expect(now).toHaveAttribute('aria-current', 'time')
  })

  it('says when the current hour is not a personal hour, and only for today', () => {
    at('10:00') // giờ Tỵ, không hợp tuổi
    const { rerender } = render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    expect(screen.getByText('Bây giờ là giờ Tỵ, không nằm trong giờ hợp tuổi.')).toBeInTheDocument()
    rerender(<PersonalFengShuiPanel date="2026-09-24" settings={settings()} />)
    expect(screen.queryByText(/^Bây giờ/)).not.toBeInTheDocument()
  })

  it('notes timed events that fall in an hour that does not suit the profile', () => {
    at('10:00')
    const occurrence = (title: string, startTime?: string) =>
      ({ event: { title, allDay: !startTime, startTime } }) as unknown as Occurrence
    render(
      <PersonalFengShuiPanel
        date="2026-09-23"
        settings={settings()}
        occurrences={[
          occurrence('Họp tổ', '10:00'),
          occurrence('Ăn sáng', '05:30'),
          occurrence('Lễ'),
        ]}
      />,
    )
    const notes = screen.getByRole('list', { name: 'Sự kiện rơi vào giờ không hợp tuổi' })
    expect(within(notes).getAllByRole('listitem')).toHaveLength(1)
    expect(notes).toHaveTextContent('Họp tổ lúc 10:00 rơi vào giờ Tỵ')
  })

  it('renders annual details directly inside the outer disclosure', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const annual = screen.getByRole('region', { name: 'Hạn theo năm' })
    expect(within(annual).queryByRole('button', { name: /^Sao La Hầu/ })).not.toBeInTheDocument()
    expect(annual).toHaveTextContent('La Hầu')
  })

  it('hides Hạn tuổi until its rule is sourced, keeping the sourced star name', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const annual = screen.getByRole('region', { name: 'Hạn theo năm' })
    expect(within(annual).getByText('La Hầu')).toBeInTheDocument()
    expect(within(annual).queryByText('Hạn tuổi (Năm)')).not.toBeInTheDocument()
    expect(annual).not.toHaveTextContent('Hạn tuổi tạm ẩn trong lúc kiểm chứng nguồn.')
    expect(annual).not.toHaveTextContent('Đang xem theo Nam mạng.')
    expect(annual).not.toHaveTextContent(
      'Theo quan niệm lịch pháp truyền thống; chỉ dùng để tham khảo.',
    )
    expect(annual).not.toHaveTextContent(
      'Bảng Sát Chủ dân gian; không khẳng định ngày này chắc chắn gây bất lợi.',
    )
  })

  it('explains the star source without a cát/hung label', async () => {
    at('10:00')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    await user.click(screen.getByRole('button', { name: 'Giải thích Sao chiếu mệnh' }))
    const dialog = screen.getByRole('dialog', { name: 'Sao La Hầu' })
    expect(dialog).toHaveTextContent('Ngọc Hạp Ký')
    expect(dialog).not.toHaveTextContent(/^Xấu|Hung tinh/)
  })

  it('shows the viewed day Ten God in its own tile', () => {
    at('10:00')
    const full = settings({
      birthTime: '08:30',
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
    })
    render(<PersonalFengShuiPanel date="2026-09-23" settings={full} />)
    // 1/7/1990 08:30 TP.HCM: Nhật Nguyên Đinh; ngày 23/9/2026 là Canh Tý → Chính Tài.
    const stem = screen.getByRole('region', { name: 'Quan hệ Thiên can' })
    expect(within(stem).queryByRole('group', { name: 'Thập thần của ngày đang xem' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Thập thần ngày' })).toHaveTextContent(
      'Nhật Nguyên Đinh · Can ngày Canh: Chính Tài',
    )
  })

  it('uses the spec order for the four core energy tiles', () => {
    at('10:00')
    const full = settings({
      birthTime: '08:30',
      birthTimePrecision: 'exact',
      birthTimeUncertaintyMinutes: 0,
      birthPlace: {
        countryCode: 'VN', subdivisionCode: 'VN-SG', label: 'TP. Hồ Chí Minh',
        latitude: 10.76, longitude: 106.66, coordinateSource: 'bundledGazetteer', coordinateAccuracyKm: 10,
      },
      birthTimezoneId: 'Asia/Ho_Chi_Minh', birthTimezoneSource: 'bundledMapping',
      birthConfirmedOffsetMinutes: null, birthZiPolicy: 'splitZi',
    })
    render(<PersonalFengShuiPanel date="2026-09-23" settings={full} />)
    const grid = screen.getByRole('region', { name: 'Phong thủy cá nhân' }).querySelector('[class*="bento"]')!
    expect(Array.from(grid.querySelectorAll('section[aria-label]')).slice(0, 4).map((node) => node.getAttribute('aria-label'))).toEqual([
      'Thập thần ngày', 'Quan hệ Địa chi', 'Quan hệ Thiên can', 'Quan hệ Nạp âm',
    ])
  })

  it('shows the nap am name for Tân Hợi', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings({ birthDate: '1971-01-29' })} />)
    expect(screen.getByRole('region', { name: 'Quan hệ Nạp âm' })).toHaveTextContent('Thoa Xuyến Kim')
  })

  it('asks for birth time and place before showing the viewed day Ten God', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const group = screen.getByRole('group', { name: 'Thập thần của ngày đang xem' })
    expect(within(group).getByRole('link', { name: 'Nhập giờ và nơi sinh' })).toHaveAttribute(
      'href',
      '/settings#birth-info',
    )
  })
})
