// Đăng nhập Google bằng Firebase Auth. Module này được tải động (xem AuthProvider).

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
import { getFirebaseAuth } from '../firebase/firebase'
import type { AuthUser } from './authContext'

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
    window.matchMedia?.('(display-mode: standalone)').matches &&
    /Android|iPhone|iPad/i.test(navigator.userAgent)
  )
}

export function watchAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (u) => callback(u ? toAuthUser(u) : null))
}

export async function signIn(): Promise<void> {
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
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  const { unregisterPushToken } = await import('../reminders/pushRegistration')
  if (auth.currentUser) await unregisterPushToken(auth.currentUser.uid)
  await firebaseSignOut(auth)
  const { clearFirestoreCache } = await import('../firebase/firestore')
  await clearFirestoreCache()
}

export async function deleteAccount(): Promise<void> {
  const auth = getFirebaseAuth()
  const current = auth.currentUser
  if (!current) return
  // Firebase yêu cầu đăng nhập gần đây mới được xóa tài khoản.
  await reauthenticateWithPopup(current, googleProvider())
  const [{ unregisterPushToken }, { getDb, clearFirestoreCache }, { FirestoreRepository }] =
    await Promise.all([
      import('../reminders/pushRegistration'),
      import('../firebase/firestore'),
      import('../data/firestoreRepository'),
    ])
  await unregisterPushToken(current.uid)
  await new FirestoreRepository(getDb(), current.uid).deleteAllData()
  await deleteUser(current)
  await clearFirestoreCache()
}
