import { solarTermsForYear } from './solarTerms'
import { TIME_ZONE_OFFSET } from './lunar'

/** 立春, 立夏, 立秋, 立冬 as longitude / 15 indices. */
const SI_LI = [21, 3, 9, 15] as const
const DAY_MS = 86_400_000

const civilDate = (epochMs: number) =>
  new Date(epochMs + TIME_ZONE_OFFSET * 3_600_000).toISOString().slice(0, 10)

/**
 * 土王用事 periods of a civil year: the 18 civil days before each 四立, the 立 day excluded.
 * 協紀 卷一: 「土於四立之前各旺一十八日」. Day count from the 立 civil date (owner 2026-10-10),
 * not a solar-longitude rule, which 協紀 does not give. All four fall inside the same year.
 */
export function thoVuongDungSuPeriods(year: number) {
  const terms = solarTermsForYear(year)
  return SI_LI.map((index) => {
    const li = civilDate(Date.parse(terms.find((term) => term.index === index)!.instantUtc))
    const liMs = Date.parse(`${li}T00:00:00Z`)
    return {
      termIndex: index,
      li,
      onset: new Date(liMs - 18 * DAY_MS).toISOString().slice(0, 10),
      eve: new Date(liMs - DAY_MS).toISOString().slice(0, 10),
    }
  })
}

export function isThoVuongDungSu(date: string): boolean {
  return thoVuongDungSuPeriods(Number(date.slice(0, 4))).some(
    (period) => date >= period.onset && date <= period.eve,
  )
}
