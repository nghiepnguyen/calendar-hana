import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CalendarDatabase } from './db'
import {
  exportData,
  importData,
  ImportFormatError,
  parseImport,
  sanitizeSettings,
} from './exportImport'
import { LocalRepository } from './localRepository'
import type { EventInput } from './repository'

let a: LocalRepository
let b: LocalRepository
let counter = 0

beforeEach(() => {
  a = new LocalRepository(new CalendarDatabase(`export-a-${++counter}`))
  b = new LocalRepository(new CalendarDatabase(`export-b-${counter}`))
})

afterEach(async () => {
  await a.db.delete()
  await b.db.delete()
})

const gio: EventInput = {
  title: 'Giỗ ông nội',
  calendarType: 'lunar',
  date: { day: 12, month: 3, year: 2026, isLeap: false },
  allDay: true,
  categoryId: 'travel',
  recurrence: { freq: 'yearly', calendar: 'lunar' },
  reminders: [],
}

describe('parseImport', () => {
  it('từ chối file không phải JSON hoặc không phải của app', () => {
    expect(() => parseImport('không phải json')).toThrow(ImportFormatError)
    expect(() => parseImport('{"app":"khac","version":1}')).toThrow(ImportFormatError)
    expect(() => parseImport('{"app":"calendar-hana","version":99}')).toThrow(/phiên bản mới hơn/)
  })

  it('bỏ qua bản ghi không hợp lệ, giữ bản ghi đúng', () => {
    const parsed = parseImport(
      JSON.stringify({
        app: 'calendar-hana',
        version: 1,
        events: [
          { ...gio, id: 'ok', createdAt: '', updatedAt: '' },
          { id: 'hong', title: '' },
        ],
        categories: [{ id: 'c', name: '', color: '#000' }],
        settings: { theme: 'dark', weekStartsOn: 5, hack: true },
      }),
    )
    expect(parsed.file.events.map((e) => e.id)).toEqual(['ok'])
    expect(parsed.skipped).toBe(2)
    expect(parsed.file.settings).toEqual({ theme: 'dark' })
  })

  it('sanitizeSettings chỉ giữ khóa hợp lệ', () => {
    expect(
      sanitizeSettings({ allDayReminderTime: '07:30', hiddenCategoryIds: ['a', 1], theme: 'x' }),
    ).toEqual({ allDayReminderTime: '07:30', hiddenCategoryIds: ['a'] })
  })
})

describe('xuất rồi nhập', () => {
  it('gộp: giữ dữ liệu hiện có, nhập danh mục và sự kiện mới', async () => {
    await a.saveCategory({ id: 'travel', name: 'Du lịch', color: '#0891b2' })
    const event = await a.saveEvent(gio)
    const existing = await b.saveEvent({ ...gio, title: 'Có sẵn ở B', categoryId: 'work' })

    const file = parseImport(JSON.stringify(await exportData(a))).file
    expect(await importData(b, file, 'merge')).toMatchObject({ events: 1 })
    const events = await b.listEvents()
    expect(events.map((e) => e.id).sort()).toEqual([event.id, existing.id].sort())
    expect((await b.getEvent(event.id))?.categoryId).toBe('travel')
  })

  it('thay thế: xóa dữ liệu cũ, sự kiện thuộc danh mục không tồn tại chuyển về "Khác"', async () => {
    const event = await a.saveEvent({ ...gio, categoryId: 'da-xoa' })
    await b.saveEvent({ ...gio, title: 'Sẽ bị xóa', categoryId: 'work' })
    await b.saveCategory({ id: 'rieng', name: 'Riêng của B', color: '#000000' })

    const file = parseImport(JSON.stringify(await exportData(a))).file
    await importData(b, file, 'replace')
    const events = await b.listEvents()
    expect(events.map((e) => e.id)).toEqual([event.id])
    expect(events[0].categoryId).toBe('other')
    expect((await b.listCategories()).map((c) => c.id)).not.toContain('rieng')
  })
})
