// Hàng đợi nhắc hẹn phía server: mỗi sự kiện có tối đa 1 document trong reminderQueue,
// giữ nhóm nhắc hẹn kế tiếp (các nhắc hẹn cùng thời điểm gửi). Gửi xong thì tính nhóm kế tiếp.

import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { nextReminderBatch, type ReminderInstance } from '@shared/reminders/nextReminder'
import type { CalendarEvent, ReminderChannel, TimeString } from '@shared/types'

export const QUEUE = 'reminderQueue'
/** Nhắc hẹn trễ quá mức này (server gián đoạn) thì bỏ qua, không gửi nữa. */
export const LATE_LIMIT_MS = 60 * 60_000
const DEFAULT_ALL_DAY_TIME: TimeString = '08:00'

export interface QueueItem {
  occurrenceKey: string
  date: string
  channel: ReminderChannel
  offsetMinutes: number
}

export interface QueueDoc {
  uid: string
  eventId: string
  fireAt: Timestamp
  items: QueueItem[]
}

/** Nơi gửi nhắc hẹn thật sự (push / email); tách ra để test. */
export interface ReminderSender {
  send(uid: string, channel: ReminderChannel, instances: ReminderInstance[]): Promise<void>
}

export function queueDocId(uid: string, eventId: string): string {
  return `${uid}__${eventId}`
}

async function allDayReminderTime(db: Firestore, uid: string): Promise<TimeString> {
  const snapshot = await db.doc(`users/${uid}`).get()
  const time = snapshot.get('settings.allDayReminderTime')
  return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time) ? time : DEFAULT_ALL_DAY_TIME
}

function toQueueDoc(uid: string, eventId: string, instances: ReminderInstance[], fireAt: Date) {
  return {
    uid,
    eventId,
    fireAt: Timestamp.fromDate(fireAt),
    items: instances.map<QueueItem>((i) => ({
      occurrenceKey: i.occurrenceKey,
      date: i.date,
      channel: i.reminder.channel,
      offsetMinutes: i.reminder.offsetMinutes,
    })),
  } satisfies QueueDoc
}

/**
 * Cập nhật hàng đợi của một sự kiện sau khi sự kiện được tạo / sửa / xóa.
 * event = null nghĩa là sự kiện đã bị xóa.
 */
export async function syncEventQueue(
  db: Firestore,
  uid: string,
  eventId: string,
  event: CalendarEvent | null,
  now: Date = new Date(),
): Promise<void> {
  const ref = db.collection(QUEUE).doc(queueDocId(uid, eventId))
  if (!event) {
    await ref.delete()
    return
  }
  const batch = safeNextBatch(event, now, await allDayReminderTime(db, uid))
  if (!batch) await ref.delete()
  else await ref.set(toQueueDoc(uid, eventId, batch.instances, batch.fireAt))
}

/** Tính lại hàng đợi cho mọi sự kiện của người dùng (khi đổi giờ nhắc mặc định). */
export async function resyncUserQueue(db: Firestore, uid: string, now = new Date()): Promise<void> {
  const events = await db.collection(`users/${uid}/events`).get()
  for (const doc of events.docs) {
    await syncEventQueue(db, uid, doc.id, doc.data() as CalendarEvent, now)
  }
}

/** Xóa mọi nhắc hẹn đang chờ của người dùng (khi xóa tài khoản). */
export async function clearUserQueue(db: Firestore, uid: string): Promise<void> {
  const pending = await db.collection(QUEUE).where('uid', '==', uid).get()
  const writer = db.bulkWriter()
  for (const doc of pending.docs) void writer.delete(doc.ref)
  await writer.close()
}

/** Dữ liệu sự kiện hỏng (ngày âm không tồn tại...) thì coi như không có nhắc hẹn. */
function safeNextBatch(event: CalendarEvent, after: Date, time: TimeString) {
  try {
    return nextReminderBatch(event, after, time)
  } catch (error) {
    console.warn(`Không tính được nhắc hẹn cho sự kiện ${event.id}`, error)
    return null
  }
}

/**
 * Gửi các nhắc hẹn đến hạn. Mỗi document được "nhận" trong transaction (chuyển sang nhóm kế tiếp
 * hoặc xóa) trước khi gửi, nên dù hàm chạy chồng nhau thì mỗi nhắc hẹn chỉ gửi tối đa 1 lần.
 * Trả về số nhóm đã gửi.
 */
export async function processDueReminders(
  db: Firestore,
  sender: ReminderSender,
  now: Date = new Date(),
  limit = 200,
): Promise<number> {
  const due = await db
    .collection(QUEUE)
    .where('fireAt', '<=', Timestamp.fromDate(now))
    .orderBy('fireAt')
    .limit(limit)
    .get()

  let sent = 0
  for (const snapshot of due.docs) {
    const claimed = await db.runTransaction(async (tx) => {
      const current = await tx.get(snapshot.ref)
      if (!current.exists) return null
      const queued = current.data() as QueueDoc
      if (queued.fireAt.toMillis() > now.getTime()) return null
      const eventSnap = await tx.get(db.doc(`users/${queued.uid}/events/${queued.eventId}`))
      const userSnap = await tx.get(db.doc(`users/${queued.uid}`))
      const event = eventSnap.exists ? (eventSnap.data() as CalendarEvent) : null
      if (!event) {
        tx.delete(snapshot.ref)
        return null
      }
      const rawTime = userSnap.get('settings.allDayReminderTime')
      const time = typeof rawTime === 'string' ? rawTime : DEFAULT_ALL_DAY_TIME
      const fireAt = queued.fireAt.toDate()
      // Tính lại từ dữ liệu mới nhất để lấy nội dung đúng của lần diễn ra.
      const currentBatch = safeNextBatch(event, new Date(fireAt.getTime() - 1), time)
      const next = safeNextBatch(event, fireAt, time)
      if (next)
        tx.set(snapshot.ref, toQueueDoc(queued.uid, queued.eventId, next.instances, next.fireAt))
      else tx.delete(snapshot.ref)
      if (!currentBatch || currentBatch.fireAt.getTime() !== fireAt.getTime()) return null
      if (now.getTime() - fireAt.getTime() > LATE_LIMIT_MS) return null
      return { uid: queued.uid, instances: currentBatch.instances }
    })
    if (!claimed) continue

    for (const channel of ['notification', 'email'] as const) {
      const instances = claimed.instances.filter((i) => i.reminder.channel === channel)
      if (instances.length === 0) continue
      try {
        await sender.send(claimed.uid, channel, instances)
      } catch (error) {
        console.error(`Gửi nhắc hẹn ${channel} cho ${claimed.uid} thất bại`, error)
      }
    }
    sent++
  }
  return sent
}
