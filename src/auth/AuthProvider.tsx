import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { FirestoreRepository } from '../data/firestoreRepository'
import {
  clearFirestoreCache,
  getDb,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '../firebase/firebase'
import { AuthContext, type AuthContextValue, type AuthUser } from './authContext'

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

/** PWA cài trên điện thoại chặn popup, nên dùng redirect. */
function prefersRedirect(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(display-mode: standalone)').matches &&
    /Android|iPhone|iPad/i.test(navigator.userAgent)
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const available = isFirebaseConfigured()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(available)

  useEffect(() => {
    if (!available) return
    return onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u ? toAuthUser(u) : null)
      setLoading(false)
    })
  }, [available])

  const value = useMemo<AuthContextValue>(
    () => ({
      available,
      loading,
      user,
      signIn: async () => {
        const auth = getFirebaseAuth()
        if (prefersRedirect()) {
          await signInWithRedirect(auth, googleProvider())
          return
        }
        try {
          await signInWithPopup(auth, googleProvider())
        } catch (error) {
          if ((error as { code?: string }).code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider())
            return
          }
          throw error
        }
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth())
        await clearFirestoreCache()
      },
      deleteAccount: async () => {
        const auth = getFirebaseAuth()
        const current = auth.currentUser
        if (!current) return
        // Firebase yêu cầu đăng nhập gần đây mới được xóa tài khoản.
        await reauthenticateWithPopup(current, googleProvider())
        await new FirestoreRepository(getDb(), current.uid).deleteAllData()
        await deleteUser(current)
        await clearFirestoreCache()
      },
    }),
    [available, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
