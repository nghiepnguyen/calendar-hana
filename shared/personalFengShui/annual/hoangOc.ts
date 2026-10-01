import type { HoangOcValue } from './types'

const PALACE_IDS = [
  'nhatCat',
  'nhiNghi',
  'tamDiaSat',
  'tuTanTai',
  'nguThoTu',
  'lucHoangOc',
] as const

/** Deliberately limited to the reviewed 10–69 domain, with each decade restarting. */
export function calculateHoangOc(nominalAge: number): HoangOcValue {
  if (!Number.isInteger(nominalAge) || nominalAge < 10 || nominalAge > 69) {
    throw new RangeError('Hoang Ốc supports integer nominal ages 10–69 only')
  }
  const decade = Math.floor(nominalAge / 10)
  const units = nominalAge % 10
  const palace = (((decade - 1 + units) % 6) + 1) as HoangOcValue['palace']
  return {
    hit: [3, 5, 6].includes(palace),
    palace,
    palaceId: PALACE_IDS[palace - 1],
    decade,
    units,
  }
}
