import art from '../almanac-data/p4-vol10-season-days.json'
import type { P4Presence } from './p4ContextBridge'

/** Source audit only: 四時 days of 協紀 卷五 (王/官/相/民/守日) and 月令長生, by Month Jian
 * season. Presence operands for the 等第 partner labels and 卷十一 宜 lists; no effect alone. */
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const SEASON = ['冬', '冬', '春', '春', '春', '夏', '夏', '夏', '秋', '秋', '秋', '冬'] as const
type Day = { branches: Record<string, string>; unknownMonths?: string[] }

export const P4_SEASON_DAYS = Object.keys(art.days) as readonly string[]

export function getP4SeasonDays(monthJianBranch: number, dayBranch: number) {
  if (![monthJianBranch, dayBranch].every((n) => Number.isInteger(n) && n >= 0 && n < 12))
    throw new RangeError('Expected Month Jian and day branch 0..11')
  const month = BRANCHES[monthJianBranch]!
  const out: Record<string, P4Presence> = {}
  for (const [name, day] of Object.entries(art.days as Record<string, Day>))
    out[name] = day.unknownMonths?.includes(month)
      ? 'unknown'
      : day.branches[SEASON[monthJianBranch]] === BRANCHES[dayBranch]
        ? 'present'
        : 'absent'
  return out
}
