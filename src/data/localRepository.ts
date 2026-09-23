import { liveQuery } from 'dexie'
import type { CalendarEvent, Category, Settings } from '@shared/types'
import { EventValidationError, validateEvent } from '@shared/validation'
import { CalendarDatabase, SETTINGS_KEY, type SettingsRow } from './db'
import { createDefaultSettings, OTHER_CATEGORY_ID } from './defaultCategories'
import {
  newId,
  sortCategories,
  SystemCategoryError,
  type CalendarRepository,
  type CategoryInput,
  type EventInput,
  type Unsubscribe,
} from './repository'

function toSettings(row: SettingsRow | undefined): Settings {
  if (!row) return createDefaultSettings()
  const { key: _key, ...settings } = row
  return { ...createDefaultSettings(), ...settings }
}

function watch<T>(query: () => Promise<T>, callback: (value: T) => void): Unsubscribe {
  const subscription = liveQuery(query).subscribe({
    next: callback,
    error: (error) => console.error('Lỗi đọc dữ liệu local', error),
  })
  return () => subscription.unsubscribe()
}

/** Lưu dữ liệu trên máy bằng IndexedDB (Dexie). Dùng khi chưa đăng nhập. */
export class LocalRepository implements CalendarRepository {
  readonly kind = 'local' as const
  readonly db: CalendarDatabase

  constructor(db = new CalendarDatabase()) {
    this.db = db
  }

  listEvents(): Promise<CalendarEvent[]> {
    return this.db.events.toArray()
  }

  getEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.db.events.get(id)
  }

  async saveEvent(input: EventInput): Promise<CalendarEvent> {
    const errors = validateEvent(input)
    if (Object.keys(errors).length > 0) throw new EventValidationError(errors)
    const now = new Date().toISOString()
    const event: CalendarEvent = {
      ...input,
      id: input.id ?? newId(),
      title: input.title.trim(),
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    }
    await this.db.events.put(event)
    return event
  }

  async deleteEvent(id: string): Promise<void> {
    await this.db.events.delete(id)
  }

  watchEvents(callback: (events: CalendarEvent[]) => void): Unsubscribe {
    return watch(() => this.db.events.toArray(), callback)
  }

  async listCategories(): Promise<Category[]> {
    return sortCategories(await this.db.categories.toArray())
  }

  async saveCategory(input: CategoryInput): Promise<Category> {
    const existing = input.id ? await this.db.categories.get(input.id) : undefined
    const order =
      input.order ??
      existing?.order ??
      Math.max(-1, ...(await this.db.categories.toArray()).map((c) => c.order)) + 1
    const category: Category = {
      ...input,
      id: input.id ?? newId(),
      name: input.name.trim(),
      order,
      // Không cho đổi cờ hệ thống từ bên ngoài.
      isSystem: existing?.isSystem,
      updatedAt: new Date().toISOString(),
    }
    if (!category.isSystem) delete category.isSystem
    await this.db.categories.put(category)
    return category
  }

  async deleteCategory(id: string): Promise<number> {
    return this.db.transaction('rw', this.db.categories, this.db.events, async () => {
      const category = await this.db.categories.get(id)
      if (!category) return 0
      if (category.isSystem || id === OTHER_CATEGORY_ID) throw new SystemCategoryError()
      const now = new Date().toISOString()
      const moved = await this.db.events
        .where('categoryId')
        .equals(id)
        .modify({ categoryId: OTHER_CATEGORY_ID, updatedAt: now })
      await this.db.categories.delete(id)
      return moved
    })
  }

  watchCategories(callback: (categories: Category[]) => void): Unsubscribe {
    return watch(() => this.listCategories(), callback)
  }

  async getSettings(): Promise<Settings> {
    return toSettings(await this.db.settings.get(SETTINGS_KEY))
  }

  async saveSettings(patch: Partial<Omit<Settings, 'updatedAt'>>): Promise<Settings> {
    return this.db.transaction('rw', this.db.settings, async () => {
      const current = await this.getSettings()
      const next: Settings = { ...current, ...patch, updatedAt: new Date().toISOString() }
      await this.db.settings.put({ key: SETTINGS_KEY, ...next })
      return next
    })
  }

  watchSettings(callback: (settings: Settings) => void): Unsubscribe {
    return watch(() => this.getSettings(), callback)
  }

  /** Xóa toàn bộ dữ liệu local (dùng sau khi chuyển dữ liệu lên tài khoản). */
  async clearAll(): Promise<void> {
    await this.db.delete()
    await this.db.open()
  }
}
