// Web Push qua Firebase Cloud Messaging cho người đã đăng nhập: nhận nhắc hẹn cả khi đã đóng tab.
// firebase/messaging được tải khi cần để không làm nặng lần tải đầu.

import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { getDb, getFirebaseApp, isFirebaseConfigured } from '../firebase/firebase'

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined
const TOKEN_KEY = 'calendar-hana:push-token'

function tokenDoc(uid: string, token: string) {
  return doc(getDb(), 'users', uid, 'pushTokens', token)
}

function rememberToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Không lưu được thì lần đăng xuất sau token cũ bị server tự dọn khi hết hạn.
  }
}

function rememberedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

async function loadMessaging() {
  if (!isFirebaseConfigured() || !vapidKey) return null
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null
  const registration = await navigator.serviceWorker?.getRegistration()
  if (!registration) return null
  const messaging = await import('firebase/messaging')
  if (!(await messaging.isSupported())) return null
  return { messaging, instance: messaging.getMessaging(getFirebaseApp()), registration }
}

/**
 * Lấy FCM token của trình duyệt này và lưu vào users/{uid}/pushTokens.
 * Không làm gì nếu chưa cấp quyền thông báo, chưa có service worker hoặc chưa cấu hình VAPID.
 */
export async function registerPushToken(uid: string): Promise<string | null> {
  const loaded = await loadMessaging()
  if (!loaded) return null
  const token = await loaded.messaging.getToken(loaded.instance, {
    vapidKey,
    serviceWorkerRegistration: loaded.registration,
  })
  if (!token) return null
  const previous = rememberedToken()
  if (previous && previous !== token) await deleteDoc(tokenDoc(uid, previous)).catch(() => {})
  const now = new Date().toISOString()
  await setDoc(tokenDoc(uid, token), {
    token,
    userAgent: navigator.userAgent.slice(0, 300),
    updatedAt: now,
  })
  rememberToken(token)
  return token
}

/** Gỡ token của trình duyệt này khi đăng xuất, để máy này không nhận nhắc hẹn của tài khoản nữa. */
export async function unregisterPushToken(uid: string): Promise<void> {
  const token = rememberedToken()
  if (!token) return
  rememberToken(null)
  await deleteDoc(tokenDoc(uid, token)).catch(() => {})
  const loaded = await loadMessaging().catch(() => null)
  if (loaded) await loaded.messaging.deleteToken(loaded.instance).catch(() => {})
}
