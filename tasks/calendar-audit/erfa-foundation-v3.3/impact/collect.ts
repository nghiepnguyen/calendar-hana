// Evaluates every solar-term consumer at the projection probes. Shared by the
// baseline (production astronomy) and ERFA (mocked SearchSunLongitude) runs.
import { createHash } from 'node:crypto'
import { termContextAt } from '../../../../shared/bazi/termInstants'
import { calculatePillars } from '../../../../shared/bazi/pillars'
import { getAlmanac } from '../../../../shared/lunar/almanac'
import { dayCanChi } from '../../../../shared/lunar/canChi'
import { evaluateGroupAAtInstant } from '../../../../shared/lunar/groupA'
import { evaluateGroupBAtInstant } from '../../../../shared/lunar/groupB'
import { solarStringToJd } from '../../../../shared/lunar/julian'
import { getOfficer, getOfficerAtInstant } from '../../../../shared/lunar/officers'
import {
  getSolarMonth,
  getSolarTerm,
  getSolarTermAt,
  solarTermMonthChi,
  solarTermsForYear,
} from '../../../../shared/lunar/solarTerms'
import { getDaySeo } from '../../../../shared/seo/daySeo'
import type { SolarDateString } from '../../../../shared/types'

const ZONE = 'Asia/Ho_Chi_Minh'
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16)
const safe = <T>(f: () => T): T | { error: string } => {
  try {
    return f()
  } catch (e) {
    return { error: String((e as Error).message ?? e) }
  }
}

export function productionRoots() {
  const rows: { year: number; longitude: number; civilMs: number }[] = []
  for (let year = 1900; year <= 2100; year++)
    for (const t of solarTermsForYear(year))
      rows.push({ year, longitude: t.longitude, civilMs: Date.parse(t.instantUtc) })
  return rows
}

export function evaluateInstant(ms: number) {
  const iso = new Date(ms).toISOString()
  const vnLocal = new Date(ms + 7 * 3600000).toISOString().slice(0, 19)
  return {
    solarTermAt: safe(() => getSolarTermAt(iso).index),
    solarMonth: safe(() => getSolarMonth(iso, ZONE)),
    officerAtInstant: safe(() => getOfficerAtInstant(iso, ZONE).index),
    groupA: safe(() => evaluateGroupAAtInstant(iso, ZONE).rules.map((r) => r.matched)),
    groupB: safe(() =>
      evaluateGroupBAtInstant(iso, ZONE)
        .rules.filter((r) => r.matched)
        .map((r) => r.id),
    ),
    baziTerm: safe(() => {
      const t = termContextAt(iso)
      return { term: t.activeTerm.name, monthOffset: t.monthOffset, pillarYear: t.pillarYear }
    }),
    // Month/year pillars only depend on the term context; TST here is the civil
    // UTC+7 reading so day/hour pillars stay constant across both runs.
    baziPillars: safe(() => {
      const p = calculatePillars(iso, vnLocal, 'splitZi').pillars
      return { year: p.year.name, month: p.month.name }
    }),
  }
}

export function evaluateDay(date: SolarDateString) {
  const jd = solarStringToJd(date)
  return {
    solarTerm: safe(() => getSolarTerm(jd)),
    solarTermDisplayVn: safe(() => {
      const t = getSolarTerm(jd)
      return new Date(Date.parse(t.startsAtUtc) + 7 * 3600000).toISOString().slice(0, 16)
    }),
    monthChi: safe(() => solarTermMonthChi(jd)),
    officer: safe(() => getOfficer(jd, dayCanChi(jd).chi).index),
    groupA: safe(() => evaluateGroupAAtInstant(`${date}T12:00:00+07:00`, ZONE).rules.map((r) => r.matched)),
    // Semantic almanac content; the term start timestamp is tracked separately as display.
    almanac: safe(() => {
      const a = getAlmanac(date)
      return sha({ ...a, solarTerm: { ...a.solarTerm, startsAtUtc: null } })
    }),
    almanacTermTimestamp: safe(() => getAlmanac(date).solarTerm.startsAtUtc),
    almanacOfficerAndStars: safe(() => {
      const a = getAlmanac(date)
      return { officer: a.officer.index, stars: sha(a.stars), recommendations: sha(a.activityRecommendations) }
    }),
    seo: safe(() => sha(getDaySeo(date))),
  }
}
