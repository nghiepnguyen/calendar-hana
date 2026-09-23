import { useMemo, type ReactNode } from 'react'
import type { CalendarRepository } from './repository'
import { getLocalRepository, RepositoryContext } from './repositoryContext'

interface RepositoryProviderProps {
  children: ReactNode
  /** Truyền repository riêng (dùng trong test). Mặc định là dữ liệu local. */
  repository?: CalendarRepository
}

/**
 * Cung cấp repository cho toàn app.
 * Task 6.7 sẽ đổi sang Firestore khi người dùng đã đăng nhập.
 */
export function RepositoryProvider({ children, repository }: RepositoryProviderProps) {
  const value = useMemo(() => repository ?? getLocalRepository(), [repository])
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}
