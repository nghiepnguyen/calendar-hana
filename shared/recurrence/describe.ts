// Câu mô tả quy tắc lặp bằng tiếng Việt, ví dụ "Lặp hằng năm vào ngày 12/3 âm lịch".

import { WEEKDAY_NAMES, formatLunarShort, formatSolarShort } from '../format'
import { dayOfWeek, parseSolarDate } from '../lunar/julian'
import { solarToLunar } from '../lunar/lunar'
import { isLunarDate, type CalendarEvent } from '../types'
import { getEventStartDate } from './recurrence'

type RecurringLike = Pick<CalendarEvent, 'date' | 'recurrence'>

export function describeRecurrence(event: RecurringLike): string {
  const rule = event.recurrence
  if (!rule) return 'Không lặp'
  const start = getEventStartDate(event)
  const s = parseSolarDate(start)
  const lunar = isLunarDate(event.date) ? event.date : solarToLunar(s.day, s.month, s.year)

  let text: string
  if (rule.calendar === 'lunar') {
    text =
      rule.freq === 'monthly'
        ? `Lặp hằng tháng vào ngày ${lunar.day} âm lịch`
        : `Lặp hằng năm vào ngày ${formatLunarShort({ ...lunar, isLeap: false })} âm lịch`
  } else {
    switch (rule.freq) {
      case 'daily':
        text = 'Lặp hằng ngày'
        break
      case 'weekly': {
        const days = rule.byWeekday?.length ? rule.byWeekday : [dayOfWeek(start)]
        // Thứ Hai → Chủ nhật.
        const ordered = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
        text = `Lặp hằng tuần vào ${ordered.map((d) => WEEKDAY_NAMES[d]).join(', ')}`
        break
      }
      case 'monthly':
        text = `Lặp hằng tháng vào ngày ${s.day}`
        break
      case 'yearly':
        text = `Lặp hằng năm vào ngày ${s.day}/${s.month}`
        break
    }
  }

  if (rule.until) text += `, đến hết ${formatSolarShort(rule.until)}`
  else if (rule.count) text += `, ${rule.count} lần`
  return text
}
