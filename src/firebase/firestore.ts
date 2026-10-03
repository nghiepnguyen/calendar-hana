// Firestore. Chỉ import động (import()): chỉ người đã đăng nhập mới cần tải.
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  type Firestore,
} from 'firebase/firestore'
import { track } from '../analytics'
import { useFirebaseEmulator as useEmulator } from './config'
import { getFirebaseApp } from './firebase'
import { probeIndexedDb } from './indexedDbProbe'

let db: Firestore | null = null
let initializing: Promise<Firestore> | null = null

function createDb(persistent: boolean): Firestore {
  const created = initializeFirestore(getFirebaseApp(), {
    localCache: persistent
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : memoryLocalCache(),
  })
  if (useEmulator) connectFirestoreEmulator(created, '127.0.0.1', 8080)
  return created
}

/**
 * Khởi tạo Firestore, thử IndexedDB trước: mở được thì có cache offline dùng chung giữa nhiều
 * tab, treo hoặc lỗi (lỗi IndexedDB của iOS) thì dùng cache trong bộ nhớ cho phiên này — vẫn
 * chạy online, chỉ mất dữ liệu offline.
 */
export function initDb(): Promise<Firestore> {
  if (db) return Promise.resolve(db)
  initializing ??= probeIndexedDb()
    .then((result) => {
      if (db) return db
      if (result !== 'ok') {
        console.warn(`IndexedDB không dùng được (${result}), Firestore dùng cache trong bộ nhớ`)
        track('firestore_memory_cache', {
          reason: result,
          standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
        })
      }
      db = createDb(result === 'ok')
      return db
    })
    .finally(() => {
      initializing = null
    })
  return initializing
}

/** Firestore đã khởi tạo; chưa có (hiếm, initDb chưa chạy) thì tạo luôn với cache offline. */
export function getDb(): Firestore {
  db ??= createDb(true)
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
