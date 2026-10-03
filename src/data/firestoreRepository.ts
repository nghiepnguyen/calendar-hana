import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'
import type { SyncState } from '../store/syncStore'
import type { CalendarEvent, Category, Settings } from '@shared/types'
import { withBirthDeletion } from '@shared/birthInfo'
import { EventValidationError, validateEvent } from '@shared/validation'
import {
  createDefaultCategories,
  createDefaultSettings,
  OTHER_CATEGORY_ID,
} from './defaultCategories'
import {
  newId,
  sortCategories,
  SystemCategoryError,
  type CalendarRepository,
  type CategoryInput,
  type EventInput,
  type Unsubscribe,
} from './repository'

export interface UserProfile {
  email: string | null
  displayName: string | null
}

export type ErrorReporter = (error: unknown) => void
export type SyncListener = (state: SyncState) => void

/** Firestore không nhận giá trị undefined: bỏ hết trước khi ghi. */
export function toFirestoreData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Lưu dữ liệu trên Cloud Firestore dưới users/{uid}/...
 *
 * Các hàm ghi trả kết quả ngay, không đợi server xác nhận: Firestore ghi vào cache offline
 * trước và tự đồng bộ khi có mạng. Lỗi ghi (ví dụ bị rules từ chối) được báo qua onError.
 */
export class FirestoreRepository implements CalendarRepository {
  readonly kind = 'cloud' as const
  readonly db: Firestore
  readonly uid: string
  private readonly onError: ErrorReporter

  constructor(db: Firestore, uid: string, onError: ErrorReporter = console.error) {
    this.db = db
    this.uid = uid
    this.onError = onError
  }

  get userDoc(): DocumentReference {
    return doc(this.db, 'users', this.uid)
  }

  private eventsCol() {
    return collection(this.userDoc, 'events')
  }

  private categoriesCol() {
    return collection(this.userDoc, 'categories')
  }

  private write(promise: Promise<unknown>): void {
    promise.catch(this.onError)
  }

  /**
   * Tạo hồ sơ, cài đặt và danh mục mặc định ở lần đăng nhập đầu tiên.
   * Trả về true nếu vừa tạo mới.
   */
  async ensureInitialized(profile: UserProfile): Promise<boolean> {
    const snapshot = await getDoc(this.userDoc)
    if (snapshot.exists()) return false
    const now = new Date().toISOString()
    const batch = writeBatch(this.db)
    batch.set(this.userDoc, {
      ...toFirestoreData(profile),
      createdAt: now,
      settings: createDefaultSettings(now),
    })
    for (const category of createDefaultCategories(now)) {
      batch.set(doc(this.categoriesCol(), category.id), category)
    }
    this.write(batch.commit())
    return true
  }

  async listEvents(): Promise<CalendarEvent[]> {
    const snapshot = await getDocs(this.eventsCol())
    return snapshot.docs.map((d) => d.data() as CalendarEvent)
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    const snapshot = await getDoc(doc(this.eventsCol(), id))
    return snapshot.exists() ? (snapshot.data() as CalendarEvent) : undefined
  }

  async saveEvent(input: EventInput): Promise<CalendarEvent> {
    const errors = validateEvent(input)
    if (Object.keys(errors).length > 0) throw new EventValidationError(errors)
    const now = new Date().toISOString()
    const event: CalendarEvent = toFirestoreData({
      ...input,
      id: input.id ?? newId(),
      title: input.title.trim(),
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    })
    this.write(setDoc(doc(this.eventsCol(), event.id), event))
    return event
  }

  async deleteEvent(id: string): Promise<void> {
    this.write(deleteDoc(doc(this.eventsCol(), id)))
  }

  watchEvents(callback: (events: CalendarEvent[]) => void): Unsubscribe {
    return onSnapshot(
      this.eventsCol(),
      (snapshot) => callback(snapshot.docs.map((d) => d.data() as CalendarEvent)),
      this.onError,
    )
  }

  async listCategories(): Promise<Category[]> {
    const snapshot = await getDocs(this.categoriesCol())
    return sortCategories(snapshot.docs.map((d) => d.data() as Category))
  }

  async saveCategory(input: CategoryInput): Promise<Category> {
    const categories = await this.listCategories()
    const existing = input.id ? categories.find((c) => c.id === input.id) : undefined
    const category: Category = toFirestoreData({
      ...input,
      id: input.id ?? newId(),
      name: input.name.trim(),
      order: input.order ?? existing?.order ?? Math.max(-1, ...categories.map((c) => c.order)) + 1,
      isSystem: existing?.isSystem || undefined,
      updatedAt: new Date().toISOString(),
    })
    this.write(setDoc(doc(this.categoriesCol(), category.id), category))
    return category
  }

  async deleteCategory(id: string): Promise<number> {
    const snapshot = await getDoc(doc(this.categoriesCol(), id))
    if (!snapshot.exists()) return 0
    if ((snapshot.data() as Category).isSystem || id === OTHER_CATEGORY_ID) {
      throw new SystemCategoryError()
    }
    const events = await getDocs(query(this.eventsCol(), where('categoryId', '==', id)))
    const now = new Date().toISOString()
    const batch = writeBatch(this.db)
    for (const d of events.docs) {
      batch.update(d.ref, { categoryId: OTHER_CATEGORY_ID, updatedAt: now })
    }
    batch.delete(snapshot.ref)
    this.write(batch.commit())
    return events.size
  }

  watchCategories(callback: (categories: Category[]) => void): Unsubscribe {
    return onSnapshot(
      this.categoriesCol(),
      (snapshot) => callback(sortCategories(snapshot.docs.map((d) => d.data() as Category))),
      this.onError,
    )
  }

  private toSettings(data: { settings?: Partial<Settings> } | undefined): Settings {
    return { ...createDefaultSettings(''), ...data?.settings }
  }

  async getSettings(): Promise<Settings> {
    const snapshot = await getDoc(this.userDoc)
    return this.toSettings(snapshot.data())
  }

  async saveSettings(patch: Partial<Omit<Settings, 'updatedAt'>>): Promise<Settings> {
    const next: Settings = {
      ...withBirthDeletion(await this.getSettings(), patch),
      updatedAt: new Date().toISOString(),
    }
    this.write(setDoc(this.userDoc, { settings: toFirestoreData(next) }, { merge: true }))
    return next
  }

  watchSettings(
    callback: (settings: Settings) => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe {
    return onSnapshot(
      this.userDoc,
      (snapshot) => callback(this.toSettings(snapshot.data())),
      (error) => {
        this.onError(error)
        onError?.(error)
      },
    )
  }

  /** Trạng thái đồng bộ: còn thay đổi chưa gửi lên server hay đang dùng cache offline. */
  watchSyncState(callback: SyncListener): Unsubscribe {
    return onSnapshot(
      this.eventsCol(),
      { includeMetadataChanges: true },
      (snapshot) =>
        callback(
          snapshot.metadata.hasPendingWrites
            ? 'pending'
            : snapshot.metadata.fromCache
              ? 'offline'
              : 'synced',
        ),
      this.onError,
    )
  }

  /** Xóa toàn bộ dữ liệu của người dùng trên cloud (đợi server xác nhận). */
  async deleteAllData(): Promise<void> {
    const [events, categories, tokens] = await Promise.all([
      getDocs(this.eventsCol()),
      getDocs(this.categoriesCol()),
      getDocs(collection(this.userDoc, 'pushTokens')),
    ])
    const refs = [...events.docs, ...tokens.docs].map((d) => d.ref)
    // Mỗi batch tối đa 500 thao tác.
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(this.db)
      for (const ref of refs.slice(i, i + 400)) batch.delete(ref)
      await batch.commit()
    }
    // Danh mục "Khác" chỉ xóa được cùng batch với hồ sơ (xem firestore.rules).
    const last = writeBatch(this.db)
    for (const d of categories.docs) last.delete(d.ref)
    last.delete(this.userDoc)
    await last.commit()
  }
}
