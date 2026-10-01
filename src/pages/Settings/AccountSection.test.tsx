import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/authContext'
import { CalendarDatabase } from '../../data/db'
import { LocalRepository } from '../../data/localRepository'
import { RepositoryContext } from '../../data/repositoryContext'
import { AccountSection } from './AccountSection'

const { fetchGoogleBirthday } = vi.hoisted(() => ({ fetchGoogleBirthday: vi.fn() }))
vi.mock('../../auth/authService', () => ({ fetchGoogleBirthday }))

const repositories: LocalRepository[] = []
async function setup(signedIn = false) {
  const repository = new LocalRepository(new CalendarDatabase(`birthday-${crypto.randomUUID()}`))
  repositories.push(repository)
  await repository.getSettings()
  const auth: AuthContextValue = {
    available: signedIn,
    loading: false,
    user: signedIn
      ? { uid: 'u1', email: 'a@example.com', displayName: 'An', photoURL: null }
      : null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
  }
  const view = render(
    <AuthContext.Provider value={auth}>
      <RepositoryContext.Provider value={repository}>
        <AccountSection />
      </RepositoryContext.Provider>
    </AuthContext.Provider>,
  )
  await screen.findByLabelText('Ngày sinh')
  return { repository, ...view }
}

afterEach(async () => {
  for (const repository of repositories.splice(0)) await repository.db.delete()
  vi.resetAllMocks()
})

function enterDate(day: string, month: string, year: string) {
  fireEvent.change(screen.getByLabelText('Ngày sinh'), { target: { value: day } })
  fireEvent.change(screen.getByLabelText('Tháng sinh'), { target: { value: month } })
  fireEvent.change(screen.getByLabelText('Năm sinh'), { target: { value: year } })
}

describe('Thông tin ngày sinh trong Tài khoản', () => {
  it('lưu ngày sinh và giờ sinh trên máy dù chưa cấu hình Firebase', async () => {
    const { repository, unmount } = await setup()
    enterDate('29', '2', '2000')
    fireEvent.change(screen.getByLabelText('Giờ sinh (tùy chọn)'), { target: { value: '23:45' } })
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await screen.findByText('Đã lưu thông tin ngày sinh.')
    expect(await repository.getSettings()).toMatchObject({
      birthDate: '2000-02-29',
      birthTime: '23:45',
    })
    unmount()
    render(
      <RepositoryContext.Provider value={repository}>
        <AccountSection />
      </RepositoryContext.Provider>,
    )
    await waitFor(() => expect(screen.getByLabelText('Năm sinh')).toHaveValue(2000))
    expect(screen.getByLabelText('Giờ sinh (tùy chọn)')).toHaveValue('23:45')
  })

  it('lưu nơi sinh, độ chắc chắn và quy ước giờ Tý mà không dùng vị trí thiết bị', async () => {
    const { repository } = await setup()
    enterDate('4', '2', '2024')
    fireEvent.change(screen.getByLabelText('Giờ sinh (tùy chọn)'), { target: { value: '15:30' } })
    await userEvent.selectOptions(screen.getByLabelText('Nơi sinh'), 'hcm')
    await userEvent.selectOptions(screen.getByLabelText('Độ chắc chắn của giờ sinh'), 'estimated')
    fireEvent.change(screen.getByLabelText('Sai số ước lượng (phút)'), {
      target: { value: '20' },
    })
    await userEvent.selectOptions(screen.getByLabelText('Quy ước giờ Tý'), 'dayStartsAt23')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await screen.findByText('Đã lưu thông tin ngày sinh.')
    expect(await repository.getSettings()).toMatchObject({
      birthPlace: { label: 'TP. Hồ Chí Minh', longitude: 106.66 },
      birthTimezoneId: 'Asia/Ho_Chi_Minh',
      birthTimezoneSource: 'bundledMapping',
      birthTimePrecision: 'estimated',
      birthTimeUncertaintyMinutes: 20,
      birthZiPolicy: 'dayStartsAt23',
    })
  })

  it('giờ sinh có thể bỏ trống, xóa thông tin đã lưu được', async () => {
    const { repository } = await setup()
    enterDate('15', '5', '1995')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await screen.findByText('Đã lưu thông tin ngày sinh.')
    expect(await repository.getSettings()).toMatchObject({
      birthDate: '1995-05-15',
      birthTime: null,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Xóa thông tin ngày sinh' }))
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await waitFor(async () =>
      expect(await repository.getSettings()).toMatchObject({ birthDate: null, birthTime: null }),
    )
  })

  it('chặn ngày không tồn tại và ngày tương lai', async () => {
    const { repository } = await setup()
    enterDate('29', '2', '2001')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ngày sinh không hợp lệ')
    enterDate('1', '1', '9999')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ngày sinh không được sau hôm nay')
    expect((await repository.getSettings()).birthDate).toBeUndefined()
  })

  it('lấy từ Google để điền form, chỉ lưu khi người dùng bấm lưu', async () => {
    const { repository } = await setup(true)
    fetchGoogleBirthday.mockResolvedValue({ day: 3, month: 7, year: 1990 })
    await userEvent.click(screen.getByRole('button', { name: 'Lấy ngày sinh từ Google' }))
    await waitFor(() => expect(screen.getByLabelText('Năm sinh')).toHaveValue(1990))
    expect((await repository.getSettings()).birthDate).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await screen.findByText('Đã lưu thông tin ngày sinh.')
    expect((await repository.getSettings()).birthDate).toBe('1990-07-03')
  })

  it('Google thiếu năm sinh thì điền ngày tháng và yêu cầu bổ sung năm', async () => {
    await setup(true)
    fetchGoogleBirthday.mockResolvedValue({ day: 3, month: 7 })
    await userEvent.click(screen.getByRole('button', { name: 'Lấy ngày sinh từ Google' }))
    await screen.findByText(/Google chưa cung cấp năm sinh/)
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue(3)
    expect(screen.getByLabelText('Năm sinh')).toHaveValue(null)
  })

  it('lỗi Google giữ thông tin đang nhập và cho phép lưu tay', async () => {
    await setup(true)
    enterDate('15', '5', '1995')
    fetchGoogleBirthday.mockRejectedValue(new Error('Không lấy được ngày sinh từ Google.'))
    await userEvent.click(screen.getByRole('button', { name: 'Lấy ngày sinh từ Google' }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('Năm sinh')).toHaveValue(1995)
    expect(screen.getByRole('button', { name: 'Lưu thông tin' })).toBeEnabled()
  })
})
