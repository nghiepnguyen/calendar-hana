import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-hard-warning-status.json'
import manifest from '../almanac-data/manifest.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

// Keep this historical migration/Golden independent of later 卷十 activation.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const { default: current } = await importOriginal<{
    default: typeof import('../almanac-data/manifest.json')
  }>()
  return {
    default: {
      ...current,
      policies: { ...current.policies, xiejiVol10Scoring: false, legacyGodsMonthJian: false },
    },
  }
})

// Owner 2026-10-10: a hard warning takes the stricter of `consider` and the score status.
const strict = (score: number) =>
  score <= 19 ? 'strong_avoid' : score <= 29 ? 'avoid' : 'consider'

describe('hard warning never softens a bad score (golden frozen before the fix)', () => {
  it('policy is on', () => {
    expect(manifest.policies.hardWarningKeepsWorseScoreStatus).toBe(true)
  })

  it('matches every frozen golden case', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const c of golden.cases) {
      const a = getAlmanac(c.date as never).activityRecommendations.find(
        (r) => r.activityId === c.activityId,
      )!
      const where = `${c.date} ${c.activityId}`
      expect(a.score, where).toBe(c.score)
      expect(
        a.contributions.filter((r) => r.hardWarning).map((r) => r.ruleId),
        where,
      ).toEqual(c.hardWarnings)
      expect(a.status, where).toBe(c.expectedStatus)
    }
  })

  it('migration: only hard-warning activities scoring <= 29 change; scores and events identical', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/manifest.json', () => ({
      default: {
        ...manifest,
        policies: { ...manifest.policies, hardWarningKeepsWorseScoreStatus: false },
      },
    }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/manifest.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    for (const { date } of baseline.days) {
      const before = pre.almanac(date as never).activityRecommendations
      for (const [i, a] of getAlmanac(date as never).activityRecommendations.entries()) {
        const prev = before[i]!
        const where = `${date} ${a.activityId}`
        expect({ ...a, status: '' }, where).toEqual({ ...prev, status: '' })
        if (a.status === prev.status) continue
        const hw = a.contributions.filter((r) => r.hardWarning).map((r) => r.ruleId)
        expect(hw.length, where).toBeGreaterThan(0)
        expect(prev.status, where).toBe('consider')
        expect(a.status, where).toBe(strict(a.score))
        bump(`consider → ${a.status} (${hw.join('+')}, ${a.activityId})`)
      }
      for (const [id] of EVENT_OPTIONS) {
        const x = pre.evaluate(date as never, id, { hour: 9 })
        const y = evaluateEventDay(date as never, id, { hour: 9 })
        expect([y.classification, y.score], `${date} ${id}`).toEqual([x.classification, x.score])
      }
    }
    expect(Object.keys(count).length).toBeGreaterThan(0)
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        Object.entries(count)
          .sort()
          .map(([k, v]) => `${v}\t${k}`)
          .join('\n'),
      )
  }, 300000)
})
