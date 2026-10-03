// Tải động: Firestore chỉ được tải khi người dùng đã đăng nhập.
import { initDb } from '../firebase/firestore'
import { FirestoreRepository, type ErrorReporter } from './firestoreRepository'

export async function createCloudRepository(
  uid: string,
  onError: ErrorReporter,
): Promise<FirestoreRepository> {
  return new FirestoreRepository(await initDb(), uid, onError)
}
