// Cloud Functions cho nhắc hẹn phía server (người dùng đã đăng nhập).
// Cần gói Blaze. Cấu hình:
//   firebase functions:secrets:set RESEND_API_KEY   (khóa API Resend, không bao giờ để trong code)
//   EMAIL_FROM, APP_URL: đặt trong functions/.env (xem functions/.env.example)

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { setGlobalOptions } from 'firebase-functions/v2'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import type { CalendarEvent } from '@shared/types'
import { resendSender } from './email'
import { clearUserQueue, processDueReminders, resyncUserQueue, syncEventQueue } from './queue'
import { createReminderSender } from './sender'

// Cùng vùng với Firestore của project.
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 5 })

initializeApp()
const db = getFirestore()

const resendApiKey = defineSecret('RESEND_API_KEY')
const emailFrom = defineString('EMAIL_FROM', { default: 'Lịch Việt <onboarding@resend.dev>' })
const appUrl = defineString('APP_URL', { default: 'https://lich.thanhnghiep.top' })

/** Sự kiện được tạo / sửa / xóa: cập nhật lần nhắc kế tiếp trong reminderQueue. */
export const scheduleReminders = onDocumentWritten('users/{uid}/events/{eventId}', async (e) => {
  const after = e.data?.after
  const event = after?.exists ? (after.data() as CalendarEvent) : null
  await syncEventQueue(db, e.params.uid, e.params.eventId, event)
})

/** Đổi giờ nhắc mặc định: tính lại mọi nhắc hẹn. Xóa hồ sơ (xóa tài khoản): dọn hàng đợi. */
export const onUserWritten = onDocumentWritten('users/{uid}', async (e) => {
  const { uid } = e.params
  if (!e.data?.after.exists) {
    await clearUserQueue(db, uid)
    return
  }
  const before = e.data.before.exists ? e.data.before.get('settings.allDayReminderTime') : undefined
  const after = e.data.after.get('settings.allDayReminderTime')
  if (e.data.before.exists && before !== after) await resyncUserQueue(db, uid)
})

/** Mỗi phút: gửi nhắc hẹn đến hạn. */
export const sendDueReminders = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'Asia/Ho_Chi_Minh', secrets: [resendApiKey] },
  async () => {
    const key = resendApiKey.value()
    const sender = createReminderSender({
      db,
      messaging: getMessaging(),
      auth: getAuth(),
      email: key ? resendSender(key, emailFrom.value()) : null,
      appUrl: appUrl.value(),
    })
    const sent = await processDueReminders(db, sender)
    if (sent > 0) console.log(`Đã gửi ${sent} nhóm nhắc hẹn`)
  },
)
