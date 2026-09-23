import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { firebaseConfig, isFirebaseConfigured, useFirebaseEmulator as useEmulator } from './config'

// Firebase App + Auth. Chỉ import động (import()) để SDK không nằm trong bundle chính.
export { isFirebaseConfigured } from './config'

let app: FirebaseApp | null = null
let auth: Auth | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new Error('Chưa cấu hình Firebase (.env.local).')
  app ??= initializeApp(firebaseConfig)
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
