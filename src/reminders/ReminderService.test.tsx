import { act, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import { CalendarDatabase } from '../data/db'
import { LocalRepository } from '../data/localRepository'
import { RepositoryProvider } from '../data/RepositoryProvider'
import { freezeNow } from '../test/fixtures'
import { useNotificationStore } from './notifications'
import { ReminderService } from './ReminderService'

vi.mock('./pushRegistration', () => ({
  registerPushToken: vi.fn(async () => 'push-token'),
}))

// 10:00 sáng 23/9/2026 giờ Việt Nam.
const NOW = '2026-09-23T03:00:00Z'

let repo: LocalRepository
let counter = 0
let NotificationMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  freezeNow(NOW)
  repo = new LocalRepository(new CalendarDatabase(`reminder-service-${++counter}`))
  NotificationMock = vi.fn()
  Object.assign(NotificationMock, { permission: 'granted' })
  vi.stubGlobal('Notification', NotificationMock)
  useNotificationStore.setState({ permission: 'granted' })
})

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  useNotificationStore.setState({ permission: 'unsupported' })
  await repo.db.delete()
})

const signedIn: AuthContextValue = {
  available: true,
  loading: false,
  user: { uid: 'u1', email: 'a@example.com', displayName: 'A', photoURL: null },
  signIn: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
}

describe('ReminderService', () => {
  it('đã đăng ký Web Push vẫn hiện nhắc hẹn khi app đang mở', async () => {
    await repo.saveEvent({
      title: 'Họp team',
      calendarType: 'solar',
      date: '2026-09-23',
      allDay: false,
      startTime: '10:01',
      endTime: '11:00',
      categoryId: 'work',
      reminders: [{ offsetMinutes: 0, channel: 'notification' }],
    })
    render(
      <MemoryRouter>
        <AuthContext.Provider value={signedIn}>
          <RepositoryProvider repository={repo}>
            <ReminderService />
          </RepositoryProvider>
        </AuthContext.Provider>
      </MemoryRouter>,
    )
    // Chờ đăng ký Web Push và dữ liệu sự kiện được nạp.
    await vi.waitFor(async () => {
      const { registerPushToken } = await import('./pushRegistration')
      expect(registerPushToken).toHaveBeenCalledWith('u1')
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // 1 phút sau, tab được mở lại: nhắc hẹn đến hạn phải hiện.
    vi.setSystemTime(new Date(new Date(NOW).getTime() + 60_000))
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await vi.waitFor(() =>
      expect(NotificationMock).toHaveBeenCalledWith(
        expect.stringContaining('Họp team'),
        expect.any(Object),
      ),
    )
  })
})
