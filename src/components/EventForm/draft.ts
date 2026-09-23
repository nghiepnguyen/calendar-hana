// Dữ liệu trên form sự kiện và cách đổi qua lại với CalendarEvent.

import { lunarToSolar, parseSolarDate, solarToLunar, toSolarDateString } from '@shared/lunar'
import { getEventStartDate } from '@shared/recurrence/recurrence'
import { minutesNowInVietnam, minutesToTime, timeToMinutes, todayInVietnam } from '@shared/time'
import {
  isLunarDate,
  type CalendarEvent,
  type CalendarType,
  type LunarDate,
  type Recurrence,
  type Reminder,
  type SolarDateString,
  type TimeString,
} from '@shared/types'
import { DEFAULT_EVENT_CATEGORY_ID } from '../../data/defaultCategories'
import type { EventInput } from '../../data/repository'
import type { EventDraftDefaults } from '../../store/uiStore'

export type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type RepeatEnd = 'never' | 'until' | 'count'

export interface EventDraft {
  title: string
  calendarType: CalendarType
  solarDate: SolarDateString
  lunarDate: LunarDate
  allDay: boolean
  startTime: TimeString
  endTime: TimeString
  categoryId: string
  repeat: RepeatOption
  byWeekday: number[]
  repeatEnd: RepeatEnd
  until: SolarDateString
  count: number
  reminders: Reminder[]
  location: string
  note: string
}

/** Các kiểu lặp cho từng loại lịch (âm lịch chỉ lặp tháng/năm). */
export const REPEAT_OPTIONS: Record<CalendarType, { value: RepeatOption; label: string }[]> = {
  solar: [
    { value: 'none', label: 'Không lặp' },
    { value: 'daily', label: 'Hằng ngày' },
    { value: 'weekly', label: 'Hằng tuần' },
    { value: 'monthly', label: 'Hằng tháng' },
    { value: 'yearly', label: 'Hằng năm' },
  ],
  lunar: [
    { value: 'none', label: 'Không lặp' },
    { value: 'monthly', label: 'Hằng tháng (âm lịch)' },
    { value: 'yearly', label: 'Hằng năm (âm lịch)' },
  ],
}

function lunarOf(date: SolarDateString): LunarDate {
  const { day, month, year } = parseSolarDate(date)
  return solarToLunar(day, month, year)
}

function addHour(time: TimeString): TimeString {
  return minutesToTime(Math.min(timeToMinutes(time) + 60, 23 * 60 + 59))
}

/** Giờ tròn kế tiếp (nếu là hôm nay) hoặc 9:00. */
function defaultStartTime(date: SolarDateString): TimeString {
  if (date !== todayInVietnam()) return '09:00'
  const next = Math.ceil((minutesNowInVietnam() + 1) / 60) * 60
  return minutesToTime(Math.min(next, 23 * 60))
}

export function draftFromDefaults(defaults: EventDraftDefaults): EventDraft {
  const startTime = defaults.startTime ?? defaultStartTime(defaults.date)
  return {
    title: '',
    calendarType: 'solar',
    solarDate: defaults.date,
    lunarDate: lunarOf(defaults.date),
    allDay: defaults.allDay ?? false,
    startTime,
    endTime: addHour(startTime),
    categoryId: DEFAULT_EVENT_CATEGORY_ID,
    repeat: 'none',
    byWeekday: [],
    repeatEnd: 'never',
    until: defaults.date,
    count: 10,
    reminders: [],
    location: '',
    note: '',
  }
}

/**
 * Form từ sự kiện có sẵn. dateOverride: ngày dương để điền vào form thay cho ngày gốc
 * (dùng khi sửa riêng một lần diễn ra).
 */
export function draftFromEvent(event: CalendarEvent, dateOverride?: SolarDateString): EventDraft {
  const solarDate = dateOverride ?? getEventStartDate(event)
  const lunarDate = !dateOverride && isLunarDate(event.date) ? event.date : lunarOf(solarDate)
  const startTime = event.startTime ?? '09:00'
  const rule = event.recurrence
  return {
    title: event.title,
    calendarType: event.calendarType,
    solarDate,
    lunarDate,
    allDay: event.allDay,
    startTime,
    endTime: event.endTime ?? addHour(startTime),
    categoryId: event.categoryId,
    repeat: rule?.freq ?? 'none',
    byWeekday: rule?.byWeekday ?? [],
    repeatEnd: rule?.until ? 'until' : rule?.count ? 'count' : 'never',
    until: rule?.until ?? solarDate,
    count: rule?.count ?? 10,
    reminders: event.reminders,
    location: event.location ?? '',
    note: event.note ?? '',
  }
}

/** Đổi Dương ↔ Âm, giữ nguyên ngày đang chọn (quy đổi sang hệ lịch kia). */
export function switchCalendar(draft: EventDraft, calendarType: CalendarType): EventDraft {
  if (draft.calendarType === calendarType) return draft
  const next: EventDraft = { ...draft, calendarType }
  if (calendarType === 'lunar') {
    next.lunarDate = lunarOf(draft.solarDate)
    if (draft.repeat === 'daily' || draft.repeat === 'weekly') next.repeat = 'none'
  } else {
    const solar = draftSolarDate(draft)
    if (solar) next.solarDate = solar
  }
  return next
}

/** Ngày dương tương ứng với ngày đang chọn trên form (null nếu ngày âm không tồn tại). */
export function draftSolarDate(draft: EventDraft): SolarDateString | null {
  if (draft.calendarType === 'solar') return draft.solarDate
  const { day, month, year, isLeap } = draft.lunarDate
  const result = lunarToSolar(day, month, year, isLeap)
  return result ? toSolarDateString(result) : null
}

/** Đổi giờ bắt đầu và dời giờ kết thúc theo, giữ nguyên độ dài. */
export function changeStartTime(draft: EventDraft, startTime: TimeString): EventDraft {
  const duration = Math.max(15, timeToMinutes(draft.endTime) - timeToMinutes(draft.startTime))
  const end = Math.min(timeToMinutes(startTime) + duration, 23 * 60 + 59)
  return { ...draft, startTime, endTime: minutesToTime(end) }
}

function draftRecurrence(draft: EventDraft): Recurrence | undefined {
  if (draft.repeat === 'none') return undefined
  const rule: Recurrence = { freq: draft.repeat, calendar: draft.calendarType }
  if (draft.repeat === 'weekly' && draft.byWeekday.length) {
    rule.byWeekday = [...draft.byWeekday].sort()
  }
  if (draft.repeatEnd === 'until') rule.until = draft.until
  if (draft.repeatEnd === 'count') rule.count = draft.count
  return rule
}

/** Dữ liệu để lưu (chưa có id / createdAt). */
export function draftToInput(draft: EventDraft): EventInput {
  const input: EventInput = {
    title: draft.title.trim(),
    calendarType: draft.calendarType,
    date: draft.calendarType === 'lunar' ? { ...draft.lunarDate } : draft.solarDate,
    allDay: draft.allDay,
    categoryId: draft.categoryId,
    reminders: draft.reminders,
  }
  if (!draft.allDay) {
    input.startTime = draft.startTime
    input.endTime = draft.endTime
  }
  const recurrence = draftRecurrence(draft)
  if (recurrence) input.recurrence = recurrence
  if (draft.location.trim()) input.location = draft.location.trim()
  if (draft.note.trim()) input.note = draft.note.trim()
  return input
}
