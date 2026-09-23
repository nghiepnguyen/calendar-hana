// Tính thời điểm gửi nhắc hẹn cho từng lần diễn ra của sự kiện (dùng chung cho app và Cloud Functions).
//
// Sự kiện có giờ: nhắc lúc (giờ bắt đầu - offset).
// Sự kiện cả ngày: mốc là giờ nhắc mặc định trong Cài đặt (8:00) của ngày diễn ra, nên
// "trước 1 ngày" = 8:00 hôm trước, "trong ngày" = 8:00 hôm đó (PRD mục 36).

import { maxMovedKey, iterateOccurrences } from '../recurrence/recurrence'
import { todayInVietnam, vietnamDateTimeToDate } from '../time'
import type { CalendarEvent, Reminder, SolarDateString, TimeString } from '../types'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

export interface ReminderInstance {
  eventId: string
  occurrenceKey: SolarDateString
  /** Ngày dương thực tế của lần diễn ra. */
  date: SolarDateString
  reminder: Reminder
  fireAt: Date
  /** Sự kiện đã gộp phần sửa riêng của lần này. */
  event: CalendarEvent
}

export interface ReminderBatch {
  fireAt: Date
  instances: ReminderInstance[]
}

/** Thời điểm gửi một nhắc hẹn của lần diễn ra vào ngày `date`. */
export function reminderFireAt(
  event: Pick<CalendarEvent, 'allDay' | 'startTime'>,
  date: SolarDateString,
  reminder: Pick<Reminder, 'offsetMinutes'>,
  allDayReminderTime: TimeString,
): Date {
  const base = vietnamDateTimeToDate(
    date,
    event.allDay ? allDayReminderTime : (event.startTime ?? '00:00'),
  )
  return new Date(base.getTime() - reminder.offsetMinutes * MINUTE)
}

function uniqueReminders(reminders: Reminder[]): Reminder[] {
  const seen = new Set<string>()
  return reminders.filter((r) => {
    const key = `${r.offsetMinutes}|${r.channel}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function maxOffsetMinutes(event: CalendarEvent): number {
  let result = Math.max(0, ...event.reminders.map((r) => r.offsetMinutes))
  for (const exception of Object.values(event.exceptions ?? {})) {
    if (exception !== 'deleted' && exception.reminders) {
      result = Math.max(result, ...exception.reminders.map((r) => r.offsetMinutes))
    }
  }
  return result
}

function hasAnyReminder(event: CalendarEvent): boolean {
  if (event.reminders.length > 0) return true
  return Object.values(event.exceptions ?? {}).some(
    (e) => e !== 'deleted' && (e.reminders?.length ?? 0) > 0,
  )
}

/**
 * Duyệt các nhắc hẹn có fireAt > after theo thứ tự ngày gốc của lần diễn ra.
 * `shouldStop(date)` được gọi với ngày của lần diễn ra (khi đã qua mọi lần bị dời ngày):
 * trả về true để dừng.
 */
function* scanReminders(
  event: CalendarEvent,
  after: Date,
  allDayReminderTime: TimeString,
  shouldStop: (date: SolarDateString) => boolean,
): Generator<ReminderInstance> {
  if (!hasAnyReminder(event)) return
  // Mốc sớm nhất (0:00 ngày diễn ra) luôn >= fireAt, nên lần diễn ra trước hôm qua không còn nhắc.
  const fromDate = todayInVietnam(new Date(after.getTime() - DAY))
  const lastMovedKey = maxMovedKey(event)
  for (const occurrence of iterateOccurrences(event)) {
    if (occurrence.occurrenceKey >= lastMovedKey && shouldStop(occurrence.date)) return
    if (occurrence.date < fromDate) continue
    for (const reminder of uniqueReminders(occurrence.event.reminders)) {
      const fireAt = reminderFireAt(occurrence.event, occurrence.date, reminder, allDayReminderTime)
      if (fireAt.getTime() <= after.getTime()) continue
      yield {
        eventId: event.id,
        occurrenceKey: occurrence.occurrenceKey,
        date: occurrence.date,
        reminder,
        fireAt,
        event: occurrence.event,
      }
    }
  }
}

function byFireAt(a: ReminderInstance, b: ReminderInstance): number {
  return a.fireAt.getTime() - b.fireAt.getTime() || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
}

/** Mọi nhắc hẹn có after < fireAt <= until, sắp theo thời điểm gửi. */
export function upcomingReminders(
  event: CalendarEvent,
  after: Date,
  until: Date,
  allDayReminderTime: TimeString,
): ReminderInstance[] {
  // fireAt <= until thì ngày diễn ra <= ngày của (until + offset lớn nhất).
  const stopAfter = todayInVietnam(new Date(until.getTime() + maxOffsetMinutes(event) * MINUTE))
  const result: ReminderInstance[] = []
  for (const instance of scanReminders(event, after, allDayReminderTime, (d) => d > stopAfter)) {
    if (instance.fireAt.getTime() <= until.getTime()) result.push(instance)
  }
  return result.sort(byFireAt)
}

/**
 * Nhóm nhắc hẹn kế tiếp (fireAt > after nhỏ nhất, gồm mọi nhắc hẹn cùng thời điểm đó),
 * hoặc null nếu sự kiện không còn nhắc hẹn nào.
 */
export function nextReminderBatch(
  event: CalendarEvent,
  after: Date,
  allDayReminderTime: TimeString,
): ReminderBatch | null {
  const maxOffset = maxOffsetMinutes(event) * MINUTE
  let best: ReminderInstance[] = []
  let bestTime = Infinity
  const shouldStop = (date: SolarDateString) =>
    // Nhắc sớm nhất có thể của lần này (0:00 trừ offset lớn nhất) đã muộn hơn nhóm tốt nhất.
    best.length > 0 && vietnamDateTimeToDate(date).getTime() - maxOffset > bestTime
  for (const instance of scanReminders(event, after, allDayReminderTime, shouldStop)) {
    const time = instance.fireAt.getTime()
    if (time < bestTime) {
      best = [instance]
      bestTime = time
    } else if (time === bestTime) {
      best.push(instance)
    }
  }
  return best.length > 0 ? { fireAt: new Date(bestTime), instances: best } : null
}
