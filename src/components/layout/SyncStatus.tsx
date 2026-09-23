import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/authContext'
import { useRepository } from '../../data/repositoryContext'
import { useSyncStore } from '../../store/syncStore'
import styles from './AppHeader.module.css'

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

/** Trạng thái đồng bộ cloud trên header (PRD 6.13). Ẩn khi chưa đăng nhập. */
export function SyncStatus() {
  const repository = useRepository()
  const { user } = useAuth()
  const online = useOnline()
  const state = useSyncStore((s) => s.state)
  const setState = useSyncStore((s) => s.setState)
  const error = useSyncStore((s) => s.error)
  const clearError = useSyncStore((s) => s.clearError)

  useEffect(() => {
    return repository.watchSyncState?.(setState)
  }, [repository, setState])

  if (repository.kind !== 'cloud' || !user) return null

  const label = error
    ? 'Lỗi đồng bộ'
    : !online
      ? 'Đang offline, sẽ đồng bộ khi có mạng'
      : state === 'pending'
        ? 'Đang đồng bộ…'
        : 'Đã đồng bộ'
  const tone = error ? styles.syncError : !online || state === 'pending' ? styles.syncPending : ''

  return (
    <button
      type="button"
      className={`${styles.sync} ${tone}`}
      title={error ?? label}
      aria-label={error ? `${label}: ${error}. Bấm để ẩn` : label}
      onClick={error ? clearError : undefined}
    >
      <span className={styles.syncDot} aria-hidden="true" />
      <span className={styles.syncText}>{label}</span>
    </button>
  )
}
