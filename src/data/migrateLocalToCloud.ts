import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import type { Category } from '@shared/types'
import { createDefaultCategories } from './defaultCategories'
import { toFirestoreData, type FirestoreRepository } from './firestoreRepository'
import type { LocalRepository } from './localRepository'

const BATCH_LIMIT = 400

/** Máy có dữ liệu local đáng chuyển không: có sự kiện, hoặc danh mục đã bị sửa/thêm/xóa. */
export async function hasLocalData(local: LocalRepository): Promise<boolean> {
  if ((await local.db.events.count()) > 0) return true
  const categories = await local.listCategories()
  const defaults = createDefaultCategories('')
  if (categories.length !== defaults.length) return true
  return categories.some((c) => {
    const d = defaults.find((x) => x.id === c.id)
    return !d || d.name !== c.name || d.color !== c.color
  })
}

export class MigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MigrationError'
  }
}

export interface MigrationResult {
  events: number
  categories: number
}

/**
 * Chuyển toàn bộ dữ liệu local lên tài khoản.
 * - Sự kiện giữ nguyên id (id là UUID nên không trùng với dữ liệu trên cloud).
 * - Danh mục cùng id: giữ bản sửa sau cùng (so sánh updatedAt).
 * - Chỉ xóa dữ liệu local sau khi đã kiểm tra trên server có đủ mọi bản ghi.
 */
export async function migrateLocalToCloud(
  local: LocalRepository,
  cloud: FirestoreRepository,
): Promise<MigrationResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new MigrationError('Cần kết nối mạng để chuyển dữ liệu lên tài khoản.')
  }

  const [events, localCategories, localSettings] = await Promise.all([
    local.listEvents(),
    local.listCategories(),
    local.getSettings(),
  ])
  const eventsCol = collection(cloud.userDoc, 'events')
  const categoriesCol = collection(cloud.userDoc, 'categories')

  const [cloudCategoriesSnap, userSnap] = await Promise.all([
    getDocsFromServer(categoriesCol),
    getDocFromServer(cloud.userDoc),
  ])
  const cloudCategories = new Map(cloudCategoriesSnap.docs.map((d) => [d.id, d.data() as Category]))
  const categoriesToWrite = localCategories.filter((c) => {
    const existing = cloudCategories.get(c.id)
    return !existing || c.updatedAt > existing.updatedAt
  })

  const writes: [DocumentReference, object][] = [
    ...events.map((e): [DocumentReference, object] => [doc(eventsCol, e.id), e]),
    ...categoriesToWrite.map((c): [DocumentReference, object] => [doc(categoriesCol, c.id), c]),
  ]
  // Cài đặt local chỉ dùng khi tài khoản chưa có cài đặt.
  if (!userSnap.data()?.settings) {
    writes.push([cloud.userDoc, { settings: localSettings }])
  }

  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = writeBatch(cloud.db)
    for (const [ref, data] of writes.slice(i, i + BATCH_LIMIT)) {
      batch.set(ref, toFirestoreData(data), { merge: true })
    }
    await batch.commit()
  }

  // Kiểm tra lại trên server trước khi xóa local.
  const serverEvents = await getDocsFromServer(eventsCol)
  const serverIds = new Set(serverEvents.docs.map((d) => d.id))
  const missing = events.filter((e) => !serverIds.has(e.id))
  if (missing.length > 0) {
    throw new MigrationError(
      `Còn ${missing.length} sự kiện chưa lên được tài khoản. Dữ liệu trên máy vẫn được giữ.`,
    )
  }

  await local.clearAll()
  return { events: events.length, categories: categoriesToWrite.length }
}
