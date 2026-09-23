import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/authContext'
import { getDb } from '../firebase/firebase'
import { useSyncStore } from '../store/syncStore'
import { FirestoreRepository } from './firestoreRepository'
import { hasLocalData } from './migrateLocalToCloud'
import { MigrationDialog } from './MigrationDialog'
import type { CalendarRepository } from './repository'
import { getLocalRepository, RepositoryContext } from './repositoryContext'

interface RepositoryProviderProps {
  children: ReactNode
  /** Truyền repository riêng (dùng trong test). Khi có, bỏ qua trạng thái đăng nhập. */
  repository?: CalendarRepository
}

const DISMISS_KEY = 'calendar-hana:migration-dismissed:'

function isDismissed(uid: string): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY + uid) === '1'
  } catch {
    return false
  }
}

function dismiss(uid: string): void {
  try {
    localStorage.setItem(DISMISS_KEY + uid, '1')
  } catch {
    // Không lưu được thì lần sau hỏi lại, không sao.
  }
}

/**
 * Chưa đăng nhập: dữ liệu local (IndexedDB).
 * Đã đăng nhập: Firestore của tài khoản, kèm hỏi chuyển dữ liệu local lên ở lần đầu.
 */
export function RepositoryProvider({ children, repository }: RepositoryProviderProps) {
  const { user, loading } = useAuth()
  const reportError = useSyncStore((s) => s.reportError)
  const uid = repository ? null : (user?.uid ?? null)

  const cloud = useMemo(
    () => (uid ? new FirestoreRepository(getDb(), uid, reportError) : null),
    [uid, reportError],
  )
  const value: CalendarRepository = repository ?? cloud ?? getLocalRepository()

  const [askMigration, setAskMigration] = useState<string | null>(null)

  useEffect(() => {
    if (!cloud || !user) return
    let cancelled = false
    void (async () => {
      try {
        await cloud.ensureInitialized({ email: user.email, displayName: user.displayName })
      } catch (error) {
        // Offline lần đầu: thử lại ở lần mở app sau.
        console.warn('Chưa khởi tạo được dữ liệu tài khoản', error)
      }
      if (!cancelled && !isDismissed(user.uid) && (await hasLocalData(getLocalRepository()))) {
        if (!cancelled) setAskMigration(user.uid)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cloud, user])

  if (loading && !repository) return null

  return (
    <RepositoryContext.Provider value={value}>
      {children}
      {cloud && askMigration === cloud.uid ? (
        <MigrationDialog
          cloud={cloud}
          local={getLocalRepository()}
          onDone={() => setAskMigration(null)}
          onSkip={() => {
            dismiss(cloud.uid)
            setAskMigration(null)
          }}
        />
      ) : null}
    </RepositoryContext.Provider>
  )
}
