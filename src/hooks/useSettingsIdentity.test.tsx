import { render, screen, act } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RepositoryContext } from '../data/repositoryContext'
import type { CalendarRepository } from '../data/repository'
import { createDefaultSettings } from '../data/defaultCategories'
import { useSettings } from './useRepositoryData'
import type { Settings } from '@shared/types'

it('hides the previous saved birth profile while a different repository loads', () => {
  let next: ((settings: Settings) => void) | undefined
  const first = {
    watchSettings: (cb: (s: Settings) => void) => {
      cb({ ...createDefaultSettings(''), birthDate: '1990-07-01' })
      return () => {}
    },
  } as CalendarRepository
  const second = {
    watchSettings: (cb: (s: Settings) => void) => {
      next = cb
      return () => {
        next = undefined
      }
    },
  } as CalendarRepository
  function Profile() {
    const settings = useSettings()
    return <p>{settings?.birthDate ?? 'loading'}</p>
  }
  const { rerender } = render(
    <RepositoryContext.Provider value={first}>
      <Profile />
    </RepositoryContext.Provider>,
  )
  expect(screen.getByText('1990-07-01')).toBeInTheDocument()
  rerender(
    <RepositoryContext.Provider value={second}>
      <Profile />
    </RepositoryContext.Provider>,
  )
  expect(screen.queryByText('1990-07-01')).not.toBeInTheDocument()
  expect(screen.getByText('loading')).toBeInTheDocument()
  act(() => next?.({ ...createDefaultSettings(''), birthDate: '2000-07-01' }))
  expect(screen.getByText('2000-07-01')).toBeInTheDocument()
})
