import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-tu-vuong-dung-su.json'
import badGodsData from '../almanac-data/bad-gods.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { isThoVuongDungSu, thoVuongDungSuPeriods } from './thoVuongDungSu'

// Keep this historical migration/Golden independent of later 卷十 activation.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const { default: current } = await importOriginal<{
    default: typeof import('../almanac-data/manifest.json')
  }>()
  return { default: { ...current, policies: { ...current.policies, xiejiVol10Scoring: false } } }
})

const GOD = 'tho_vuong_dung_su'
const row = (date: string, activityId: string) =>
  getAlmanac(date as never)
    .activityRecommendations.find((r) => r.activityId === activityId)!
    .contributions.find((r) => r.source === 'bad_god' && r.ruleId === GOD)

describe('土王用事 (golden frozen before code, 四立 dates from HKO)', () => {
  it('matches every frozen period', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const p of golden.periods) {
      const year = Number(p.liDate.slice(0, 4))
      expect(thoVuongDungSuPeriods(year), p.liDate).toContainEqual(
        expect.objectContaining({ li: p.liDate, onset: p.onset, eve: p.eve }),
      )
    }
  })

  it('matches every frozen boundary case', () => {
    for (const c of golden.cases) {
      expect(isThoVuongDungSu(c.date), c.why).toBe(c.inPeriod)
      for (const id of golden.affected) {
        const r = row(c.date, id)
        expect(Boolean(r), `${c.why} ${id}`).toBe(c.inPeriod)
        if (!r) continue
        expect(r.rawDelta, `${c.why} ${id}`).toBe(golden.expectedRawDelta)
        expect(Boolean(r.hardWarning), `${c.why} ${id}`).toBe(golden.expectedHardWarning)
      }
      for (const id of golden.unaffected) expect(row(c.date, id), `${c.why} ${id}`).toBeUndefined()
    }
  })

  it('migration: only the six activities change, on period days, by the new row', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/bad-gods.json', () => ({
      default: { ...badGodsData, items: badGodsData.items.filter((g) => g.id !== GOD) },
    }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/bad-gods.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    for (const { date } of baseline.days) {
      const inPeriod = isThoVuongDungSu(date)
      if (inPeriod) bump('period days')
      const before = pre.almanac(date as never).activityRecommendations
      for (const [i, act] of getAlmanac(date as never).activityRecommendations.entries()) {
        const prev = before[i]!
        const where = `${date} ${act.activityId}`
        const added = act.contributions.filter((r) => r.ruleId === GOD)
        const kept = act.contributions.filter((r) => r.ruleId !== GOD)
        expect(
          kept.map((r) => ({ ...r, scoreDelta: 0 })),
          where,
        ).toEqual(prev.contributions.map((r) => ({ ...r, scoreDelta: 0 })))
        if (!added.length) {
          expect(act, where).toEqual(prev)
          continue
        }
        expect(inPeriod, where).toBe(true)
        expect(golden.affected, where).toContain(act.activityId)
        if (act.status !== prev.status) bump(`${act.activityId} ${prev.status} → ${act.status}`)
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = pre.evaluate(date as never, id, { hour: 9 })
        const b = evaluateEventDay(date as never, id, { hour: 9 })
        if (!inPeriod)
          expect([b.classification, b.score], `${date} ${id}`).toEqual([a.classification, a.score])
        else if (a.classification !== b.classification)
          bump(`event ${id} ${a.classification} → ${b.classification}`)
      }
    }
    expect(count['period days']).toBeGreaterThan(0)
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
