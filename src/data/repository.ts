import type { CalendarEvent, Category, Settings } from '@shared/types'

export type Unsubscribe = () => void

/** Dữ liệu đầu vào khi lưu sự kiện: id, createdAt, updatedAt do repository tự điền nếu thiếu. */
export type EventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<CalendarEvent, 'id' | 'createdAt'>>

export type CategoryInput = Omit<Category, 'id' | 'updatedAt' | 'order'> &
  Partial<Pick<Category, 'id' | 'order'>>

/**
 * Nơi lưu dữ liệu của app. Có 2 bản cài đặt: local (Dexie/IndexedDB) và cloud (Firestore).
 * Giao diện chỉ gọi qua interface này, không gọi thẳng Dexie hay Firestore.
 */
export interface CalendarRepository {
  readonly kind: 'local' | 'cloud'

  listEvents(): Promise<CalendarEvent[]>
  getEvent(id: string): Promise<CalendarEvent | undefined>
  saveEvent(event: EventInput): Promise<CalendarEvent>
  deleteEvent(id: string): Promise<void>
  /** Gọi callback mỗi khi danh sách sự kiện thay đổi (gọi ngay lần đầu). */
  watchEvents(callback: (events: CalendarEvent[]) => void): Unsubscribe

  listCategories(): Promise<Category[]>
  saveCategory(category: CategoryInput): Promise<Category>
  /**
   * Xóa danh mục và chuyển các sự kiện của nó sang "Khác".
   * Trả về số sự kiện đã chuyển. Báo lỗi nếu là danh mục hệ thống.
   */
  deleteCategory(id: string): Promise<number>
  watchCategories(callback: (categories: Category[]) => void): Unsubscribe

  getSettings(): Promise<Settings>
  saveSettings(patch: Partial<Omit<Settings, 'updatedAt'>>): Promise<Settings>
  watchSettings(callback: (settings: Settings) => void): Unsubscribe
}

export class SystemCategoryError extends Error {
  constructor() {
    super('Không xóa được danh mục "Khác".')
    this.name = 'SystemCategoryError'
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'))
}
