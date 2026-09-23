import type { CalendarEvent, Category, Settings } from '@shared/types'
import { isValidEvent } from '@shared/validation'
import { OTHER_CATEGORY_ID } from './defaultCategories'
import type { CalendarRepository } from './repository'

export const EXPORT_APP = 'calendar-hana'
export const EXPORT_VERSION = 1

export interface ExportFile {
  app: typeof EXPORT_APP
  version: number
  exportedAt: string
  events: CalendarEvent[]
  categories: Category[]
  settings: Settings
}

export async function exportData(repository: CalendarRepository): Promise<ExportFile> {
  const [events, categories, settings] = await Promise.all([
    repository.listEvents(),
    repository.listCategories(),
    repository.getSettings(),
  ])
  return {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    events,
    categories,
    settings,
  }
}

export function exportFileName(date = new Date()): string {
  return `lich-hana-${date.toISOString().slice(0, 10)}.json`
}

/** Tải file JSON xuống máy. */
export function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export class ImportFormatError extends Error {
  constructor(message = 'File không đúng định dạng sao lưu của Lịch Hana.') {
    super(message)
    this.name = 'ImportFormatError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCategory(value: unknown): value is Category {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.color === 'string'
  )
}

function isEvent(value: unknown): value is CalendarEvent {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    Array.isArray(value.reminders) &&
    isValidEvent(value as unknown as CalendarEvent)
  )
}

/** Chỉ giữ các khóa cài đặt hợp lệ, đúng kiểu. */
export function sanitizeSettings(raw: unknown): Partial<Omit<Settings, 'updatedAt'>> {
  if (!isObject(raw)) return {}
  const result: Partial<Omit<Settings, 'updatedAt'>> = {}
  if (raw.weekStartsOn === 0 || raw.weekStartsOn === 1) result.weekStartsOn = raw.weekStartsOn
  if (typeof raw.showHolidays === 'boolean') result.showHolidays = raw.showHolidays
  if (typeof raw.showAuspicious === 'boolean') result.showAuspicious = raw.showAuspicious
  if (typeof raw.allDayReminderTime === 'string' && /^\d{2}:\d{2}$/.test(raw.allDayReminderTime)) {
    result.allDayReminderTime = raw.allDayReminderTime
  }
  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system')
    result.theme = raw.theme
  if (Array.isArray(raw.hiddenCategoryIds)) {
    result.hiddenCategoryIds = raw.hiddenCategoryIds.filter(
      (x): x is string => typeof x === 'string',
    )
  }
  return result
}

export interface ParsedImport {
  file: ExportFile
  /** Số bản ghi bị bỏ qua vì không hợp lệ. */
  skipped: number
}

/** Đọc và kiểm tra nội dung file. Bỏ qua từng bản ghi sai thay vì từ chối cả file. */
export function parseImport(text: string): ParsedImport {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ImportFormatError('File không phải JSON hợp lệ.')
  }
  if (!isObject(raw) || raw.app !== EXPORT_APP || typeof raw.version !== 'number') {
    throw new ImportFormatError()
  }
  if (raw.version > EXPORT_VERSION) {
    throw new ImportFormatError('File được tạo từ phiên bản mới hơn của app. Hãy cập nhật app.')
  }
  const rawEvents = Array.isArray(raw.events) ? raw.events : []
  const rawCategories = Array.isArray(raw.categories) ? raw.categories : []
  const events = rawEvents.filter(isEvent)
  const categories = rawCategories.filter(isCategory)
  return {
    file: {
      app: EXPORT_APP,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      events,
      categories,
      settings: sanitizeSettings(raw.settings) as Settings,
    },
    skipped: rawEvents.length - events.length + (rawCategories.length - categories.length),
  }
}

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  events: number
  categories: number
}

/**
 * Nhập dữ liệu.
 * - 'merge': thêm mới hoặc ghi đè bản ghi cùng id nếu bản trong file mới hơn.
 * - 'replace': xóa hết sự kiện và danh mục (trừ "Khác") rồi nhập lại từ file.
 */
export async function importData(
  repository: CalendarRepository,
  file: ExportFile,
  mode: ImportMode,
): Promise<ImportResult> {
  const [currentEvents, currentCategories] = await Promise.all([
    repository.listEvents(),
    repository.listCategories(),
  ])

  if (mode === 'replace') {
    for (const event of currentEvents) await repository.deleteEvent(event.id)
    const keep = new Set(file.categories.map((c) => c.id))
    for (const category of currentCategories) {
      if (!category.isSystem && !keep.has(category.id)) await repository.deleteCategory(category.id)
    }
  }

  const existingEvents = new Map((mode === 'replace' ? [] : currentEvents).map((e) => [e.id, e]))
  const existingCategories = new Map(currentCategories.map((c) => [c.id, c]))

  let categories = 0
  for (const category of file.categories) {
    const existing = existingCategories.get(category.id)
    if (mode === 'merge' && existing && existing.updatedAt >= category.updatedAt) continue
    await repository.saveCategory({
      id: category.id,
      name: category.name,
      color: category.color,
      order: category.order,
    })
    categories++
  }

  // Sự kiện thuộc danh mục không còn tồn tại thì chuyển về "Khác".
  const knownCategories = new Set([
    ...(mode === 'replace' ? currentCategories.filter((c) => c.isSystem) : currentCategories).map(
      (c) => c.id,
    ),
    ...file.categories.map((c) => c.id),
    OTHER_CATEGORY_ID,
  ])

  let events = 0
  for (const event of file.events) {
    const existing = existingEvents.get(event.id)
    if (existing && existing.updatedAt >= event.updatedAt) continue
    const { updatedAt: _updatedAt, ...input } = event
    await repository.saveEvent({
      ...input,
      categoryId: knownCategories.has(input.categoryId) ? input.categoryId : OTHER_CATEGORY_ID,
    })
    events++
  }

  if (mode === 'replace' && Object.keys(file.settings).length > 0) {
    await repository.saveSettings(sanitizeSettings(file.settings))
  }

  return { events, categories }
}
