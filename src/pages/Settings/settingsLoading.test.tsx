import { act, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { RepositoryContext } from '../../data/repositoryContext'
import type { CalendarRepository } from '../../data/repository'
import { SETTINGS_SLOW_MS } from '../../hooks/useRepositoryData'
import { render } from '../../test/render'
import { SettingsPage } from './SettingsPage'

afterEach(() => {
  vi.useRealTimers()
})

function renderSettings(repository: CalendarRepository) {
  return render(
    <RepositoryContext.Provider value={repository}>
      <SettingsPage />
    </RepositoryContext.Provider>,
  )
}

it('không kẹt ở "Đang tải" khi cài đặt mãi không tới (IndexedDB treo trên iOS)', () => {
  vi.useFakeTimers()
  const repository = {
    kind: 'cloud',
    watchSettings: () => () => {},
  } as unknown as CalendarRepository
  renderSettings(repository)
  expect(screen.getByText('Đang tải…')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(SETTINGS_SLOW_MS))
  expect(screen.getByRole('alert')).toHaveTextContent('Cài đặt tải lâu hơn bình thường')
  expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument()
})

it('báo lỗi khi đọc cài đặt lỗi', () => {
  const repository = {
    kind: 'local',
    watchSettings: (_: unknown, onError?: (error: unknown) => void) => {
      onError?.(new DOMException('Connection to Indexed Database server lost', 'UnknownError'))
      return () => {}
    },
  } as unknown as CalendarRepository
  renderSettings(repository)
  expect(screen.getByRole('alert')).toHaveTextContent('Không tải được cài đặt.')
})
