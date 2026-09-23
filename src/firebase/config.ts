// Cấu hình Firebase, không import SDK: dùng được ở bundle chính mà không kéo Firebase theo.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const useFirebaseEmulator =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

/** false nếu chưa điền .env.local: app chỉ chạy với dữ liệu local. */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}
