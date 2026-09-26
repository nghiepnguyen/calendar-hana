import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('hỏng')
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ErrorBoundary', () => {
  it('không lỗi thì hiện nội dung bình thường', () => {
    render(
      <ErrorBoundary>
        <p>Lịch</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Lịch')).toBeInTheDocument()
  })

  it('con ném lỗi thì hiện thông báo thay vì trang trắng, bấm Tải lại thì reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Đã có lỗi xảy ra')
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại trang' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
