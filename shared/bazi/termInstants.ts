import { solarTermsForYear } from '../lunar/solarTerms'

export const MONTH_OPENING_ANGLES = [
  315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285,
] as const
export const MONTH_OPENING_NAMES = [
  'Lập Xuân',
  'Kinh Trập',
  'Thanh Minh',
  'Lập Hạ',
  'Mang Chủng',
  'Tiểu Thử',
  'Lập Thu',
  'Bạch Lộ',
  'Hàn Lộ',
  'Lập Đông',
  'Đại Tuyết',
  'Tiểu Hàn',
] as const

export interface TermInstant {
  name: (typeof MONTH_OPENING_NAMES)[number]
  longitude: (typeof MONTH_OPENING_ANGLES)[number]
  instantUtc: string
}

export function monthOpeningTerms(year: number): readonly TermInstant[] {
  // 1899 is required only to resolve the active term for January 1900 births.
  if (!Number.isInteger(year) || year < 1899 || year > 2100)
    throw new RangeError('Unsupported year')
  const terms = [...solarTermsForYear(year), ...solarTermsForYear(year + 1)]
  return MONTH_OPENING_ANGLES.map((longitude, index) => {
    // Preserve the Bazi cycle: Lập Xuân of year through Tiểu Hàn of year + 1.
    const term = terms.find(
      (t) =>
        t.longitude === longitude &&
        new Date(t.instantUtc).getUTCFullYear() === (index === 11 ? year + 1 : year),
    )
    if (!term) throw new Error(`Cannot find solar term ${longitude}`)
    return { name: MONTH_OPENING_NAMES[index], longitude, instantUtc: term.instantUtc }
  })
}

export function termContextAt(instantUtc: string) {
  const instant = Date.parse(instantUtc)
  if (!Number.isFinite(instant)) throw new RangeError('Invalid instant')
  const year = new Date(instant).getUTCFullYear()
  const terms = [...monthOpeningTerms(year - 1), ...monthOpeningTerms(year)]
  const active = terms.filter((term) => Date.parse(term.instantUtc) <= instant).at(-1)
  if (!active) throw new Error('No active term')
  const monthOffset = MONTH_OPENING_ANGLES.indexOf(active.longitude)
  const lichun = monthOpeningTerms(year)[0]
  const pillarYear = instant >= Date.parse(lichun.instantUtc) ? year : year - 1
  return { activeTerm: active, monthOffset, pillarYear }
}
