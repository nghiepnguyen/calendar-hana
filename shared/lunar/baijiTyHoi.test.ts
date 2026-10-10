import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-baiji-ty-hoi.json'
import badGodsData from '../almanac-data/bad-gods.json'
import overridesData from '../almanac-data/overrides.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

const TARGET: Record<string, string> = { bach_ky_ty: 'travel', bach_ky_hoi: 'wedding' }
const EVENTS = new Set(['start_journey', 'wedding'])
const NEW_GODS = Object.keys(TARGET)
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const hardWarningStatus = (score: number) =>
  score <= 19 ? 'strong_avoid' : score <= 29 ? 'avoid' : 'consider'

describe('卷十 百忌日: 巳日 出行, 亥日 嫁娶 (golden frozen before code)', () => {
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
      const event = evaluateEventDay(c.date as never, c.event as never, { hour: 9 })
      if (c.eventClassification === 'not_recommended')
        expect(event.classification, where).toBe('not_recommended')
      else expect(['not_recommended', 'caution'], where).toContain(event.classification)
    }
  })

  it('migration: only travel/wedding and their events change, only on 巳/亥 days', async () => {
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
      const branch = BRANCHES[getAlmanac(date as never).dayCanChi.chi]!
      const before = pre.almanac(date as never).activityRecommendations
      const after = getAlmanac(date as never).activityRecommendations
      for (const [i, act] of after.entries()) {
        const prev = before[i]!
        const added = act.contributions.filter((r) => NEW_GODS.includes(r.ruleId))
        const kept = act.contributions.filter((r) => !NEW_GODS.includes(r.ruleId))
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
        const affected =
          (id === 'start_journey' && branch === '巳') || (id === 'wedding' && branch === '亥')
        if (!affected || !EVENTS.has(id)) {
          expect(b.classification, `${date} ${id}`).toBe(a.classification)
          expect(b.score, `${date} ${id}`).toBe(a.score)
          continue
        }
        expect(b.classification).not.toBe('recommended')
        if (id === 'wedding') expect(b.classification).toBe('not_recommended')
        if (a.classification !== b.classification)
          bump(`event ${id} ${a.classification} → ${b.classification}`)
      }
    }
    expect(count).toMatchObject({
      'travel days': 91,
      'wedding days': 91,
      'event start_journey recommended → caution': 46,
      'event wedding recommended → not_recommended': 27,
      'event wedding caution → not_recommended': 12,
      'event wedding insufficient_evidence → not_recommended': 12,
    })
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        Object.entries(count)
          .sort()
          .map(([k, v]) => `${v}\t${k}`)
          .join('\n'),
      )
  }, 900_000)
})
