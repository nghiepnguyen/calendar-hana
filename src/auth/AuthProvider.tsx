import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { track } from '../analytics'
import { isFirebaseConfigured } from '../firebase/config'
import { AuthContext, type AuthContextValue, type AuthUser } from './authContext'

// Firebase Auth được tải động để lần mở app đầu tiên nhẹ và nhanh.
const loadAuthService = () => import('./authService')

/** Máy này từng đăng nhập: cần đợi Firebase trước khi hiện dữ liệu (tránh hiện nhầm dữ liệu local). */
const SIGNED_IN_HINT = 'calendar-hana:signed-in'

function readHint(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_HINT) === '1'
  } catch {
    return false
  }
}

function writeHint(signedIn: boolean): void {
  try {
    if (signedIn) localStorage.setItem(SIGNED_IN_HINT, '1')
    else localStorage.removeItem(SIGNED_IN_HINT)
  } catch {
    // Không lưu được thì lần sau hiện dữ liệu local trước rồi mới chuyển sang cloud.
  }
}

/** Chạy khi trình duyệt rảnh, sau khi trang đã hiện. */
function whenIdle(callback: () => void): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 3000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(callback, 1500)
  return () => clearTimeout(id)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const available = isFirebaseConfigured()
  const [user, setUser] = useState<AuthUser | null>(null)
  // Chưa từng đăng nhập: hiện dữ liệu local ngay, không đợi Firebase.
  const [loading, setLoading] = useState(() => available && readHint())
  /** Bắt đầu theo dõi trạng thái đăng nhập ngay (không đợi lúc rảnh). */
  const startNowRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!available) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    let started = false
    const start = () => {
      if (started) return
      started = true
      loadAuthService()
        .then((service) => {
          if (cancelled) return
          unsubscribe = service.watchAuth((u) => {
            setUser(u)
            setLoading(false)
            writeHint(!!u)
          })
        })
        .catch((error) => {
          // Offline lần đầu, chưa có chunk trong cache: dùng dữ liệu local.
          console.warn('Không tải được Firebase Auth', error)
          if (!cancelled) setLoading(false)
        })
    }
    startNowRef.current = start
    const cancelIdle = readHint() ? (start(), () => {}) : whenIdle(start)
    return () => {
      cancelled = true
      cancelIdle()
      unsubscribe?.()
    }
  }, [available])

  const value = useMemo<AuthContextValue>(
    () => ({
      available,
      loading,
      user,
      signIn: async () => {
        startNowRef.current()
        const service = await loadAuthService()
        // Đăng nhập bằng redirect: trang tải lại thì đợi Firebase ngay.
        writeHint(true)
        try {
          await service.signIn()
          // Đăng nhập bằng redirect rời trang trước khi tới đây, nên chỉ đếm được popup.
          track('login', { method: 'google' })
        } catch (error) {
          writeHint(false)
          throw error
        }
      },
      signOut: async () => {
        await (await loadAuthService()).signOut()
        track('logout')
        writeHint(false)
      },
      deleteAccount: async () => {
        await (await loadAuthService()).deleteAccount()
        track('delete_account')
        writeHint(false)
      },
    }),
    [available, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
