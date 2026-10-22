import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring.json'
import type { Evidence } from './evidence'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring, VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'
import { getActivityRecommendations } from './activityRecommendations'

// Golden v1 is frozen against the pre-2026-10-22 resolver: pinned to legacy-cancel-both. The
// faithful-v1 successor is golden-xieji-vol10-scoring-v2.json (xiejiVol10ScoringV2.test.ts).
const POLICY = { jieshaPolicy: 'legacy-cancel-both' } as const

const B = (c: string) => '子丑寅卯辰巳午未申酉戌亥'.indexOf(c)
const S = (c: string) => '甲乙丙丁戊己庚辛壬癸'.indexOf(c)
const OFFICERS = [
  'kien',
  'tru',
  'man',
  'binh',
  'dinh',
  'chap',
  'pha',
  'nguy',
  'thanh',
  'thu',
  'khai',
  'be',
]

const row = (
  activityId: string,
  r: { source: string; ruleId: string; delta: number },
): Evidence => ({
  source: r.source as Evidence['source'],
  ruleId: r.ruleId,
  activityId,
  scope: activityId,
  label: r.ruleId,
  sourcePhrase: r.ruleId,
  sourceRef: '',
  confidence: 'high',
  status: 'applied',
  rawDelta: r.delta,
  scoreDelta: r.delta,
  polarity: r.delta > 0 ? 'positive' : r.delta < 0 ? 'negative' : 'neutral',
})

describe('協紀 卷十 scoring policy — frozen hand-derived golden', () => {
  it('golden is frozen and internally consistent', () => {
    expect(golden.status).toMatch(/^FROZEN/)
    expect(golden.cases.length).toBeGreaterThanOrEqual(30)
    for (const c of golden.cases) {
      // Each case is a real day: the officer follows from Month Jian and day branch.
      expect(OFFICERS[(B(c.pillar[1]!) - B(c.month) + 12) % 12], c.id).toBe(c.officer)
      expect(S(c.pillar[0]!) % 2, c.id).toBe(B(c.pillar[1]!) % 2)
    }
  })

  for (const c of golden.cases)
    it(c.id, () => {
      const items = resolveVol10(
        {
          monthJianBranch: B(c.month),
          dayStem: S(c.pillar[0]!),
          dayBranch: B(c.pillar[1]!),
          officerId: c.officer,
          presentGods: new Set(c.gods),
          unknownGods: new Set(),
        },
        [c.activity],
        POLICY,
      )
      const verdicts = Object.fromEntries(
        items.filter((i) => VOL10_SCORED_ENTRIES.has(i.entry)).map((i) => [i.entry, i.verdict]),
      )
      expect(verdicts).toEqual(c.expect.verdicts)
      const out = applyVol10Scoring(
        c.rows.map((r) => row(c.activity, r)),
        items,
        { activityId: c.activity, scope: c.activity, badGodCap: -30 },
      )
      const shape = (r: Evidence) => ({
        source: r.source,
        ruleId: r.ruleId,
        scoreDelta: r.scoreDelta,
        status: r.status,
      })
      expect(out.slice(0, c.rows.length).map(shape)).toEqual(c.expect.rows)
      expect(out.slice(c.rows.length).map(shape)).toEqual(c.expect.added)
    })
})

describe('policy mechanics not reachable by real days', () => {
  const item = (entry: string, verdict: string, extra = {}) =>
    ({
      entry,
      han: entry,
      activityId: 'wedding',
      verdict,
      effect: 'as_usual',
      reason: '',
      quote: 'q',
      ...extra,
    }) as never
  it('stricter verdict wins when two chains share a row', () => {
    const out = applyVol10Scoring(
      [row('wedding', { source: 'bad_god', ruleId: 'kiep_sat', delta: -15 })],
      [item('jie_sha', 'not_avoided'), item('shou_ri', 'avoid', { via: 'jie_sha' })],
      { activityId: 'wedding', scope: 'wedding', badGodCap: -30 },
    )
    expect(out.map((r) => [r.scoreDelta, r.status])).toEqual([[-15, 'applied']])
  })
  it('a god-only chain adds its penalty inside the bad-god cap', () => {
    const out = applyVol10Scoring(
      [row('wedding', { source: 'bad_god', ruleId: 'other', delta: -25 })],
      [item('jie_sha', 'avoid')],
      { activityId: 'wedding', scope: 'wedding', badGodCap: -30 },
    )
    expect(out.at(-1)).toMatchObject({ source: 'bad_god', scoreDelta: -5, status: 'applied' })
  })
  it('new 月厭/月刑/月煞/災煞 entries never get rows of their own', () => {
    const out = applyVol10Scoring([], [item('yue_sha', 'avoid')], {
      activityId: 'wedding',
      scope: 'wedding',
      badGodCap: -30,
    })
    expect(out).toEqual([])
  })
})

describe('owner decision 2026-10-10: 不註宜忌 / 不忌 lifting every rule reads as neutral', () => {
  // 辰 month 乙巳 (除日): 刼煞 without 德 → 凡所忌者則不註宜所宜者亦不註忌. Trực Trừ has no wedding
  // rule, Kiếp Sát −15 is the only applied row.
  const input = {
    officerId: 'tru',
    presentGoodGods: [],
    presentBadGods: ['kiep_sat'],
    godPresence: { kiep_sat: [{ operand: 'DAY_BRANCH', equals: B('巳') }] },
    classicalDay: { monthJianBranch: B('辰'), dayStem: S('乙'), dayBranch: B('巳') },
  }
  const wedding = (on: boolean) =>
    getActivityRecommendations({
      ...input,
      xiejiVol10Scoring: on,
      xiejiVol10JieshaPolicy: POLICY.jieshaPolicy,
    }).find((r) => r.activityId === 'wedding')!
  it('flag on: neutral at the base score, not no_evidence', () => {
    expect(wedding(true)).toMatchObject({ status: 'neutral', score: 50, negativeMagnitude: 0 })
  })
  it('flag off: unchanged product result', () => {
    expect(wedding(false).status).not.toBe('neutral')
    expect(wedding(false).negativeMagnitude).toBe(15)
  })
})
