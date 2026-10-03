import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Settings } from '@shared/types'
import { RepositoryContext } from '../data/repositoryContext'
import type { CalendarRepository } from '../data/repository'
import { createDefaultSettings } from '../data/defaultCategories'
import { SETTINGS_SLOW_MS, useSettingsStatus } from './useRepositoryData'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function fakeRepository() {
  const handlers: {
    next?: (settings: Settings) => void
    error?: (error: unknown) => void
  } = {}
  const repository = {
    kind: 'cloud',
    watchSettings: (next: (s: Settings) => void, error?: (e: unknown) => void) => {
      handlers.next = next
      handlers.error = error
      return () => {}
    },
  } as unknown as CalendarRepository
  return { repository, handlers }
}

function Status() {
  const { settings, error, slow } = useSettingsStatus()
  return <p>{settings ? 'ready' : error ? 'error' : slow ? 'slow' : 'loading'}</p>
}

function renderStatus(repository: CalendarRepository) {
  return render(
    <RepositoryContext.Provider value={repository}>
      <Status />
    </RepositoryContext.Provider>,
  )
}

it('báo chậm khi quá thời gian chờ, rồi về bình thường khi cài đặt tới', () => {
  const { repository, handlers } = fakeRepository()
  renderStatus(repository)
  expect(screen.getByText('loading')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(SETTINGS_SLOW_MS))
  expect(screen.getByText('slow')).toBeInTheDocument()
  act(() => handlers.next?.(createDefaultSettings('')))
  expect(screen.getByText('ready')).toBeInTheDocument()
})

it('báo lỗi khi đọc cài đặt lỗi', () => {
  const { repository, handlers } = fakeRepository()
  renderStatus(repository)
  act(() => handlers.error?.(new Error('boom')))
  expect(screen.getByText('error')).toBeInTheDocument()
})

it('không báo chậm khi cài đặt tới kịp', () => {
  const { repository, handlers } = fakeRepository()
  renderStatus(repository)
  act(() => handlers.next?.(createDefaultSettings('')))
  act(() => vi.advanceTimersByTime(SETTINGS_SLOW_MS))
  expect(screen.getByText('ready')).toBeInTheDocument()
})
