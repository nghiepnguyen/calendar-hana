import authority from '../almanac-data/p4-soil-owner-convention-v1.json'
import { thoVuongDungSuPeriods } from './thoVuongDungSu'

/** Audit-only reuse under the new P4-B owner approval; canonical witness remains open. */
export function getP4SoilPresence(date: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new RangeError('Invalid civil date')
  const [start, end] = authority.convention.coverage
  const presence =
    date < start! || date > end!
      ? 'unknown'
      : thoVuongDungSuPeriods(Number(date.slice(0, 4))).some(
            (p) => date >= p.onset && date <= p.eve,
          )
        ? 'present'
        : 'absent'
  return { date, authorityId: authority.version, status: authority.status, presence }
}
