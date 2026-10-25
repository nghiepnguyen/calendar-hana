import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-legacy-gods-month-jian.json'
import manifest from '../almanac-data/manifest.json'
import goodGodsData from '../almanac-data/good-gods.json'
import badGodsData from '../almanac-data/bad-gods.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { getDayInfo } from './index'
import { LEGACY_LUNAR_GOD_IDS } from './xiejiGodPresence'

// Frozen before G2 Stage 2 (立劵交易 alias + 劫煞 authority v2): pinned to the pre-G2 rollback (g2Rollback.ts).
vi.mock('../almanac-data/xiejibianfangshu-vol10-yiji.json', async (load) =>
  (await import('./g2Rollback')).withoutG2Alias(await load()),
)
vi.mock('../almanac-data/xieji-vol10-jiesha-authority-v3.json', async () =>
  (await import('./g2Rollback')).jieshaAuthorityV1(),
)
await vi.hoisted(async () => (await import('./g2Rollback')).reloadUnderG2Pins())

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
// Frozen before the 卷十 劫煞 faithful-v1 migration (2026-10-22): pinned to legacy-cancel-both.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return {
    default: {
      ...real,
      policies: {
        ...real.policies,
        xiejiVol10BalancingEnabled: false,
        tiangouYinNoYi: false,
        xiejiVol10JieshaPolicy: 'legacy-cancel-both',
      },
    },
  }
})

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const LABELS = new Set(
  [...goodGodsData.items, ...badGodsData.items]
    .filter((g) => LEGACY_LUNAR_GOD_IDS.includes(g.id))
    .map((g) => g.label),
)

describe('14 legacy gods on Month Jian (golden frozen before code)', () => {
  it('is enabled in production', () => {
    expect(manifest.policies.legacyGodsMonthJian).toBe(true)
  })

  it('matches every frozen golden case: shown and scored iff present', () => {
    expect(golden.status).toBe('FROZEN_BEFORE_CODE')
    for (const c of golden.cases) {
      const day = getAlmanac(c.date as never)
      expect(STEMS[day.dayCanChi.can]! + BRANCHES[day.dayCanChi.chi], c.date).toBe(c.pillar)
      expect(BRANCHES[day.selectionContext.MONTH_JIAN_BRANCH!], c.date).toBe(c.monthJian)
      const where = `${c.date} ${c.god}`
      const shown = [...day.stars.good, ...day.stars.bad].some((s) => s.name === c.label)
      expect(shown, where).toBe(c.present)
      const scored = day.activityRecommendations.some((r) =>
        r.contributions.some((row) => row.ruleId === c.god),
      )
      if (!c.present) expect(scored, where).toBe(false)
      expect(c.god in Object.fromEntries(day.auditedGodIds.map((id) => [id, 1])), where).toBe(
        c.present,
      )
    }
  })

  it('migration: only the 14 gods move, only on days whose lunar month differs from Month Jian', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/manifest.json', () => ({
      default: {
        ...manifest,
        policies: {
          ...manifest.policies,
          xiejiVol10BalancingEnabled: false,
          legacyGodsMonthJian: false,
        },
      },
    }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/manifest.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    const ids = new Set(LEGACY_LUNAR_GOD_IDS)
    for (const { date } of baseline.days) {
      const before = pre.almanac(date as never)
      const after = getAlmanac(date as never)
      const jianMonth = ((after.selectionContext.MONTH_JIAN_BRANCH! + 10) % 12) + 1
      const sameBasis = getDayInfo(date as never).lunar.month === jianMonth
      // Stars outside the 14 are untouched; the 14 move only when the month bases differ.
      const names = (a: typeof after) => [...a.stars.good, ...a.stars.bad].map((s) => s.name).sort()
      const other = (list: string[]) => list.filter((n) => !LABELS.has(n))
      expect(other(names(after)), date).toEqual(other(names(before)))
      // Same basis: same stars in the same order (the UI shows the first five per list).
      if (sameBasis) expect(after.stars, date).toEqual(before.stars)
      for (const [i, act] of after.activityRecommendations.entries()) {
        const prev = before.activityRecommendations[i]!
        // Rows other than the 14 gods and 卷十 rows are identical apart from the god-cap share.
        // 卷十 rows can change: a locked 月刑/天赦/月恩 now joins its 凶 chain (avoid then keeps
        // the god's negative instead of adding −25, 「從月刑論」).
        const strip = (rows: typeof act.contributions) =>
          rows
            .filter((r) => !ids.has(r.ruleId) && !r.classical)
            .map(({ activityMapping: _m, conditions: _c, exceptions: _e, ...r }) => ({
              ...r,
              scoreDelta: 0,
            }))
        expect(strip(act.contributions), `${date} ${act.activityId}`).toEqual(
          strip(prev.contributions),
        )
        if (sameBasis && act.score !== prev.score) {
          const vol10 = [...act.contributions, ...prev.contributions].some((r) => r.classical)
          expect(vol10, `${date} ${act.activityId} same-basis change without 卷十 row`).toBe(true)
          bump('same-basis activity score changed via 卷十 chain')
        }
        if (act.status !== prev.status) bump(`activity ${prev.status} → ${act.status}`)
        if (act.score !== prev.score) bump('activity score changed')
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = pre.evaluate(date as never, id, { hour: 9 })
        const b = evaluateEventDay(date as never, id, { hour: 9 })
        if (sameBasis && a.classification !== b.classification)
          bump('same-basis event classification changed via 卷十 chain')
        if (a.score !== b.score) bump('event score changed')
        if (a.classification !== b.classification) {
          bump('event classification changed')
          bump(`event ${a.classification} → ${b.classification}`)
        }
      }
    }
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        Object.entries(count)
          .sort()
          .map(([k, v]) => `${v}\t${k}`)
          .join('\n') + '\n',
      )
    expect(count['event classification changed']).toBe(741)
    expect(count['event score changed']).toBe(1835)
    expect(count['activity score changed']).toBe(3724)
    // Where the lunar month equals Month Jian nothing scores differently.
    expect(count['same-basis activity score changed via 卷十 chain']).toBeUndefined()
    expect(count['same-basis event classification changed via 卷十 chain']).toBeUndefined()
  }, 900_000)
})
