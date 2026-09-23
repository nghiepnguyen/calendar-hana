import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEvent, ReminderChannel } from '@shared/types'
import type { ReminderInstance } from '@shared/reminders/nextReminder'
import { sendPush } from './push'
import {
  clearUserQueue,
  processDueReminders,
  QUEUE,
  queueDocId,
  syncEventQueue,
  type QueueDoc,
  type ReminderSender,
} from './queue'

const PROJECT = 'demo-calendar-hana'
let app: App
let db: Firestore

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT }, 'queue-test')
  db = getFirestore(app)
})

afterAll(async () => {
  await deleteApp(app)
})

beforeEach(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
  await fetch(`http://${host}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {
    method: 'DELETE',
  })
})

// 10:00 sáng 23/9/2026 giờ Việt Nam.
const NOW = new Date('2026-09-23T03:00:00Z')
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000)

function makeEvent(partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'meeting',
    title: 'Họp nhóm',
    calendarType: 'solar',
    date: '2026-09-23',
    allDay: false,
    startTime: '10:30',
    endTime: '11:30',
    categoryId: 'work',
    reminders: [{ offsetMinutes: 15, channel: 'notification' }],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...partial,
  }
}

async function saveEvent(uid: string, event: CalendarEvent) {
  await db.doc(`users/${uid}/events/${event.id}`).set(event)
  await syncEventQueue(db, uid, event.id, event, NOW)
}

async function queued(uid: string, eventId: string): Promise<QueueDoc | undefined> {
  const snap = await db.collection(QUEUE).doc(queueDocId(uid, eventId)).get()
  return snap.data() as QueueDoc | undefined
}

function recordingSender() {
  const calls: { uid: string; channel: ReminderChannel; instances: ReminderInstance[] }[] = []
  const sender: ReminderSender = {
    send: vi.fn(async (uid, channel, instances) => {
      calls.push({ uid, channel, instances })
    }),
  }
  return { sender, calls }
}

describe('reminderQueue', () => {
  it('tạo sự kiện thì có hàng đợi với lần nhắc kế tiếp', async () => {
    await db.doc('users/alice').set({ settings: { allDayReminderTime: '08:00' } })
    await saveEvent('alice', makeEvent())
    const doc = await queued('alice', 'meeting')
    expect(doc?.fireAt.toDate().toISOString()).toBe('2026-09-23T03:15:00.000Z')
    expect(doc?.items).toEqual([
      {
        occurrenceKey: '2026-09-23',
        date: '2026-09-23',
        channel: 'notification',
        offsetMinutes: 15,
      },
    ])
  })

  it('đến giờ thì gửi đúng 1 lần, kể cả khi hàm chạy chồng nhau', async () => {
    await saveEvent('alice', makeEvent())
    const { sender, calls } = recordingSender()
    expect(await processDueReminders(db, sender, minutes(10))).toBe(0)
    const results = await Promise.all([
      processDueReminders(db, sender, minutes(15)),
      processDueReminders(db, sender, minutes(15)),
    ])
    expect(results[0] + results[1]).toBe(1)
    await processDueReminders(db, sender, minutes(16))
    expect(calls).toHaveLength(1)
    expect(calls[0].channel).toBe('notification')
    expect(calls[0].instances[0].event.title).toBe('Họp nhóm')
    // Sự kiện không lặp: gửi xong thì hết hàng đợi.
    expect(await queued('alice', 'meeting')).toBeUndefined()
  })

  it('sự kiện lặp thì có lần nhắc kế tiếp sau khi gửi', async () => {
    await saveEvent(
      'alice',
      makeEvent({
        recurrence: { freq: 'weekly', calendar: 'solar' },
        reminders: [
          { offsetMinutes: 15, channel: 'notification' },
          { offsetMinutes: 15, channel: 'email' },
        ],
      }),
    )
    const { sender, calls } = recordingSender()
    await processDueReminders(db, sender, minutes(15))
    expect(calls.map((c) => c.channel)).toEqual(['notification', 'email'])
    const next = await queued('alice', 'meeting')
    expect(next?.fireAt.toDate().toISOString()).toBe('2026-09-30T03:15:00.000Z')
  })

  it('sự kiện cả ngày dùng giờ nhắc trong cài đặt của người dùng', async () => {
    await db.doc('users/bob').set({ settings: { allDayReminderTime: '07:30' } })
    const { startTime: _s, endTime: _e, ...base } = makeEvent()
    await saveEvent('bob', {
      ...base,
      id: 'gio',
      allDay: true,
      date: '2026-09-25',
      reminders: [{ offsetMinutes: 1440, channel: 'email' }],
    })
    expect((await queued('bob', 'gio'))?.fireAt.toDate().toISOString()).toBe(
      '2026-09-24T00:30:00.000Z',
    )
  })

  it('xóa sự kiện thì xóa hàng đợi; sự kiện bị xóa trước khi gửi thì không gửi', async () => {
    await saveEvent('alice', makeEvent())
    await syncEventQueue(db, 'alice', 'meeting', null, NOW)
    expect(await queued('alice', 'meeting')).toBeUndefined()

    await saveEvent('alice', makeEvent())
    await db.doc('users/alice/events/meeting').delete()
    const { sender, calls } = recordingSender()
    await processDueReminders(db, sender, minutes(15))
    expect(calls).toHaveLength(0)
    expect(await queued('alice', 'meeting')).toBeUndefined()
  })

  it('bỏ qua nhắc hẹn trễ quá 1 giờ nhưng vẫn tính lần kế tiếp', async () => {
    await saveEvent('alice', makeEvent({ recurrence: { freq: 'daily', calendar: 'solar' } }))
    const { sender, calls } = recordingSender()
    await processDueReminders(db, sender, minutes(15 + 90))
    expect(calls).toHaveLength(0)
    const next = await queued('alice', 'meeting')
    expect(next?.fireAt.toDate().toISOString()).toBe('2026-09-24T03:15:00.000Z')
  })

  it('xóa tài khoản thì dọn hàng đợi của người đó', async () => {
    await saveEvent('alice', makeEvent())
    await saveEvent('bob', makeEvent())
    await clearUserQueue(db, 'alice')
    expect(await queued('alice', 'meeting')).toBeUndefined()
    expect(await queued('bob', 'meeting')).toBeDefined()
  })
})

describe('sendPush', () => {
  it('gửi tới mọi token và xóa token hết hạn', async () => {
    await db.doc('users/alice/pushTokens/good').set({ token: 'good' })
    await db.doc('users/alice/pushTokens/dead').set({ token: 'dead' })
    const messaging = {
      sendEachForMulticast: vi.fn(async ({ tokens }: { tokens: string[] }) => ({
        successCount: 1,
        failureCount: 1,
        responses: tokens.map((t) =>
          t === 'dead'
            ? { success: false, error: { code: 'messaging/registration-token-not-registered' } }
            : { success: true },
        ),
      })),
    }
    const count = await sendPush(db, messaging as never, 'alice', {
      title: 'Họp nhóm',
      body: 'Hôm nay lúc 10:30, 13/8 âm lịch',
      tag: 'meeting|2026-09-23|15',
      url: '/day/2026-09-23',
    })
    expect(count).toBe(1)
    const remaining = await db.collection('users/alice/pushTokens').get()
    expect(remaining.docs.map((d) => d.id)).toEqual(['good'])
  })
})
