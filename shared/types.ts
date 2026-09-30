// Kiểu dữ liệu dùng chung giữa frontend và Cloud Functions.
// Không import React, Dexie hay Firebase trong thư mục shared/.

/** Ngày dương dạng chuỗi 'YYYY-MM-DD' (luôn hiểu theo giờ Việt Nam). */
export type SolarDateString = string

/** Giờ trong ngày dạng 'HH:mm' (24 giờ). */
export type TimeString = string

export type CalendarType = 'solar' | 'lunar'

export interface LunarDate {
  day: number
  month: number
  year: number
  isLeap: boolean
}

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurrence {
  freq: RecurrenceFreq
  /** Lặp theo dương lịch hay âm lịch. Âm lịch chỉ hỗ trợ 'monthly' và 'yearly'. */
  calendar: CalendarType
  /** Chỉ dùng cho freq 'weekly': 0 = Chủ nhật, 1 = Thứ Hai, ... 6 = Thứ Bảy. */
  byWeekday?: number[]
  /** Lặp đến hết ngày này (ngày dương, tính cả ngày này). */
  until?: SolarDateString
  /** Số lần diễn ra tối đa (tính cả lần đầu). */
  count?: number
}

export type ReminderChannel = 'notification' | 'email'

export interface Reminder {
  /** Số phút nhắc trước giờ bắt đầu. 0 = lúc diễn ra. */
  offsetMinutes: number
  channel: ReminderChannel
}

/** Phần có thể ghi đè cho một lần diễn ra riêng lẻ của sự kiện lặp. */
export type EventOverride = Partial<
  Pick<
    CalendarEvent,
    'title' | 'allDay' | 'startTime' | 'endTime' | 'categoryId' | 'reminders' | 'location' | 'note'
  >
> & {
  /** Dời lần diễn ra này sang ngày dương khác. */
  date?: SolarDateString
}

export interface CalendarEvent {
  id: string
  title: string
  calendarType: CalendarType
  /** calendarType 'solar': chuỗi 'YYYY-MM-DD'. calendarType 'lunar': LunarDate. */
  date: SolarDateString | LunarDate
  allDay: boolean
  startTime?: TimeString
  endTime?: TimeString
  categoryId: string
  recurrence?: Recurrence
  /** Khóa là occurrenceKey ('YYYY-MM-DD' ngày dương gốc của lần diễn ra). */
  exceptions?: Record<string, 'deleted' | EventOverride>
  reminders: Reminder[]
  location?: string
  note?: string
  /** ISO timestamp. */
  createdAt: string
  /** ISO timestamp, dùng cho last-write-wins khi đồng bộ. */
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  /** Mã màu hex, ví dụ '#2563eb'. */
  color: string
  /** Danh mục hệ thống ("Khác") không xóa được. */
  isSystem?: boolean
  order: number
  updatedAt: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

/** Cỡ chữ toàn app. Chữ, icon, nút và khoảng cách cùng phóng theo tỉ lệ. */
export type TextSize = 'default' | 'large' | 'xlarge'

export interface Settings {
  /** Ngày sinh dương lịch. null = đã xóa; undefined = chưa nhập ở bản cũ. */
  birthDate?: SolarDateString | null
  /** Giờ sinh 24 giờ, tùy chọn, không tự suy ra từ Google. */
  birthTime?: TimeString | null
  /** 1 = Thứ Hai, 0 = Chủ nhật. */
  weekStartsOn: 0 | 1
  showHolidays: boolean
  showAuspicious: boolean
  /** Giờ gửi nhắc hẹn cho sự kiện cả ngày, dạng 'HH:mm'. */
  allDayReminderTime: TimeString
  theme: ThemePreference
  textSize: TextSize
  /** Làm chữ đậm hơn để dễ đọc trên nền kính mờ. */
  boldText: boolean
  hiddenCategoryIds: string[]
  updatedAt: string
}

export const EVENT_TITLE_MAX = 200
export const EVENT_NOTE_MAX = 2000
export const MAX_REMINDERS = 5

export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function isLunarDate(value: CalendarEvent['date']): value is LunarDate {
  return typeof value === 'object' && value !== null
}
