import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4OwnerRulesDay } from './p4OwnerRules'
import { setP4HeadingsProvider, type P4DayOperands, type P4HeadingInput } from './p4ScoreAdapter'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiSoil'

// Roadmap 8: P4 operands (moon phase, soil) are frozen for these civil dates only (PRD goal 4).
const P4_DOMAIN = ['2025-01-01', '2027-12-31'] as const
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

/** Heading states of a day for the score adapter; `{}` (every activity on baseline) outside the
 * P4 domain or when resolution fails (PRD goal 5: never throw in production). */
export function getP4DayHeadings(date: string, day: P4DayOperands): Record<string, P4HeadingInput> {
  if (date < P4_DOMAIN[0] || date > P4_DOMAIN[1]) return {}
  try {
    const rows = resolveP4OwnerRulesDay(
      BRANCHES[day.monthJianBranch]!,
      STEMS[day.dayStem]! + BRANCHES[day.dayBranch]!,
      {
        lunarDay: day.lunarDay,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      },
    )
    return Object.fromEntries(
      Object.entries(rows).map(([heading, row]) => [
        heading,
        {
          state: row.state,
          ...(row.rule === 'all_taboo' ? { rule: 'all_taboo' } : {}),
          ...(row.trace?.prot.length ? { prot: row.trace.prot } : {}),
        },
      ]),
    )
  } catch {
    return {}
  }
}

setP4HeadingsProvider(getP4DayHeadings)
