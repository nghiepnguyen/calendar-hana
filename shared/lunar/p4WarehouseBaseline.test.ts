import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

// P5 task 1 baseline: operand inventory for 修倉庫 / 開倉庫出貨財 on the P4-C sweep inputs.
// Inventory only, never expected: no R10/R11/D verdict is computed here (Golden comes in task 3).
// Ordinary runs verify committed bytes; P5_BASELINE_WRITE=1 regenerates them.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const DIR = 'docs/audits/sources/p4-vol10/p5-warehouse-baseline-v1/'
const P4C_TSV = 'docs/audits/p4-vol10-yi-operands-2025-2027.tsv'
const DIRECT = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '三合', '滿日']
const BASES = ['收日', '母倉', '六合', '五富', '天倉']
// 月恩 is a 卷十 partner only; 卷十一 修倉庫 does not list it, so it is read from 開倉庫出貨財.
const PARTNERS = ['月恩', '月德', '四相', '時德', '開日']
const GODS = [...new Set([...DIRECT, ...BASES, ...PARTNERS])]
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
const add = (tally: Record<string, number>, key: string) => (tally[key] = (tally[key] ?? 0) + 1)

function p4cRows() {
  const [head, ...lines] = readFileSync(P4C_TSV, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return lines.map((line) => Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v])))
}

describe('P5 task 1 warehouse baseline (audit-only)', () => {
  it('inventories warehouse operands on 1,095 dates', { timeout: 60_000 }, () => {
    const p4c = new Map(p4cRows().map((r) => [`${r.date}:${r.heading}`, r]))
    const columns = [
      'date',
      'month_jian',
      'pillar',
      ...GODS,
      'xiu_p4c_final_state',
      'xiu_p4c_bucket',
      'xiu_unresolved',
      'kai_yi',
      'kai_pre_state',
      'kai_final_state',
      'kai_final_ji',
      'kai_protected_ji',
      'kai_propagated_from',
      'kai_propagation_blocked',
      'kai_unresolved',
    ]
    const rows = [columns.join('\t')]
    const presence = Object.fromEntries(GODS.map((g) => [g, {} as Record<string, number>]))
    const source = Object.fromEntries(GODS.map((g) => [g, {} as Record<string, number>]))
    const deferredCombos: Record<string, number> = {}
    const kai = { states: {} as Record<string, number>, jiaDays: 0, jiaProtected: 0 }
    let deferred = 0
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const day = resolveP4YiDay(month, pillar, {
        lunarDay: a.selectionContext.LUNAR_DAY!,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      })
      const xiu = day.yiEvidence['修倉庫']!
      const kaiEv = day.yiEvidence['開倉庫出貨財']!
      type T = { traceId: string; han: string; presence: string }
      const seen = new Map<string, T>()
      for (const t of [...xiu.trace, ...kaiEv.trace] as T[]) {
        const prior = seen.get(t.han)
        if (prior) expect(prior.presence, `${date} ${t.han}`).toBe(t.presence)
        seen.set(t.han, t)
      }
      const p = (g: string) => seen.get(g)?.presence ?? 'not_traced'
      for (const g of GODS) {
        add(presence[g]!, p(g))
        add(source[g]!, seen.get(g)?.traceId.split(':')[0] ?? 'not_traced')
      }
      const xiuRow = p4c.get(`${date}:修倉庫`)!
      if (xiuRow.after_bucket === 'P5_WAREHOUSE') {
        deferred++
        const bases = BASES.filter((g) => p(g) === 'present')
        const partners = PARTNERS.filter((g) => p(g) === 'present')
        const unknown = [...BASES, ...PARTNERS].filter((g) => p(g) === 'unknown')
        add(
          deferredCombos,
          `${bases.join('+') || '-'} | ${partners.join('+') || '-'}${unknown.length ? ` | unknown:${unknown.join('+')}` : ''}`,
        )
      }
      const kaiFinal = day.headings['開倉庫出貨財']! as (typeof day.headings)[string] & {
        propagatedFrom?: string
        propagationBlocked?: string
      }
      add(kai.states, kaiFinal.state)
      if (pillar[0] === '甲') {
        kai.jiaDays++
        kai.jiaProtected += Number(kaiFinal.protectedJi && kaiFinal.ji)
      }
      rows.push(
        [
          date,
          month,
          pillar,
          ...GODS.map(p),
          xiuRow.after_final_state,
          xiuRow.after_bucket,
          (xiu.unresolvedTraceIds as string[]).join(','),
          yi(kaiEv.yi),
          day.prePropagationHeadings['開倉庫出貨財']!.state,
          kaiFinal.state,
          String(kaiFinal.ji),
          String(kaiFinal.protectedJi),
          kaiFinal.propagatedFrom ?? '',
          kaiFinal.propagationBlocked ?? '',
          (kaiEv.unresolvedTraceIds as string[]).join(','),
        ].join('\t'),
      )
    }
    const tsv = rows.join('\n') + '\n'
    const undetermined = p4cRows().filter((r) => r.after_final_state === 'undetermined')
    const otherUndetermined: Record<string, number> = {}
    for (const r of undetermined)
      if (r.after_bucket !== 'P5_WAREHOUSE')
        add(otherUndetermined, `${r.heading}:${r.after_bucket}`)
    const summary = {
      version: 'p5-warehouse-baseline-v1',
      inventoryOnly: 'No R10/R11/D verdicts; expected values come from the task 3 Golden.',
      p4cSweep: { path: P4C_TSV, sha256: sha256(readFileSync(P4C_TSV, 'utf8')) },
      dates: dates.days.length,
      baselineSha256: sha256(tsv),
      xiuCangKu: {
        deferredRows: deferred,
        deferredBasePartnerCombos: Object.fromEntries(
          Object.entries(deferredCombos).sort(([, x], [, y]) => y - x),
        ),
      },
      operandPresence: presence,
      operandTraceSource: source,
      kaiCangKu: kai,
      otherUndetermined: {
        rows: undetermined.length - deferred,
        byHeadingBucket: otherUndetermined,
        warehouseHeadings: undetermined.filter(
          (r) => r.after_bucket !== 'P5_WAREHOUSE' && /倉庫/.test(r.heading),
        ).length,
      },
    }
    const json = JSON.stringify(summary, null, 2) + '\n'
    if (process.env.P5_BASELINE_WRITE === '1') {
      writeFileSync(DIR + 'baseline.tsv', tsv)
      writeFileSync(DIR + 'summary.json', json)
    }
    expect(tsv).toBe(readFileSync(DIR + 'baseline.tsv', 'utf8'))
    expect(json).toBe(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(deferred).toBe(539)
  })
})
