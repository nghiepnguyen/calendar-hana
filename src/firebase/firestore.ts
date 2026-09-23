// Firestore. Chỉ import động (import()): chỉ người đã đăng nhập mới cần tải.
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  type Firestore,
} from 'firebase/firestore'
import { useFirebaseEmulator as useEmulator } from './config'
import { getFirebaseApp } from './firebase'

let db: Firestore | null = null

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
