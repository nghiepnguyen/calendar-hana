// Email nhắc hẹn tiếng Việt, gửi qua Resend (https://resend.com).
// API key lưu trong Firebase Secret Manager (RESEND_API_KEY), không để trong code.

import { formatLunar, formatReminderMessage, formatSolar, formatTime } from '@shared/format'
import { solarToLunar } from '@shared/lunar/lunar'
import { parseSolarDate } from '@shared/lunar/julian'
import { occurrencePath } from '@shared/reminders/links'
import type { ReminderInstance } from '@shared/reminders/nextReminder'

export interface EmailContent {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function timeText(instance: ReminderInstance): string {
  const { allDay, startTime, endTime } = instance.event
  if (allDay || !startTime) return 'Cả ngày'
  return endTime ? `${formatTime(startTime)}-${formatTime(endTime)}` : formatTime(startTime)
}

/** Nội dung email cho một hoặc nhiều nhắc hẹn cùng lúc. */
export function renderReminderEmail(
  instances: ReminderInstance[],
  appUrl: string,
  today: string,
): EmailContent {
  const first = instances[0]
  const { title, body } = formatReminderMessage(first.event, first.date, today)
  const subject =
    instances.length === 1
      ? `Nhắc hẹn: ${title} - ${body.split('\n')[0]}`
      : `Nhắc hẹn: ${title} và ${instances.length - 1} sự kiện khác`

  const blocks = instances.map((instance) => {
    const { day, month, year } = parseSolarDate(instance.date)
    const rows: [string, string][] = [
      ['Ngày', formatSolar(instance.date)],
      ['Âm lịch', formatLunar(solarToLunar(day, month, year))],
      ['Giờ', timeText(instance)],
    ]
    if (instance.event.location) rows.push(['Địa điểm', instance.event.location])
    if (instance.event.note) rows.push(['Ghi chú', instance.event.note])
    const link = `${appUrl.replace(/\/$/, '')}${occurrencePath(instance.date, instance.eventId, instance.occurrenceKey)}`
    return { title: instance.event.title, rows, link }
  })

  const html = `<!doctype html>
<html lang="vi"><body style="margin:0;padding:24px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1c1e">
<div style="max-width:520px;margin:0 auto">
<p style="margin:0 0 16px;font-size:14px;color:#6e6e73">Lịch Việt nhắc bạn</p>
${blocks
  .map(
    (b) => `<div style="background:#ffffff;border-radius:18px;padding:20px 22px;margin-bottom:12px">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${escapeHtml(b.title)}</h1>
<table role="presentation" style="border-collapse:collapse;font-size:15px;line-height:1.5">
${b.rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:2px 16px 2px 0;color:#6e6e73;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:2px 0;white-space:pre-line">${escapeHtml(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin:16px 0 0"><a href="${escapeHtml(b.link)}" style="display:inline-block;background:#e0342b;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:999px">Mở sự kiện</a></p>
</div>`,
  )
  .join('\n')}
<p style="margin:16px 0 0;font-size:12px;color:#6e6e73">Bạn nhận email này vì đã bật nhắc hẹn qua email trong Lịch Việt. Tắt bằng cách sửa nhắc hẹn của sự kiện.</p>
</div></body></html>`

  const text = blocks
    .map((b) =>
      [b.title, ...b.rows.map(([k, v]) => `${k}: ${v}`), `Mở sự kiện: ${b.link}`].join('\n'),
    )
    .join('\n\n')

  return { subject, html, text }
}

export interface EmailSender {
  send(to: string, content: EmailContent): Promise<void>
}

/** Gửi qua Resend REST API. */
export function resendSender(apiKey: string, from: string): EmailSender {
  return {
    async send(to, content) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], ...content }),
      })
      if (!response.ok) {
        throw new Error(`Resend trả lỗi ${response.status}: ${await response.text()}`)
      }
    },
  }
}
