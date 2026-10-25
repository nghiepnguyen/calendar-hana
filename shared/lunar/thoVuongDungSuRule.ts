import { TIME_ZONE_OFFSET } from './lunar'
import { thoVuongDungSuPeriods } from './thoVuongDungSu'

/**
 * Calendar-rule service for 土王用事 as 劫煞 authority input (G1-SOIL Stage 2, owner ruling 2026-10-25).
 * Rule `tho-vuong-dung-su-rule-v1`: for each 四立 (JPL true-term instant → civil date at UTC+7) the window is
 * [立 − 18, 立 − 1], both ends included, the 立 day excluded (協紀 卷一 + 卷六 「四立前一辰」 = 先一日;
 * docs/audits/p4-g1-soil-authority.md). Supported 1900-01-01 … 2100-12-31. A change of timezone, civil
 * conversion, solar-term authority or inclusivity is a new rule version, never an edit under this id.
 */
export const THO_VUONG_DUNG_SU_RULE_ID = 'tho-vuong-dung-su-rule-v1'
export type SoilState = 'inside' | 'outside'

// The civil-date convention is part of the rule identity: refuse to load under another offset.
if (TIME_ZONE_OFFSET !== 7)
  throw new Error(
    `${THO_VUONG_DUNG_SU_RULE_ID}: civil dates are frozen at UTC+7, got ${TIME_ZONE_OFFSET}`,
  )

/** Inside or outside 土王用事 on a civil date; throws on a malformed or unsupported date. */
export function thoVuongDungSuState(date: string): SoilState {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  )
    throw new RangeError(`${THO_VUONG_DUNG_SU_RULE_ID}: invalid civil date ${String(date)}`)
  if (date < '1900-01-01' || date > '2100-12-31')
    throw new RangeError(`${THO_VUONG_DUNG_SU_RULE_ID}: ${date} outside 1900–2100`)
  const periods = thoVuongDungSuPeriods(Number(date.slice(0, 4)))
  if (periods.length !== 4)
    throw new Error(`${THO_VUONG_DUNG_SU_RULE_ID}: expected 4 windows in ${date.slice(0, 4)}`)
  return periods.some((p) => date >= p.onset && date <= p.eve) ? 'inside' : 'outside'
}
