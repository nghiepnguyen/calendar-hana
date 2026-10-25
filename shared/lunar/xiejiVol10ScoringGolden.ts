/** Test-only: runs a frozen 卷十 scoring Golden (golden-xieji-vol10-scoring-v*.json) against the resolver and
 * scorer of the caller's module graph (v2: pre-G2 rollback, v3: G2 Stage 2, v4: G1 glyph Stage 2, v5: G1-SOIL
 * Stage 2). v5 cases may carry a real civil `date` with its explicit `soilState` (both checked as calendar facts
 * before scoring) and `expect.throws` (a date-dependent lookup without a date must fail loud). */
import { describe, expect, it } from 'vitest'
import type { Evidence } from './evidence'
import type { resolveVol10 as ResolveVol10 } from './xiejiVol10Resolution'
import type { applyVol10Scoring as ApplyVol10Scoring } from './xiejiVol10Scoring'

type Engine = {
  resolveVol10: typeof ResolveVol10
  applyVol10Scoring: typeof ApplyVol10Scoring
  VOL10_SCORED_ENTRIES: ReadonlySet<string>
}
type Golden = {
  status: string
  cases: {
    id: string
    month: string
    pillar: string
    officer: string
    gods: string[]
    activity: string
    date?: string
    soilState?: string
    rows: { source: string; ruleId: string; delta: number }[]
    expect: {
      verdicts?: Record<string, string | undefined>
      rows?: unknown[]
      added?: unknown[]
      throws?: string
    }
  }[]
}

// The 卷十 劫煞 faithful-v1 reading rule, pinned explicitly (authority v1 or v2 comes from the graph).
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

export function describeScoringGolden(
  title: string,
  golden: Golden,
  engine: () => Promise<Engine>,
) {
  describe(title, () => {
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
      it(c.id, async () => {
        const { resolveVol10, applyVol10Scoring, VOL10_SCORED_ENTRIES } = await engine()
        if (c.date !== undefined) {
          // Calendar facts, not fixtures: the date is a real day of this Month Jian + pillar, and its 土王用事
          // state under the rule service is the declared soilState.
          const { thoVuongDungSuState } = await import('./thoVuongDungSuRule')
          const { getAlmanac } = await import('./almanac')
          const a = getAlmanac(c.date as never)
          expect(
            [a.selectionContext.MONTH_JIAN_BRANCH, a.dayCanChi.can, a.dayCanChi.chi],
            c.id,
          ).toEqual([B(c.month), S(c.pillar[0]!), B(c.pillar[1]!)])
          expect(thoVuongDungSuState(c.date), c.id).toBe(c.soilState)
        }
        const day = {
          monthJianBranch: B(c.month),
          dayStem: S(c.pillar[0]!),
          dayBranch: B(c.pillar[1]!),
          officerId: c.officer,
          presentGods: new Set(c.gods),
          unknownGods: new Set<string>(),
          ...(c.date !== undefined ? { civilDate: c.date } : {}),
        }
        if (c.expect.throws) {
          expect(() => resolveVol10(day, [c.activity], POLICY), c.id).toThrow(c.expect.throws)
          return
        }
        const items = resolveVol10(day, [c.activity], POLICY)
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
}
