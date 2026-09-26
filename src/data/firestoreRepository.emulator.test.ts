import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { waitForPendingWrites, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarDatabase } from './db'
import { exportData, importData, parseImport } from './exportImport'
import { FirestoreRepository } from './firestoreRepository'
import { LocalRepository } from './localRepository'
import { hasLocalData } from './hasLocalData'
import { migrateLocalToCloud } from './migrateLocalToCloud'
import type { EventInput } from './repository'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-calendar-hana',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
})

afterAll(async () => {
  await env.cleanup()
})

const gio: EventInput = {
  title: 'Giỗ ông nội',
  calendarType: 'lunar',
  date: { day: 12, month: 3, year: 2026, isLeap: false },
  allDay: true,
  categoryId: 'memorial',
  recurrence: { freq: 'yearly', calendar: 'lunar' },
  reminders: [{ offsetMinutes: 1440, channel: 'email' }],
}

function cloudFor(uid: string, onError = vi.fn()) {
  const db = env.authenticatedContext(uid).firestore() as unknown as Firestore
  return { repo: new FirestoreRepository(db, uid, onError), db, onError }
}

let localCounter = 0
function newLocal() {
  return new LocalRepository(new CalendarDatabase(`emulator-local-${++localCounter}`))
}

describe('FirestoreRepository', () => {
  it('khởi tạo danh mục và cài đặt mặc định ở lần đầu', async () => {
    const { repo, db, onError } = cloudFor('alice')
    expect(await repo.ensureInitialized({ email: 'a@x.vn', displayName: 'Alice' })).toBe(true)
    await waitForPendingWrites(db)
    expect((await repo.listCategories()).map((c) => c.id)).toEqual([
      'work',
      'personal',
      'family',
      'memorial',
      'health',
      'other',
    ])
    expect((await repo.getSettings()).weekStartsOn).toBe(1)
    expect(await repo.ensureInitialized({ email: 'a@x.vn', displayName: 'Alice' })).toBe(false)
    expect(onError).not.toHaveBeenCalled()
  })

  it('lưu, đọc, xóa sự kiện; bỏ giá trị undefined trước khi ghi', async () => {
    const { repo, db, onError } = cloudFor('alice')
    const saved = await repo.saveEvent({ ...gio, note: undefined, exceptions: undefined })
    await waitForPendingWrites(db)
    expect(await repo.getEvent(saved.id)).toEqual(saved)
    expect('note' in saved).toBe(false)
    await repo.deleteEvent(saved.id)
    await waitForPendingWrites(db)
    expect(await repo.listEvents()).toEqual([])
    expect(onError).not.toHaveBeenCalled()
  })

  it('watchEvents nhận thay đổi', async () => {
    const { repo } = cloudFor('alice')
    const seen: number[] = []
    const stop = repo.watchEvents((events) => seen.push(events.length))
    await repo.saveEvent(gio)
    await vi.waitFor(() => expect(seen.at(-1)).toBe(1))
    stop()
  })

  it('xóa danh mục chuyển sự kiện sang "Khác", không xóa được "Khác"', async () => {
    const { repo, db } = cloudFor('alice')
    await repo.ensureInitialized({ email: null, displayName: null })
    await waitForPendingWrites(db)
    const a = await repo.saveEvent({ ...gio, categoryId: 'family' })
    await waitForPendingWrites(db)
    expect(await repo.deleteCategory('family')).toBe(1)
    await waitForPendingWrites(db)
    expect((await repo.getEvent(a.id))?.categoryId).toBe('other')
    await expect(repo.deleteCategory('other')).rejects.toThrow('Khác')
  })

  it('lưu cài đặt', async () => {
    const { repo, db } = cloudFor('alice')
    await repo.ensureInitialized({ email: null, displayName: null })
    expect(await repo.getSettings()).toMatchObject({ textSize: 'default', boldText: false })
    await repo.saveSettings({
      theme: 'dark',
      hiddenCategoryIds: ['work'],
      textSize: 'xlarge',
      boldText: true,
    })
    await waitForPendingWrites(db)
    expect(await repo.getSettings()).toMatchObject({
      theme: 'dark',
      hiddenCategoryIds: ['work'],
      showHolidays: true,
      textSize: 'xlarge',
      boldText: true,
    })
  })

  it('xóa toàn bộ dữ liệu tài khoản', async () => {
    const { repo, db } = cloudFor('alice')
    await repo.ensureInitialized({ email: null, displayName: null })
    await repo.saveEvent(gio)
    await waitForPendingWrites(db)
    await repo.deleteAllData()
    expect(await repo.listEvents()).toEqual([])
    expect(await repo.listCategories()).toEqual([])
  })
})

describe('migrateLocalToCloud', () => {
  it('chuyển sự kiện và danh mục lên cloud, rồi xóa local', async () => {
    const local = newLocal()
    const { repo: cloud, db } = cloudFor('alice')
    await cloud.ensureInitialized({ email: null, displayName: null })
    await waitForPendingWrites(db)

    expect(await hasLocalData(local)).toBe(false)
    const e1 = await local.saveEvent(gio)
    const e2 = await local.saveEvent({ ...gio, title: 'Rằm', recurrence: undefined })
    await local.saveCategory({ name: 'Du lịch', color: '#0891b2', id: 'travel' })
    expect(await hasLocalData(local)).toBe(true)

    const result = await migrateLocalToCloud(local, cloud)
    expect(result.events).toBe(2)

    const cloudEvents = await cloud.listEvents()
    expect(cloudEvents.map((e) => e.id).sort()).toEqual([e1.id, e2.id].sort())
    expect((await cloud.listCategories()).map((c) => c.id)).toContain('travel')
    // Local đã được xóa và trở về mặc định.
    expect(await local.listEvents()).toEqual([])
    expect(await hasLocalData(local)).toBe(false)
    await local.db.delete()
  })
})

describe('xuất / nhập dữ liệu', () => {
  it('xuất từ local rồi nhập vào cloud (gộp), nhập lại lần nữa không nhân đôi', async () => {
    const local = newLocal()
    await local.saveEvent(gio)
    await local.saveCategory({ id: 'travel', name: 'Du lịch', color: '#0891b2' })
    const text = JSON.stringify(await exportData(local))

    const { repo: cloud, db } = cloudFor('bob')
    await cloud.ensureInitialized({ email: null, displayName: null })
    const parsed = parseImport(text)
    expect(parsed.skipped).toBe(0)
    await importData(cloud, parsed.file, 'merge')
    await waitForPendingWrites(db)
    expect(await cloud.listEvents()).toHaveLength(1)
    await importData(cloud, parsed.file, 'merge')
    await waitForPendingWrites(db)
    expect(await cloud.listEvents()).toHaveLength(1)
    expect((await cloud.listCategories()).map((c) => c.id)).toContain('travel')
    await local.db.delete()
  })
})
