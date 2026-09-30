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
import { isValidBirthDate } from '@shared/birthInfo'
import { isValidSolarDate, toSolarDateString } from '@shared/lunar/julian'

export interface GoogleBirthday {
  day: number
  month: number
  year?: number
}

/** Xin quyền ngày sinh riêng, chỉ khi người dùng chủ động bấm nút trong Tài khoản. */
export async function fetchGoogleBirthday(): Promise<GoogleBirthday> {
  const current = getFirebaseAuth().currentUser
  if (!current) throw new Error('Vui lòng đăng nhập Google để lấy ngày sinh.')
  const provider = googleProvider()
  provider.addScope('https://www.googleapis.com/auth/user.birthday.read')
  provider.setCustomParameters({ login_hint: current.email ?? '', prompt: 'consent' })
  let result
  try {
    // Reauthenticate giữ đúng tài khoản đang mở, không chuyển dữ liệu sang tài khoản khác.
    result = await reauthenticateWithPopup(current, provider)
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/popup-blocked') {
      throw new Error(
        'Trình duyệt chặn cửa sổ Google. Hãy cho phép cửa sổ bật lên hoặc nhập thủ công.',
      )
    }
    throw error
  }
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken
  if (!token) throw new Error('Chưa được cấp quyền đọc ngày sinh Google. Bạn có thể nhập thủ công.')
  // Token chỉ dùng cho yêu cầu này, không ghi vào database hay bộ nhớ trình duyệt.
  const response = await fetch(
    'https://people.googleapis.com/v1/people/me?personFields=birthdays',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  if (!response.ok) {
    throw new Error(
      'Không lấy được ngày sinh từ Google. Bạn có thể nhập thủ công hoặc thử lại sau.',
    )
  }
  const person = (await response.json()) as {
    birthdays?: { metadata?: { primary?: boolean }; date?: Partial<GoogleBirthday> }[]
  }
  const birthdays = person.birthdays ?? []
  const birthday = (birthdays.find((b) => b.metadata?.primary) ?? birthdays[0])?.date
  if (!birthday?.day || !birthday.month) {
    throw new Error('Tài khoản Google chưa cung cấp ngày sinh. Bạn có thể nhập thủ công.')
  }
  const { day, month, year } = birthday
  if (
    !isValidSolarDate(day, month, year || 2000) ||
    (year && !isValidBirthDate(toSolarDateString({ day, month, year })))
  ) {
    throw new Error('Ngày sinh Google không hợp lệ. Vui lòng nhập thủ công.')
  }
  return { day, month, ...(year ? { year } : {}) }
}

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
