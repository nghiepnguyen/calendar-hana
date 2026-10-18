import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Evidence } from './evidence'
import { P4_PENALTY_POLICY_ID, P4_SCORE_ADAPTER_VERSION } from './p4ScoreAdapter'
import {
  activityViolations,
  classifyActivityRow,
  eventViolations,
  P4_MIGRATION_RULES_VERSION,
  type ActivityDiffRow,
  type Rec,
} from './p4MigrationRules'
import { VOL10_SCORING_VERSION } from './xiejiVol10Scoring'

// Roadmap 9 FR-01/FR-04 (owner §6.10): synthetic witnesses, frozen before the migration TSV.
// Each invariant passes a clean row and catches one crafted violation.

const ev = (
  o: Partial<Evidence> & Pick<Evidence, 'source' | 'ruleId' | 'scoreDelta'>,
): Evidence => ({
  activityId: 'wedding',
  scope: 'wedding',
  polarity: o.scoreDelta > 0 ? 'positive' : o.scoreDelta < 0 ? 'negative' : 'neutral',
  sourcePhrase: '',
  sourceRef: '',
  confidence: 'high',
  status: 'applied',
  rawDelta: o.scoreDelta,
  label: '',
  ...o,
})
const rec = (o: Partial<Rec> = {}): Rec => ({
  activityId: 'wedding',
  score: 50,
  status: 'neutral',
  hardWarning: false,
  contributions: [],
  warnings: [],
  ...o,
})
const row = (o: Partial<ActivityDiffRow> = {}): ActivityDiffRow => ({
  date: '2026-05-01',
  inDomain: true,
  state: 'only_ji',
  headingStates: ['only_ji'],
  prot: new Set(),
  base: rec(),
  full: rec(),
  ...o,
})
const lifted = (o: Partial<Evidence> & Pick<Evidence, 'source' | 'ruleId'>, raw: number) =>
  ev({
    ...o,
    scoreDelta: 0,
    rawDelta: raw,
    status: 'informational',
    classical: { version: P4_SCORE_ADAPTER_VERSION, entry: '嫁娶', verdict: '', quote: '' },
  })
const penalty = (clause = 'p4:嫁娶') =>
  ev({
    source: 'bad_god',
    ruleId: 'p4_default_penalty:wedding',
    scoreDelta: -25,
    preCapDelta: -25,
    policyId: P4_PENALTY_POLICY_ID,
    sourceClauseId: clause,
  })
const chainRow = ev({
  source: 'truc',
  ruleId: 'chain',
  scoreDelta: -25,
  classical: { version: VOL10_SCORING_VERSION, entry: '嫁娶', verdict: '', quote: '' },
})

const LOCK = 'docs/audits/sources/p4-vol10/p4-migration-rules-v1/lock.json'

describe(`roadmap 9 migration rules (${P4_MIGRATION_RULES_VERSION})`, () => {
  it('rules and witnesses equal the frozen lock (owner §6.10.2: never edited to fit the data)', () => {
    const lock = JSON.parse(readFileSync(LOCK, 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    expect(lock.files.map((f) => f.path)).toEqual([
      'shared/lunar/p4MigrationRules.ts',
      'shared/lunar/p4MigrationRules.test.ts',
    ])
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
  })

  it('an unchanged clean row has no violation and no conclusion class', () => {
    expect(activityViolations(row())).toEqual([])
    expect(classifyActivityRow(row())).toEqual({ changed: false, classes: [] })
  })

  it('classifies each trace label from the full row', () => {
    const full = rec({
      score: 15,
      status: 'avoid',
      contributions: [
        lifted({ source: 'good_god', ruleId: 'thien_duc' }, 10),
        ev({ source: 'bad_god', ruleId: 'nguyet_hai', scoreDelta: -10 }),
      ],
    })
    expect(
      classifyActivityRow(row({ full, base: rec({ contributions: [chainRow] }) })).classes,
    ).toEqual(['STATE_LIFT', 'DORMANT_GOD_ADDED', 'CHAIN_REPLACED'])
    expect(
      classifyActivityRow(row({ full: rec({ score: 25, contributions: [penalty()] }) })).classes,
    ).toEqual(['DEFAULT_PENALTY'])
    expect(
      classifyActivityRow(
        row({ full: rec({ score: 25, contributions: [penalty('p4:嫁娶:all_taboo')] }) }),
      ).classes,
    ).toEqual(['DEFAULT_PENALTY_ALL_TABOO'])
  })

  it('CAP_REALLOCATION when dormant gods leave less cap to the other gods than balancing-only', () => {
    const god = (d: number) => ev({ source: 'good_god', ruleId: 'thien_duc', scoreDelta: d })
    const r = row({
      state: 'only_yi',
      full: rec({
        score: 75,
        contributions: [ev({ source: 'good_god', ruleId: 'tu_tuong', scoreDelta: 15 }), god(10)],
      }),
      balancing: rec({ score: 70, contributions: [god(20)] }),
    })
    expect(classifyActivityRow(r).classes).toEqual(['DORMANT_GOD_ADDED', 'CAP_REALLOCATION'])
  })

  it('CHAIN_REPLACED_LIGHTER only without a state lift (§6.10.7)', () => {
    const base = rec({ score: 25, status: 'avoid', contributions: [chainRow] })
    const full = rec({ score: 40, status: 'watch' })
    expect(classifyActivityRow(row({ state: 'both_present', base, full })).classes).toEqual([
      'CHAIN_REPLACED',
      'CHAIN_REPLACED_LIGHTER',
    ])
    const withLift = rec({
      ...full,
      contributions: [lifted({ source: 'bad_god', ruleId: 'tai_sat' }, -10)],
    })
    expect(
      classifyActivityRow(row({ state: 'only_yi', base, full: withLift })).classes,
    ).not.toContain('CHAIN_REPLACED_LIGHTER')
  })

  it('report-only classes: multi-heading baseline, alias warnings, schema-only', () => {
    expect(
      classifyActivityRow(row({ state: 'baseline', headingStates: ['not_recorded', 'only_yi'] }))
        .classes,
    ).toEqual(['MULTI_HEADING_BASELINE'])
    expect(classifyActivityRow(row({ full: rec({ warnings: ['alias'] }) })).classes).toEqual([
      'ALIAS_STAR_SWAP',
    ])
    expect(
      classifyActivityRow(
        row({ full: rec({ contributions: [ev({ source: 'truc', ruleId: 't', scoreDelta: 0 })] }) }),
      ).classes,
    ).toEqual(['SCHEMA_ONLY'])
  })

  const violation = (r: ActivityDiffRow) => activityViolations(r).map((m) => m.split(' ')[0])

  it('1 a baseline activity must keep score/status/hard warning', () => {
    expect(
      violation(row({ state: 'baseline', full: rec({ score: 45, status: 'watch' }) })),
    ).toContain('1')
  })

  it('2 hard warning never changes', () => {
    expect(violation(row({ full: rec({ hardWarning: true }) }))).toContain('2')
  })

  it('3 out of domain the whole output equals flag OFF', () => {
    expect(violation(row({ inDomain: false, full: rec({ warnings: ['x'] }) }))).toEqual(['3'])
    expect(violation(row({ inDomain: false }))).toEqual([])
  })

  it('4 every changed row has a conclusion class', () => {
    const pha = [ev({ source: 'truc', ruleId: 't', scoreDelta: -10 })]
    const base = rec({ score: 40, status: 'watch', contributions: pha })
    expect(violation(row({ base, full: { ...base, status: 'avoid' } }))).toEqual(['4'])
  })

  it('5 recommended or score above 50 needs an applied positive; consider is not covered', () => {
    expect(
      violation(
        row({
          state: 'baseline',
          base: rec({ status: 'recommended' }),
          full: rec({ status: 'recommended' }),
        }),
      ),
    ).toEqual(['5'])
    expect(
      violation(
        row({
          state: 'baseline',
          base: rec({
            score: 40,
            status: 'consider',
            contributions: [ev({ source: 'truc', ruleId: 't', scoreDelta: -10 })],
          }),
          full: rec({
            score: 40,
            status: 'consider',
            contributions: [ev({ source: 'truc', ruleId: 't', scoreDelta: -10 })],
          }),
        }),
      ),
    ).toEqual([])
  })

  it('6 at most one penalty, only on only_ji, never beside an applied in-scope negative', () => {
    const two = rec({ score: 0, status: 'strong_avoid', contributions: [penalty(), penalty()] })
    expect(violation(row({ full: two }))).toContain('6')
    expect(
      violation(
        row({ state: 'both_present', full: rec({ score: 25, contributions: [penalty()] }) }),
      ),
    ).toContain('6')
    const beside = rec({
      score: 15,
      contributions: [ev({ source: 'truc', ruleId: 'pha', scoreDelta: -10 }), penalty()],
    })
    expect(violation(row({ full: beside }))).toContain('6')
    // A 28 Tú negative is out of scope and does not block the penalty (owner PRD 8 §6.7).
    const mansion = rec({
      score: 25,
      contributions: [ev({ source: 'mansion', ruleId: 'm', scoreDelta: -5 }), penalty()],
    })
    expect(violation(row({ full: mansion }))).not.toContain('6')
  })

  it('7 lifts follow the FR-02 table and never touch protected 忌 or preserve_bad', () => {
    const neg = (state: string, extra: Partial<Evidence> = {}, prot = new Set<string>()) =>
      violation(
        row({
          state,
          prot,
          full: rec({
            score: 55,
            contributions: [
              ev({ source: 'truc', ruleId: 't', scoreDelta: 5 }),
              lifted({ source: 'bad_god', ruleId: 'nguyet_pha', ...extra }, -30),
            ],
          }),
        }),
      )
    expect(neg('only_yi')).not.toContain('7')
    expect(neg('only_ji')).toContain('7')
    expect(neg('both_present')).toContain('7')
    expect(neg('only_yi', { hardWarning: true })).toContain('7')
    expect(neg('only_yi', {}, new Set(['月破']))).toContain('7')
    const pos = (state: string) =>
      violation(
        row({
          state,
          full: rec({
            score: 25,
            contributions: [lifted({ source: 'good_god', ruleId: 'thien_duc' }, 10), penalty()],
          }),
        }),
      )
    expect(pos('only_ji')).not.toContain('7')
    expect(pos('only_yi').filter((v) => v === '7')).toHaveLength(1)
  })

  it('8 an applied dormant god must be present in Golden v2 that day', () => {
    const full = rec({
      score: 40,
      status: 'watch',
      contributions: [ev({ source: 'bad_god', ruleId: 'nguyet_hai', scoreDelta: -10 })],
    })
    expect(violation(row({ full, goldenDormant: new Set(['nguyet_hai']) }))).toEqual([])
    expect(violation(row({ full, goldenDormant: new Set() }))).toEqual(['8'])
  })

  it('9 activity state equals Golden score v1', () => {
    expect(violation(row({ goldenState: 'only_ji' }))).toEqual([])
    expect(violation(row({ goldenState: 'only_yi' }))).toEqual(['9'])
  })

  it('10 a changed event needs a changed profile activity', () => {
    const changedActivities = new Set(['wedding'])
    expect(
      eventViolations({ changed: true, profileActivities: ['wedding'], changedActivities }),
    ).toEqual([])
    expect(
      eventViolations({ changed: true, profileActivities: ['travel'], changedActivities }),
    ).toHaveLength(1)
    expect(
      eventViolations({ changed: false, profileActivities: ['travel'], changedActivities }),
    ).toEqual([])
  })

  it('12 the trace explains the delta: replay and per-row reasons', () => {
    const truc = (d: number, o: Partial<Evidence> = {}) =>
      ev({ source: 'truc', ruleId: 't', scoreDelta: d, ...o })
    const god = (d: number, o: Partial<Evidence> = {}) =>
      ev({ source: 'good_god', ruleId: 'thien_duc', scoreDelta: d, ...o })
    const base = rec({ score: 70, status: 'recommended', contributions: [truc(10), god(10)] })
    expect(violation(row({ state: 'both_present', base, full: base }))).toEqual([])
    expect(violation(row({ state: 'both_present', base, full: { ...base, score: 65 } }))).toContain(
      '12',
    )
    // A silently zeroed in-scope row is caught even when another class landed on the row.
    const zeroed = rec({
      score: 50,
      status: 'watch',
      contributions: [
        truc(10),
        god(0),
        ev({ source: 'bad_god', ruleId: 'nguyet_hai', scoreDelta: -10 }),
      ],
    })
    expect(violation(row({ state: 'both_present', base, full: zeroed }))).toEqual(['12'])
    // Explained: lift tag, a cap in full, a cap or a chain in flag OFF.
    const lift = rec({
      score: 60,
      contributions: [truc(10), lifted({ source: 'good_god', ruleId: 'thien_duc' }, 10)],
    })
    expect(violation(row({ state: 'only_ji', base, full: lift }))).not.toContain('12')
    const capped = rec({ score: 65, contributions: [truc(10), god(5, { preCapDelta: 10 })] })
    expect(violation(row({ state: 'both_present', base, full: capped }))).not.toContain('12')
    const baseChain = rec({
      score: 70,
      status: 'recommended',
      contributions: [truc(10, { classical: chainRow.classical }), god(10)],
    })
    const noChain = rec({ score: 70, status: 'recommended', contributions: [truc(10), god(10)] })
    expect(
      violation(
        row({ state: 'both_present', base: { ...baseChain, score: 70 }, full: { ...noChain } }),
      ),
    ).not.toContain('12')
    // A flag-OFF row may vanish only if a 6-chain added it.
    const withChain = rec({
      score: 45,
      status: 'watch',
      contributions: [truc(10), god(10), chainRow],
    })
    expect(violation(row({ state: 'both_present', base: withChain, full: base }))).not.toContain(
      '12',
    )
    expect(
      violation(
        row({ state: 'both_present', base, full: rec({ score: 60, contributions: [truc(10)] }) }),
      ),
    ).toContain('12')
  })

  it('11 no_evidence → recommended needs an applied positive', () => {
    const r = row({
      state: 'baseline',
      base: rec({ status: 'no_evidence' }),
      full: rec({ status: 'recommended' }),
    })
    expect(violation(r)).toContain('11')
  })
})
