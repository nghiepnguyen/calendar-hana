import { createContext, useContext } from 'react'
import { LocalRepository } from './localRepository'
import type { CalendarRepository } from './repository'

export const RepositoryContext = createContext<CalendarRepository | null>(null)

let defaultLocalRepository: LocalRepository | null = null

/** Repository local dùng chung cho cả app (một database IndexedDB duy nhất). */
export function getLocalRepository(): LocalRepository {
  defaultLocalRepository ??= new LocalRepository()
  return defaultLocalRepository
}

export function useRepository(): CalendarRepository {
  const repository = useContext(RepositoryContext)
  if (!repository) throw new Error('useRepository phải được dùng bên trong <RepositoryProvider>')
  return repository
}
