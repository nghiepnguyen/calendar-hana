import { writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import type { Evidence } from './evidence'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'
import { VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'

// Flag off is the production path (the frozen-baseline proof in xiejiConditionalMigration.test.ts
// still reproduces 1095/1095). Here the flag is turned on and every difference must be explained
// by exactly one 卷十 verdict of a scored 凶 chain: EXPECTED_AUTHORITY_MIGRATION_CHANGE.
const key = (r: Evidence) => `${r.source}|${r.ruleId}`
const ACTED = new Set(['avoid', 'not_avoided', 'no_annotation'])

describe('協紀 卷十 scoring migration (flag xiejiVol10Scoring)', () => {
  it('defaults to off', () => {
    expect(manifest.policies.xiejiVol10Scoring).toBe(false)
  })

  it('with the flag on, every changed row is explained by one 卷十 verdict', async () => {
    vi.resetModules()
    vi.doMock('../almanac-data/manifest.json', () => ({
      default: { ...manifest, policies: { ...manifest.policies, xiejiVol10Scoring: true } },
    }))
    const on = {
      almanac: (await import('./almanac')).getAlmanac,
      evaluate: (await import('./eventEvaluation')).evaluateEventDay,
    }
    vi.doUnmock('../almanac-data/manifest.json')

    const count: Record<string, number> = {}
    const bump = (k: string) => (count[k] = (count[k] ?? 0) + 1)
    const samples: Record<string, unknown> = {}
    expect(baseline.days).toHaveLength(1095)
    expect(EVENT_OPTIONS).toHaveLength(11)
    for (const { date } of baseline.days) {
      const offRows = getAlmanac(date as never).activityRecommendations
      const onRows = on.almanac(date as never).activityRecommendations
      expect(onRows).toHaveLength(32)
      expect(onRows.map((r) => r.activityId)).toEqual(offRows.map((r) => r.activityId))
      for (const [i, after] of onRows.entries()) {
        const before = offRows[i]!
        const old = new Map(before.contributions.map((r) => [key(r), r]))
        const next = new Map(after.contributions.map((r) => [key(r), r]))
        // Preserve unrelated rules, including the newer 百忌日 and 土王用事.
        for (const prev of before.contributions) {
          const row = next.get(key(prev))
          expect(row, `${date} ${after.activityId} ${key(prev)}`).toBeDefined()
          if (!row!.classical) expect(row).toEqual(prev)
          expect(row!.hardWarning).toBe(prev.hardWarning)
        }
        for (const row of after.contributions) {
          const prev = old.get(key(row))
          const same = prev && prev.scoreDelta === row.scoreDelta && prev.status === row.status
          if (same && !row.classical) continue
          if (same) {
            bump('rows_tagged_unchanged')
            continue
          }
          // Changed or added: carries one deciding 卷十 item of a scored entry.
          expect(row.classical, `${date} ${after.activityId} ${key(row)}`).toBeDefined()
          expect(VOL10_SCORED_ENTRIES.has(row.classical!.entry)).toBe(true)
          expect(ACTED.has(row.classical!.verdict)).toBe(true)
          bump(`rows of activity ${after.activityId}`)
          bump(
            `${prev ? 'changed' : 'added'} ${row.classical!.entry}${row.classical!.via ? `→${row.classical!.via}` : ''} ${row.classical!.verdict}`,
          )
        }
        // Nothing disappears.
        expect(after.contributions.length).toBeGreaterThanOrEqual(before.contributions.length)
        if (after.status !== before.status) bump(`activity ${before.status} → ${after.status}`)
        if (after.score !== before.score) bump(`activity score changed ${after.activityId}`)
        if (after.contributions.some((r) => r.hardWarning && r.status === 'applied'))
          expect(after.status, `${date} ${after.activityId}`).toBe(
            after.score <= 19 ? 'strong_avoid' : after.score <= 29 ? 'avoid' : 'consider',
          )
      }
      for (const [id] of EVENT_OPTIONS) {
        const a = evaluateEventDay(date as never, id, { hour: 9 })
        const b = on.evaluate(date as never, id, { hour: 9 })
        expect(b.classicalResolution.items.some((x) => x.verdict === 'undetermined')).toBe(false)
        if (a.classification !== b.classification) {
          bump(`event ${a.classification} → ${b.classification}`)
          const transition = `${id} ${a.classification} → ${b.classification}`
          bump(`event by type ${transition}`)
          samples[transition] ??= {
            date,
            event: id,
            before: { score: a.score, classification: a.classification },
            after: { score: b.score, classification: b.classification },
            items: b.classicalResolution.items,
          }
        }
        if (a.score !== b.score) {
          bump('event score changed')
          bump(`event score changed ${id}`)
        }
      }
    }
    expect(Object.keys(count).some((k) => k.startsWith('changed'))).toBe(true)
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        Object.entries(count)
          .sort()
          .map(([k, v]) => `${v}\t${k}`)
          .join('\n'),
      )
    if (process.env.REPORT_FILE)
      writeFileSync(`${process.env.REPORT_FILE}.samples.json`, JSON.stringify(samples, null, 2))
  }, 300000)
})
