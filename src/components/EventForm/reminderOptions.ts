import type { Reminder } from '@shared/types'

const DAY = 24 * 60

export const TIMED_PRESETS = [0, 5, 15, 30, 60, DAY, 3 * DAY, 7 * DAY]
export const ALL_DAY_PRESETS = [0, DAY, 3 * DAY, 7 * DAY]

export type ReminderUnit = 'minutes' | 'hours' | 'days'

export const UNIT_MINUTES: Record<ReminderUnit, number> = { minutes: 1, hours: 60, days: DAY }

export const UNIT_LABELS: Record<ReminderUnit, string> = {
  minutes: 'phút',
  hours: 'giờ',
  days: 'ngày',
}

/** "Trước 30 phút", "Trước 1 ngày (8:00)", "Lúc bắt đầu"... */
export function reminderLabel(
  offsetMinutes: number,
  allDay: boolean,
  allDayTime = '08:00',
): string {
  const time = allDayTime.replace(/^0/, '')
  if (offsetMinutes === 0) return allDay ? `Trong ngày (${time})` : 'Lúc bắt đầu'
  const { value, unit } = splitOffset(offsetMinutes)
  const text = `Trước ${value} ${UNIT_LABELS[unit]}`
  if (!allDay) return text
  return unit === 'days' ? `${text} (${time})` : text
}

/** Tách số phút thành số + đơn vị lớn nhất chia hết. */
export function splitOffset(offsetMinutes: number): { value: number; unit: ReminderUnit } {
  if (offsetMinutes > 0 && offsetMinutes % DAY === 0)
    return { value: offsetMinutes / DAY, unit: 'days' }
  if (offsetMinutes > 0 && offsetMinutes % 60 === 0)
    return { value: offsetMinutes / 60, unit: 'hours' }
  return { value: offsetMinutes, unit: 'minutes' }
}

export function channelLabel(channel: Reminder['channel']): string {
  return channel === 'email' ? 'Email' : 'Thông báo'
}
