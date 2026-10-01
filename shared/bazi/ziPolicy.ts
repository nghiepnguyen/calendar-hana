import { addDays } from '../lunar/julian'
import type { ZiPolicy } from './types'

export function resolveZiPolicy(tstDateTime: string, policy: ZiPolicy) {
  if (policy !== 'splitZi' && policy !== 'dayStartsAt23') throw new RangeError('Invalid Zi policy')
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):\d{2}(?:\.\d{3})?$/.exec(tstDateTime)
  if (!match) throw new RangeError('Invalid TST date-time')
  const date = match[1]
  const hour = Number(match[2])
  const next = addDays(date, 1)
  const isLateZi = hour === 23
  const hourChi = Math.floor(((hour + 1) % 24) / 2)
  return {
    dayPillarDate: isLateZi && policy === 'dayStartsAt23' ? next : date,
    hourStemDate: isLateZi ? next : date,
    hourChi,
    policy,
  }
}
