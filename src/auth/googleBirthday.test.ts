import { GoogleAuthProvider } from 'firebase/auth'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authService from './authService'

const { reauthenticate, currentUser } = vi.hoisted(() => ({
  reauthenticate: vi.fn(),
  currentUser: { uid: 'u1', email: 'a@example.com' },
}))
vi.mock('../firebase/firebase', () => ({ getFirebaseAuth: () => ({ currentUser }) }))
vi.mock('firebase/auth', async (original) => ({
  ...(await original<typeof import('firebase/auth')>()),
  reauthenticateWithPopup: reauthenticate,
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

function mockResponse(body: unknown, status = 200) {
  const fetch = vi.fn().mockResolvedValue({ ok: status === 200, status, json: async () => body })
  vi.stubGlobal('fetch', fetch)
  reauthenticate.mockResolvedValue({})
  vi.spyOn(GoogleAuthProvider, 'credentialFromResult').mockReturnValue({
    accessToken: 'google-token',
  } as never)
  return fetch
}

describe('Lấy ngày sinh Google', () => {
  it('xin quyền đúng tài khoản và dùng access token đọc People API', async () => {
    const fetch = mockResponse({
      birthdays: [{ metadata: { primary: true }, date: { day: 29, month: 2, year: 2000 } }],
    })
    expect(await authService.fetchGoogleBirthday()).toEqual({ day: 29, month: 2, year: 2000 })
    const [user, provider] = reauthenticate.mock.calls[0]
    expect(user).toBe(currentUser)
    expect(provider.getScopes()).toContain('https://www.googleapis.com/auth/user.birthday.read')
    expect(fetch).toHaveBeenCalledWith(
      'https://people.googleapis.com/v1/people/me?personFields=birthdays',
      expect.objectContaining({
        headers: { Authorization: 'Bearer google-token' },
      }),
    )
  })

  it('giữ ngày tháng khi Google không trả năm, ưu tiên birthday primary', async () => {
    mockResponse({
      birthdays: [
        { date: { day: 1, month: 1, year: 1995 } },
        { metadata: { primary: true }, date: { day: 3, month: 7, year: 0 } },
      ],
    })
    expect(await authService.fetchGoogleBirthday()).toEqual({ day: 3, month: 7 })
  })

  it('báo rõ khi tài khoản chưa có ngày sinh', async () => {
    mockResponse({ birthdays: [] })
    await expect(authService.fetchGoogleBirthday()).rejects.toThrow(/chưa cung cấp ngày sinh/)
  })

  it('API bị từ chối vẫn có thể nhập tay', async () => {
    mockResponse({}, 403)
    await expect(authService.fetchGoogleBirthday()).rejects.toThrow(/nhập thủ công/)
  })

  it('không chấp nhận ngày sinh không tồn tại từ API', async () => {
    mockResponse({ birthdays: [{ date: { day: 31, month: 2, year: 2000 } }] })
    await expect(authService.fetchGoogleBirthday()).rejects.toThrow(/không hợp lệ/)
  })
})
