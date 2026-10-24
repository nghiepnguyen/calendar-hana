import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import { solarTermCacheStore } from '../astronomy/solarTerms/cache'
import type { ActivityRecommendation } from './activityRecommendations'
import { getP4DayHeadings } from './p4AlmanacHeadings'
import { getAlmanac } from './almanac'
import { OUTSIDE_P4_DOMAIN, P4_DOMAIN_DATES } from './p4AdapterBaselineRows'
import { capFirstDiff } from './p4MigrationReport'
import {
  applyP4Balancing,
  p4ActivityState,
  type P4HeadingInput,
  type P4ScoreHeadingLookup,
} from './p4ScoreAdapter'
import { canonicalP4HeadingKey } from './xiejiVol10Resolution'

// G1-b Stage 2 (docs/audits/p4-g1b-score-lookup.md §4–§6): migration diff v3, source-key-v1 → canonical-v1 on
// the production configuration (only the heading lookup is mocked), plus the domain gate, owner witnesses,
// isolation and the rollback proof. Independent of Score Golden v3 (golden.py): this file reads only the
// running engine. npm test: every 10th P4 date + witnesses + outside dates; ci:p4 (P4_MIGRATION_V3_FULL=1): all
// 1,095 + 3, with the counts gate and byte-equal files. Write: P4_MIGRATION_V3_FULL=1 P4_MIGRATION_V3_WRITE=1.
const policy = vi.hoisted(() => ({
  lookup: undefined as undefined | string,
  goldenConfig: false,
}))
vi.mock('../almanac-data/manifest.json', async (load) => {
  const real = ((await load()) as { default: { policies: Record<string, unknown> } }).default
  return {
    default: {
      ...real,
      policies: new Proxy(real.policies, {
        get(target, prop) {
          if (prop === 'p4ScoreHeadingLookup') return policy.lookup ?? target[prop]
          // Score Golden v2/v3 configuration (as their almanac gates): these postdate the Goldens.
          if (policy.goldenConfig && (prop === 'tiangouYinNoYi' || prop === 'satChuNgocHapStars'))
            return false
          return target[prop as string]
        },
      }),
    },
  }
})

const FULL = process.env.P4_MIGRATION_V3_FULL === '1'
const WRITE = process.env.P4_MIGRATION_V3_WRITE === '1'
const OUT = 'docs/audits/sources/p4-vol10/p4-migration-diff-v3/'
const GOLDEN = 'docs/audits/sources/p4-vol10/'
const SOURCE_RAW = '破屋壞垣'
const CANONICAL = '破屋壊垣'
const WITNESSES = ['2025-02-02', '2026-01-28', '2027-01-23', '2026-08-02', '2027-07-28']
// Frozen envelope (spec §6), recomputed on 5f2397d.
const ENVELOPE = { changedDemolitionDays: 353, scoreChanges: 320, statusChanges: 337 }
const DOMAIN = FULL
  ? P4_DOMAIN_DATES
  : P4_DOMAIN_DATES.filter((d, i) => i % 10 === 0 || WITNESSES.includes(d))
const DATES = [...DOMAIN, ...OUTSIDE_P4_DOMAIN]
const HEADINGS = xieji.activityEntries as Record<string, string[] | undefined>
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'
const SHIPPED = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
  policies: { p4ScoreHeadingLookup: string }
}

type Rec = ActivityRecommendation
interface Day {
  ctx: { monthJian: string; pillar: string }
  headings: Record<string, P4HeadingInput>
  recs: Rec[]
}
function run(date: string, lookup: P4ScoreHeadingLookup): Day {
  policy.lookup = lookup
  solarTermCacheStore('almanac').clear() // the getAlmanac memo key has no policy component
  const a = getAlmanac(date as never)
  const op = {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  }
  return {
    ctx: { monthJian: BR[op.monthJianBranch]!, pillar: ST[op.dayStem]! + BR[op.dayBranch]! },
    headings: getP4DayHeadings(date, op),
    recs: a.activityRecommendations,
  }
}
afterEach(() => {
  policy.lookup = undefined
  policy.goldenConfig = false
  solarTermCacheStore('almanac').clear()
})

const fullCode = new Map(
  readFileSync(GOLDEN + 'p4-full-golden-v2/compose/dated.tsv', 'utf8')
    .trimEnd()
    .split('\n')
    .slice(1)
    .map((l) => l.split('\t'))
    .filter((c) => c[3] === CANONICAL)
    .map((c) => [c[0]!, c[13]!]),
)
const path = (state: string, r: Rec) =>
  state !== 'baseline'
    ? 'p4'
    : r.contributions.some((c) => c.classical?.version?.startsWith('xieji-vol10'))
      ? 'vol10'
      : 'legacy'
const key = (c: Rec['contributions'][number]) => `${c.source}:${c.ruleId}`
const policyRows = (r: Rec) =>
  r.contributions
    .filter((c) => c.evidenceOrigin === 'product_policy')
    .map((c) => `${c.sourceClauseId}=${c.scoreDelta}`)
    .join(' ')

const HEADER = [
  'date',
  'month_jian',
  'pillar',
  'activity',
  'source_heading',
  'canonical_heading',
  'p4_state_old',
  'p4_state_new',
  'deciding_heading_new',
  'heading_input',
  'score_old',
  'score_new',
  'status_old',
  'status_new',
  'hard_warning_old',
  'hard_warning_new',
  'path_old',
  'path_new',
  'rows_removed',
  'rows_added',
  'rows_status_changed',
  'policy_rows',
  'cap_first_diff',
  'class',
  'reason',
].join('\t')

/** One diff row per (date, activity) whose recommendation differs between the two lookups. */
function compare(date: string) {
  const before = run(date, 'source-key-v1')
  const after = run(date, 'canonical-v1')
  expect(after.headings).toEqual(before.headings) // the provider does not read the lookup
  const rows: string[][] = []
  const unexpected: string[] = []
  after.recs.forEach((b, k) => {
    const a = before.recs[k]!
    expect(b.activityId).toBe(a.activityId)
    if (JSON.stringify(a) === JSON.stringify(b)) return
    const id = a.activityId
    const hs = HEADINGS[id] ?? []
    const oldP4 = p4ActivityState(id, before.headings, 'source-key-v1')
    const newP4 = p4ActivityState(id, after.headings, 'canonical-v1')
    const inDomain = P4_DOMAIN_DATES.includes(date)
    const h = after.headings[CANONICAL]
    const oldRows = new Map(a.contributions.map((c) => [key(c), c.status]))
    const newRows = new Map(b.contributions.map((c) => [key(c), c.status]))
    const removed = [...oldRows.keys()].filter((x) => !newRows.has(x))
    const added = [...newRows.keys()].filter((x) => !oldRows.has(x))
    const flipped = [...newRows]
      .filter(([x, s]) => oldRows.has(x) && oldRows.get(x) !== s)
      .map(([x, s]) => `${x}:${oldRows.get(x)}>${s}`)
    // EXPECTED only for the frozen G1-b cause: demolition, in domain, baseline → the canonical row's state,
    // deciding heading kept in the source spelling, hard warning unchanged.
    const expected =
      id === 'demolition' &&
      inDomain &&
      hs.join() === SOURCE_RAW &&
      canonicalP4HeadingKey(SOURCE_RAW) === CANONICAL &&
      oldP4.state === 'baseline' &&
      newP4.state === h?.state &&
      newP4.heading === SOURCE_RAW &&
      a.hardWarning === b.hardWarning
    if (!expected) unexpected.push(`${date} ${id}`)
    const reason = [
      `p4:${newP4.state}`,
      path(oldP4.state, a) !== path(newP4.state, b) &&
        `path:${path(oldP4.state, a)}>${path(newP4.state, b)}`,
      added.length && `rows_added:${added.length}`,
      removed.length && `rows_removed:${removed.length}`,
      flipped.length && `rows_status:${flipped.length}`,
      policyRows(b) && 'product_policy',
      capFirstDiff(b) && 'cap',
    ]
      .filter(Boolean)
      .join(';')
    rows.push([
      date,
      after.ctx.monthJian,
      after.ctx.pillar,
      id,
      hs.join('+'),
      hs.map(canonicalP4HeadingKey).join('+'),
      oldP4.state,
      newP4.state,
      newP4.heading ?? '',
      h
        ? [`state=${h.state}`, h.rule && `rule=${h.rule}`, h.prot && `prot=${h.prot.join('+')}`]
            .filter(Boolean)
            .concat(`code=${fullCode.get(date) ?? ''}`)
            .join(';')
        : '',
      String(a.score),
      String(b.score),
      a.status,
      b.status,
      String(a.hardWarning),
      String(b.hardWarning),
      path(oldP4.state, a),
      path(newP4.state, b),
      removed.join(' '),
      added.join(' '),
      flipped.join(' '),
      policyRows(b),
      String(capFirstDiff(b)),
      expected ? 'EXPECTED_G1B_MIGRATION_CHANGE' : 'UNEXPECTED_REGRESSION',
      reason,
    ])
  })
  return { rows, unexpected, evaluations: after.recs.length }
}

describe('G1-b Stage 2 migration diff v3 (source-key-v1 → canonical-v1)', () => {
  it('ships canonical-v1', () => {
    expect(SHIPPED.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
  })

  it('domain gate: only the frozen demolition envelope changes', { timeout: 1_800_000 }, () => {
    const rows: string[][] = []
    const unexpected: string[] = []
    let evaluations = 0
    for (const date of DATES) {
      const r = compare(date)
      rows.push(...r.rows)
      unexpected.push(...r.unexpected)
      evaluations += r.evaluations
    }
    const col = (name: string) => HEADER.split('\t').indexOf(name)
    const differs = (a: string, b: string) => rows.filter((r) => r[col(a)] !== r[col(b)]).length
    const conclusion = (r: string[]) =>
      ['score', 'status', 'hard_warning'].some((f) => r[col(`${f}_old`)] !== r[col(`${f}_new`)])
    const summary = {
      version: 'p4-migration-diff-v3',
      spec: 'docs/audits/p4-g1b-score-lookup.md §6',
      before: 'source-key-v1',
      after: 'canonical-v1',
      domain: [P4_DOMAIN_DATES[0], P4_DOMAIN_DATES.at(-1)],
      domainDaysEvaluated: DOMAIN.length,
      outsideControls: OUTSIDE_P4_DOMAIN,
      activityEvaluations: evaluations,
      changedEvaluations: rows.length,
      unchangedEvaluations: evaluations - rows.length,
      // Spec §6 counts score-or-status changes; §5 lists every row where any field differs.
      changedDemolitionDays: rows.filter((r) => r[3] === 'demolition' && conclusion(r)).length,
      evidenceOnlyDemolitionRows: rows.filter((r) => r[3] === 'demolition' && !conclusion(r))
        .length,
      scoreChanges: differs('score_old', 'score_new'),
      scoreLower: rows.filter((r) => Number(r[col('score_new')]) < Number(r[col('score_old')]))
        .length,
      statusChanges: differs('status_old', 'status_new'),
      hardWarningChanges: differs('hard_warning_old', 'hard_warning_new'),
      otherActivityChanges: rows.filter((r) => r[3] !== 'demolition').length,
      outsideDomainChanges: rows.filter((r) => OUTSIDE_P4_DOMAIN.includes(r[0]!)).length,
      expectedG1bChanges: rows.filter((r) => r[col('class')] === 'EXPECTED_G1B_MIGRATION_CHANGE')
        .length,
      unexpectedRegressions: unexpected.length,
      sourceHeadingsNew: [...new Set(rows.map((r) => r[col('deciding_heading_new')]))],
    }
    expect(unexpected.slice(0, 10)).toEqual([])
    expect(summary.otherActivityChanges).toBe(0)
    expect(summary.hardWarningChanges).toBe(0)
    expect(summary.outsideDomainChanges).toBe(0)
    expect(summary.sourceHeadingsNew).toEqual(rows.length ? [SOURCE_RAW] : [])
    const tsvText = [HEADER, ...rows.map((r) => r.join('\t'))].join('\n') + '\n'
    if (!FULL) {
      // Sampled: every row equals the committed full diff's row for that date.
      const committed = new Set(readFileSync(OUT + 'activities-changed.tsv', 'utf8').split('\n'))
      expect(rows.map((r) => r.join('\t')).filter((l) => !committed.has(l))).toEqual([])
      return
    }
    expect(summary.domainDaysEvaluated).toBe(1095)
    expect(summary.activityEvaluations).toBe(1098 * 32)
    expect(summary.changedDemolitionDays).toBe(ENVELOPE.changedDemolitionDays)
    expect(summary.scoreChanges).toBe(ENVELOPE.scoreChanges)
    expect(summary.statusChanges).toBe(ENVELOPE.statusChanges)
    expect(summary.expectedG1bChanges).toBe(rows.length)
    const summaryText = JSON.stringify(summary, null, 1) + '\n'
    if (WRITE) {
      mkdirSync(OUT, { recursive: true })
      writeFileSync(OUT + 'activities-changed.tsv', tsvText)
      writeFileSync(OUT + 'summary.json', summaryText)
    }
    expect(tsvText).toBe(readFileSync(OUT + 'activities-changed.tsv', 'utf8'))
    expect(summaryText).toBe(readFileSync(OUT + 'summary.json', 'utf8'))
  })

  it('migration diff v3 files equal the lock', () => {
    const lock = JSON.parse(readFileSync(OUT + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
  })

  it('owner witnesses: baseline / 35 / watch → only_ji / 20 / avoid', () => {
    for (const date of WITNESSES) {
      const before = run(date, 'source-key-v1')
      const after = run(date, 'canonical-v1')
      const d = (x: Day) => x.recs.find((r) => r.activityId === 'demolition')!
      const p4 = (x: Day, l: P4ScoreHeadingLookup) => p4ActivityState('demolition', x.headings, l)
      expect([p4(before, 'source-key-v1').state, d(before).score, d(before).status], date).toEqual([
        'baseline',
        35,
        'watch',
      ])
      expect([p4(after, 'canonical-v1'), d(after).score, d(after).status], date).toEqual([
        { state: 'only_ji', heading: SOURCE_RAW },
        20,
        'avoid',
      ])
      expect(d(after).hardWarning, date).toBe(d(before).hardWarning)
    }
  })
})

describe('G1-b Stage 2 cross-evidence', () => {
  it('migration diff v3 conclusion changes = Score Golden v3 vs v2 changes (independent derivations)', () => {
    const scores = (v: string) =>
      new Map(
        readFileSync(`${GOLDEN}p4-score-golden-${v}/activity-scores.tsv`, 'utf8')
          .trimEnd()
          .split('\n')
          .slice(1)
          .map((l) => l.split('\t'))
          .map((c) => [`${c[0]}|${c[1]}`, c.slice(3, 6).join(' ')]),
      )
    const [v2, v3] = [scores('v2'), scores('v3')]
    const golden = [...v3].filter(([k, x]) => v2.get(k) !== x).map(([k]) => k)
    const [head, ...lines] = readFileSync(OUT + 'activities-changed.tsv', 'utf8')
      .trimEnd()
      .split('\n')
    const c = head!.split('\t')
    const at = (r: string[], n: string) => r[c.indexOf(n)]!
    const diff = lines
      .map((l) => l.split('\t'))
      .filter((r) =>
        ['score', 'status', 'hard_warning'].some((f) => at(r, `${f}_old`) !== at(r, `${f}_new`)),
      )
    expect(diff.map((r) => `${r[0]}|${r[3]}`).sort()).toEqual(golden.sort())
    expect(golden).toHaveLength(ENVELOPE.changedDemolitionDays)
    // Each changed row: before = Golden v2, after = Golden v3.
    for (const r of diff) {
      const k = `${r[0]}|${r[3]}`
      expect(`${at(r, 'score_old')} ${at(r, 'status_old')} ${at(r, 'hard_warning_old')}`, k).toBe(
        v2.get(k),
      )
      expect(`${at(r, 'score_new')} ${at(r, 'status_new')} ${at(r, 'hard_warning_new')}`, k).toBe(
        v3.get(k),
      )
    }
  })
})

describe('G1-b Stage 2 isolation', () => {
  const sources = Object.values(HEADINGS).flatMap((h) => h ?? [])

  it('the canonical key folds exactly one source heading, with no collision (no G2, no other variant)', () => {
    const folded = sources.filter((h) => canonicalP4HeadingKey(h) !== h)
    expect([...new Set(folded)]).toEqual([SOURCE_RAW])
    const byKey = new Map<string, Set<string>>()
    for (const h of sources) {
      const k = canonicalP4HeadingKey(h)
      byKey.set(k, (byKey.get(k) ?? new Set()).add(h))
    }
    expect([...byKey].filter(([, s]) => s.size > 1)).toEqual([])
    expect(sources).not.toContain(CANONICAL) // no source heading already spelled canonically
    expect(canonicalP4HeadingKey('立券交易')).toBe('立券交易') // G2 keys untouched
  })

  it('sourceRaw: the activity map keeps the source spelling', () => {
    expect(HEADINGS.demolition).toEqual([SOURCE_RAW])
    expect(Object.keys(xieji.entries)).toContain(SOURCE_RAW)
    expect(Object.keys(xieji.entries)).not.toContain(CANONICAL)
  })

  it('missing lookup: an unknown activity stays baseline; no heading activity reads a missing key', () => {
    const day = { [CANONICAL]: { state: 'only_ji' } }
    expect(p4ActivityState('no_such_activity', day, 'canonical-v1')).toEqual({ state: 'baseline' })
    const missing: string[] = []
    for (const date of DOMAIN) {
      const { headings } = run(date, 'canonical-v1')
      for (const [a, hs] of Object.entries(HEADINGS))
        for (const h of hs ?? [])
          if (!headings[canonicalP4HeadingKey(h)]) missing.push(`${date} ${a} ${h}`)
    }
    expect(missing.slice(0, 10)).toEqual([])
  }, 900_000)

  it('scoring is unchanged: canonical-v1 on canonical keys = source-key-v1 on source keys', () => {
    const rows = [
      { status: 'applied', rawDelta: -15, ruleId: 'kiep_sat' },
      { status: 'applied', rawDelta: 10, ruleId: 'thien_duc' },
    ].map(
      (r) =>
        ({
          source: r.rawDelta < 0 ? 'bad_god' : 'good_god',
          ruleId: r.ruleId,
          activityId: 'demolition',
          scope: 'demolition',
          label: r.ruleId,
          sourcePhrase: '',
          sourceRef: '',
          confidence: 'high',
          status: r.status,
          rawDelta: r.rawDelta,
          scoreDelta: r.rawDelta,
          polarity: r.rawDelta < 0 ? 'negative' : 'positive',
        }) as Rec['contributions'][number],
    )
    for (const input of [
      { state: 'only_ji', prot: ['土王用事後'] },
      { state: 'only_yi' },
      { state: 'neither_recorded', prot: ['刼煞'] },
      { state: 'both_present', rule: 'all_taboo' },
    ]) {
      const viaCanonical = { [CANONICAL]: input }
      const viaSource = { [SOURCE_RAW]: input }
      const s1 = p4ActivityState('demolition', viaCanonical, 'canonical-v1')
      const s0 = p4ActivityState('demolition', viaSource, 'source-key-v1')
      expect(s1).toEqual(s0)
      const opts = { activityId: 'demolition', scope: 'demolition' }
      expect(
        applyP4Balancing(rows, s1, viaCanonical, { ...opts, headingLookup: 'canonical-v1' }),
      ).toEqual(applyP4Balancing(rows, s0, viaSource, { ...opts, headingLookup: 'source-key-v1' }))
    }
  })
})

describe('G1-b Stage 2 rollback proof (configuration flip, no data change)', () => {
  const golden = (v: 'v2' | 'v3') =>
    new Map(
      readFileSync(`${GOLDEN}p4-score-golden-${v}/activity-scores.tsv`, 'utf8')
        .trimEnd()
        .split('\n')
        .slice(1)
        .map((l) => l.split('\t'))
        .map((c) => [`${c[0]}|${c[1]}`, `${c[3]} ${c[4]} ${c[5]}`]),
    )
  const G2 = golden('v2')
  const G3 = golden('v3')
  const mismatches = (lookup: P4ScoreHeadingLookup, want: Map<string, string>) => {
    policy.goldenConfig = true
    const bad: string[] = []
    for (const date of DOMAIN)
      for (const r of run(date, lookup).recs)
        if (`${r.score} ${r.status} ${r.hardWarning}` !== want.get(`${date}|${r.activityId}`))
          bad.push(`${date} ${r.activityId}`)
    return bad
  }
  const sourceBytes = () =>
    createHash('sha256')
      .update(readFileSync('shared/almanac-data/xiejibianfangshu-yiji.json'))
      .digest('hex')

  it('forward canonical-v1 = Golden v3, rollback source-key-v1 = Golden v2, re-enable = Golden v3', () => {
    const src = sourceBytes()
    const steps: Record<string, unknown>[] = []
    const step = (name: string, lookup: P4ScoreHeadingLookup, want: 'v2' | 'v3') => {
      const bad = mismatches(lookup, want === 'v2' ? G2 : G3)
      steps.push({
        step: name,
        p4ScoreHeadingLookup: lookup,
        golden: want,
        dates: DOMAIN.length,
        mismatches: bad.length,
      })
      expect(bad.slice(0, 10), name).toEqual([])
    }
    step('forward', 'canonical-v1', 'v3')
    step('rollback', 'source-key-v1', 'v2')
    for (const date of WITNESSES) {
      const d = run(date, 'source-key-v1').recs.find((r) => r.activityId === 'demolition')!
      expect([d.score, d.status], date).toEqual([35, 'watch'])
    }
    step('re-enable', 'canonical-v1', 'v3')
    expect(sourceBytes()).toBe(src) // no source data touched by the flip
    if (FULL && WRITE)
      writeFileSync(
        OUT + 'rollback.json',
        JSON.stringify(
          {
            proof: 'ROLLBACK_PROOF',
            mechanism:
              'manifest.policies.p4ScoreHeadingLookup flipped in-process (vi.mock); no data file written',
            manifestShipped: { p4ScoreHeadingLookup: SHIPPED.policies.p4ScoreHeadingLookup },
            configuration:
              'Score Golden v2/v3 gate configuration (tiangouYinNoYi, satChuNgocHapStars off)',
            sourceDataSha256: { 'shared/almanac-data/xiejibianfangshu-yiji.json': src },
            steps,
            witnessesOnRollback: Object.fromEntries(WITNESSES.map((w) => [w, '35 watch'])),
            result: 'PASS',
          },
          null,
          1,
        ) + '\n',
      )
  }, 1_800_000)
})
