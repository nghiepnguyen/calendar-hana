import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import trucData from '../almanac-data/truc.json'
import goodGodsData from '../almanac-data/good-gods.json'
import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

// 修倉庫 宜 "…又收日母倉六合五富天倉與月德四相時德開日併者": 收日/六合/五富/天倉 are good for
// repairing storehouses only when combined with 月德/四相/時德/開日. The pre-fix catalog listed them
// unconditionally (ENGINE_BUG in the parity parser). Rebuild that catalog to prove the frozen
// baseline still reproduces exactly, then classify every production difference.
const ADDED_ACTIVITIES = ['door_opening', 'waterworks', 'warehouse_opening']
const REMOVED_GODS = ['luc_hop', 'ngu_phu', 'thien_thuong']

function preFixCatalog() {
  const truc = structuredClone(trucData)
  truc.items
    .find((o) => o.id === 'thu')!
    .activityRules.push({
      activityId: 'warehouse',
      level: 'good',
      weight: 15,
      sourceRef: '協紀辨方書 卷十一 修倉庫',
      reviewStatus: 'classical_text',
      updatedAt: '2026-10-05',
    })
  const good = structuredClone(goodGodsData)
  for (const god of good.items) if (REMOVED_GODS.includes(god.id)) god.activityIds.push('warehouse')
  return { truc, good }
}

type Payload = { activities: (string | number | null)[][]; events: (string | number | null)[][] }
function payload(
  almanac: typeof getAlmanac,
  evaluate: typeof evaluateEventDay,
  date: string,
): Payload {
  return {
    activities: almanac(date as never)
      .activityRecommendations.filter((r) => !ADDED_ACTIVITIES.includes(r.activityId))
      .map((r) => [r.activityId, r.score, r.status]),
    events: EVENT_OPTIONS.map(([id]) => {
      const r = evaluate(date as never, id, { hour: 9 })
      return [id, r.score, r.classification]
    }),
  }
}

describe('協紀 修倉庫 conditional clause migration (dataset 1.2.1)', () => {
  it('reproduces the frozen decision baseline with the pre-fix catalog and changes only warehouse', async () => {
    const { truc, good } = preFixCatalog()
    // Isolate this migration from issue #19: both sides keep the legacy trigram Thiên Đức.
    const legacyTianDe = () => ({ KEEP_LEGACY_TRIGRAM_TIAN_DE: true })
    // Likewise both sides keep the pre-10/10/2026 neutral policy (low severity only) and the
    // old hard-warning status (always consider).
    const lowNeutral = () => ({
      default: {
        ...manifest,
        policies: {
          ...manifest.policies,
          noTabooMeansNeutralUpToSeverity: 'low',
          hardWarningKeepsWorseScoreStatus: false,
        },
      },
    })
    vi.resetModules()
    vi.doMock('./tianDeLegacyPolicy', legacyTianDe)
    vi.doMock('../almanac-data/manifest.json', lowNeutral)
    vi.doMock('../almanac-data/truc.json', () => ({ default: truc }))
    vi.doMock('../almanac-data/good-gods.json', () => ({ default: good }))
    const pre = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/truc.json')
    vi.doUnmock('../almanac-data/good-gods.json')
    vi.resetModules()
    const post = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('./tianDeLegacyPolicy')
    vi.doUnmock('../almanac-data/manifest.json')

    expect(baseline.days).toHaveLength(1095)
    let changed = 0
    for (const { date, sha256 } of baseline.days) {
      const before = payload(pre.almanac, pre.evaluate, date)
      expect(createHash('sha256').update(JSON.stringify(before)).digest('hex'), date).toBe(sha256)
      const after = payload(post.almanac, post.evaluate, date)
      expect(after.events, date).toEqual(before.events)
      const diff = after.activities.filter(
        (row, i) => JSON.stringify(row) !== JSON.stringify(before.activities[i]),
      )
      if (!diff.length) continue
      // EXPECTED_AUTHORITY_MIGRATION_CHANGE: only warehouse, only where a removed rule applied.
      expect(
        diff.map((row) => row[0]),
        date,
      ).toEqual(['warehouse'])
      const warehouse = pre
        .almanac(date as never)
        .activityRecommendations.find((r) => r.activityId === 'warehouse')!
      expect(
        warehouse.contributions.some(
          (c) =>
            (c.source === 'truc' && c.ruleId.startsWith('thu:') && c.scoreDelta > 0) ||
            (c.source === 'good_god' && REMOVED_GODS.includes(c.ruleId) && c.scoreDelta > 0),
        ),
        date,
      ).toBe(true)
      changed++
    }
    expect(changed).toBeGreaterThan(0)
    if (process.env.REPORT_DIFF) process.stdout.write(`\nWAREHOUSE_CHANGED ${changed}\n`)
  }, 120000)
})
