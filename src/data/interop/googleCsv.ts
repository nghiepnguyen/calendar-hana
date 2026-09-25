// Xuất / nhập CSV theo mẫu của Google Calendar (Cài đặt → Nhập và xuất).
//
// Cột: Subject, Start Date, Start Time, End Date, End Time, All Day Event, Description, Location.
// Ngày dạng MM/DD/YYYY, giờ dạng "9:00 AM". CSV không có quy tắc lặp nên sự kiện lặp được trải
// ra từng lần trong một khoảng quanh hôm nay.

import { addDays } from '@shared/lunar/julian'
import { expandOccurrences, iterateOccurrences } from '@shared/recurrence/recurrence'
import type { CalendarEvent, SolarDateString, TimeString } from '@shared/types'
import { isValidEvent } from '@shared/validation'
import {
  clampEndTime,
  EPOCH_ISO,
  isRealDate,
  multiDayRecurrence,
  stableId,
  textFields,
  type ParsedEvents,
} from './common'
import { OTHER_CATEGORY_ID } from '../defaultCategories'

export const CSV_HEADERS = [
  'Subject',
  'Start Date',
  'Start Time',
  'End Date',
  'End Time',
  'All Day Event',
  'Description',
  'Location',
] as const

/** Sự kiện lặp được trải ra từ bấy nhiêu năm trước tới bấy nhiêu năm sau hôm nay. */
export const CSV_YEARS_BEFORE = 1
export const CSV_YEARS_AFTER = 2

// ─── Xuất ────────────────────────────────────────────────────────────────────

function shiftYears(date: SolarDateString, years: number): SolarDateString {
  const shifted = `${Number(date.slice(0, 4)) + years}${date.slice(4)}`
  // 29/2 sang năm không nhuận.
  return isRealDate(shifted) ? shifted : addDays(`${shifted.slice(0, 8)}28`, 1)
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

const usDate = (date: SolarDateString) =>
  `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`

function usTime(time: TimeString): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function row(event: CalendarEvent, date: SolarDateString): string[] {
  const timed = !event.allDay && !!event.startTime
  return [
    event.title,
    usDate(date),
    timed ? usTime(event.startTime!) : '',
    usDate(date),
    timed ? usTime(event.endTime ?? event.startTime!) : '',
    timed ? 'False' : 'True',
    event.note ?? '',
    event.location ?? '',
  ]
}

/** Sự kiện thành CSV cho Google Calendar. Sự kiện lặp trải ra trong khoảng quanh hôm nay. */
export function exportGoogleCsv(events: readonly CalendarEvent[], today: SolarDateString): string {
  const from = shiftYears(today, -CSV_YEARS_BEFORE)
  const to = shiftYears(today, CSV_YEARS_AFTER)
  const rows: { date: SolarDateString; cells: string[] }[] = []
  for (const event of events) {
    const occurrences = event.recurrence
      ? expandOccurrences(event, from, to)
      : [...iterateOccurrences(event)]
    for (const occurrence of occurrences) {
      rows.push({ date: occurrence.date, cells: row(occurrence.event, occurrence.date) })
    }
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return [CSV_HEADERS as readonly string[], ...rows.map((r) => r.cells)]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\r\n')
    .concat('\r\n')
}

// ─── Nhập ────────────────────────────────────────────────────────────────────

/** Tách CSV (RFC 4180): ô trong ngoặc kép có thể chứa dấu phẩy, xuống dòng, "" là một ". */
export function parseCsvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

/** "09/25/2026" (kiểu Mỹ như Google) hoặc "2026-09-25". */
function parseDate(value: string): SolarDateString | null {
  const text = value.trim()
  let date: string | null = null
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (iso) date = `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  else if (us) date = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  return date && isRealDate(date) ? date : null
}

/** "9:00 AM", "9:00:00 PM" hoặc "21:00". */
function parseTime(value: string): TimeString | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(value.trim())
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2])
  const meridiem = match[3]?.toUpperCase()
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    hour = (hour % 12) + (meridiem === 'PM' ? 12 : 0)
  }
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export class CsvFormatError extends Error {
  constructor(
    message = 'File CSV cần có cột "Subject" và "Start Date" như mẫu của Google Calendar.',
  ) {
    super(message)
    this.name = 'CsvFormatError'
  }
}

/** Đọc CSV theo mẫu Google Calendar thành sự kiện (không lặp) của app. */
export function parseGoogleCsv(input: string): ParsedEvents {
  const [header, ...rows] = parseCsvRows(input)
  const columns = new Map((header ?? []).map((name, i) => [name.trim().toLowerCase(), i]))
  if (!columns.has('subject') || !columns.has('start date')) throw new CsvFormatError()
  const cell = (r: string[], name: string) => {
    const index = columns.get(name)
    return index === undefined ? '' : (r[index] ?? '').trim()
  }

  const events: CalendarEvent[] = []
  let skipped = 0
  for (const r of rows) {
    const date = parseDate(cell(r, 'start date'))
    if (!date) {
      skipped++
      continue
    }
    const endDate = parseDate(cell(r, 'end date'))
    const startTime = parseTime(cell(r, 'start time'))
    const endTime = parseTime(cell(r, 'end time'))
    const allDayCell = cell(r, 'all day event').toLowerCase()
    const allDay = allDayCell === 'true' || allDayCell === '1' || !startTime
    const clampedEnd =
      !allDay && startTime
        ? clampEndTime(date, startTime, endTime ? { date: endDate ?? date, time: endTime } : null)
        : null

    const event: CalendarEvent = {
      id: stableId('csv', [cell(r, 'subject'), date, startTime ?? ''].join('|')),
      ...textFields(cell(r, 'subject'), cell(r, 'description'), cell(r, 'location')),
      calendarType: 'solar',
      date,
      allDay: allDay || !clampedEnd,
      categoryId: OTHER_CATEGORY_ID,
      reminders: [],
      createdAt: EPOCH_ISO,
      updatedAt: EPOCH_ISO,
    }
    if (!event.allDay) {
      event.startTime = startTime!
      event.endTime = clampedEnd!
    } else if (endDate) {
      // Cột End Date của Google tính cả ngày cuối.
      const repeat = multiDayRecurrence(date, addDays(endDate, 1))
      if (repeat) event.recurrence = repeat
    }
    if (isValidEvent(event)) events.push(event)
    else skipped++
  }
  return { events, skipped, simplified: 0 }
}
