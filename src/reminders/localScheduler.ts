// Nhắc hẹn thông báo cho người chưa đăng nhập: chỉ chạy khi app đang mở (PRD mục 37).
//
// Tính các nhắc hẹn trong 24 giờ tới và đặt setTimeout. Tính lại khi dữ liệu đổi, khi tab mở lại,
// và định kỳ trước khi hết khoảng 24 giờ. Nhắc hẹn bị lỡ (máy ngủ, tab bị treo) trong vòng
// 1 giờ vẫn được hiện ngay khi tính lại.

import { upcomingReminders, type ReminderInstance } from '@shared/reminders/nextReminder'
import { reminderTag } from '@shared/reminders/links'
import type { CalendarEvent, TimeString } from '@shared/types'

const HOUR = 3600_000
export const SCHEDULE_WINDOW_MS = 24 * HOUR
export const MISSED_GRACE_MS = HOUR

export interface LocalSchedulerOptions {
  show: (instance: ReminderInstance) => void
  now?: () => Date
}

export class LocalScheduler {
  private readonly show: (instance: ReminderInstance) => void
  private readonly now: () => Date
  private events: CalendarEvent[] = []
  private allDayReminderTime: TimeString = '08:00'
  private timers: ReturnType<typeof setTimeout>[] = []
  /** Khóa nhắc hẹn đã hiện → thời điểm gửi, để không hiện lại. */
  private readonly shown = new Map<string, number>()
  /** Mốc đã tính tới lần trước; nhắc hẹn sau mốc này chưa bị bỏ lỡ. */
  private cursor: number

  constructor({ show, now = () => new Date() }: LocalSchedulerOptions) {
    this.show = show
    this.now = now
    this.cursor = now().getTime()
  }

  update(events: CalendarEvent[], allDayReminderTime: TimeString): void {
    this.events = events
    this.allDayReminderTime = allDayReminderTime
    this.reschedule()
  }

  reschedule(): void {
    this.clearTimers()
    const now = this.now().getTime()
    const after = new Date(Math.max(this.cursor, now - MISSED_GRACE_MS))
    const until = new Date(now + SCHEDULE_WINDOW_MS)
    this.cursor = now
    this.prune(now)

    const due: ReminderInstance[] = []
    for (const event of this.events) {
      for (const instance of upcomingReminders(event, after, until, this.allDayReminderTime)) {
        if (instance.reminder.channel !== 'notification') continue
        if (this.shown.has(keyOf(instance))) continue
        const delay = instance.fireAt.getTime() - now
        if (delay <= 0) due.push(instance)
        else this.timers.push(setTimeout(() => this.fire(instance), delay))
      }
    }
    for (const instance of due) this.fire(instance)
    // Tính lại trước khi hết khoảng 24 giờ.
    this.timers.push(setTimeout(() => this.reschedule(), SCHEDULE_WINDOW_MS / 2))
  }

  dispose(): void {
    this.clearTimers()
  }

  private fire(instance: ReminderInstance): void {
    const key = keyOf(instance)
    if (this.shown.has(key)) return
    this.shown.set(key, instance.fireAt.getTime())
    this.show(instance)
  }

  private prune(now: number): void {
    for (const [key, fireAt] of this.shown) {
      if (fireAt < now - 2 * MISSED_GRACE_MS) this.shown.delete(key)
    }
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer)
    this.timers = []
  }
}

function keyOf(instance: ReminderInstance): string {
  return `${reminderTag(instance.eventId, instance.occurrenceKey, instance.reminder.offsetMinutes)}|${instance.fireAt.getTime()}`
}
