import type { CalendarEvent, Category, Settings, SolarDateString } from '@shared/types'
import { todayInVietnam } from '@shared/time'
import { isValidEvent } from '@shared/validation'
import { isValidBirthDate, isValidBirthPlace, isValidBirthTime } from '@shared/birthInfo'
import { OTHER_CATEGORY_ID } from './defaultCategories'
import type { InteropContext } from './interop/common'
import { exportGoogleCsv, parseGoogleCsv } from './interop/googleCsv'
import { exportIcs, parseIcs } from './interop/ics'
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

/** Tên file theo ngày Việt Nam (xuất lúc sáng sớm vẫn đúng ngày). */
export function exportFileName(
  date = new Date(),
  extension: 'json' | 'ics' | 'csv' = 'json',
): string {
  return `lich-hana-${todayInVietnam(date)}.${extension}`
}

/** Tải file xuống máy. */
export function downloadFile(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Tải file JSON xuống máy. */
export function downloadJson(data: unknown, fileName: string): void {
  downloadFile(JSON.stringify(data, null, 2), fileName, 'application/json')
}

export class ImportFormatError extends Error {
  constructor(message = 'File không đúng định dạng sao lưu của Lịch Việt.') {
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
  if (raw.birthDate === null || isValidBirthDate(raw.birthDate)) result.birthDate = raw.birthDate
  if (raw.birthTime === null || isValidBirthTime(raw.birthTime)) result.birthTime = raw.birthTime
  if (isValidBirthDate(raw.birthDate)) {
    if (
      raw.birthTimePrecision === null ||
      raw.birthTimePrecision === 'exact' ||
      raw.birthTimePrecision === 'estimated' ||
      raw.birthTimePrecision === 'unknown'
    )
      result.birthTimePrecision = raw.birthTimePrecision
    if (
      raw.birthTimeUncertaintyMinutes === null ||
      (typeof raw.birthTimeUncertaintyMinutes === 'number' &&
        Number.isFinite(raw.birthTimeUncertaintyMinutes) &&
        raw.birthTimeUncertaintyMinutes >= 0)
    )
      result.birthTimeUncertaintyMinutes = raw.birthTimeUncertaintyMinutes as number | null
    if (raw.birthPlace === null || isValidBirthPlace(raw.birthPlace))
      result.birthPlace = raw.birthPlace
    if (
      raw.birthTimezoneId === null ||
      raw.birthTimezoneId === 'Asia/Ho_Chi_Minh' ||
      raw.birthTimezoneId === 'Asia/Bangkok'
    )
      result.birthTimezoneId = raw.birthTimezoneId
    if (
      raw.birthTimezoneSource === null ||
      raw.birthTimezoneSource === 'bundledMapping' ||
      raw.birthTimezoneSource === 'userConfirmed'
    )
      result.birthTimezoneSource = raw.birthTimezoneSource
    if (
      raw.birthConfirmedOffsetMinutes === null ||
      (typeof raw.birthConfirmedOffsetMinutes === 'number' &&
        Number.isInteger(raw.birthConfirmedOffsetMinutes) &&
        Math.abs(raw.birthConfirmedOffsetMinutes) <= 840)
    )
      result.birthConfirmedOffsetMinutes = raw.birthConfirmedOffsetMinutes as number | null
    if (
      raw.birthZiPolicy === null ||
      raw.birthZiPolicy === 'splitZi' ||
      raw.birthZiPolicy === 'dayStartsAt23'
    )
      result.birthZiPolicy = raw.birthZiPolicy
    if (raw.birthGender === null || raw.birthGender === 'male' || raw.birthGender === 'female')
      result.birthGender = raw.birthGender
  }
  if (raw.weekStartsOn === 0 || raw.weekStartsOn === 1) result.weekStartsOn = raw.weekStartsOn
  if (typeof raw.showHolidays === 'boolean') result.showHolidays = raw.showHolidays
  if (typeof raw.showAuspicious === 'boolean') result.showAuspicious = raw.showAuspicious
  if (typeof raw.showPersonalFengShui === 'boolean')
    result.showPersonalFengShui = raw.showPersonalFengShui
  if (typeof raw.allDayReminderTime === 'string' && /^\d{2}:\d{2}$/.test(raw.allDayReminderTime)) {
    result.allDayReminderTime = raw.allDayReminderTime
  }
  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system')
    result.theme = raw.theme
  if (raw.textSize === 'default' || raw.textSize === 'large' || raw.textSize === 'xlarge')
    result.textSize = raw.textSize
  if (typeof raw.boldText === 'boolean') result.boldText = raw.boldText
  if (Array.isArray(raw.hiddenCategoryIds)) {
    result.hiddenCategoryIds = raw.hiddenCategoryIds.filter(
      (x): x is string => typeof x === 'string',
    )
  }
  return result
}

export type ImportFormat = 'json' | 'ics' | 'csv'

export interface ParsedImport {
  format: ImportFormat
  file: ExportFile
  /** Số bản ghi bị bỏ qua vì không hợp lệ. */
  skipped: number
  /** ICS: sự kiện lặp có quy tắc app không hỗ trợ, chỉ nhập lần đầu. */
  simplified: number
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
    format: 'json',
    simplified: 0,
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

/** Nhận biết định dạng theo đuôi file, không có đuôi quen thì theo nội dung. */
export function detectFormat(fileName: string, text: string): ImportFormat {
  const extension = fileName.toLowerCase().split('.').pop()
  if (extension === 'ics' || extension === 'ical' || extension === 'ifb') return 'ics'
  if (extension === 'csv') return 'csv'
  if (extension === 'json') return 'json'
  const start = text.replace(/^\uFEFF/, '').trimStart()
  if (start.startsWith('BEGIN:VCALENDAR')) return 'ics'
  return start.startsWith('{') ? 'json' : 'csv'
}

/**
 * Đọc file sao lưu JSON của app, file .ics hoặc .csv (Google Calendar). ICS / CSV chỉ có sự
 * kiện, không có danh mục và cài đặt.
 */
export function parseImportFile(fileName: string, text: string, ctx: InteropContext): ParsedImport {
  const format = detectFormat(fileName, text)
  if (format === 'json') return parseImport(text)
  const parsed = format === 'ics' ? parseIcs(text, ctx) : parseGoogleCsv(text)
  if (parsed.events.length === 0 && parsed.skipped === 0) {
    throw new ImportFormatError('File không có sự kiện nào.')
  }
  return {
    format,
    file: {
      app: EXPORT_APP,
      version: EXPORT_VERSION,
      exportedAt: '',
      events: parsed.events,
      categories: [],
      settings: {} as Settings,
    },
    skipped: parsed.skipped,
    simplified: parsed.simplified,
  }
}

/** File .ics chứa toàn bộ sự kiện. */
export function toIcs(data: ExportFile, today: SolarDateString): string {
  return exportIcs(
    {
      events: data.events,
      categories: data.categories,
      allDayTime: data.settings.allDayReminderTime,
    },
    today,
  )
}

/** File .csv theo mẫu Google Calendar. */
export function toGoogleCsv(data: ExportFile, today: SolarDateString): string {
  return exportGoogleCsv(data.events, today)
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
