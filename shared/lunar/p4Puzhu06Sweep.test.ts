import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4Puzhu06Day } from './p4Puzhu06'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiOperands'
// Frozen before F1 Stage 3 (puzhu:06 authority v4, owner R2): pinned to the pre-R2 rollback (f1R2Rollback.ts).
vi.mock('../almanac-data/p4b-puzhu06-v5.json', async () =>
  (await import('./f1R2Rollback')).puzhu06V3(),
)
await vi.hoisted(async () => (await import('./f1R2Rollback')).reloadUnderR2Pin())

// puzhu:06 task 5.1 sweep: the 1,095 dates x 29 headings of the P4-C sweep, now through the
// puzhu:06 day. "Before" is the committed P4-C sweep TSV; the reason (action, classes) comes from
// the frozen Golden v3 dated.tsv, never from this output. P4B_PUZHU06_WRITE=1 regenerates.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const P4C = 'docs/audits/p4-vol10-yi-operands-2025-2027.tsv'
const GOLDEN = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/dated.tsv'
const PROPAGATION = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/propagation.tsv'
const TSV = 'docs/audits/p4b-puzhu06-2025-2027.tsv'
const SUMMARY = 'docs/audits/p4b-puzhu06-summary.json'
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
const add = (tally: Record<string, number>, key: string) => (tally[key] = (tally[key] ?? 0) + 1)
function rows(path: string, key: (r: Record<string, string>) => string) {
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return new Map(
    lines.map((l) => {
      const r = Object.fromEntries(l.split('\t').map((v, i) => [keys[i]!, v]))
      return [key(r), r]
    }),
  )
}
const FIELDS = [
  'final_yi',
  'final_ji',
  'final_protected_ji',
  'final_state',
  'propagated_from',
  'propagation_blocked',
]

describe('puzhu:06 before/after sweep (audit-only)', () => {
  it('lifts exactly the Golden rows and changes nothing else', () => {
    const before = rows(P4C, (r) => `${r.date}:${r.heading}`)
    const golden = rows(GOLDEN, (r) => `${r.id}:${r.heading}`)
    const propagated = rows(PROPAGATION, (r) => `${r.domain}:${r.id}:${r.heading}`)
    const columns = [
      'date',
      'month_jian',
      'pillar',
      'heading',
      'triggers',
      'classes',
      'action',
      ...FIELDS.flatMap((f) => [`before_${f}`, `after_${f}`]),
    ]
    const out = [columns.join('\t')]
    const counts = {
      dates: 0,
      rows: 0,
      changedRows: 0,
      lifted: 0,
      propagationOnly: 0,
      changedProtectedJi: 0,
    }
    const byAction: Record<string, Record<string, number>> = {}
    const transitions: Record<string, number> = {}
    const undetermined = { before: 0, after: 0 }
    const liftedDates = new Set<string>()
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const day = resolveP4Puzhu06Day(month, pillar, {
        lunarDay: a.selectionContext.LUNAR_DAY!,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      })
      counts.dates++
      for (const [heading, final] of Object.entries(day.headings)) {
        const old = before.get(`${date}:${heading}`)!
        const now: Record<string, string> = {
          final_yi: yi(final.yi),
          final_ji: String(final.ji),
          final_protected_ji: String(final.protectedJi),
          final_state: final.state,
          propagated_from: final.propagatedFrom ?? '',
          propagation_blocked: final.propagationBlocked ?? '',
        }
        const changed = FIELDS.some((f) => now[f] !== old[`after_${f}`])
        const t = day.puzhu06[heading]
        const g = golden.get(`${date}:${heading}`)
        counts.rows++
        counts.changedRows += Number(changed)
        undetermined.before += Number(old.after_final_state === 'undetermined')
        undetermined.after += Number(final.state === 'undetermined')
        // A change outside a lifted row must be a propagation row of the frozen Golden.
        const p = propagated.get(`dated:${date}:${heading}`)
        if (changed && (!t || t.action !== 'lift')) {
          expect(p, `${date} ${heading} unexplained change`).toBeDefined()
          expect([
            now.final_ji,
            now.final_state,
            now.propagated_from,
            now.propagation_blocked,
          ]).toEqual([
            p!.after_ji,
            p!.after_state,
            p!.after_propagated_from,
            p!.after_propagation_blocked,
          ])
          counts.propagationOnly++
        }
        counts.changedProtectedJi += Number(
          old.after_final_protected_ji === 'true' && now.final_ji !== old.after_final_ji,
        )
        if (!t) continue
        // Reasons from the frozen Golden row only.
        expect([t.action, t.classes.join('+')], `${date} ${heading}`).toEqual([
          g!.action,
          g!.classes,
        ])
        expect(changed, `${date} ${heading}`).toBe(g!.action === 'lift' || p !== undefined)
        if (t.action === 'lift') {
          counts.lifted++
          // A lifted row that P4-B left undetermined must end explained: 相抵 or still open.
          if (old.after_final_state === 'undetermined')
            expect(['neither_recorded', 'undetermined'], `${date} ${heading}`).toContain(
              final.state,
            )
          liftedDates.add(date)
          add(transitions, `${heading} ${old.after_final_state}>${final.state}`)
        }
        add((byAction[g!.action] ??= {}), heading)
        out.push(
          [
            date,
            month,
            pillar,
            heading,
            g!.triggers,
            g!.classes,
            g!.action,
            ...FIELDS.flatMap((f) => [old[`after_${f}`]!, now[f]!]),
          ].join('\t'),
        )
      }
    }
    expect(counts).toEqual({
      dates: 1095,
      rows: 31755,
      changedRows: 70,
      lifted: 68,
      propagationOnly: 2,
      changedProtectedJi: 0,
    })
    expect(liftedDates.size).toBe(34)
    const summary = {
      scope: 'MEASURED_AUDIT_ONLY_NOT_GOLDEN',
      before: P4C,
      reasonGolden: GOLDEN,
      authority: 'p4b-puzhu06-v3',
      decision: { Q1: 'no', Q2: 'no', Q3: 'no', Q4: 'yes', Q4a: 'block' },
      counts,
      byAction: Object.fromEntries(
        Object.entries(byAction)
          .sort()
          .map(([k, v]) => [k, Object.fromEntries(Object.entries(v).sort())]),
      ),
      transitions: Object.fromEntries(Object.entries(transitions).sort()),
      liftedDates: liftedDates.size,
      undeterminedAllHeadings: undetermined,
      limits: [
        'Reasons come from the frozen Golden v3; the after-state is a measurement, not an oracle.',
        '進人口, 經絡 and 醞釀 are outside the 29 P4 headings (OUT_OF_HEADING_SCOPE).',
        'Month Jian uses the calendar-day convention (P4-C 5.6).',
      ],
    }
    const outputs: [string, string][] = [
      [TSV, out.join('\n') + '\n'],
      [SUMMARY, JSON.stringify(summary, null, 2) + '\n'],
    ]
    for (const [path, content] of outputs)
      if (process.env.P4B_PUZHU06_WRITE) writeFileSync(path, content)
      else {
        expect(existsSync(path), `${path}: run with P4B_PUZHU06_WRITE=1`).toBe(true)
        const committed = readFileSync(path, 'utf8')
        if (sha256(committed) !== sha256(content)) {
          const was = committed.split('\n')
          const at = content.split('\n').findIndex((line, i) => line !== was[i])
          expect(content.split('\n')[at], `${path} line ${at + 1}`).toBe(was[at])
        }
      }
  }, 300_000)
})
