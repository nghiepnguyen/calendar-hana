import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { CalendarDatabase } from './data/db'
import { LocalRepository } from './data/localRepository'
import { RepositoryProvider } from './data/RepositoryProvider'
import { freezeNow } from './test/fixtures'

let repo: LocalRepository
let counter = 0

beforeEach(() => {
  freezeNow()
  repo = new LocalRepository(new CalendarDatabase(`app-test-${++counter}`))
})

afterEach(async () => {
  vi.useRealTimers()
  await repo.db.delete()
})

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repo}>
        <App />
      </RepositoryProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('mặc định mở xem Ngày của hôm nay', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Thứ Tư, 23/9/2026' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Ngày' })).toBeChecked()
    expect(screen.getByRole('region', { name: 'Thông tin ngày' })).toBeInTheDocument()
  })

  it('chuyển Ngày / Tuần / Tháng và đi trước / sau', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('radio', { name: 'Tuần' }))
    expect(screen.getByRole('heading', { name: '21–27/9/2026' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tuần sau' }))
    expect(screen.getByRole('heading', { name: '28/9 – 4/10/2026' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Tháng' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tháng 9/2026 — Tháng 7–8 âm lịch, năm Bính Ngọ',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    await userEvent.keyboard('d')
    expect(screen.getByRole('heading', { name: 'Thứ Tư, 23/9/2026' })).toBeInTheDocument()
  })

  it('mở đúng ngày từ URL, URL sai thì về mặc định', async () => {
    renderApp('/month/2026-02-17')
    expect(await screen.findByText('Tết Nguyên Đán')).toBeInTheDocument()
  })

  it('hiện danh mục trong sidebar và lọc được', async () => {
    renderApp()
    const checkbox = await screen.findByRole('checkbox', { name: 'Công việc' })
    expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    await vi.waitFor(async () =>
      expect((await repo.getSettings()).hiddenCategoryIds).toEqual(['work']),
    )
  })
})
