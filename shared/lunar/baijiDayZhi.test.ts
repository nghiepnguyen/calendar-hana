import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-baiji-dayzhi.json'
import badGodsData from '../almanac-data/bad-gods.json'
import overridesData from '../almanac-data/overrides.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

const TARGET: Record<string, string> = {
  bach_ky_dan: 'worship',
  bach_ky_dau: 'meeting',
  bach_ky_than: 'bed_installation',
  bach_ky_mui: 'medical',
}
const NEW_GODS = Object.keys(TARGET)
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
// hardWarningKeepsWorseScoreStatus: the stricter of consider and the score status.
const hardWarningStatus = (score: number) =>
  score <= 19 ? 'strong_avoid' : score <= 29 ? 'avoid' : 'consider'

describe('卷十 百忌日: 寅日 祭祀, 酉日 宴會, 申日 安牀, 未日 求醫療病 (golden frozen before code)', () => {
  it('matches every frozen golden case', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const c of golden.cases) {
      const day = getAlmanac(c.date as never)
      expect(BRANCHES[day.dayCanChi.chi], c.date).toBe(c.dayBranch)
      const activity = day.activityRecommendations.find((r) => r.activityId === c.activityId)!
      const row = activity.contributions.find(
        (r) => r.source === 'bad_god' && r.ruleId === c.rule && r.status === 'applied',
      )
      const where = `${c.date} ${c.activityId} ${c.rule}`
      expect(Boolean(row), where).toBe(c.present)
      if (!c.present) continue
      expect(row!.hardWarning, where).toBe(c.hardWarning)
      expect(activity.status, where).not.toBe('recommended')
      expect(activity.status, where).toBe(hardWarningStatus(activity.score))
    }
  })

  it('migration: only the four target activities change, no event changes', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/bad-gods.json', () => ({
      default: { ...badGodsData, items: badGodsData.items.filter((g) => !NEW_GODS.includes(g.id)) },
    }))
    vi.doMock('../almanac-data/overrides.json', () => ({
      default: {
        ...overridesData,
        items: overridesData.items.filter((o) => !NEW_GODS.includes(o.when.targetPresent ?? '')),
      },
    }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/bad-gods.json')
    vi.doUnmock('../almanac-data/overrides.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    for (const { date } of baseline.days) {
      const before = pre.almanac(date as never).activityRecommendations
      const after = getAlmanac(date as never).activityRecommendations
      for (const [i, act] of after.entries()) {
        const prev = before[i]!
        const added = act.contributions.filter((r) => NEW_GODS.includes(r.ruleId))
        const kept = act.contributions.filter((r) => !NEW_GODS.includes(r.ruleId))
        // Everything else is identical: a new row never shifts another row (bad-god cap aside).
        expect(
          kept.map((r) => ({ ...r, scoreDelta: 0 })),
          `${date} ${act.activityId}`,
        ).toEqual(prev.contributions.map((r) => ({ ...r, scoreDelta: 0 })))
        if (!added.length) {
          expect(act, `${date} ${act.activityId}`).toEqual(prev)
          continue
        }
        expect(added).toHaveLength(1)
        expect(TARGET[added[0]!.ruleId]).toBe(act.activityId)
        expect(act.status).not.toBe('recommended')
        bump(`${act.activityId} days`)
        if (act.status !== prev.status) bump(`${act.activityId} ${prev.status} → ${act.status}`)
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = pre.evaluate(date as never, id, { hour: 9 })
        const b = evaluateEventDay(date as never, id, { hour: 9 })
        expect(b.classification, `${date} ${id}`).toBe(a.classification)
        expect(b.score, `${date} ${id}`).toBe(a.score)
      }
    }
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        Object.entries(count)
          .sort()
          .map(([k, v]) => `${v}\t${k}`)
          .join('\n'),
      )
    expect(count['worship days']).toBeGreaterThan(0)
  }, 600_000)
})
