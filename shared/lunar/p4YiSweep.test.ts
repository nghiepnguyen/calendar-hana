import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'

// P4-C task 6 sweep: same 1,095 dates / inputs / 29 headings as baseline 1.4, on the opt-in 宜
// path. Outputs are committed; ordinary runs verify bytes, P4C_SWEEP_WRITE=1 regenerates them.
// Reasons come from the frozen baseline and the independent 5.4 Golden, never from this output.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const TSV = 'docs/audits/p4-vol10-yi-operands-2025-2027.tsv'
const SUMMARY = 'docs/audits/p4-vol10-yi-operands-summary.json'
const BASELINE = 'docs/audits/sources/p4-vol10/yi-baseline-v1/baseline.tsv'
const GOLDEN = 'docs/audits/sources/p4-vol10/yi-propagation-v1/'
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
function table(path: string) {
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return new Map(
    lines.map((line) => {
      const row = Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v]))
      return [`${row.date}:${row.heading}`, row]
    }),
  )
}
const add = (tally: Record<string, number>, key: string) => (tally[key] = (tally[key] ?? 0) + 1)

describe('P4-C task 6 before/after sweep (audit-only)', () => {
  it('reports 1,095 dates x 29 headings with explained transitions', () => {
    const baseline = table(BASELINE)
    const evidence = table(GOLDEN + 'evidence.tsv')
    const golden = JSON.parse(readFileSync(GOLDEN + 'expected.json', 'utf8')) as {
      sections: { stopJiReveal: { date: string; heading: string }[] }
    }
    const stop = new Set(golden.sections.stopJiReveal.map((x) => `${x.date}:${x.heading}`))
    const fields = [
      'pre_yi',
      'pre_ji',
      'pre_protected_ji',
      'pre_state',
      'final_yi',
      'final_ji',
      'final_protected_ji',
      'final_state',
      'propagated_from',
      'propagation_blocked',
    ]
    const columns = [
      'date',
      'lunar_day',
      'phase',
      'soil_presence',
      'mucang_soil',
      'month_jian',
      'pillar',
      'heading',
      'activities',
      'p4c_presence',
      'p4c_unresolved',
      'legacy_present',
      'legacy_unknown',
      'warehouse_deferred',
      'before_raw_yi',
      'after_evidence_yi',
      ...fields.flatMap((f) => [`before_${f}`, `after_${f}`]),
      'after_raw_ji',
      'ji_unresolved',
      'before_bucket',
      'after_bucket',
      'reason',
    ]
    const rows = [columns.join('\t')]
    const counts = {
      dates: 0,
      rows: 0,
      changedRows: 0,
      unexplained: 0,
      unresolvedJiRows: 0,
      conflicts: 0,
      p4cUnknownOperands: 0,
      p4cUnknownTracedRows: 0,
      finalUndeterminedBefore: 0,
      finalUndeterminedAfter: 0,
    }
    const buckets = { before: {} as Record<string, number>, after: {} as Record<string, number> }
    const transitions: Record<string, number> = {}
    const perGod = Object.fromEntries(
      authority.entries.map((e) => [
        e.han,
        {
          authorityId: e.authorityId,
          ruleId: e.ruleId,
          status: e.status,
          requiredInputs: e.operandInputs.filter((x) => x.required).map((x) => x.key),
          dates: { present: 0, absent: 0, unknown: 0 },
          unknownReasons: {} as Record<string, number>,
          tracedRows: { present: 0, absent: 0, unknown: 0 },
          // 宜 true only through this god (no other present operand on the heading).
          soleProofRows: 0,
          // Baseline raw 宜 unknown rows on which this god is now known.
          resolvedBaselineUnknownRows: 0,
        },
      ]),
    )
    const perHeading: Record<string, Record<string, number>> = {}
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const lunarDay = a.selectionContext.LUNAR_DAY!
      const phase = getP4MoonPhase(date)
      const soil = getP4SoilPresence(date)
      const mucang = getP4MuCangSoil(date)
      const day = resolveP4YiDay(month, pillar, {
        lunarDay,
        phase,
        soil,
        yiInputs: { SOIL_REIGN_STATE: mucang },
      })
      counts.dates++
      counts.conflicts += Number(Boolean(day.remaining.scopes['遊禍']?.reason))
      for (const op of day.yiOperands) {
        const g = perGod[op.han]!
        g.dates[op.presence]++
        if (op.reason) add(g.unknownReasons, op.reason)
        counts.p4cUnknownOperands += Number(op.presence === 'unknown')
      }
      for (const [heading, final] of Object.entries(day.headings) as [
        string,
        (typeof day.headings)[string] & { propagatedFrom?: string; propagationBlocked?: string },
      ][]) {
        const id = `${date}:${heading}`
        const base = baseline.get(id)!
        const pre = day.prePropagationHeadings[heading]!
        const ev = day.yiEvidence[heading]!
        const trace = ev.trace as { traceId: string; han: string; presence: string }[]
        const p4c = trace.filter((t) => t.traceId.startsWith('p4yi:'))
        const legacy = trace.filter((t) => t.traceId.startsWith('p4legacy:'))
        const now: Record<string, string> = {
          pre_yi: yi(pre.yi),
          pre_ji: String(pre.ji),
          pre_protected_ji: String(pre.protectedJi),
          pre_state: pre.state,
          final_yi: yi(final.yi),
          final_ji: String(final.ji),
          final_protected_ji: String(final.protectedJi),
          final_state: final.state,
          propagated_from: final.propagatedFrom ?? '',
          propagation_blocked: final.propagationBlocked ?? '',
        }
        const changed = fields.some((f) => now[f] !== base[f])
        const warehouse = ev.deferred === 'P5'
        const bucket =
          final.state !== 'undetermined'
            ? ''
            : warehouse
              ? 'P5_WAREHOUSE'
              : ev.yi === undefined && ev.unresolvedP4cTraceIds.length
                ? 'P4C_YI_UNKNOWN'
                : ev.yi === undefined
                  ? 'OTHER_YI_UNKNOWN'
                  : 'OTHER_STATE_WITH_KNOWN_YI'
        // Same reason ladder as the 5.7 gate: Golden reveal, then Golden-resolved recorded /
        // pre-suppression 宜. Anything else is a regression.
        const reason = !changed
          ? ''
          : stop.has(id)
            ? 'STOP_JI_REVEAL'
            : base.pre_yi === 'unknown' && evidence.get(id)!.expected_recorded_yi !== 'null'
              ? 'RECORDED_YI_RESOLVED'
              : base.raw_yi === 'unknown' && evidence.get(id)!.expected_evidence_yi !== 'null'
                ? 'EVIDENCE_YI_RESOLVED'
                : 'UNEXPLAINED'
        counts.rows++
        counts.changedRows += Number(changed)
        counts.unexplained += Number(reason === 'UNEXPLAINED')
        counts.unresolvedJiRows += Number(day.unresolvedJi[heading]!.length > 0)
        counts.p4cUnknownTracedRows += Number(ev.unresolvedP4cTraceIds.length > 0)
        counts.finalUndeterminedBefore += Number(base.final_state === 'undetermined')
        counts.finalUndeterminedAfter += Number(final.state === 'undetermined')
        if (base.final_undetermined_bucket) add(buckets.before, base.final_undetermined_bucket)
        if (bucket) add(buckets.after, bucket)
        if (changed) add(transitions, `${reason} ${base.final_state}>${final.state}`)
        const present = trace.filter((t) => t.presence === 'present')
        for (const t of p4c) {
          const g = perGod[t.han]!
          g.tracedRows[t.presence as 'present' | 'absent' | 'unknown']++
          g.soleProofRows += Number(present.length === 1 && present[0] === t)
          g.resolvedBaselineUnknownRows += Number(
            base.raw_yi === 'unknown' && t.presence !== 'unknown',
          )
        }
        const h = (perHeading[heading] ??= {
          rows: 0,
          undeterminedBefore: 0,
          undeterminedAfter: 0,
          yiTrue: 0,
          yiFalse: 0,
          yiUnknown: 0,
          changed: 0,
        })
        h.rows++
        h.undeterminedBefore += Number(base.final_state === 'undetermined')
        h.undeterminedAfter += Number(final.state === 'undetermined')
        h[ev.yi === undefined ? 'yiUnknown' : ev.yi ? 'yiTrue' : 'yiFalse']++
        h.changed += Number(changed)
        rows.push(
          [
            date,
            lunarDay,
            phase.phase,
            soil.presence,
            mucang.state,
            month,
            pillar,
            heading,
            base.activities,
            p4c.map((t) => `${t.han}:${t.presence}`).join('+'),
            p4c
              .filter((t) => t.presence === 'unknown')
              .map((t) => t.han)
              .join('+'),
            legacy
              .filter((t) => t.presence === 'present')
              .map((t) => t.han)
              .join('+'),
            legacy
              .filter((t) => t.presence === 'unknown')
              .map((t) => t.han)
              .join('+'),
            warehouse,
            base.raw_yi,
            warehouse ? 'deferred' : yi(ev.yi),
            ...fields.flatMap((f) => [base[f], now[f]]),
            day.rawJiHeadings[heading]!.ji,
            day.unresolvedJi[heading]!.join('+'),
            base.final_undetermined_bucket,
            bucket,
            reason,
          ].join('\t'),
        )
      }
    }
    // 6.4: full-input domain no longer misses any of the 11 operands, 凶 stays fully modeled.
    expect(counts.dates).toBe(1095)
    expect(counts.rows).toBe(31755)
    expect(counts.p4cUnknownOperands).toBe(0)
    expect(counts.p4cUnknownTracedRows).toBe(0)
    expect(buckets.after.P4C_YI_UNKNOWN ?? 0).toBe(0)
    expect(counts.unresolvedJiRows).toBe(0)
    expect(counts.conflicts).toBe(0)
    expect(counts.unexplained).toBe(0)
    expect(counts.finalUndeterminedAfter).toBe(
      Object.values(buckets.after).reduce((x, y) => x + y, 0),
    )
    const summary = {
      scope: 'MEASURED_AUDIT_ONLY_NOT_GOLDEN',
      baseline: BASELINE,
      reasonGolden: GOLDEN,
      counts,
      undeterminedBuckets: buckets,
      transitions,
      perGod,
      perHeading,
      limits: [
        'Undetermined reduction is a measurement, not an oracle; reasons come from baseline + 5.4 Golden.',
        'Month Jian uses the calendar-day selectionContext convention (5.6); 3 Jie days differ for 母倉 under noon.',
        '母倉 is OWNER_ADOPTED_SOURCE_DEPENDENT within 2025-2027; canonical S1 stays OPEN.',
        '修倉庫 stays deferred to P5; its rows are not resolved by any listed god.',
        'Per-god traced rows overlap across gods; do not sum them to obtain unique rows.',
      ],
    }
    const outputs: [string, string][] = [
      [TSV, rows.join('\n') + '\n'],
      [SUMMARY, JSON.stringify(summary, null, 2) + '\n'],
    ]
    for (const [path, content] of outputs)
      if (process.env.P4C_SWEEP_WRITE) writeFileSync(path, content)
      else {
        expect(existsSync(path), `${path}: run with P4C_SWEEP_WRITE=1`).toBe(true)
        const committed = readFileSync(path, 'utf8')
        if (sha256(committed) !== sha256(content)) {
          const was = committed.split('\n')
          const firstDiff = content.split('\n').findIndex((line, i) => line !== was[i])
          expect(content.split('\n')[firstDiff], `${path} line ${firstDiff + 1}`).toBe(
            was[firstDiff],
          )
        }
      }
  }, 300_000)
})
