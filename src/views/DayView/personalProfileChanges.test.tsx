import { act, render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/authContext'
import { DayView } from './DayView'
import { viewProps } from '../../test/fixtures'
import { createDefaultSettings } from '../../data/defaultCategories'
import { FENG_SHUI_RULES } from '@shared/personalFengShui/rules'
import { PersonalFengShuiPanel } from './PersonalFengShuiPanel'

it('resets temporary purpose/role on account change and sign-out', () => {
  const auth = (uid: string | null): AuthContextValue => ({
    available: true,
    loading: false,
    user: uid ? { uid, email: null, displayName: null, photoURL: null } : null,
    signIn: async () => {},
    signOut: async () => {},
    deleteAccount: async () => {},
  })
  const p = viewProps({ settings: { ...createDefaultSettings(''), birthDate: '1990-07-01' } })
  const { rerender } = render(
    <AuthContext.Provider value={auth('a')}>
      <DayView {...p} />
    </AuthContext.Provider>,
  )
  fireEvent.change(screen.getByLabelText('Mục đích xem hạn năm'), {
    target: { value: 'construction' },
  })
  fireEvent.change(screen.getByLabelText('Vai trò của bạn'), { target: { value: 'owner' } })
  rerender(
    <AuthContext.Provider value={auth('b')}>
      <DayView {...p} settings={{ ...p.settings, birthDate: '2000-07-01' }} />
    </AuthContext.Provider>,
  )
  expect(screen.getByLabelText('Mục đích xem hạn năm')).toHaveValue('general')
  expect(screen.getByLabelText('Vai trò của bạn')).toHaveValue('self')
  expect(screen.queryByText(/Tuổi mụ: 37/)).not.toBeInTheDocument()
  rerender(
    <AuthContext.Provider value={auth(null)}>
      <DayView {...p} settings={{ ...p.settings, birthDate: null }} />
    </AuthContext.Provider>,
  )
  expect(screen.queryByTestId('personal-day-summary')).not.toBeInTheDocument()
})
it('updates hour badge at 01:00, uses the live Vietnam date and marks no hour on another day', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T17:59:00Z'))
  try {
    const p = viewProps({
      today: '2000-01-01',
      settings: { ...createDefaultSettings(''), birthDate: '1990-07-01' },
    })
    const { container, rerender } = render(<DayView {...p} />)
    expect(container.querySelector('[data-personal-hour="0"]')).toHaveAttribute(
      'aria-current',
      'time',
    )
    act(() => vi.advanceTimersByTime(60_000))
    expect(container.querySelector('[data-personal-hour="1"]')).toHaveAttribute(
      'aria-current',
      'time',
    )
    expect(container.querySelector('[data-personal-hour="0"]')).not.toHaveAttribute('aria-current')
    rerender(<DayView {...p} date="2026-09-24" />)
    expect(container.querySelector('[data-personal-hour][aria-current]')).toBeNull()
  } finally {
    vi.useRealTimers()
  }
})
it('rerenders rule version changes and exposes unavailable rules without old ratings', () => {
  const settings = { ...createDefaultSettings(''), birthDate: '1990-07-01' }
  const { rerender } = render(<PersonalFengShuiPanel date="2026-09-23" settings={settings} />)
  expect(screen.getByTestId('personal-day-summary')).toBeInTheDocument()
  rerender(
    <PersonalFengShuiPanel
      date="2026-09-23"
      settings={settings}
      rules={FENG_SHUI_RULES.map((rule) =>
        rule.id === 'personal.summary-policy' ? { ...rule, verificationStatus: 'pending' } : rule,
      )}
    />,
  )
  expect(screen.queryByTestId('personal-day-summary')).not.toBeInTheDocument()
  expect(screen.getByText('Quy tắc cá nhân chưa đủ kiểm chứng để tính.')).toBeInTheDocument()
  rerender(
    <PersonalFengShuiPanel
      date="2026-09-23"
      settings={settings}
      rules={FENG_SHUI_RULES.map((rule) =>
        rule.id === 'annual.tam-tai' ? { ...rule, verificationStatus: 'pending' } : rule,
      )}
    />,
  )
  expect(screen.getByTestId('personal-day-summary')).toBeInTheDocument()
  expect(screen.getByText('Chưa hỗ trợ')).toBeInTheDocument()
  expect(screen.queryByText('Không thuộc chu kỳ Tam Tai')).not.toBeInTheDocument()
})
