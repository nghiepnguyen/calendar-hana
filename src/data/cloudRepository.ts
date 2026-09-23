// Tải động: Firestore chỉ được tải khi người dùng đã đăng nhập.
import { getDb } from '../firebase/firestore'
import { FirestoreRepository, type ErrorReporter } from './firestoreRepository'

export function createCloudRepository(uid: string, onError: ErrorReporter): FirestoreRepository {
  return new FirestoreRepository(getDb(), uid, onError)
}
