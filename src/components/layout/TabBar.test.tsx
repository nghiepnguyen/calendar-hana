import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

function renderBar() {
  return render(
    <RepositoryProvider repository={repo}>
      <TabBar active="month" onSelect={() => {}} onCreate={() => {}} />
    </RepositoryProvider>,
  )
}

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
})
