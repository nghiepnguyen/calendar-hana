import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

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

const event = {
  id: 'e1',
  title: 'Giỗ ông nội',
  calendarType: 'lunar',
  date: { day: 12, month: 3, year: 2026, isLeap: false },
  allDay: true,
  categoryId: 'memorial',
  reminders: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const category = {
  id: 'travel',
  name: 'Du lịch',
  color: '#0891b2',
  order: 6,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('firestore.rules', () => {
  it('người dùng đọc/ghi được dữ liệu của mình', async () => {
    const db = env.authenticatedContext('alice').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'users/alice'), {
        email: 'alice@example.com',
        displayName: 'Alice',
        createdAt: '2026-01-01T00:00:00.000Z',
        settings: {},
      }),
    )
    await assertSucceeds(setDoc(doc(db, 'users/alice/events/e1'), event))
    await assertSucceeds(getDoc(doc(db, 'users/alice/events/e1')))
    await assertSucceeds(setDoc(doc(db, 'users/alice/categories/travel'), category))
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/events/e1')))
  })

  it('hồ sơ không nhận field lạ và không cho sửa createdAt', async () => {
    const db = env.authenticatedContext('alice').firestore()
    const path = 'users/alice'
    await assertSucceeds(
      setDoc(doc(db, path), {
        email: 'alice@example.com',
        displayName: 'Alice',
        createdAt: '2026-01-01T00:00:00.000Z',
        settings: {},
      }),
    )
    await assertFails(setDoc(doc(db, path), { settings: {}, admin: true }))
    await assertFails(
      setDoc(doc(db, path), {
        email: 'alice@example.com',
        displayName: 'Alice',
        createdAt: '2026-02-01T00:00:00.000Z',
        settings: {},
      }),
    )
  })

  it('không đọc/ghi được dữ liệu của người khác hoặc khi chưa đăng nhập', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice/events/e1'), event)
    })
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(getDoc(doc(bob, 'users/alice/events/e1')))
    await assertFails(setDoc(doc(bob, 'users/alice/events/e2'), { ...event, id: 'e2' }))
    await assertFails(getDoc(doc(bob, 'users/alice')))
    const anon = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, 'users/alice/events/e1')))
  })

  it('từ chối sự kiện không hợp lệ', async () => {
    const db = env.authenticatedContext('alice').firestore()
    const path = 'users/alice/events/e1'
    await assertFails(setDoc(doc(db, path), { ...event, title: '' }))
    await assertFails(setDoc(doc(db, path), { ...event, title: 'a'.repeat(201) }))
    await assertFails(setDoc(doc(db, path), { ...event, note: 'a'.repeat(2001) }))
    await assertFails(setDoc(doc(db, path), { ...event, id: 'khac' }))
    await assertFails(setDoc(doc(db, path), { ...event, calendarType: 'moon' }))
    await assertFails(
      setDoc(doc(db, path), { ...event, reminders: Array(6).fill({ offsetMinutes: 0 }) }),
    )
  })

  it('không xóa được danh mục hệ thống', async () => {
    const db = env.authenticatedContext('alice').firestore()
    await setDoc(doc(db, 'users/alice'), { settings: {} })
    await setDoc(doc(db, 'users/alice/categories/other'), {
      ...category,
      id: 'other',
      name: 'Khác',
      isSystem: true,
    })
    await assertFails(deleteDoc(doc(db, 'users/alice/categories/other')))
    await setDoc(doc(db, 'users/alice/categories/travel'), category)
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/categories/travel')))
  })

  it('xóa được "Khác" khi xóa cả hồ sơ trong cùng batch (xóa tài khoản)', async () => {
    const db = env.authenticatedContext('alice').firestore()
    await setDoc(doc(db, 'users/alice'), { settings: {} })
    await setDoc(doc(db, 'users/alice/categories/other'), {
      ...category,
      id: 'other',
      name: 'Khác',
      isSystem: true,
    })
    const batch = writeBatch(db)
    batch.delete(doc(db, 'users/alice/categories/other'))
    batch.delete(doc(db, 'users/alice'))
    await assertSucceeds(batch.commit())
  })

  it('push token: id phải trùng token, không thêm trường lạ', async () => {
    const db = env.authenticatedContext('alice').firestore()
    const data = { token: 'tok:1', userAgent: 'Chrome', updatedAt: '2026-09-23T00:00:00.000Z' }
    await assertSucceeds(setDoc(doc(db, 'users/alice/pushTokens/tok:1'), data))
    await assertFails(setDoc(doc(db, 'users/alice/pushTokens/other'), data))
    await assertFails(setDoc(doc(db, 'users/alice/pushTokens/tok:1'), { ...data, admin: true }))
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/pushTokens/tok:1')))
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(setDoc(doc(bob, 'users/alice/pushTokens/tok:1'), data))
  })

  it('client không truy cập được hàng đợi nhắc hẹn', async () => {
    const db = env.authenticatedContext('alice').firestore()
    await assertFails(getDoc(doc(db, 'reminderQueue/x')))
    await assertFails(setDoc(doc(db, 'reminderQueue/x'), { uid: 'alice' }))
  })
})
