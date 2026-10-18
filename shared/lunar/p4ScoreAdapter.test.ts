import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getActivityRecommendations, type ActivityInput } from './activityRecommendations'
import type { Evidence } from './evidence'
import { lockedDigests } from './lockAnchor'
import { applyP4Balancing, p4ActivityState, type P4HeadingInput } from './p4ScoreAdapter'

// Roadmap 8 FR-01 / roadmap 9b: score Golden v2 frozen before the 9b adapter code; supersedes v1 after the
// owner policy change of 2026-10-18 (docs/.../p4-score-golden-v2/README.md, tasks/prd-p4-9b.md).
const DIR = 'docs/audits/sources/p4-vol10/p4-score-golden-v2/'
const COMPOSE = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/compose/dated.tsv'
type Case = {
  id: string
  activityId: string
  officerId: string
  goodGods: string[]
  badGods: string[]
  headings: Record<string, P4HeadingInput>
  classicalDay?: ActivityInput['classicalDay']
  expected: Record<string, unknown> & { equalsFlagOffWithout?: string[] }
}
const { cases } = JSON.parse(readFileSync(DIR + 'cases.json', 'utf8')) as { cases: Case[] }

const run = (c: Case, on: boolean, drop: string[] = []) =>
  getActivityRecommendations({
    officerId: c.officerId,
    presentGoodGods: c.goodGods.filter((g) => !drop.includes(g)),
    presentBadGods: c.badGods.filter((g) => !drop.includes(g)),
    ...(c.classicalDay ? { classicalDay: c.classicalDay } : {}),
    xiejiVol10BalancingEnabled: on,
    ...(on ? { p4Headings: c.headings } : {}),
  }).find((r) => r.activityId === c.activityId)!

const projectRow = (r: Evidence) => ({
  source: r.source,
  ruleId: r.ruleId,
  status: r.status,
  rawDelta: r.rawDelta,
  preCapDelta: r.preCapDelta,
  hardWarning: r.hardWarning === true,
  ...(r.balancingEligible === undefined ? {} : { balancingEligible: r.balancingEligible }),
  evidenceOrigin: r.evidenceOrigin,
  ...(r.policyId === undefined ? {} : { policyId: r.policyId }),
  ...(r.sourceClauseId === undefined ? {} : { sourceClauseId: r.sourceClauseId }),
  scoreDelta: r.scoreDelta,
})

describe('P4 score Golden v2 (flag ON)', () => {
  it('lock pins the Golden and its inputs', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    expect(lock.files).toHaveLength(14)
    // Own files on the working tree; catalog and Golden v2 inputs as committed at the lock's anchor.
    const atAnchor = lockedDigests(
      DIR + 'lock.json',
      lock.files.filter((f) => !f.path.startsWith(DIR)).map((f) => f.path),
    )
    for (const f of lock.files)
      expect(
        atAnchor.get(f.path) ?? createHash('sha256').update(readFileSync(f.path)).digest('hex'),
        f.path,
      ).toBe(f.sha256)
  })

  for (const c of cases.filter((c) => !c.expected.equalsFlagOffWithout))
    it(`${c.id} score`, () => {
      const { state: _s, rows, ...want } = c.expected as { state: string; rows: unknown[] }
      const r = run(c, true)
      const sortKeys = (o: object) => Object.fromEntries(Object.entries(o).sort())
      expect({
        score: r.score,
        status: r.status,
        positiveMagnitude: r.positiveMagnitude,
        negativeMagnitude: r.negativeMagnitude,
        hardWarning: r.hardWarning,
      }).toEqual(want)
      expect(r.contributions.map((x) => sortKeys(projectRow(x)))).toEqual(
        (rows as object[]).map(sortKeys),
      )
    })

  for (const c of cases.filter((c) => c.expected.equalsFlagOffWithout))
    it(`${c.id} keeps the baseline`, () => {
      expect(run(c, true)).toEqual(run(c, false, c.expected.equalsFlagOffWithout))
    })

  // PRD §6.13: no catalog pair separates it (only 月破 is subsumed, always under a negative Trực).
  it('a Trực-subsumed bad god does not block the only_ji penalty', () => {
    const row = (
      source: Evidence['source'],
      ruleId: string,
      rawDelta: number,
      status: Evidence['status'],
    ) =>
      ({
        source,
        ruleId,
        activityId: 'medical',
        scope: 'medical',
        label: ruleId,
        sourcePhrase: ruleId,
        sourceRef: '',
        confidence: 'high',
        status,
        rawDelta,
        scoreDelta: status === 'applied' ? rawDelta : 0,
        polarity: rawDelta < 0 ? 'negative' : 'positive',
      }) as Evidence
    const out = applyP4Balancing(
      [
        row('truc', 'pha:medical', 25, 'applied'),
        row('bad_god', 'nguyet_pha', -25, 'informational'),
      ],
      { state: 'only_ji', heading: '求醫療病' },
      { 求醫療病: { state: 'only_ji', prot: [''] } },
      { activityId: 'medical', scope: 'medical' },
    )
    expect(out.map((r) => [r.ruleId, r.status, r.scoreDelta])).toEqual([
      ['pha:medical', 'informational', 0],
      ['nguyet_pha', 'informational', 0],
      ['p4_default_penalty:medical', 'applied', -25],
    ])
  })

  it('activity states equal the Golden for every P4 date (layer B)', () => {
    const days = new Map<string, Record<string, P4HeadingInput>>()
    const [, ...rows] = readFileSync(COMPOSE, 'utf8').trimEnd().split('\n')
    for (const line of rows) {
      const [date, , , heading, , , , , state, , , , , code] = line.split('\t')
      const prot = code!.includes('prot=') ? code!.split('prot=')[1]!.split(';')[0]!.split('+') : []
      const day = days.get(date!) ?? {}
      day[heading!] = {
        state: state!,
        ...(code!.startsWith('all_taboo') ? { rule: 'all_taboo' } : {}),
        ...(prot.length ? { prot } : {}),
      }
      days.set(date!, day)
    }
    const [header, ...want] = readFileSync(DIR + 'activity-states.tsv', 'utf8')
      .trimEnd()
      .split('\n')
    expect(header).toBe('date\tactivity\tstate\tdeciding_heading\tall_taboo')
    const diff = want.filter((line) => {
      const [date, activity, state, heading, taboo] = line.split('\t')
      const hs = days.get(date!) ?? {}
      const got = p4ActivityState(activity!, hs)
      return (
        got.state !== state ||
        (got.heading ?? '') !== heading ||
        String(got.allTaboo === true) !== taboo
      )
    })
    expect(diff.slice(0, 10).join('\n')).toBe('')
    expect(want).toHaveLength(31_842)
  })
})
