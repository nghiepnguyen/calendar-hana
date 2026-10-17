import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4WarehouseDay } from './p4Warehouse'
import { getP4MuCangSoil } from './p4YiOperands'

// P5 task 5.1/5.2 sweep: the 1,095 dates x 29 headings of the P4-C sweep, now through the P5
// day. "Before" is the committed P4-C sweep TSV; reasons come from the frozen P5 Golden
// (dated.tsv), never from this output. Ordinary runs verify bytes; P5_SWEEP_WRITE=1 regenerates.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const P4C = 'docs/audits/p4-vol10-yi-operands-2025-2027.tsv'
const GOLDEN = 'docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/dated.tsv'
const TSV = 'docs/audits/p5-warehouse-2025-2027.tsv'
const SUMMARY = 'docs/audits/p5-warehouse-summary.json'
const XIU = '修倉庫'
const KAI = '開倉庫出貨財'
const DIRECT = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '三合', '滿日']
const DE = ['天德', '月德', '天德合', '月德合']
// puzhu:06 「凡德合赦願月恩四相時德等日不註忌…開倉庫出貨財如遇德猶忌及從忌不從宜之日則仍註忌」
const PUZHU06 = [...DE, '天赦', '天願', '月恩', '四相', '時德']
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
const add = (tally: Record<string, number>, key: string) => (tally[key] = (tally[key] ?? 0) + 1)
function rows(path: string) {
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [keys[i]!, v])))
}
const FIELDS = [
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

describe('P5 warehouse before/after sweep (audit-only)', () => {
  it('resolves every 修倉庫 row with a reason and changes no other heading', () => {
    const before = new Map(rows(P4C).map((r) => [`${r.date}:${r.heading}`, r]))
    const golden = new Map(rows(GOLDEN).map((r) => [r.date!, r]))
    const columns = [
      'date',
      'month_jian',
      'pillar',
      'direct_present',
      'bases_present',
      'partners_present',
      'bases_r10_r11_d',
      'verdict',
      'p4c_bucket',
      ...['pre_state', 'final_yi', 'final_ji', 'final_state'].flatMap((f) => [
        `before_${f}`,
        `after_${f}`,
      ]),
      'reason',
      'after_bucket',
      'ji_subjects',
    ]
    const out = [columns.join('\t')]
    const counts = { dates: 0, rows: 0, changedRows: 0, changedOtherHeadings: 0, deferredAfter: 0 }
    const xiu = {
      p5Rows: {} as Record<string, number>,
      otherRows: {} as Record<string, number>,
      transitions: {} as Record<string, number>,
      reasons: {} as Record<string, number>,
      finalStateAfter: {} as Record<string, number>,
      sourceDependent: [] as string[],
      undeterminedAfter: {} as Record<string, number>,
    }
    const undeterminedElsewhere = { before: 0, after: 0 }
    const kai = {
      yiTrue: 0,
      jiaDays: 0,
      jiaZhuanJiKept: 0,
      jiaPuzhu28NotJi: [] as string[],
      propagation: {} as Record<string, number>,
      yueSha: {} as Record<string, number>,
      yueYan: {} as Record<string, number>,
      yueYanLiftedWithoutDe: [] as string[],
      // Not modeled by P4-B: unprotected 忌 kept on a puzhu:06 day (candidate, 從忌 not classified).
      puzhu06Candidates: {} as Record<string, number>,
    }
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const g = golden.get(date)!
      expect(month + pillar, date).toBe(g.month_jian! + g.pillar!)
      const day = resolveP4WarehouseDay(month, pillar, {
        lunarDay: a.selectionContext.LUNAR_DAY!,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      })
      counts.dates++
      for (const [heading, final] of Object.entries(day.headings) as [
        string,
        (typeof day.headings)[string] & { propagatedFrom?: string; propagationBlocked?: string },
      ][]) {
        const old = before.get(`${date}:${heading}`)!
        const pre = day.prePropagationHeadings[heading]!
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
        const changed = FIELDS.some((f) => now[f] !== old[`after_${f}`])
        counts.rows++
        counts.changedRows += Number(changed)
        counts.deferredAfter += Number('deferred' in day.yiEvidence[heading]!)
        if (heading !== XIU) {
          counts.changedOtherHeadings += Number(changed)
          undeterminedElsewhere.before += Number(old.after_final_state === 'undetermined')
          undeterminedElsewhere.after += Number(final.state === 'undetermined')
          continue
        }
        const w = day.warehouse
        expect(w.heading, date).toBe(g.xiu_cang_ku)
        const present = (gods: string[]) => gods.filter((x) => w.presence[x]).join('+')
        // Reasons from the frozen Golden row only.
        const reason = DIRECT.some((x) => g[x] === 'present')
          ? 'DIRECT_YI'
          : g.xiu_cang_ku === 'yi'
            ? 'CO_PRESENCE_AGREED'
            : g.xiu_cang_ku === 'source_dependent'
              ? 'SOURCE_DEPENDENT'
              : g.bases_d === '-'
                ? 'NO_OPERAND'
                : 'CO_PRESENCE_ABSENT'
        add(xiu.reasons, reason)
        add(
          old.after_bucket ? xiu.p5Rows : xiu.otherRows,
          `${old.after_final_state}>${final.state}`,
        )
        add(xiu.transitions, `${reason} ${old.after_final_state}>${final.state}`)
        add(xiu.finalStateAfter, final.state)
        if (reason === 'SOURCE_DEPENDENT') xiu.sourceDependent.push(date)
        // 宜 is known except SOURCE_DEPENDENT; any other undetermined state is the 忌 side (P4-B).
        const bucket =
          final.state !== 'undetermined'
            ? ''
            : reason === 'SOURCE_DEPENDENT'
              ? 'SOURCE_DEPENDENT'
              : 'OTHER_STATE_WITH_KNOWN_YI'
        if (bucket === 'OTHER_STATE_WITH_KNOWN_YI') expect(w.yi, date).not.toBe(undefined)
        const subjects = (day.subjects as readonly string[]).join('+')
        if (bucket) add(xiu.undeterminedAfter, `${bucket} ${subjects}`)
        out.push(
          [
            date,
            month,
            pillar,
            present(DIRECT),
            present(w.bases.map((b) => b.base)),
            present(['月恩', '四相', '時德', '開日']),
            w.bases.map((b) => `${b.base}:${yi(b.r10)}/${yi(b.r11)}/${b.d}`).join('|'),
            w.heading,
            old.after_bucket,
            ...['pre_state', 'final_yi', 'final_ji', 'final_state'].flatMap((f) => [
              old[`after_${f}`],
              now[f],
            ]),
            reason,
            bucket,
            subjects,
          ].join('\t'),
        )
      }
      // 5.2 — 開倉庫出貨財 on real data (FR-07), checked against the Golden columns.
      const k = day.headings[KAI]! as (typeof day.headings)[string] & {
        propagatedFrom?: string
        propagationBlocked?: string
      }
      const kPre = day.prePropagationHeadings
      expect(day.yiEvidence[KAI]!.yi, date).toBe(g.kai_yi === 'true')
      kai.yiTrue += Number(g.kai_yi === 'true')
      if (g.甲日 === 'present') {
        kai.jiaDays++
        if (g.kai_zhuan_ji_kept === 'true') {
          expect(k, date).toMatchObject({ ji: true, protectedJi: true })
          kai.jiaZhuanJiKept++
        } else {
          expect(g.puzhu28, date).toBe('present')
          expect(k.ji, date).toBe(false)
          kai.jiaPuzhu28NotJi.push(`${date} ${month}${pillar}`)
        }
      }
      const fired = ['開市', '立券交易'].filter((h) => kPre[h]!.state === 'neither_recorded')
      // requireAll: lifted only when both from-headings are 相抵 and the 忌 is not protected.
      if (k.propagatedFrom) expect(fired, date).toEqual(['開市', '立券交易'])
      add(
        kai.propagation,
        fired.length === 2
          ? `both ${kPre[KAI]!.state}${k.propagationBlocked ? ' blocked' : ''}${k.propagatedFrom ? ' lifted' : ''}`
          : fired.length
            ? `one-sided ${fired[0]} ${kPre[KAI]!.state}`
            : 'none',
      )
      const raw = day.rawJiHeadings[KAI]!.ji
      if (k.ji && !k.protectedJi && PUZHU06.some((x) => g[x] === 'present'))
        add(kai.puzhu06Candidates, k.state)
      if (g.月煞 === 'present') {
        expect(raw, `${date} 月虛 忌開倉庫`).toBe(true)
        add(kai.yueSha, `${k.state}${g.puzhu28 === 'present' ? ' puzhu28' : ''}`)
        if (!k.ji) expect(g.puzhu28, `${date} 月煞 lifted`).toBe('present')
      }
      if (g.月厭 === 'present') {
        add(kai.yueYan, `raw ${raw} ${k.state}`)
        if (!raw && !DE.some((x) => g[x] === 'present'))
          kai.yueYanLiftedWithoutDe.push(`${date} ${month}${pillar}`)
      }
    }
    expect(counts.dates).toBe(1095)
    expect(counts.rows).toBe(31755)
    expect(counts.changedOtherHeadings).toBe(0)
    expect(counts.deferredAfter).toBe(0)
    expect(undeterminedElsewhere.after).toBe(undeterminedElsewhere.before)
    expect(xiu.sourceDependent).toEqual(['2025-10-08'])
    expect(kai.jiaZhuanJiKept).toBe(106)
    expect(kai.jiaPuzhu28NotJi).toHaveLength(4)
    expect(kai.yueYanLiftedWithoutDe).toEqual([])
    const summary = {
      scope: 'MEASURED_AUDIT_ONLY_NOT_GOLDEN',
      before: P4C,
      reasonGolden: GOLDEN,
      counts,
      xiuCangKu: xiu,
      undeterminedOtherHeadings: undeterminedElsewhere,
      kaiCangKu: kai,
      limits: [
        'Reasons come from the frozen P5 Golden; the after-state is a measurement, not an oracle.',
        'Month Jian uses the calendar-day convention (P4-C 5.6).',
        '母倉 is OWNER_ADOPTED_SOURCE_DEPENDENT within 2025-2027; outside it 修倉庫 can stay unknown.',
        '月厭 lifts come from the P4-B 月厭 clause (德神 present on every lifted date); not re-derived here.',
        'puzhu:06 is not modeled in P4-B (all 8 headings it names); 開倉庫 candidates are counted, not resolved (SPEC_GAP, separate task).',
      ],
    }
    const outputs: [string, string][] = [
      [TSV, out.join('\n') + '\n'],
      [SUMMARY, JSON.stringify(summary, null, 2) + '\n'],
    ]
    for (const [path, content] of outputs)
      if (process.env.P5_SWEEP_WRITE) writeFileSync(path, content)
      else {
        expect(existsSync(path), `${path}: run with P5_SWEEP_WRITE=1`).toBe(true)
        const committed = readFileSync(path, 'utf8')
        if (sha256(committed) !== sha256(content)) {
          const was = committed.split('\n')
          const at = content.split('\n').findIndex((line, i) => line !== was[i])
          expect(content.split('\n')[at], `${path} line ${at + 1}`).toBe(was[at])
        }
      }
  }, 300_000)
})
