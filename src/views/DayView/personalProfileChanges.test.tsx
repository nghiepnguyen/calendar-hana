import { screen, fireEvent } from '@testing-library/react'
import { render as renderBase } from '../../test/render'
import type { ReactElement } from 'react'
import { expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/authContext'
import { DayView } from './DayView'
import { viewProps } from '../../test/fixtures'
import { createDefaultSettings } from '../../data/defaultCategories'
import { FENG_SHUI_RULES } from '@shared/personalFengShui/rules'
import { PersonalFengShuiPanel } from './PersonalFengShuiPanel'

it('resets annual view on account change and sign-out', () => {
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
  fireEvent.click(screen.getByRole('radio', { name: 'Nữ mạng' }))
  rerender(
    <AuthContext.Provider value={auth('b')}>
      <DayView {...p} settings={{ ...p.settings, birthDate: '2000-07-01' }} />
    </AuthContext.Provider>,
  )
  expect(screen.getByRole('radio', { name: 'Nam mạng' })).toBeChecked()
  expect(screen.queryByText(/Tuổi mụ: 37/)).not.toBeInTheDocument()
  rerender(
    <AuthContext.Provider value={auth(null)}>
      <DayView {...p} settings={{ ...p.settings, birthDate: null }} />
    </AuthContext.Provider>,
  )
  expect(screen.queryByTestId('personal-day-summary')).not.toBeInTheDocument()
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
  expect(screen.getAllByText('Chưa có dữ liệu').length).toBeGreaterThan(0)
  expect(screen.queryByText('Không thuộc chu kỳ Tam Tai')).not.toBeInTheDocument()
})

// Existing content assertions exercise the explicit advanced navigation.
function render(ui: ReactElement) {
  const result = renderBase(ui)
  const advanced = screen.queryByRole('button', { name: /Luận đoán nâng cao/ })
  if (advanced) {
    fireEvent.click(advanced)
    for (const name of [/^Hạn theo năm/, /^Tứ trụ theo giờ sinh/]) {
      const toggle = screen.queryByRole('button', { name })
      if (toggle) fireEvent.click(toggle)
    }
  }
  return result
}
