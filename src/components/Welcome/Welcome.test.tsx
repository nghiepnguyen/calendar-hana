import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Welcome, WELCOME_STORAGE_KEY } from './Welcome'

function CurrentUrl() {
  const location = useLocation()
  return <p data-testid="url">{location.pathname + location.hash}</p>
}

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Welcome />
      <Routes>
        <Route path="*" element={<CurrentUrl />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.removeItem(WELCOME_STORAGE_KEY)
})

describe('Welcome', () => {
  it('lần đầu mở app thì chào và giới thiệu cài app dùng offline', () => {
    renderWelcome()
    const dialog = screen.getByRole('dialog', { name: 'Chào mừng đến với Lịch Việt' })
    expect(dialog).toHaveTextContent('Dùng cả khi mất mạng')
    expect(screen.getByRole('button', { name: 'Xem hướng dẫn' })).toHaveFocus()
  })

  it('bấm Xem hướng dẫn thì mở tab Cài app và không chào lại', async () => {
    const view = renderWelcome()
    await userEvent.click(screen.getByRole('button', { name: 'Xem hướng dẫn' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('url')).toHaveTextContent('/settings#install')
    view.unmount()
    renderWelcome()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('bấm Bỏ qua thì đóng, ở nguyên trang và không chào lại', async () => {
    const view = renderWelcome()
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('url')).toHaveTextContent('/')
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('1')
    view.unmount()
    renderWelcome()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Esc cũng tính là bỏ qua', async () => {
    renderWelcome()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('1')
  })
})
