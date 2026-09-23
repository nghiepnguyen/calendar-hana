import Dexie, { type EntityTable } from 'dexie'
import type { CalendarEvent, Category, Settings } from '@shared/types'
import { createDefaultCategories, createDefaultSettings } from './defaultCategories'

export const SETTINGS_KEY = 'settings'

export type SettingsRow = Settings & { key: typeof SETTINGS_KEY }

export class CalendarDatabase extends Dexie {
  events!: EntityTable<CalendarEvent, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<SettingsRow, 'key'>

  constructor(name = 'calendar-hana') {
    super(name)
    this.version(1).stores({
      events: 'id, categoryId, updatedAt',
      categories: 'id, order',
      settings: 'key',
    })
    // Chạy một lần khi database được tạo lần đầu.
    this.on('populate', (tx) => {
      const now = new Date().toISOString()
      tx.table('categories').bulkAdd(createDefaultCategories(now))
      tx.table('settings').add({ key: SETTINGS_KEY, ...createDefaultSettings(now) })
    })
  }
}
