import { describe, expect, it } from 'vitest'
import activities from '../almanac-data/activities.json'
import events from '../almanac-data/event-mapping.json'
import truc from '../almanac-data/truc.json'
import good from '../almanac-data/good-gods.json'
import bad from '../almanac-data/bad-gods.json'
import overrides from '../almanac-data/overrides.json'
import patterns from '../almanac-data/mansion-patterns.json'
import snapshot from '../almanac-data/audited-mansion-evidence.json'
import manifest from '../almanac-data/manifest.json'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import { getActivityRecommendations } from './activityRecommendations'
import { resolvePresentGods } from './godMapping'
import { STARS } from './stars.data'
import { getAlmanac } from './almanac'
import { solarStringToJd } from './julian'
import { getMansion } from './mansions'

describe('data release validation (runs in existing CI npm test)', () => {
  const ids = new Set(activities.items.filter((item) => item.enabled).map((item) => item.id))
  it('has valid enabled references everywhere', () => {
    const refs = [
      ...Object.values(events.events).flatMap((event) =>
        event.activities.map((row) => row.activityId),
      ),
      ...truc.items.flatMap((row) => row.activityRules.map((rule) => rule.activityId)),
      ...good.items.flatMap((row) => row.activityIds),
      ...bad.items.flatMap((row) => row.activityIds),
      ...overrides.items.flatMap((row) => row.activityIds),
      ...patterns.items.map((row) => row.activityId).filter(Boolean),
    ]
    expect(refs.every((id) => ids.has(id))).toBe(true)
    expect(ids.size).toBe(activities.items.length)
  })
  it('has exactly one primary and valid multipliers in every event', () => {
    for (const event of Object.values(events.events)) {
      expect(event.activities.filter((row) => row.role === 'primary')).toHaveLength(1)
      expect(event.activities.every((row) => row.multiplier >= 0 && row.multiplier <= 1)).toBe(true)
      expect(
        event.mustHave.every((id) => ['calendar_validity', 'event_fit', 'good_hour'].includes(id)),
      ).toBe(true)
    }
  })
  it('has no duplicate patterns, rules or unresolved scoped conflicts', () => {
    const keys = patterns.items.map((row) => `${row.activityId}:${row.scope}:${row.phrase}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (const row of truc.items)
      expect(new Set(row.activityRules.map((rule) => rule.activityId)).size).toBe(
        row.activityRules.length,
      )
    for (const row of snapshot.items) {
      const evidenceKeys = row.evidence.map(
        (rule) => `${rule.source}:${rule.ruleId}:${rule.activityId}:${rule.scope}`,
      )
      expect(new Set(evidenceKeys).size).toBe(evidenceKeys.length)
      expect(row.evidence.some((rule) => rule.status === 'conflict')).toBe(false)
    }
  })
  it('applies the disabled mansion policy on all 28 mansions', () => {
    const baseline = getActivityRecommendations({
      officerId: 'chap',
      presentGoodGods: [],
      presentBadGods: [],
    })
    for (let i = 0; i < 28; i++) {
      const mansion = getMansion(solarStringToJd('2026-10-05') + i)
      const rows = getActivityRecommendations({
        officerId: 'chap',
        mansion,
        presentGoodGods: [],
        presentBadGods: [],
      })
      expect(rows.map((row) => [row.score, row.status])).toEqual(
        baseline.map((row) => [row.score, row.status]),
      )
      expect(
        rows
          .flatMap((row) => row.contributions)
          .filter((row) => row.source === 'mansion')
          .every((row) => row.scoreDelta === 0 && row.status === 'informational'),
      ).toBe(true)
    }
    expect(manifest.policies.mansion28ScoringEnabled).toBe(false)
  })
  it('injects actual day gods and records contributions', () => {
    const day = getAlmanac('2026-10-05')
    const context = resolvePresentGods(day.stars)
    expect(
      day.activityRecommendations
        .flatMap((row) => row.contributions)
        .some((row) => row.source === 'good_god' || row.source === 'bad_god'),
    ).toBe(true)
    expect(context.presentGoodGods.length + context.presentBadGods.length).toBeGreaterThan(0)
    expect(
      day.activityRecommendations.every((row) =>
        row.warnings.every((warning) => !warning.startsWith('Chưa truyền')),
      ),
    ).toBe(true)
  })
  it('caps both sources and does not double count repeated present IDs', () => {
    const row = getActivityRecommendations({
      officerId: 'chap',
      presentGoodGods: good.items.map((row) => row.id).concat(good.items.map((row) => row.id)),
      presentBadGods: bad.items.map((row) => row.id),
    }).find((row) => row.activityId === 'wedding')!
    expect(
      row.contributions
        .filter((row) => row.source === 'good_god')
        .reduce((sum, row) => sum + row.scoreDelta, 0),
    ).toBe(25)
    expect(
      row.contributions
        .filter((row) => row.source === 'bad_god')
        .reduce((sum, row) => sum + row.scoreDelta, 0),
    ).toBe(-30)
    expect(new Set(row.contributions.map((row) => `${row.source}:${row.ruleId}`)).size).toBe(
      row.contributions.length,
    )
  })
  it('never invents aliases for unmatched star names', () => {
    const ctx = resolvePresentGods({
      good: [{ name: 'unmapped', isGood: true, meaning: '' }],
      bad: [],
    })
    expect(ctx.presentGoodGods).toEqual([])
    expect(ctx.warnings).toHaveLength(1)
    const all = resolvePresentGods({
      good: STARS.filter((row) => row.isGood),
      bad: STARS.filter((row) => !row.isGood),
    })
    expect(all.presentGoodGods.every((id) => good.items.some((row) => row.id === id))).toBe(true)
  })
})

describe('Hiệp Kỷ Biện Phương Thư vol. 11 parity', () => {
  const entries = xieji.entries as Record<string, { 宜: string; 忌: string }>
  const activityEntries = xieji.activityEntries as Record<string, string[]>
  const aliases = xieji.trucAliases as Record<string, string[]>
  // Lists are unseparated names; 天德/月德 also occur inside 天德合/月德合. A trailing
  // "又…與…併者" clause is conditional (only when combined) and none of its names is a standalone
  // 宜: 修倉庫 "又收日母倉六合五富天倉與月德四相時德開日併者" (卷十: 母倉 "與月恩四相開日併宜修倉庫").
  const lists = (name: string, key: '宜' | '忌', activityId: string) =>
    activityEntries[activityId].some((entry) =>
      entries[entry][key]
        .replace(/又[^併]*併者/, '')
        .replace(/與[^併]*併者/, '')
        .replaceAll(`${name}合`, '')
        .includes(name),
    )
  const sign = (level: string) => (level.endsWith('good') ? 1 : level.endsWith('bad') ? -1 : 0)

  it('derives every Trực rule from the vol. 11 lists (plus documented extras)', () => {
    for (const officer of truc.items) {
      for (const activityId of Object.keys(activityEntries)) {
        const names = aliases[officer.id]
        const good = names.some((name) => lists(name, '宜', activityId))
        const bad = names.some((name) => lists(name, '忌', activityId))
        const extra = xieji.extra.find(
          (row) => row.officerId === officer.id && row.activityId === activityId,
        )
        const expected = good ? 1 : bad ? -1 : extra ? sign(extra.level) : 0
        const rule = officer.activityRules.find((row) => row.activityId === activityId)
        expect(rule ? sign(rule.level) : 0, `${officer.id}:${activityId}`).toBe(expected)
      }
    }
  })
  it('lists each god only for activities whose vol. 11 entry names it', () => {
    for (const [catalog, key] of [
      [good, '宜'],
      [bad, '忌'],
    ] as const) {
      for (const god of catalog.items) {
        const expected = Object.keys(activityEntries).filter((id) => lists(god.han, key, id))
        expect([...god.activityIds].sort(), god.id).toEqual(expected.sort())
      }
    }
  })
})
