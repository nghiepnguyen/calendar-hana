import { render, screen, within } from '@testing-library/react'
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

  it('keeps a short summary for the collapsed mobile view', () => {
    at('10:00')
    render(<PersonalFengShuiPanel date="2026-09-23" settings={settings()} />)
    const annual = screen.getByRole('region', { name: 'Hạn theo năm' })
    expect(
      within(annual).getByRole('button', { name: /Sao La Hầu, hạn Địa Võng/ }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})
