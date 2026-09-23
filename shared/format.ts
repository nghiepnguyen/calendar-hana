// Format ngày dương / âm bằng tiếng Việt.

import { yearCanChi } from './lunar/canChi'
import { daysInSolarMonth, dayOfWeek, parseSolarDate, solarStringToJd } from './lunar/julian'
import { solarToLunar } from './lunar/lunar'
import type { CalendarEvent, LunarDate, SolarDateString } from './types'

export const WEEKDAY_NAMES = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const

export const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

/** "12/3" hoặc "10/4 nhuận". */
export function formatLunarShort(lunar: Pick<LunarDate, 'day' | 'month' | 'isLeap'>): string {
  return `${lunar.day}/${lunar.month}${lunar.isLeap ? ' nhuận' : ''}`
}

/** "12/3 âm lịch" hoặc "10/4 nhuận âm lịch". */
export function formatLunar(lunar: Pick<LunarDate, 'day' | 'month' | 'isLeap'>): string {
  return `${formatLunarShort(lunar)} âm lịch`
}

/** "12/3 năm Bính Ngọ (âm lịch)". */
export function formatLunarWithYear(lunar: LunarDate): string {
  return `${formatLunarShort(lunar)} năm ${yearCanChi(lunar.year).name} (âm lịch)`
}

/** "23/9/2026". */
export function formatSolarShort(date: SolarDateString): string {
  const { day, month, year } = parseSolarDate(date)
  return `${day}/${month}/${year}`
}

/** "Thứ Tư, 23/9/2026". */
export function formatSolar(date: SolarDateString): string {
  return `${WEEKDAY_NAMES[dayOfWeek(date)]}, ${formatSolarShort(date)}`
}

/** Nhãn đọc màn hình: "Thứ Tư, 23 tháng 9 năm 2026, ngày 13 tháng 8 âm lịch". */
export function formatAccessibleDate(date: SolarDateString): string {
  const { day, month, year } = parseSolarDate(date)
  const lunar = solarToLunar(day, month, year)
  const leap = lunar.isLeap ? ' nhuận' : ''
  return `${WEEKDAY_NAMES[dayOfWeek(date)]}, ${day} tháng ${month} năm ${year}, ngày ${lunar.day} tháng ${lunar.month}${leap} âm lịch`
}

function lunarMonthLabel(lunar: LunarDate): string {
  return `${lunar.month}${lunar.isLeap ? ' nhuận' : ''}`
}

/**
 * Tiêu đề xem Tháng gồm phần dương lịch và phần âm lịch.
 * Ví dụ: { solar: "Tháng 9/2026", lunar: "Tháng 7-8 âm lịch, năm Bính Ngọ" }.
 * Tháng dương vắt qua hai năm âm: lunar = "Tháng 12 năm Ất Tỵ - tháng 1 năm Bính Ngọ âm lịch".
 */
export function formatMonthTitleParts(
  month: number,
  year: number,
): { solar: string; lunar: string } {
  const first = solarToLunar(1, month, year)
  const last = solarToLunar(daysInSolarMonth(month, year), month, year)
  const solar = `Tháng ${month}/${year}`
  if (first.year !== last.year) {
    return {
      solar,
      lunar: `Tháng ${lunarMonthLabel(first)} năm ${yearCanChi(first.year).name} - tháng ${lunarMonthLabel(last)} năm ${yearCanChi(last.year).name} âm lịch`,
    }
  }
  const sameMonth = first.month === last.month && first.isLeap === last.isLeap
  const range = sameMonth
    ? lunarMonthLabel(first)
    : `${lunarMonthLabel(first)}-${lunarMonthLabel(last)}`
  return { solar, lunar: `Tháng ${range} âm lịch, năm ${yearCanChi(first.year).name}` }
}

/** Tiêu đề xem Tháng một dòng: "Tháng 9/2026. Tháng 7-8 âm lịch, năm Bính Ngọ". */
export function formatMonthTitle(month: number, year: number): string {
  const { solar, lunar } = formatMonthTitleParts(month, year)
  return `${solar}. ${lunar}`
}

/** Giờ 'HH:mm' → "9:00" / "14:30". */
export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${Number(h)}:${m}`
}

/** "Hôm nay", "Ngày mai", "Hôm qua" hoặc "Thứ Bảy 26/9/2026", so với ngày `today`. */
export function formatRelativeDay(date: SolarDateString, today: SolarDateString): string {
  const diff = solarStringToJd(date) - solarStringToJd(today)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Ngày mai'
  if (diff === -1) return 'Hôm qua'
  return `${WEEKDAY_NAMES[dayOfWeek(date)]} ${formatSolarShort(date)}`
}

/**
 * Nội dung thông báo nhắc hẹn (PRD mục 40).
 * Ví dụ: { title: "Giỗ ông nội", body: "Hôm nay, 12/3 âm lịch" }
 * hoặc { title: "Họp nhóm", body: "Ngày mai lúc 9:00, 14/8 âm lịch" }.
 */
export function formatReminderMessage(
  event: Pick<CalendarEvent, 'title' | 'allDay' | 'startTime' | 'location'>,
  date: SolarDateString,
  today: SolarDateString,
): { title: string; body: string } {
  const { day, month, year } = parseSolarDate(date)
  const lunar = formatLunar(solarToLunar(day, month, year))
  const time = !event.allDay && event.startTime ? ` lúc ${formatTime(event.startTime)}` : ''
  const location = event.location ? `\n${event.location}` : ''
  return {
    title: event.title,
    body: `${formatRelativeDay(date, today)}${time}, ${lunar}${location}`,
  }
}
