import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthUser } from '../../auth/authContext'
import { CalendarDatabase } from '../../data/db'
import { LocalRepository } from '../../data/localRepository'
import { RepositoryProvider } from '../../data/RepositoryProvider'
import { TabBar } from './TabBar'

let repo: LocalRepository
let counter = 0
let resize: (width: number) => void

beforeEach(() => {
  repo = new LocalRepository(new CalendarDatabase(`tabbar-test-${++counter}`))
  let callback: ResizeObserverCallback | undefined
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        callback = cb
      }
      observe() {}
      disconnect() {}
    },
  )
  resize = (width) =>
    act(() => callback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver))
})

afterEach(async () => {
  vi.unstubAllGlobals()
  await repo.db.delete()
})

function renderBar(user: AuthUser | null = null) {
  const auth = { available: true, loading: false, user } as AuthContextValue
  return render(
    <AuthContext.Provider value={auth}>
      <RepositoryProvider repository={repo}>
        <TabBar active="month" onSelect={() => {}} onCreate={() => {}} />
      </RepositoryProvider>
    </AuthContext.Provider>,
  )
}

const google: AuthUser = {
  uid: 'u1',
  email: 'lan@gmail.com',
  displayName: 'Lan Nguyễn',
  photoURL: 'https://lh3.googleusercontent.com/a/lan',
}

const menu = () => screen.getByRole('button', { name: 'Mở menu' })

describe('TabBar', () => {
  it('đủ chỗ thì hiện icon và nhãn', async () => {
    renderBar()
    resize(264)
    expect(screen.getByRole('button', { name: 'Tháng' })).toHaveTextContent('Tháng')
    expect(screen.getByText('Sự kiện')).toBeInTheDocument()
  })

  it('chữ Rất lớn trên màn hẹp: chỉ icon, tên tab vẫn đọc được', async () => {
    await repo.saveSettings({ textSize: 'xlarge' })
    renderBar()
    // Đợi cài đặt tải xong rồi mới đo, như khi mở app.
    await waitFor(async () => {
      resize(228)
      expect(screen.queryByText('Sự kiện')).not.toBeInTheDocument()
    })
    for (const name of ['Ngày', 'Tháng', 'Sự kiện', 'Mở menu'])
      expect(screen.getByRole('button', { name })).toHaveTextContent('')
    expect(screen.getByRole('button', { name: 'Tháng' })).toHaveAttribute('aria-current', 'page')
  })

  it('chữ Rất lớn trên màn rộng vẫn giữ nhãn', async () => {
    await repo.saveSettings({ textSize: 'xlarge' })
    renderBar()
    resize(600)
    await waitFor(() => expect(screen.getByText('Sự kiện')).toBeInTheDocument())
  })

  describe('nút Menu', () => {
    it('chưa đăng nhập: icon Menu', () => {
      renderBar()
      expect(menu().querySelector('img')).toBeNull()
      expect(menu().querySelector('svg')).not.toBeNull()
      expect(menu()).toHaveTextContent('Menu')
    })

    it('đã đăng nhập Google: avatar thay icon, vẫn có nhãn và tên đọc được', () => {
      renderBar(google)
      const img = menu().querySelector('img')!
      expect(img).toHaveAttribute('src', google.photoURL)
      expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
      expect(menu().querySelector('svg')).toBeNull()
      expect(menu()).toHaveTextContent('Menu')
    })

    it('ảnh lỗi hoặc không có ảnh: chữ cái đầu của tên', () => {
      renderBar(google)
      fireEvent.error(menu().querySelector('img')!)
      expect(menu().querySelector('img')).toBeNull()
      expect(menu()).toHaveTextContent(/^LMenu$/)
    })

    it('không có ảnh và tên: chữ cái đầu của email', () => {
      renderBar({ ...google, photoURL: null, displayName: null })
      expect(menu()).toHaveTextContent(/^LMenu$/)
    })
  })
})
