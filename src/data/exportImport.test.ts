import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CalendarDatabase } from './db'
import {
  detectFormat,
  exportData,
  importData,
  ImportFormatError,
  parseImport,
  parseImportFile,
  sanitizeSettings,
  toGoogleCsv,
  toIcs,
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

  it('sanitizeSettings nhận cỡ chữ hợp lệ, bỏ giá trị lạ', () => {
    expect(sanitizeSettings({ textSize: 'xlarge', boldText: true })).toEqual({
      textSize: 'xlarge',
      boldText: true,
    })
    expect(sanitizeSettings({ textSize: 'huge', boldText: 'yes' })).toEqual({})
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

describe('ICS và CSV', () => {
  const ctx = async (repo: LocalRepository) => ({
    categories: await repo.listCategories(),
    allDayReminderTime: '08:00',
  })

  it('nhận biết định dạng theo đuôi file, rồi theo nội dung', () => {
    expect(detectFormat('google.ics', '')).toBe('ics')
    expect(detectFormat('lich.CSV', '')).toBe('csv')
    expect(detectFormat('backup', '{"app":"calendar-hana"}')).toBe('json')
    expect(detectFormat('tai-xuong', 'BEGIN:VCALENDAR\r\n')).toBe('ics')
    expect(detectFormat('tai-xuong', 'Subject,Start Date')).toBe('csv')
  })

  it('xuất ICS từ app này rồi nhập vào app khác; nhập lại không tạo bản trùng', async () => {
    await a.saveEvent({ ...gio, categoryId: 'family' })
    await a.saveEvent({
      title: 'Họp team',
      calendarType: 'solar',
      date: '2026-09-21',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      categoryId: 'work',
      recurrence: { freq: 'weekly', calendar: 'solar' },
      reminders: [],
    })
    const ics = toIcs(await exportData(a), '2026-09-25')

    const parsed = parseImportFile('lich.ics', ics, await ctx(b))
    expect(parsed.format).toBe('ics')
    await importData(b, parsed.file, 'merge')
    const events = await b.listEvents()
    const weekly = events.find((e) => e.title === 'Họp team')
    expect(weekly?.recurrence).toEqual({ freq: 'weekly', calendar: 'solar' })
    expect(weekly?.categoryId).toBe('work')
    // Giỗ âm lịch được trải ra từng năm (2026 → 2036).
    expect(events.filter((e) => e.title === 'Giỗ ông nội')).toHaveLength(11)

    const again = await importData(b, parseImportFile('lich.ics', ics, await ctx(b)).file, 'merge')
    expect(again.events).toBe(0)
    expect(await b.listEvents()).toHaveLength(events.length)
  })

  it('CSV chỉ có sự kiện, không nhận file rỗng', async () => {
    await a.saveEvent({ ...gio, categoryId: 'family' })
    const csv = toGoogleCsv(await exportData(a), '2026-09-25')
    const parsed = parseImportFile('lich.csv', csv, await ctx(b))
    expect(parsed.format).toBe('csv')
    expect(parsed.file.categories).toEqual([])
    expect(parsed.file.events.length).toBeGreaterThan(0)
    expect(() =>
      parseImportFile('rong.csv', 'Subject,Start Date\r\n', {
        categories: [],
        allDayReminderTime: '08:00',
      }),
    ).toThrow(ImportFormatError)
  })
})
