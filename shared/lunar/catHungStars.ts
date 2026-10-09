import { dayCanChi } from './canChi'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { solarStringToJd } from './julian'
import { getSolarMonth } from './solarTerms'
import type { Star } from './stars'

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

export const SOURCE_LOCKED_CAT_HUNG_STAR_NAMES = [
  'Thiên Đức',
  'Thiên Đức Hợp',
  'Nguyệt Đức',
  'Nguyệt Đức Hợp',
  'Nguyệt Phá',
  'Kiếp Sát',
] as const

export type SourceLockedCatHungStarName = (typeof SOURCE_LOCKED_CAT_HUNG_STAR_NAMES)[number]

const META: Record<SourceLockedCatHungStarName, Pick<Star, 'isGood' | 'meaning'>> = {
  'Thiên Đức': { isGood: true, meaning: 'Tốt cho mọi việc.' },
  'Thiên Đức Hợp': { isGood: true, meaning: 'Tốt cho mọi việc.' },
  'Nguyệt Đức': { isGood: true, meaning: 'Tốt cho mọi việc.' },
  'Nguyệt Đức Hợp': { isGood: true, meaning: 'Tốt cho mọi việc, kỵ việc kiện tụng.' },
  'Nguyệt Phá': { isGood: false, meaning: 'Xấu cho xây dựng, cưới hỏi, mở cửa, khai trương.' },
  'Kiếp Sát': { isGood: false, meaning: 'Kỵ xuất hành, cưới hỏi, an táng, xây dựng.' },
}

function star(name: SourceLockedCatHungStarName): Star {
  return { name, ...META[name] }
}

/**
 * Source-locked Phase 4D subset only. Month operand is Month Jian, never lunar month.
 * Raw 天德 tokens 坤/乾/艮/巽 deliberately do not match until an independent normalization
 * authority is admitted. This function contains no scoring/activity resolution.
 */
export function getSourceLockedCatHungStars(monthJianBranch: number, dayCan: number, dayChi: number) {
  const row = getCatHungAuthorityByMonthJian(monthJianBranch)
  const stem = STEMS[dayCan]
  const branch = BRANCHES[dayChi]
  if (!stem || !branch) throw new RangeError('Expected day Can 0..9 and Chi 0..11')

  const good: Star[] = []
  const bad: Star[] = []
  if (row.tianDe === stem || row.tianDe === branch) good.push(star('Thiên Đức'))
  if (row.tianDeHe && (row.tianDeHe === stem || row.tianDeHe === branch)) good.push(star('Thiên Đức Hợp'))
  if (row.yueDe === stem) good.push(star('Nguyệt Đức'))
  if (row.yueDeHe === stem) good.push(star('Nguyệt Đức Hợp'))
  if (row.yuePo === branch) bad.push(star('Nguyệt Phá'))
  if (row.jieSha === branch) bad.push(star('Kiếp Sát'))
  return { good, bad }
}

/** Civil-day production adapter. Noon follows the project's whole-day presentation convention;
 * exact-instant consumers must use getCatHungAuthorityAtInstant instead.
 */
export function getSourceLockedCatHungStarsForDate(date: string, timezone = 'Asia/Ho_Chi_Minh') {
  const jd = solarStringToJd(date)
  const day = dayCanChi(jd)
  const monthJianBranch = getSolarMonth(`${date}T12:00:00+07:00`, timezone)
  return getSourceLockedCatHungStars(monthJianBranch, day.can, day.chi)
}
