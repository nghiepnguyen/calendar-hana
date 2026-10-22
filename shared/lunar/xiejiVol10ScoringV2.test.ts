import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v2.json'
import type { Evidence } from './evidence'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring, VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'

// Golden v2 (successor of v1): the 卷十 劫煞 faithful-v1 projection, pinned explicitly.
const POLICY = { jieshaPolicy: 'faithful-v1' } as const

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

describe('協紀 卷十 scoring policy — golden v2 (faithful-v1)', () => {
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

describe('golden v2 provenance', () => {
  it('records the approved authority and the v1 projection', () => {
    expect(golden.provenance.sourceAuthority).toContain(
      'b24f6f68e6b662fc04b5ec56ab6f2da8981273291ef3bf4e05a028b2f48d326a',
    )
    expect(golden.provenance.demolition).toMatch(/^EXCLUDED_PENDING_GLYPH_AUDIT/)
    expect(golden.provenance.contractTransaction).toMatch(
      /^UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION/,
    )
    expect(golden.provenance.normalization).toBe('unchanged')
  })
})
