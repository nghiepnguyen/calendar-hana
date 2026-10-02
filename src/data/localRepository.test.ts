import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventValidationError } from '@shared/validation'
import { CalendarDatabase, SETTINGS_KEY, type SettingsRow } from './db'
import { LocalRepository } from './localRepository'
import { SystemCategoryError, type EventInput } from './repository'

const baseEvent: EventInput = {
  title: 'Giỗ ông nội',
  calendarType: 'lunar',
  date: { day: 12, month: 3, year: 2026, isLeap: false },
  allDay: true,
  categoryId: 'memorial',
  recurrence: { freq: 'yearly', calendar: 'lunar' },
  reminders: [{ offsetMinutes: 1440, channel: 'notification' }],
}

let repo: LocalRepository
let dbCounter = 0

beforeEach(() => {
  // Mỗi test dùng một database riêng để không ảnh hưởng nhau.
  repo = new LocalRepository(new CalendarDatabase(`test-${++dbCounter}`))
})

afterEach(async () => {
  await repo.db.delete()
})

describe('LocalRepository — danh mục và cài đặt mặc định', () => {
  it('tạo 6 danh mục mặc định ở lần mở đầu, theo đúng thứ tự', async () => {
    const categories = await repo.listCategories()
    expect(categories.map((c) => c.name)).toEqual([
      'Công việc',
      'Cá nhân',
      'Gia đình',
      'Giỗ/Lễ',
      'Sức khỏe',
      'Khác',
    ])
    expect(categories.find((c) => c.id === 'other')?.isSystem).toBe(true)
  })

  it('có cài đặt mặc định và lưu được thay đổi', async () => {
    expect(await repo.getSettings()).toMatchObject({
      weekStartsOn: 1,
      showHolidays: true,
      allDayReminderTime: '08:00',
      theme: 'system',
    })
    await repo.saveSettings({ weekStartsOn: 0, theme: 'dark' })
    expect(await repo.getSettings()).toMatchObject({
      weekStartsOn: 0,
      theme: 'dark',
      showHolidays: true,
    })
  })

  it('bản ghi cài đặt cũ chưa có cỡ chữ thì dùng mặc định, giữ các trường khác', async () => {
    const row = await repo.db.settings.get(SETTINGS_KEY)
    const { textSize: _t, boldText: _b, ...old } = row!
    await repo.db.settings.put({ ...old, theme: 'dark' } as SettingsRow)
    expect(await repo.getSettings()).toMatchObject({
      theme: 'dark',
      textSize: 'default',
      boldText: false,
    })
    await repo.saveSettings({ textSize: 'xlarge', boldText: true })
    expect(await repo.getSettings()).toMatchObject({ textSize: 'xlarge', boldText: true })
  })

  it('xóa ngày sinh thì xóa toàn bộ metadata Bát Tự liên đới', async () => {
    await repo.saveSettings({
      birthDate: '2000-02-29',
      birthTime: '23:45',
      birthTimePrecision: 'exact',
      birthTimeUncertaintyMinutes: 0,
      birthPlace: {
        countryCode: 'VN',
        subdivisionCode: 'VN-SG',
        label: 'TP. Hồ Chí Minh',
        latitude: 10.76,
        longitude: 106.66,
        coordinateSource: 'bundledGazetteer',
        coordinateAccuracyKm: 10,
      },
      birthTimezoneId: 'Asia/Ho_Chi_Minh',
      birthTimezoneSource: 'bundledMapping',
      birthZiPolicy: 'splitZi',
      birthGender: 'female',
    })
    const deleted = await repo.saveSettings({ birthDate: null })
    expect(deleted).toMatchObject({
      birthDate: null,
      birthTime: null,
      birthPlace: null,
      birthTimezoneId: null,
      birthTimePrecision: null,
      birthZiPolicy: null,
      birthGender: null,
    })
  })
})

describe('LocalRepository — sự kiện', () => {
  it('tạo, đọc, sửa, xóa', async () => {
    const created = await repo.saveEvent(baseEvent)
    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBe(created.updatedAt)
    expect(await repo.getEvent(created.id)).toEqual(created)

    await new Promise((r) => setTimeout(r, 5))
    const updated = await repo.saveEvent({ ...created, title: '  Giỗ ông nội (nhà bác)  ' })
    expect(updated.title).toBe('Giỗ ông nội (nhà bác)')
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await repo.listEvents()).toHaveLength(1)

    await repo.deleteEvent(created.id)
    expect(await repo.listEvents()).toEqual([])
  })

  it('không lưu sự kiện không hợp lệ', async () => {
    await expect(repo.saveEvent({ ...baseEvent, title: '   ' })).rejects.toBeInstanceOf(
      EventValidationError,
    )
    await expect(
      repo.saveEvent({ ...baseEvent, date: { day: 1, month: 4, year: 2026, isLeap: true } }),
    ).rejects.toThrow(/nhuận/)
  })

  it('watchEvents gọi lại khi dữ liệu thay đổi', async () => {
    const seen: number[] = []
    const unsubscribe = repo.watchEvents((events) => seen.push(events.length))
    await vi.waitFor(() => expect(seen).toHaveLength(1))
    await repo.saveEvent(baseEvent)
    await vi.waitFor(() => expect(seen.at(-1)).toBe(1))
    unsubscribe()
    expect(seen[0]).toBe(0)
  })
})

describe('LocalRepository — xóa danh mục', () => {
  it('chuyển sự kiện của danh mục bị xóa sang "Khác"', async () => {
    const category = await repo.saveCategory({ name: 'Du lịch', color: '#0891b2' })
    expect(category.order).toBe(6)
    const a = await repo.saveEvent({ ...baseEvent, categoryId: category.id })
    const b = await repo.saveEvent({ ...baseEvent, categoryId: category.id })
    const c = await repo.saveEvent({ ...baseEvent, categoryId: 'work' })

    expect(await repo.deleteCategory(category.id)).toBe(2)
    expect((await repo.getEvent(a.id))?.categoryId).toBe('other')
    expect((await repo.getEvent(b.id))?.categoryId).toBe('other')
    expect((await repo.getEvent(c.id))?.categoryId).toBe('work')
    expect((await repo.listCategories()).map((x) => x.id)).not.toContain(category.id)
  })

  it('không cho xóa danh mục "Khác" và không cho gỡ cờ hệ thống', async () => {
    await expect(repo.deleteCategory('other')).rejects.toBeInstanceOf(SystemCategoryError)
    const renamed = await repo.saveCategory({ id: 'other', name: 'Linh tinh', color: '#475569' })
    expect(renamed).toMatchObject({ name: 'Linh tinh', isSystem: true, order: 5 })
  })
})
