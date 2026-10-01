import { CAN, CHI, dayCanChi, hourCanChi, yearCanChi, type CanChi } from '../lunar/canChi'
import { solarStringToJd } from '../lunar/julian'
import { termContextAt } from './termInstants'
import { resolveZiPolicy } from './ziPolicy'
import type { ZiPolicy } from './types'

function make(can: number, chi: number): CanChi {
  const normalizedCan = ((can % 10) + 10) % 10
  const normalizedChi = ((chi % 12) + 12) % 12
  return {
    can: normalizedCan,
    chi: normalizedChi,
    name: `${CAN[normalizedCan]} ${CHI[normalizedChi]}`,
  }
}

export function calculatePillars(instantUtc: string, tstDateTime: string, policy: ZiPolicy) {
  const term = termContextAt(instantUtc)
  const year = yearCanChi(term.pillarYear)
  const monthChi = term.monthOffset + 2
  const month = make((year.can % 5) * 2 + 2 + term.monthOffset, monthChi)
  const zi = resolveZiPolicy(tstDateTime, policy)
  const day = dayCanChi(solarStringToJd(zi.dayPillarDate))
  const hour = hourCanChi(solarStringToJd(zi.hourStemDate), zi.hourChi)
  return { pillars: { year, month, day, hour }, zi, term }
}
