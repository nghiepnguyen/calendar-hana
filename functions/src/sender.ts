import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import type { Messaging } from 'firebase-admin/messaging'
import { formatReminderMessage } from '@shared/format'
import { occurrencePath, reminderTag } from '@shared/reminders/links'
import { todayInVietnam } from '@shared/time'
import { renderReminderEmail, type EmailSender } from './email'
import { sendPush } from './push'
import type { ReminderSender } from './queue'

interface SenderDeps {
  db: Firestore
  messaging: Pick<Messaging, 'sendEachForMulticast'>
  auth: Pick<Auth, 'getUser'>
  /** null khi chưa cấu hình Resend: nhắc hẹn email bị bỏ qua. */
  email: EmailSender | null
  appUrl: string
}

/** Gửi thông báo qua Web Push, email tới địa chỉ Google của tài khoản. */
export function createReminderSender(deps: SenderDeps): ReminderSender {
  return {
    async send(uid, channel, instances) {
      const today = todayInVietnam()
      if (channel === 'notification') {
        for (const instance of instances) {
          const { title, body } = formatReminderMessage(instance.event, instance.date, today)
          const delivered = await sendPush(deps.db, deps.messaging, uid, {
            title,
            body,
            tag: reminderTag(
              instance.eventId,
              instance.occurrenceKey,
              instance.reminder.offsetMinutes,
            ),
            url: occurrencePath(instance.date, instance.eventId, instance.occurrenceKey),
          })
          console.log(`Push nhắc hẹn ${instance.eventId} cho ${uid}: ${delivered} trình duyệt nhận`)
        }
        return
      }
      if (!deps.email) {
        console.warn('Chưa cấu hình RESEND_API_KEY, bỏ qua nhắc hẹn email')
        return
      }
      const user = await deps.auth.getUser(uid)
      if (!user.email) return
      await deps.email.send(user.email, renderReminderEmail(instances, deps.appUrl, today))
    },
  }
}
