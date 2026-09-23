import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  type Firestore,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

/** false nếu chưa điền .env.local: app chỉ chạy với dữ liệu local. */
export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId)
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new Error('Chưa cấu hình Firebase (.env.local).')
  app ??= initializeApp(config)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    auth.languageCode = 'vi'
    if (useEmulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return auth
}

/** Firestore có cache offline trên IndexedDB, dùng chung giữa nhiều tab. */
export function getDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
    if (useEmulator) connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }
  return db
}

/** Xóa cache Firestore trên máy (khi đăng xuất / xóa tài khoản). */
export async function clearFirestoreCache(): Promise<void> {
  if (!db) return
  const current = db
  db = null
  await terminate(current)
  try {
    await clearIndexedDbPersistence(current)
  } catch (error) {
    // Tab khác còn mở thì không xóa được; cache sẽ bị ghi đè ở lần đăng nhập sau.
    console.warn('Không xóa được cache Firestore', error)
  }
}
