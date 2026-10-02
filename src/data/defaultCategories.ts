import type { Category, Settings } from '@shared/types'

/** Bảng 12 màu cho danh mục. */
export const CATEGORY_COLORS = [
  { value: '#2563eb', name: 'Xanh dương' },
  { value: '#16a34a', name: 'Xanh lá' },
  { value: '#ea580c', name: 'Cam' },
  { value: '#dc2626', name: 'Đỏ' },
  { value: '#9333ea', name: 'Tím' },
  { value: '#db2777', name: 'Hồng' },
  { value: '#0d9488', name: 'Xanh ngọc' },
  { value: '#ca8a04', name: 'Vàng' },
  { value: '#4f46e5', name: 'Chàm' },
  { value: '#0891b2', name: 'Xanh lơ' },
  { value: '#65a30d', name: 'Xanh nõn chuối' },
  { value: '#475569', name: 'Xám' },
] as const

export const OTHER_CATEGORY_ID = 'other'
export const DEFAULT_EVENT_CATEGORY_ID = 'personal'
/** Giỗ/Lễ: chọn danh mục này thì sự kiện mặc định lặp hằng năm. */
export const MEMORIAL_CATEGORY_ID = 'memorial'

/** Danh mục mặc định với id cố định, để dữ liệu local và cloud khớp nhau. */
export function createDefaultCategories(now = new Date().toISOString()): Category[] {
  return [
    { id: 'work', name: 'Công việc', color: '#2563eb', order: 0, updatedAt: now },
    { id: 'personal', name: 'Cá nhân', color: '#16a34a', order: 1, updatedAt: now },
    { id: 'family', name: 'Gia đình', color: '#ea580c', order: 2, updatedAt: now },
    { id: MEMORIAL_CATEGORY_ID, name: 'Giỗ/Lễ', color: '#dc2626', order: 3, updatedAt: now },
    { id: 'health', name: 'Sức khỏe', color: '#0d9488', order: 4, updatedAt: now },
    {
      id: OTHER_CATEGORY_ID,
      name: 'Khác',
      color: '#475569',
      order: 5,
      isSystem: true,
      updatedAt: now,
    },
  ]
}

export function createDefaultSettings(now = new Date().toISOString()): Settings {
  return {
    birthTimePrecision: null,
    birthTimeUncertaintyMinutes: null,
    birthPlace: null,
    birthTimezoneId: null,
    birthTimezoneSource: null,
    birthConfirmedOffsetMinutes: null,
    birthZiPolicy: 'splitZi',
    birthGender: null,
    weekStartsOn: 1,
    showHolidays: true,
    showAuspicious: true,
    showPersonalFengShui: true,
    allDayReminderTime: '08:00',
    theme: 'system',
    textSize: 'default',
    boldText: false,
    hiddenCategoryIds: [],
    updatedAt: now,
  }
}
