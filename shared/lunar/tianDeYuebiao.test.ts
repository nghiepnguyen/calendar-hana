import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import witness from '../almanac-data/golden-yuebiao-tiande.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

// Keep this historical migration/Golden independent of later 卷十 activation.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const { default: current } = await importOriginal<{
    default: typeof import('../almanac-data/manifest.json')
  }>()
  return { default: { ...current, policies: { ...current.policies, xiejiVol10Scoring: false } } }
})

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const TIAN_DE = new Set(['Thiên Đức', 'Thiên Đức Hợp'])
const GOD_IDS = new Set(['thien_duc', 'thien_duc_hop'])

describe('Thiên Đức / Thiên Đức Hợp follow the 協紀 月表 (issue #19)', () => {
  it('every baseline day matches the frozen scan witness', () => {
    const byMonth = new Map(witness.months.map((m) => [m.monthJian, m]))
    expect(byMonth.size).toBe(12)
    for (const { date } of baseline.days) {
      const a = getAlmanac(date as never)
      const m = byMonth.get(BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH]!)!
      const stem = STEMS[a.dayCanChi.can]
      const good = new Set(a.stars.good.map((s) => s.name))
      expect(good.has('Thiên Đức'), `${date} ${m.month}`).toBe(stem === m.tianDeStem)
      expect(good.has('Thiên Đức Hợp'), `${date} ${m.month}`).toBe(stem === m.tianDeHeStem)
    }
  })

  it('migration: only trigram-month days change, each by a removed Thiên Đức/Hợp row', async () => {
    vi.resetModules()
    vi.doMock('./tianDeLegacyPolicy', () => ({ KEEP_LEGACY_TRIGRAM_TIAN_DE: true }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('./tianDeLegacyPolicy')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    for (const { date } of baseline.days) {
      const before = pre.almanac(date as never)
      const after = getAlmanac(date as never)
      const trigram = '卯午酉子'.includes(BRANCHES[after.selectionContext.MONTH_JIAN_BRANCH]!)
      const removed = before.stars.good.filter((s) => TIAN_DE.has(s.name)).map((s) => s.name)
      expect(after.stars.good.filter((s) => TIAN_DE.has(s.name)).length, date).toBe(
        trigram ? 0 : removed.length,
      )
      // Everything else in the star lists is identical.
      expect(after.stars.good.filter((s) => !TIAN_DE.has(s.name))).toEqual(
        before.stars.good.filter((s) => !TIAN_DE.has(s.name)),
      )
      expect(after.stars.bad).toEqual(before.stars.bad)
      if (!trigram) {
        expect(after.activityRecommendations).toEqual(before.activityRecommendations)
        continue
      }
      if (removed.length) bump(`days with legacy removed (${removed.join('+')})`)
      for (const [i, act] of after.activityRecommendations.entries()) {
        const prev = before.activityRecommendations[i]!
        const keep = (rows: typeof act.contributions) =>
          rows.filter((r) => !(r.source === 'good_god' && GOD_IDS.has(r.ruleId)))
        const kept = keep(act.contributions)
        const prevKept = keep(prev.contributions)
        // Same rows; only other good-god rows may rise, within their weight, as the cap frees up.
        expect(
          kept.map((r) => ({ ...r, scoreDelta: 0 })),
          `${date} ${act.activityId}`,
        ).toEqual(prevKept.map((r) => ({ ...r, scoreDelta: 0 })))
        for (const [j, row] of kept.entries()) {
          const was = prevKept[j]!
          if (row.scoreDelta === was.scoreDelta) continue
          expect(row.source, `${date} ${act.activityId} ${row.ruleId}`).toBe('good_god')
          expect(row.scoreDelta).toBeGreaterThan(was.scoreDelta)
          expect(row.scoreDelta).toBeLessThanOrEqual(row.rawDelta)
          bump('other good-god row rose (cap freed)')
        }
        if (act.status !== prev.status) bump(`activity ${prev.status} → ${act.status}`)
        if (act.score !== prev.score) bump('activity score changed')
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = pre.evaluate(date as never, id, { hour: 9 })
        const b = evaluateEventDay(date as never, id, { hour: 9 })
        if (a.classification !== b.classification)
          bump(`event ${a.classification} → ${b.classification}`)
        if (a.score !== b.score) bump('event score changed')
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
