// Ngày hoàng đạo / hắc đạo, giờ hoàng đạo và các ngày kỵ cơ bản.
//
// Day-level 黃道黒道 authority: 欽定協紀辨方書 卷七〈黃道黒道〉.
// Its month operand is 月建 / Month Jian, not lunar month. Exact-instant callers use the
// canonical JPL/Jie authority through getSolarMonth. Legacy lunar-month API remains temporarily
// for migration evidence only and must not be used by new production code.

import { formatInTimeZone } from 'date-fns-tz'
import { todayInVietnam } from '../time'
import { CHI, dayCanChi, hourCanChi, type CanChi } from './canChi'
import { solarStringToJd } from './julian'
import { getSolarMonth } from './solarTerms'

/** 12 vị thần theo thứ tự luân phiên, bắt đầu từ Thanh Long. */
export const TWELVE_GODS = [
  { name: 'Thanh Long', good: true },
  { name: 'Minh Đường', good: true },
  { name: 'Thiên Hình', good: false },
  { name: 'Chu Tước', good: false },
  { name: 'Kim Quỹ', good: true },
  { name: 'Thiên Đức', good: true },
  { name: 'Bạch Hổ', good: false },
  { name: 'Ngọc Đường', good: true },
  { name: 'Thiên Lao', good: false },
  { name: 'Huyền Vũ', good: false },
  { name: 'Tư Mệnh', good: true },
  { name: 'Câu Trận', good: false },
] as const

export interface DayGod {
  name: string
  /** true = ngày hoàng đạo, false = ngày hắc đạo. */
  isHoangDao: boolean
}

/** Canonical day god from Month Jian branch (0=Tý ... 11=Hợi) and day branch. */
export function getDayGodByMonthJian(monthJianBranch: number, dayChi: number): DayGod {
  if (!Number.isInteger(monthJianBranch) || monthJianBranch < 0 || monthJianBranch > 11)
    throw new RangeError('Expected Month Jian branch 0..11')
  if (!Number.isInteger(dayChi) || dayChi < 0 || dayChi > 11)
    throw new RangeError('Expected day branch 0..11')
  // 寅申→子, 卯酉→寅, 辰戌→辰, 巳亥→午, 午子→申, 未丑→戌.
  const startChi = ((monthJianBranch + 10) % 6) * 2
  const god = TWELVE_GODS[(dayChi - startChi + 12) % 12]!
  return { name: god.name, isHoangDao: god.good }
}

/** Exact-instant authority path. Month Jian changes at the canonical Jie millisecond. */
export function getDayGodAtInstant(
  dateTime: string,
  timezone: string,
): DayGod & { monthJianBranch: number; dayBranch: number } {
  const monthJianBranch = getSolarMonth(dateTime, timezone)
  const instant = new Date(dateTime)
  if (!Number.isFinite(instant.getTime())) throw new RangeError('Invalid instant')
  const date =
    timezone === 'Asia/Ho_Chi_Minh'
      ? todayInVietnam(instant)
      : formatInTimeZone(instant, timezone, 'yyyy-MM-dd')
  const dayBranch = dayCanChi(solarStringToJd(date)).chi
  return { ...getDayGodByMonthJian(monthJianBranch, dayBranch), monthJianBranch, dayBranch }
}

/**
 * @deprecated Historical Vietnamese lunar-month convention retained only for migration/audit tests.
 * New production code must use getDayGodByMonthJian or getDayGodAtInstant.
 */
export function getDayGod(lunarMonth: number, dayChi: number): DayGod {
  const startChi = ((lunarMonth - 1) % 6) * 2
  const god = TWELVE_GODS[(dayChi - startChi + 12) % 12]!
  return { name: god.name, isHoangDao: god.good }
}

export interface AuspiciousHour {
  chi: number
  /** Ví dụ "Tý". */
  name: string
  /** Giờ bắt đầu (0..23), ví dụ Tý là 23. */
  startHour: number
  /** Giờ kết thúc, ví dụ Tý là 1. */
  endHour: number
  /** Ví dụ "Tý (23h–1h)". */
  label: string
  god: string
}

function hourRange(chi: number): { startHour: number; endHour: number } {
  const startHour = (23 + chi * 2) % 24
  return { startHour, endHour: (startHour + 2) % 24 }
}

/**
 * 6 giờ hoàng đạo trong ngày, dựa vào Chi của ngày.
 * Thanh Long của giờ khởi ở: ngày Tý, Ngọ → giờ Thân; Sửu, Mùi → Tuất; Dần, Thân → Tý;
 * Mão, Dậu → Dần; Thìn, Tuất → Thìn; Tỵ, Hợi → Ngọ.
 */
export function getAuspiciousHours(dayChi: number): AuspiciousHour[] {
  return getHourGods(dayChi)
    .filter((h) => h.isGood)
    .map(({ isGood: _isGood, ...hour }) => hour)
}

/** Thần trực của đủ 12 giờ trong ngày (Tý..Hợi), dựa vào Chi của ngày. */
function getHourGods(dayChi: number): (AuspiciousHour & { isGood: boolean })[] {
  const startChi = (8 + (dayChi % 6) * 2) % 12
  return CHI.map((name, chi) => {
    const god = TWELVE_GODS[(chi - startChi + 12) % 12]!
    const { startHour, endHour } = hourRange(chi)
    return {
      chi,
      name,
      startHour,
      endHour,
      label: `${name} (${startHour}h-${endHour}h)`,
      god: god.name,
      isGood: god.good,
    }
  })
}

export interface DayHour extends AuspiciousHour {
  /** Can Chi của giờ, ví dụ "Canh Tý". */
  canChi: CanChi
  /** true = giờ hoàng đạo (tốt). */
  isGood: boolean
  /** Giờ Sát Chủ của tháng âm: kỵ cất nhà, cưới gả. Độc lập với hoàng đạo/hắc đạo. */
  isSatChu: boolean
}

/**
 * Chi giờ Sát Chủ theo tháng âm 1..12, Ngọc Hạp Chánh Tông tr. 129: "Chánh, Thất, giai qui Hổ /
 * Nhị, Bát, tốc thị Xà…". Tháng nhuận dùng tháng thường cùng số.
 */
export const SAT_CHU_HOUR = Object.freeze([2, 5, 8, 4, 9, 3, 2, 5, 8, 4, 9, 3])

/** Đủ 12 giờ của ngày jd theo thứ tự Tý..Hợi, kèm Can Chi giờ, giờ tốt/xấu và giờ Sát Chủ. */
export function getAllHours(jd: number, dayChi: number, lunarMonth: number): DayHour[] {
  return getHourGods(dayChi).map((h) => ({
    ...h,
    canChi: hourCanChi(jd, h.chi),
    isSatChu: SAT_CHU_HOUR[lunarMonth - 1] === h.chi,
  }))
}

export interface BadDay {
  name: string
  description: string
}

const TAM_NUONG_DAYS = new Set([3, 7, 13, 18, 22, 27])
const NGUYET_KY_DAYS = new Set([5, 14, 23])

/** Các ngày kỵ theo ngày âm: Tam Nương, Nguyệt Kỵ. */
export function getBadDays(lunarDay: number): BadDay[] {
  const result: BadDay[] = []
  if (TAM_NUONG_DAYS.has(lunarDay)) {
    result.push({
      name: 'Tam Nương',
      description: 'Kỵ khởi công, cưới hỏi, xuất hành, khai trương.',
    })
  }
  if (NGUYET_KY_DAYS.has(lunarDay)) {
    result.push({
      name: 'Nguyệt Kỵ',
      description: 'Kỵ đi xa, làm việc lớn.',
    })
  }
  return result
}
