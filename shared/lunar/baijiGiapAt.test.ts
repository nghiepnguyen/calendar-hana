import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-baiji-giap-at.json'
import badGodsData from '../almanac-data/bad-gods.json'
import overridesData from '../almanac-data/overrides.json'
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
      policies: {
        ...current.policies,
        xiejiVol10BalancingEnabled: false,
        xiejiVol10Scoring: false,
        legacyGodsMonthJian: false,
      },
    },
  }
})

const NEW_GODS = ['giap_nhat', 'at_nhat']
const TARGET: Record<string, string> = { giap_nhat: 'warehouse_opening', at_nhat: 'planting' }
const STEMS = '甲乙丙丁戊己庚辛壬癸'

describe('卷十 百忌日: 甲日 開倉庫出貨財, 乙日 栽種 (golden frozen before code)', () => {
  it('matches every frozen golden case', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const c of golden.cases) {
      const day = getAlmanac(c.date as never)
      expect(STEMS[day.dayCanChi.can], c.date).toBe(c.dayStem)
      const activity = day.activityRecommendations.find((r) => r.activityId === c.activityId)!
      const row = activity.contributions.find(
        (r) => r.source === 'bad_god' && r.ruleId === c.rule && r.status === 'applied',
      )
      const where = `${c.date} ${c.activityId} ${c.rule}`
      expect(Boolean(row), where).toBe(c.present)
      if (!c.present) continue
      expect(row!.hardWarning, where).toBe(c.hardWarning)
      expect(activity.status, where).toBe(c.status)
    }
  })

  it('migration: only the two target activities change, each by its new row', async () => {
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
        for (const row of added) expect(TARGET[row.ruleId]).toBe(act.activityId)
        bump(`${act.activityId} days with ${added.map((r) => r.ruleId).join('+')}`)
        if (act.status !== prev.status) bump(`${act.activityId} ${prev.status} → ${act.status}`)
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = pre.evaluate(date as never, id, { hour: 9 })
        const b = evaluateEventDay(date as never, id, { hour: 9 })
        expect(b.classification, `${date} ${id}`).toBe(a.classification)
        expect(b.score, `${date} ${id}`).toBe(a.score)
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
