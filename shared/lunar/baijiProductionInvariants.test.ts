import { describe, expect, it } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'

// 卷十 百忌日; reviewed mappings: docs/audits/baiji-{giap-at,dayzhi,ty-hoi}.md.
// Explicit contract, never derived from the production god catalog.
const RULES = [
  { id: 'giap_nhat', activity: 'warehouse_opening', operand: 'stem', index: 0 },
  { id: 'at_nhat', activity: 'planting', operand: 'stem', index: 1 },
  { id: 'dinh_nhat', activity: 'cut_hair', operand: 'stem', index: 3 },
  { id: 'bach_ky_dan', activity: 'worship', operand: 'branch', index: 2 },
  { id: 'bach_ky_dau', activity: 'meeting', operand: 'branch', index: 9 },
  { id: 'bach_ky_than', activity: 'bed_installation', operand: 'branch', index: 8 },
  { id: 'bach_ky_mui', activity: 'medical', operand: 'branch', index: 7 },
  { id: 'bach_ky_ty', activity: 'travel', operand: 'branch', index: 5 },
  { id: 'bach_ky_hoi', activity: 'wedding', operand: 'branch', index: 11 },
] as const
const DAY_MS = 86_400_000
const ANCHOR = Date.parse('2000-01-07T00:00:00Z') // independently documented 甲子
const DATES = Array.from({ length: 1095 }, (_, i) =>
  new Date(Date.parse('2025-01-01T00:00:00Z') + i * DAY_MS).toISOString().slice(0, 10),
)
const strictStatus = (score: number) =>
  score <= 19 ? 'strong_avoid' : score <= 29 ? 'avoid' : 'consider'

// No manifest mocks: these assertions protect the deployed policy combination.
describe('百忌日 and hard-warning invariants on current production policies', () => {
  it('uses the current production flags', () => {
    expect(manifest.policies).toMatchObject({
      xiejiVol10Scoring: true,
      legacyGodsMonthJian: true,
      hardWarningKeepsWorseScoreStatus: true,
    })
  })

  it('covers all nine rules, negative controls, and all hard-warning score bands in 2025–2027', () => {
    const counts = Object.fromEntries(RULES.map((rule) => [rule.id, 0]))
    const bands = new Set<string>()
    for (const date of DATES) {
      const offset = (Date.parse(`${date}T00:00:00Z`) - ANCHOR) / DAY_MS
      const stem = ((offset % 10) + 10) % 10
      const branch = ((offset % 12) + 12) % 12
      const day = getAlmanac(date as never)
      expect([day.dayCanChi.can, day.dayCanChi.chi], date).toEqual([stem, branch])
      for (const rule of RULES) {
        const expected = (rule.operand === 'stem' ? stem : branch) === rule.index
        const rows = day.activityRecommendations.flatMap((activity) =>
          activity.contributions
            .filter(
              (row) =>
                row.source === 'bad_god' && row.ruleId === rule.id && row.status === 'applied',
            )
            .map((row) => ({ activity, row })),
        )
        const where = `${date} ${rule.id}`
        expect(rows, where).toHaveLength(expected ? 1 : 0)
        if (expected) {
          counts[rule.id]!++
          expect(rows[0]!.activity.activityId, where).toBe(rule.activity)
          expect(rows[0]!.row.hardWarning, where).toBe(true)
          expect(rows[0]!.activity.status, where).toBe(strictStatus(rows[0]!.activity.score))
        }
      }
      for (const activity of day.activityRecommendations) {
        if (!activity.contributions.some((row) => row.status === 'applied' && row.hardWarning))
          continue
        const expected = strictStatus(activity.score)
        bands.add(expected)
        expect(activity.status, `${date} ${activity.activityId} score=${activity.score}`).toBe(
          expected,
        )
      }
    }
    for (const rule of RULES) {
      expect(counts[rule.id], rule.id).toBe(
        rule.operand === 'stem'
          ? ({ 0: 110, 1: 109, 3: 109 } as Record<number, number>)[rule.index]
          : rule.index === 7 || rule.index === 8
            ? 92
            : 91,
      )
    }
    expect([...bands].sort()).toEqual(['avoid', 'consider', 'strong_avoid'])
  }, 300_000)

  it('keeps 巳 travel and 亥 wedding events non-recommended with and without a selected hour', () => {
    const counts = { travel: 0, wedding: 0 }
    for (const date of DATES) {
      const branch = ((((Date.parse(`${date}T00:00:00Z`) - ANCHOR) / DAY_MS) % 12) + 12) % 12
      if (branch !== 5 && branch !== 11) continue
      const event = branch === 5 ? 'start_journey' : 'wedding'
      counts[branch === 5 ? 'travel' : 'wedding']++
      for (const options of [{}, { hour: 9 }]) {
        const result = evaluateEventDay(date as never, event, options)
        const where = `${date} ${event} hour=${'hour' in options ? options.hour : 'none'}`
        if (event === 'wedding') expect(result.classification, where).toBe('not_recommended')
        else expect(['caution', 'not_recommended'], where).toContain(result.classification)
      }
    }
    expect(counts).toEqual({ travel: 91, wedding: 91 })
  }, 300_000)
})
