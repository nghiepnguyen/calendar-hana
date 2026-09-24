// Kiểm tra dữ liệu sự kiện. Dùng chung cho form (hiện lỗi) và repository (chặn dữ liệu sai).

import { lunarToSolar, MAX_YEAR, MIN_YEAR } from './lunar/lunar'
import { parseSolarDate } from './lunar/julian'
import { getEventStartDate } from './recurrence/recurrence'
import {
  EVENT_NOTE_MAX,
  EVENT_TITLE_MAX,
  isLunarDate,
  MAX_REMINDERS,
  type CalendarEvent,
} from './types'

export type EventField =
  'title' | 'date' | 'time' | 'note' | 'location' | 'recurrence' | 'reminders' | 'categoryId'

export type EventErrors = Partial<Record<EventField, string>>

export const EVENT_LOCATION_MAX = 500

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

type EventLike = Pick<
  CalendarEvent,
  | 'title'
  | 'calendarType'
  | 'date'
  | 'allDay'
  | 'startTime'
  | 'endTime'
  | 'categoryId'
  | 'recurrence'
  | 'reminders'
  | 'location'
  | 'note'
>

/** Trả về lỗi theo từng trường (tiếng Việt). Object rỗng nghĩa là hợp lệ. */
export function validateEvent(event: EventLike): EventErrors {
  const errors: EventErrors = {}
  const title = event.title.trim()
  if (!title) errors.title = 'Vui lòng nhập tiêu đề.'
  else if (title.length > EVENT_TITLE_MAX) errors.title = `Tiêu đề tối đa ${EVENT_TITLE_MAX} ký tự.`

  if ((event.note ?? '').length > EVENT_NOTE_MAX) {
    errors.note = `Ghi chú tối đa ${EVENT_NOTE_MAX} ký tự.`
  }
  if ((event.location ?? '').length > EVENT_LOCATION_MAX) {
    errors.location = `Địa điểm tối đa ${EVENT_LOCATION_MAX} ký tự.`
  }
  if (!event.categoryId) errors.categoryId = 'Vui lòng chọn danh mục.'

  let startDate: string | null = null
  if (event.calendarType === 'lunar') {
    if (!isLunarDate(event.date)) {
      errors.date = 'Ngày âm lịch không hợp lệ.'
    } else {
      const { day, month, year, isLeap } = event.date
      if (!lunarToSolar(day, month, year, isLeap)) {
        errors.date = isLeap
          ? `Năm ${year} không có tháng ${month} nhuận hoặc tháng đó không có ngày ${day}.`
          : `Tháng ${month} âm lịch năm ${year} không có ngày ${day}.`
      } else {
        startDate = getEventStartDate(event)
      }
    }
  } else if (isLunarDate(event.date)) {
    errors.date = 'Ngày dương lịch không hợp lệ.'
  } else {
    try {
      const { year } = parseSolarDate(event.date)
      if (year < MIN_YEAR || year > MAX_YEAR) {
        errors.date = `Năm phải từ ${MIN_YEAR} đến ${MAX_YEAR}.`
      } else {
        startDate = event.date
      }
    } catch {
      errors.date = 'Ngày dương lịch không hợp lệ.'
    }
  }

  if (!event.allDay) {
    if (!event.startTime || !TIME_RE.test(event.startTime)) {
      errors.time = 'Vui lòng nhập giờ bắt đầu.'
    } else if (!event.endTime || !TIME_RE.test(event.endTime)) {
      errors.time = 'Vui lòng nhập giờ kết thúc.'
    } else if (event.endTime <= event.startTime) {
      errors.time = 'Giờ kết thúc phải sau giờ bắt đầu.'
    }
  }

  const rule = event.recurrence
  if (rule) {
    if (rule.calendar === 'lunar' && rule.freq !== 'monthly' && rule.freq !== 'yearly') {
      errors.recurrence = 'Âm lịch chỉ lặp hằng tháng hoặc hằng năm.'
    } else if (rule.count !== undefined && (!Number.isInteger(rule.count) || rule.count < 1)) {
      errors.recurrence = 'Số lần lặp phải từ 1 trở lên.'
    } else if (rule.until && startDate && rule.until < startDate) {
      errors.recurrence = 'Ngày kết thúc lặp phải sau ngày bắt đầu.'
    } else if (rule.freq === 'weekly' && rule.byWeekday?.some((d) => d < 0 || d > 6)) {
      errors.recurrence = 'Thứ trong tuần không hợp lệ.'
    }
  }

  if (event.reminders.length > MAX_REMINDERS) {
    errors.reminders = `Tối đa ${MAX_REMINDERS} nhắc hẹn.`
  } else if (
    event.reminders.some((r) => !Number.isInteger(r.offsetMinutes) || r.offsetMinutes < 0)
  ) {
    errors.reminders = 'Thời điểm nhắc không hợp lệ.'
  }

  return errors
}

export function isValidEvent(event: EventLike): boolean {
  return Object.keys(validateEvent(event)).length === 0
}

export class EventValidationError extends Error {
  readonly errors: EventErrors
  constructor(errors: EventErrors) {
    super(Object.values(errors).join(' '))
    this.name = 'EventValidationError'
    this.errors = errors
  }
}
