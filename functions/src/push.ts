// Gửi Web Push tới mọi trình duyệt đã đăng ký của người dùng qua FCM.

import type { Firestore } from 'firebase-admin/firestore'
import type { Messaging } from 'firebase-admin/messaging'

export interface PushContent {
  title: string
  body: string
  tag: string
  /** Đường dẫn trong app, ví dụ /day/2026-09-23?event=... */
  url: string
}

/** Lỗi FCM cho biết token không còn dùng được, cần xóa. */
const DEAD_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
])

/**
 * Gửi data message (service worker tự hiện thông báo, xem src/sw.ts).
 * Trả về số trình duyệt nhận được.
 */
export async function sendPush(
  db: Firestore,
  messaging: Pick<Messaging, 'sendEachForMulticast'>,
  uid: string,
  content: PushContent,
): Promise<number> {
  const tokensSnap = await db.collection(`users/${uid}/pushTokens`).get()
  const tokens = tokensSnap.docs.map((d) => d.id)
  if (tokens.length === 0) return 0

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: { ...content },
    webpush: { headers: { Urgency: 'high', TTL: '3600' } },
  })

  const dead = response.responses
    .map((r, i) => (!r.success && DEAD_TOKEN_ERRORS.has(r.error?.code ?? '') ? tokens[i] : null))
    .filter((t): t is string => t !== null)
  await Promise.all(dead.map((t) => db.doc(`users/${uid}/pushTokens/${t}`).delete()))
  return response.successCount
}
