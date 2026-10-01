import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import type { Category, Settings } from '@shared/types'
import { BIRTH_METADATA_KEYS, isValidBirthDate, isValidBirthTime } from '@shared/birthInfo'
import { toFirestoreData, type FirestoreRepository } from './firestoreRepository'
import type { LocalRepository } from './localRepository'

const BATCH_LIMIT = 400

function stableJson(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (Array.isArray(value))
    return JSON.stringify(value.map((item) => JSON.parse(stableJson(item)!)))
  if (value && typeof value === 'object') {
    const sorted = Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [
          key,
          item && typeof item === 'object' ? JSON.parse(stableJson(item)!) : item,
        ]),
    )
    return JSON.stringify(sorted)
  }
  return JSON.stringify(value)
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
  const cloudSettings = userSnap.data()?.settings
  const birthInfo: Partial<Settings> | null =
    isValidBirthDate(localSettings.birthDate) && cloudSettings?.birthDate === undefined
      ? {
          birthDate: localSettings.birthDate,
          birthTime: isValidBirthTime(localSettings.birthTime) ? localSettings.birthTime : null,
          ...Object.fromEntries(
            BIRTH_METADATA_KEYS.filter((key) => key !== 'birthTime').map((key) => [
              key,
              localSettings[key],
            ]),
          ),
        }
      : null
  if (!cloudSettings) {
    writes.push([cloud.userDoc, { settings: { ...localSettings, ...birthInfo } }])
  } else if (birthInfo) {
    // Không ghi đè ngày sinh đã nhập/xóa trên tài khoản hay các cài đặt khác.
    writes.push([cloud.userDoc, { settings: birthInfo }])
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

  if (birthInfo) {
    const serverUser = await getDocFromServer(cloud.userDoc)
    const saved = serverUser.data()?.settings
    const missingBirthFields = [
      ...(saved?.birthDate === birthInfo.birthDate ? [] : ['birthDate']),
      ...BIRTH_METADATA_KEYS.filter(
        (key) =>
          birthInfo[key] !== null &&
          birthInfo[key] !== undefined &&
          stableJson(saved?.[key]) !== stableJson(birthInfo[key]),
      ),
    ]
    if (missingBirthFields.length > 0) {
      throw new MigrationError(
        `Chưa chuyển được thông tin ngày sinh (${missingBirthFields.join(', ')}). Dữ liệu trên máy vẫn được giữ.`,
      )
    }
  }

  await local.clearAll()
  return { events: events.length, categories: categoriesToWrite.length }
}
