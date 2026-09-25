// Xuất / nhập iCalendar (RFC 5545), dùng được với Google Calendar.
//
// Xuất: sự kiện lặp dương lịch dùng RRULE (+ EXDATE cho lần đã xóa, VEVENT có RECURRENCE-ID cho
// lần sửa riêng). Google không có âm lịch nên sự kiện lặp âm lịch được trải ra từng lần.
// Nhập: đổi mọi giờ về giờ Việt Nam; quy tắc lặp app không có (INTERVAL, BYSETPOS, "thứ Ba thứ
// 2 của tháng"...) thì chỉ nhập lần đầu.

import { addDays, dayOfWeek } from '@shared/lunar/julian'
import { getEventStartDate, iterateOccurrences } from '@shared/recurrence/recurrence'
import { timeToMinutes } from '@shared/time'
import {
  APP_TIME_ZONE,
  MAX_REMINDERS,
  type CalendarEvent,
  type Category,
  type EventOverride,
  type Recurrence,
  type RecurrenceFreq,
  type Reminder,
  type SolarDateString,
  type TimeString,
} from '@shared/types'
import { isValidEvent } from '@shared/validation'
import {
  categoryIdByName,
  clampEndTime,
  EPOCH_ISO,
  isRealDate,
  multiDayRecurrence,
  stableId,
  textFields,
  utcToVietnam,
  wallTimeToUtc,
  type InteropContext,
  type ParsedEvents,
  type VietnamDateTime,
} from './common'

const PRODID = '-//Lich Hana//Lich Viet//VI'
const UID_DOMAIN = 'lich-hana'
/** Sự kiện lặp âm lịch được trải ra tới bấy nhiêu năm sau hôm nay. */
export const LUNAR_EXPAND_YEARS = 10

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

// ─── Xuất ────────────────────────────────────────────────────────────────────

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const encoder = new TextEncoder()

/** Gập dòng dài hơn 75 byte (UTF-8), không cắt giữa một ký tự. */
function fold(line: string): string {
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const size = encoder.encode(ch).length
    // Dòng nối tiếp bắt đầu bằng một dấu cách, nên chỉ còn 74 byte.
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const compactDate = (date: SolarDateString) => date.replace(/-/g, '')
const compactDateTime = (date: SolarDateString, time: TimeString) =>
  `${compactDate(date)}T${time.replace(':', '')}00`

function utcStamp(iso: string): string {
  const date = new Date(iso)
  const value = Number.isNaN(date.getTime()) ? new Date(0) : date
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** DTSTART / DTEND / RECURRENCE-ID / EXDATE: ngày (cả ngày) hoặc giờ Việt Nam. */
function dateProp(name: string, date: SolarDateString, time: TimeString | undefined): string {
  return time
    ? `${name};TZID=${APP_TIME_ZONE}:${compactDateTime(date, time)}`
    : `${name};VALUE=DATE:${compactDate(date)}`
}

function timeLines(event: CalendarEvent, date: SolarDateString): string[] {
  if (event.allDay || !event.startTime) {
    return [dateProp('DTSTART', date, undefined), dateProp('DTEND', addDays(date, 1), undefined)]
  }
  return [
    dateProp('DTSTART', date, event.startTime),
    dateProp('DTEND', date, event.endTime ?? event.startTime),
  ]
}

/** Báo trước của app → TRIGGER. Cả ngày: app nhắc lúc giờ nhắc cả ngày của ngày (trước) đó. */
function triggerFor(reminder: Reminder, allDay: boolean, allDayTime: TimeString): string {
  const minutes = allDay
    ? timeToMinutes(allDayTime) - reminder.offsetMinutes
    : -reminder.offsetMinutes
  return `${minutes < 0 ? '-' : ''}PT${Math.abs(minutes)}M`
}

function alarmLines(event: CalendarEvent, allDayTime: TimeString): string[] {
  return event.reminders.flatMap((reminder) => [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    `TRIGGER:${triggerFor(reminder, event.allDay, allDayTime)}`,
    'END:VALARM',
  ])
}

function rruleFor(event: CalendarEvent, rule: Recurrence): string {
  const parts = [`FREQ=${rule.freq.toUpperCase()}`]
  if (rule.freq === 'weekly' && rule.byWeekday?.length) {
    parts.push(
      `BYDAY=${[...rule.byWeekday]
        .sort()
        .map((d) => WEEKDAY_CODES[d])
        .join(',')}`,
    )
  }
  if (rule.until) {
    // UNTIL phải cùng kiểu với DTSTART; giờ thì ghi theo UTC (hết ngày until, giờ Việt Nam).
    parts.push(
      event.allDay
        ? `UNTIL=${compactDate(rule.until)}`
        : `UNTIL=${compactDate(rule.until)}T165959Z`,
    )
  }
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`)
  return `RRULE:${parts.join(';')}`
}

/** Ngày gốc đầu tiên: lặp tuần mà ngày bắt đầu không thuộc các thứ đã chọn thì dời tới thứ đầu. */
function firstKey(event: CalendarEvent, start: SolarDateString): SolarDateString {
  const days = event.recurrence?.freq === 'weekly' ? event.recurrence.byWeekday : undefined
  if (!days?.length) return start
  let date = start
  while (!days.includes(dayOfWeek(date))) date = addDays(date, 1)
  return date
}

interface ExportContext {
  categoryName: (id: string) => string | undefined
  allDayTime: TimeString
  stamp: string
}

function veventLines(
  event: CalendarEvent,
  date: SolarDateString,
  uid: string,
  ctx: ExportContext,
  extra: string[],
): string[] {
  const category = ctx.categoryName(event.categoryId)
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${ctx.stamp}`,
    `CREATED:${utcStamp(event.createdAt)}`,
    `LAST-MODIFIED:${utcStamp(event.updatedAt)}`,
    ...timeLines(event, date),
    ...extra,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(event.note ? [`DESCRIPTION:${escapeText(event.note)}`] : []),
    ...(category ? [`CATEGORIES:${escapeText(category)}`] : []),
    ...alarmLines(event, ctx.allDayTime),
    'END:VEVENT',
  ]
}

function eventLines(event: CalendarEvent, today: SolarDateString, ctx: ExportContext): string[] {
  const rule = event.recurrence
  const uid = `${event.id}@${UID_DOMAIN}`

  // Lặp âm lịch: trải ra từng lần (đã gồm phần sửa riêng), tới LUNAR_EXPAND_YEARS năm sau.
  if (rule?.calendar === 'lunar') {
    const last = `${Number(today.slice(0, 4)) + LUNAR_EXPAND_YEARS}${today.slice(4)}`
    const lines: string[] = []
    for (const occurrence of iterateOccurrences(event)) {
      if (occurrence.occurrenceKey > last) break
      lines.push(
        ...veventLines(
          occurrence.event,
          occurrence.date,
          `${event.id}-${occurrence.occurrenceKey}@${UID_DOMAIN}`,
          ctx,
          [],
        ),
      )
    }
    return lines
  }

  const start = firstKey(event, getEventStartDate(event))
  if (!rule) return veventLines(event, start, uid, ctx, [])

  const baseTime = event.allDay ? undefined : event.startTime
  const exceptions = Object.entries(event.exceptions ?? {}).sort(([a], [b]) => (a < b ? -1 : 1))
  const exdates = exceptions
    .filter(([, value]) => value === 'deleted')
    .map(([key]) => dateProp('EXDATE', key, baseTime))
  const lines = veventLines(event, start, uid, ctx, [rruleFor(event, rule), ...exdates])

  for (const [key, value] of exceptions) {
    if (value === 'deleted') continue
    const { date: movedTo, ...fields } = value
    lines.push(
      ...veventLines({ ...event, ...fields }, movedTo ?? key, uid, ctx, [
        dateProp('RECURRENCE-ID', key, baseTime),
      ]),
    )
  }
  return lines
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${APP_TIME_ZONE}`,
  `X-LIC-LOCATION:${APP_TIME_ZONE}`,
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0700',
  'TZOFFSETTO:+0700',
  'TZNAME:+07',
  'DTSTART:19700101T000000',
  'END:STANDARD',
  'END:VTIMEZONE',
]

/** Toàn bộ sự kiện thành một file .ics. */
export function exportIcs(
  data: {
    events: readonly CalendarEvent[]
    categories: readonly Category[]
    allDayTime: TimeString
  },
  today: SolarDateString,
  now = new Date(),
): string {
  const names = new Map(data.categories.map((c) => [c.id, c.name]))
  const ctx: ExportContext = {
    categoryName: (id) => names.get(id),
    allDayTime: data.allDayTime,
    stamp: utcStamp(now.toISOString()),
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lịch Việt',
    `X-WR-TIMEZONE:${APP_TIME_ZONE}`,
    ...VTIMEZONE,
    ...data.events.flatMap((event) => eventLines(event, today, ctx)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

// ─── Nhập ────────────────────────────────────────────────────────────────────

interface Property {
  name: string
  params: Record<string, string>
  value: string
}

interface Component {
  type: string
  props: Property[]
  children: Component[]
}

function parseLine(line: string): Property | null {
  // Tìm dấu ':' đầu tiên nằm ngoài ngoặc kép (tham số có thể chứa ':' trong ngoặc kép).
  let quoted = false
  let colon = -1
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') quoted = !quoted
    else if (ch === ':' && !quoted) {
      colon = i
      break
    }
  }
  if (colon < 0) return null
  const [name, ...rawParams] = line.slice(0, colon).split(';')
  const params: Record<string, string> = {}
  for (const param of rawParams) {
    const eq = param.indexOf('=')
    if (eq > 0) params[param.slice(0, eq).toUpperCase()] = param.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) }
}

function parseComponents(text: string): Component[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const root: Component = { type: 'ROOT', props: [], children: [] }
  const stack = [root]
  for (const line of lines) {
    if (!line.trim()) continue
    const prop = parseLine(line)
    if (!prop) continue
    const current = stack[stack.length - 1]
    if (prop.name === 'BEGIN') {
      const child: Component = { type: prop.value.trim().toUpperCase(), props: [], children: [] }
      current.children.push(child)
      stack.push(child)
    } else if (prop.name === 'END') {
      if (stack.length > 1) stack.pop()
    } else {
      current.props.push(prop)
    }
  }
  return root.children
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, ch: string) => (ch === 'n' || ch === 'N' ? '\n' : ch))
}

const prop = (c: Component, name: string) => c.props.find((p) => p.name === name)
const text = (c: Component, name: string) => {
  const p = prop(c, name)
  return p ? unescapeText(p.value) : undefined
}

/** Giá trị ngày / giờ của ICS: cả ngày giữ nguyên ngày, có giờ thì đổi về giờ Việt Nam. */
type IcsDate = { allDay: true; date: SolarDateString } | ({ allDay: false } & VietnamDateTime)

function parseDateValue(value: string, tzid: string | undefined): IcsDate | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim())
  if (!match) return null
  const [, y, mo, d, h, mi, s, z] = match
  const date = `${y}-${mo}-${d}`
  if (!isRealDate(date)) return null
  if (h === undefined) return { allDay: true, date }
  const wall = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Number(s ?? 0),
  }
  const utc = z
    ? Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
    : wallTimeToUtc(wall, tzid)
  return { allDay: false, ...utcToVietnam(utc) }
}

function dateOf(c: Component, name: string): IcsDate | null {
  const p = prop(c, name)
  return p ? parseDateValue(p.value, p.params.TZID) : null
}

/** Ngày dương (giờ Việt Nam) dùng làm occurrenceKey. */
const keyOf = (value: IcsDate) => value.date

/** 'P1DT2H', '-PT15M'... → số phút (âm = trước). */
function parseDuration(value: string): number | null {
  const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value.trim(),
  )
  if (!match) return null
  const [, sign, w, d, h, m, s] = match
  const minutes =
    Number(w ?? 0) * 7 * 24 * 60 +
    Number(d ?? 0) * 24 * 60 +
    Number(h ?? 0) * 60 +
    Number(m ?? 0) +
    Math.floor(Number(s ?? 0) / 60)
  return sign === '-' ? -minutes : minutes
}

function addMinutes(start: VietnamDateTime, minutes: number): VietnamDateTime {
  const [y, mo, d] = start.date.split('-').map(Number)
  const [h, mi] = start.time.split(':').map(Number)
  return utcToVietnam(Date.UTC(y, mo - 1, d, h, mi + minutes) - 7 * 60 * 60_000)
}

function parseReminders(c: Component, allDay: boolean, allDayTime: TimeString): Reminder[] {
  const result: Reminder[] = []
  for (const alarm of c.children.filter((child) => child.type === 'VALARM')) {
    const trigger = prop(alarm, 'TRIGGER')
    if (!trigger || trigger.params.VALUE === 'DATE-TIME' || trigger.params.RELATED === 'END') {
      continue
    }
    const minutes = parseDuration(trigger.value)
    if (minutes === null) continue
    const offsetMinutes = allDay
      ? Math.max(0, Math.round((timeToMinutes(allDayTime) - minutes) / (24 * 60))) * 24 * 60
      : Math.max(0, -minutes)
    const channel = text(alarm, 'ACTION')?.toUpperCase() === 'EMAIL' ? 'email' : 'notification'
    if (!result.some((r) => r.offsetMinutes === offsetMinutes && r.channel === channel)) {
      result.push({ offsetMinutes, channel })
    }
  }
  return result.slice(0, MAX_REMINDERS)
}

const FREQS: Record<string, RecurrenceFreq> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

/** RRULE → quy tắc lặp của app. null nếu app không biểu diễn được. */
function parseRrule(
  value: string,
  start: SolarDateString,
  tzid: string | undefined,
): Recurrence | null {
  const parts = Object.fromEntries(
    value.split(';').map((part) => {
      const [k, v = ''] = part.split('=')
      return [k.toUpperCase(), v.toUpperCase()]
    }),
  )
  let freq = FREQS[parts.FREQ]
  if (!freq) return null
  if (parts.INTERVAL && parts.INTERVAL !== '1') return null
  const allowed = new Set([
    'FREQ',
    'INTERVAL',
    'UNTIL',
    'COUNT',
    'BYDAY',
    'BYMONTHDAY',
    'BYMONTH',
    'WKST',
  ])
  if (Object.keys(parts).some((k) => !allowed.has(k))) return null

  const [, month, day] = start.split('-').map(Number)
  let byWeekday: number[] | undefined
  if (parts.BYDAY) {
    const days = parts.BYDAY.split(',').map((code: string) => WEEKDAY_CODES.indexOf(code))
    if (days.some((d: number) => d < 0)) return null // có tiền tố số, ví dụ 2TU
    // "Hằng ngày vào các thứ..." chính là lặp tuần.
    if (freq === 'daily') freq = 'weekly'
    if (freq !== 'weekly') return null
    byWeekday = [...new Set<number>(days)].sort()
  }
  if (
    parts.BYMONTHDAY &&
    (freq === 'daily' || freq === 'weekly' || Number(parts.BYMONTHDAY) !== day)
  ) {
    return null
  }
  if (parts.BYMONTH && (freq !== 'yearly' || Number(parts.BYMONTH) !== month)) return null

  const rule: Recurrence = { freq, calendar: 'solar' }
  if (byWeekday) rule.byWeekday = byWeekday
  if (parts.COUNT) {
    const count = Number(parts.COUNT)
    if (!Number.isInteger(count) || count < 1) return null
    rule.count = count
  }
  if (parts.UNTIL) {
    const until = parseDateValue(parts.UNTIL, tzid)
    if (!until) return null
    rule.until = until.date
  }
  return rule
}

/** Phần giờ / ngày chung của sự kiện gốc và lần sửa riêng. */
function timing(c: Component): {
  date: SolarDateString
  allDay: boolean
  startTime?: TimeString
  endTime?: TimeString
  endExclusive: SolarDateString | null
} | null {
  const start = dateOf(c, 'DTSTART')
  if (!start) return null
  const end = dateOf(c, 'DTEND')
  const duration = text(c, 'DURATION')
  const durationMinutes = duration ? parseDuration(duration) : null

  if (start.allDay) {
    const endExclusive =
      end?.allDay === true
        ? end.date
        : durationMinutes !== null
          ? addDays(start.date, Math.max(1, Math.round(durationMinutes / (24 * 60))))
          : null
    return { date: start.date, allDay: true, endExclusive }
  }

  const endValue =
    end && !end.allDay ? end : durationMinutes !== null ? addMinutes(start, durationMinutes) : null
  const endTime = clampEndTime(start.date, start.time, endValue)
  // Bắt đầu lúc 23:59 thì không còn giờ kết thúc hợp lệ trong ngày: nhập thành cả ngày.
  if (!endTime) return { date: start.date, allDay: true, endExclusive: null }
  return { date: start.date, allDay: false, startTime: start.time, endTime, endExclusive: null }
}

function isCancelled(c: Component) {
  return text(c, 'STATUS')?.toUpperCase() === 'CANCELLED'
}

function isoOf(c: Component, name: string): string | undefined {
  const p = prop(c, name)
  const match = p && /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(p.value.trim())
  if (!match) return undefined
  const [, y, mo, d, h, mi, s] = match
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`
}

function buildEvent(
  master: Component,
  overrides: Component[],
  ctx: InteropContext,
): { event: CalendarEvent | null; simplified: boolean } {
  const time = timing(master)
  if (!time) return { event: null, simplified: false }
  // Lần sửa riêng nhập như sự kiện đơn lẻ thì kèm RECURRENCE-ID để mỗi lần có id riêng.
  const uid = [
    text(master, 'UID') ?? text(master, 'SUMMARY'),
    text(master, 'UID') ? prop(master, 'RECURRENCE-ID')?.value : prop(master, 'DTSTART')?.value,
  ]
    .filter(Boolean)
    .join('|')
  const rrule = prop(master, 'RRULE')
  const tzid = prop(master, 'DTSTART')?.params.TZID
  const recurrence = rrule ? parseRrule(rrule.value, time.date, tzid) : null
  const categories = text(master, 'CATEGORIES')?.split(',')[0]

  const event: CalendarEvent = {
    id: stableId('ics', uid),
    ...textFields(text(master, 'SUMMARY'), text(master, 'DESCRIPTION'), text(master, 'LOCATION')),
    calendarType: 'solar',
    date: time.date,
    allDay: time.allDay,
    ...(time.allDay ? {} : { startTime: time.startTime, endTime: time.endTime }),
    categoryId: categoryIdByName(ctx.categories, categories),
    reminders: parseReminders(master, time.allDay, ctx.allDayReminderTime),
    createdAt: isoOf(master, 'CREATED') ?? EPOCH_ISO,
    updatedAt: isoOf(master, 'LAST-MODIFIED') ?? isoOf(master, 'DTSTAMP') ?? EPOCH_ISO,
  }
  const repeat =
    recurrence ?? (rrule ? undefined : multiDayRecurrence(time.date, time.endExclusive))
  if (repeat) event.recurrence = repeat

  if (recurrence) {
    const exceptions: NonNullable<CalendarEvent['exceptions']> = {}
    for (const exdate of master.props.filter((p) => p.name === 'EXDATE')) {
      for (const value of exdate.value.split(',')) {
        const parsed = parseDateValue(value, exdate.params.TZID)
        if (parsed) exceptions[keyOf(parsed)] = 'deleted'
      }
    }
    for (const override of overrides) {
      const recurrenceId = dateOf(override, 'RECURRENCE-ID')
      if (!recurrenceId) continue
      const key = keyOf(recurrenceId)
      if (isCancelled(override)) {
        exceptions[key] = 'deleted'
        continue
      }
      const changed = timing(override)
      if (!changed) continue
      const fields = textFields(
        text(override, 'SUMMARY') ?? event.title,
        text(override, 'DESCRIPTION'),
        text(override, 'LOCATION'),
      )
      const value: EventOverride = {
        title: fields.title,
        allDay: changed.allDay,
        ...(changed.allDay ? {} : { startTime: changed.startTime, endTime: changed.endTime }),
        location: fields.location,
        note: fields.note,
      }
      if (changed.date !== key) value.date = changed.date
      exceptions[key] = value
    }
    if (Object.keys(exceptions).length > 0) event.exceptions = exceptions
  }

  return { event, simplified: !!rrule && !recurrence }
}

export class IcsFormatError extends Error {
  constructor(message = 'File không phải iCalendar (.ics) hợp lệ.') {
    super(message)
    this.name = 'IcsFormatError'
  }
}

/** Đọc file .ics (ví dụ xuất từ Google Calendar) thành sự kiện của app. */
export function parseIcs(input: string, ctx: InteropContext): ParsedEvents {
  const calendars = parseComponents(input).filter((c) => c.type === 'VCALENDAR')
  if (calendars.length === 0) throw new IcsFormatError()
  const vevents = calendars.flatMap((c) => c.children.filter((child) => child.type === 'VEVENT'))

  // Gom theo UID: bản gốc (không có RECURRENCE-ID) và các lần sửa riêng.
  const groups = new Map<string, { master?: Component; overrides: Component[] }>()
  const standalone: Component[] = []
  for (const vevent of vevents) {
    const uid = text(vevent, 'UID')
    if (!uid) {
      standalone.push(vevent)
      continue
    }
    const group = groups.get(uid) ?? { overrides: [] }
    if (prop(vevent, 'RECURRENCE-ID')) group.overrides.push(vevent)
    else group.master = vevent
    groups.set(uid, group)
  }

  const events: CalendarEvent[] = []
  let skipped = 0
  let simplified = 0
  const add = (master: Component, overrides: Component[]) => {
    if (isCancelled(master)) return
    const result = buildEvent(master, overrides, ctx)
    if (result.event && isValidEvent(result.event)) {
      events.push(result.event)
      if (result.simplified) simplified++
    } else {
      skipped++
    }
  }

  for (const group of groups.values()) {
    if (group.master) add(group.master, group.overrides)
    // Lần sửa riêng không có bản gốc trong file: nhập như sự kiện đơn lẻ.
    else for (const override of group.overrides) add(override, [])
  }
  for (const vevent of standalone) add(vevent, [])

  return { events, skipped, simplified }
}
