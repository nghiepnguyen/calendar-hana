import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS, getEventProfile, resolveEventActivityRoles } from './eventMapping'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

describe('no taboo means neutral up to high severity (owner, 10/10/2026)', () => {
  it('policy is set to high', () => {
    expect(manifest.policies.noTabooMeansNeutralUpToSeverity).toBe('high')
  })

  it('migration: only events whose primary activity has no evidence change', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/manifest.json', () => ({
      default: {
        ...manifest,
        policies: {
          ...manifest.policies,
          xiejiVol10BalancingEnabled: false,
          noTabooMeansNeutralUpToSeverity: 'low',
        },
      },
    }))
    const pre = (await import('./eventEvaluation')).evaluateEventDay
    vi.doUnmock('../almanac-data/manifest.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    for (const { date } of baseline.days) {
      const day = getAlmanac(date as never)
      for (const [id] of EVENT_OPTIONS) {
        const input = { hour: 9 }
        const a = pre(date as never, id, input)
        const b = evaluateEventDay(date as never, id, input)
        const severity = getEventProfile(id)!.severity
        const primaryId = resolveEventActivityRoles(id, input).find(
          (role) => role.role === 'primary',
        )!.activityId
        const primary = day.activityRecommendations.find((row) => row.activityId === primaryId)!
        const where = `${date} ${id}`
        // Contributions never change; only the reading of a primary without evidence does.
        expect(b.contributions, where).toEqual(a.contributions)
        if (primary.status !== 'no_evidence' || severity === 'very_high') {
          expect(b.classification, where).toBe(a.classification)
          expect(b.score, where).toBe(a.score)
          continue
        }
        expect(b.neutralByPolicy, where).toBe(true)
        expect(b.classification, where).not.toBe('recommended')
        if (a.classification === b.classification) continue
        if (severity === 'low') {
          // The cap only: a neutral haircut lifted by supporting rows is no longer recommended.
          expect([a.classification, b.classification], where).toEqual(['recommended', 'caution'])
        } else {
          expect(a.classification, where).toBe('insufficient_evidence')
        }
        bump(`event [${severity}] ${a.classification} → ${b.classification}`)
        bump(`event ${id} ${a.classification} → ${b.classification}`)
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
