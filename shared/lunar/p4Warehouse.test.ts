import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p5-warehouse-v1.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { applyP4Propagation } from './p4DayComposition'
import {
  P5_WAREHOUSE_AUTHORITY,
  P5_WAREHOUSE_GODS,
  resolveP4Warehouse,
  resolveP4WarehouseDay,
} from './p4Warehouse'
import { resolveP4YiDay } from './p4YiDayComposition'
import { composeP4YiEvidence } from './p4YiEvidence'
import { getP4MuCangSoil } from './p4YiOperands'

// P5 task 4.2: every expected value comes from the Golden frozen in fc5c1fb (task 3.0).
const DIR = 'docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const KAI = ['月恩', '四相', '時德', '滿日', '五富']
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const tsv = (name: string) => {
  const [head, ...lines] = readFileSync(DIR + name, 'utf8')
    .replace(/\n$/, '')
    .split('\n')
  const keys = head!.split('\t')
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [keys[i]!, v])))
}
type Row = Record<string, string>
const presenceOf = (row: Row) =>
  Object.fromEntries(P5_WAREHOUSE_GODS.map((g) => [g, row[g] === 'present']))
const basesD = (r: ReturnType<typeof resolveP4Warehouse>) =>
  r.bases.map((b) => `${b.base}:${b.d}`).join('|') || '-'
const nul = (v: boolean | null | undefined) => (v === null ? undefined : v)

type Fixture = {
  id: string
  present: string[]
  unknown: string[]
  expected:
    | { error: string; pair: string }
    | {
        xiuCangKu: string
        kaiCangKuYi: boolean | null
        bases: Record<
          string,
          { base: boolean | null; r10: boolean | null; r11: boolean | null; d: string }
        >
      }
}
const golden = JSON.parse(readFileSync(DIR + 'expected.json', 'utf8')) as { fixtures: Fixture[] }

describe('P5 warehouse predicate against the frozen Golden', () => {
  it('pins the authority it reads and the Golden block counts', () => {
    expect(sha256(readFileSync(P5_WAREHOUSE_AUTHORITY.path))).toBe(P5_WAREHOUSE_AUTHORITY.sha256)
    expect(P5_WAREHOUSE_AUTHORITY.sha256).toBe(index.authority.sha256)
    expect(golden.fixtures).toHaveLength(167)
  })

  it('matches all 167 fixtures, 開倉庫出貨財 through the unchanged P4-C path', () => {
    for (const f of golden.fixtures) {
      const p = Object.fromEntries(
        P5_WAREHOUSE_GODS.map((g) => [
          g,
          f.unknown.includes(g) ? undefined : f.present.includes(g),
        ]),
      )
      const e = f.expected
      if ('error' in e) {
        expect(() => resolveP4Warehouse(p), f.id).toThrow(
          expect.objectContaining({ code: e.error, pair: e.pair }),
        )
        continue
      }
      const r = resolveP4Warehouse(p)
      expect(r.heading, f.id).toBe(e.xiuCangKu)
      expect(
        Object.fromEntries(
          r.bases.map((b) => [b.base, { base: b.present, r10: b.r10, r11: b.r11, d: b.d }]),
        ),
        f.id,
      ).toEqual(
        Object.fromEntries(
          Object.entries(e.bases).map(([k, v]) => [
            k,
            { ...v, base: nul(v.base), r10: nul(v.r10), r11: nul(v.r11) },
          ]),
        ),
      )
      const ops = KAI.map((han) => ({
        traceId: `fixture:${han}`,
        han,
        presence: p[han] === undefined ? 'unknown' : p[han] ? 'present' : 'absent',
      }))
      expect(composeP4YiEvidence('開倉庫出貨財', ops).yi, f.id).toBe(nul(e.kaiCangKuYi))
    }
  })

  it('lifts 開倉庫出貨財 only when 開市 and 立券交易 are both 相抵 and 忌 is not 專忌 (puzhu:22)', () => {
    // No 2025-2027 date fires this lift, so the frozen 16-row table is checked on the propagation
    // step itself. puzhu:28 acts after propagation and is checked on the dated block.
    const table = JSON.parse(readFileSync(DIR + 'expected.json', 'utf8')).propagation as {
      開市_notJi: boolean
      立券交易_notJi: boolean
      甲日: boolean
      expected: { propagatedLift: boolean }
    }[]
    expect(table).toHaveLength(16)
    const state = (lifted: boolean) => ({
      state: lifted ? ('neither_recorded' as const) : ('only_ji' as const),
      ji: !lifted,
      protectedJi: false,
      yi: false,
    })
    for (const r of table) {
      const out = applyP4Propagation({
        開市: state(r.開市_notJi),
        立券交易: state(r.立券交易_notJi),
        開倉庫出貨財: { state: 'only_ji', ji: true, protectedJi: r.甲日, yi: false },
      })['開倉庫出貨財']!
      const id = JSON.stringify(r)
      expect(Boolean(out.propagatedFrom), id).toBe(r.expected.propagatedLift)
      expect(out.ji, id).toBe(!r.expected.propagatedLift)
    }
  })

  it('matches the 1,440 Month Jian x pillar x soil contexts', () => {
    const rows = tsv('context.tsv')
    expect(rows).toHaveLength(1440)
    for (const row of rows) {
      const r = resolveP4Warehouse(presenceOf(row))
      const id = `${row.month_jian}${row.pillar} soil ${row.soil}`
      expect(basesD(r), id).toBe(row.bases_d)
      expect(r.heading, id).toBe(row.xiu_cang_ku)
    }
  })

  it('reads every operand from P4-C on 720 contexts; 母倉 without a date stays unknown', () => {
    const rows = tsv('context.tsv').filter((r) => r.soil === 'absent')
    expect(rows).toHaveLength(720)
    for (const row of rows) {
      const id = row.month_jian! + row.pillar!
      const day = resolveP4WarehouseDay(row.month_jian!, row.pillar!)
      const w = day.warehouse
      for (const g of P5_WAREHOUSE_GODS)
        expect(w.presence[g], `${id} ${g}`).toBe(g === '母倉' ? undefined : row[g] === 'present')
      expect(w.unknownOperands, id).toEqual(['母倉'])
      expect(w.heading, id).toBe(resolveP4Warehouse(w.presence).heading)
    }
  })

  it(
    'resolves 修倉庫 on the 1,095 dates with no other heading changed',
    { timeout: 180_000 },
    () => {
      const rows = new Map(tsv('dated.tsv').map((r) => [r.date!, r]))
      expect(rows.size).toBe(1095)
      const sourceDependent: string[] = []
      for (const { date } of dates.days) {
        const row = rows.get(date)!
        const a = getAlmanac(date as never)
        const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
        const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
        expect(month + pillar, date).toBe(row.month_jian! + row.pillar!)
        const operands = {
          lunarDay: a.selectionContext.LUNAR_DAY!,
          phase: getP4MoonPhase(date),
          soil: getP4SoilPresence(date),
          yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
        }
        const day = resolveP4WarehouseDay(month, pillar, operands)
        const p4c = resolveP4YiDay(month, pillar, operands)
        const w = day.warehouse
        for (const g of P5_WAREHOUSE_GODS)
          expect(w.presence[g], `${date} ${g}`).toBe(row[g] === 'present')
        expect(basesD(w), date).toBe(row.bases_d)
        expect(w.heading, date).toBe(row.xiu_cang_ku)
        const ev = day.yiEvidence['修倉庫']!
        expect(ev, date).not.toHaveProperty('deferred')
        expect(ev.yi, date).toBe(
          { yi: true, no_yi: false, source_dependent: undefined }[w.heading as 'yi'],
        )
        if (w.heading === 'source_dependent') {
          sourceDependent.push(date)
          expect(day.headings['修倉庫']).toMatchObject({
            state: 'undetermined',
            warehouse: 'SOURCE_DEPENDENT',
          })
          // the split comes from 月恩, traced only under 開倉庫出貨財
          const mucang = w.bases.find((x) => x.base === '母倉')!
          expect(mucang.partners.filter((x) => x.presence)).toEqual([
            { han: '月恩', presence: true, r10: true, r11: false },
          ])
          expect(w.traceIds['月恩']).toBe('p4legacy:月恩')
        }
        expect(day.yiEvidence['開倉庫出貨財']!.yi, date).toBe(row.kai_yi === 'true')
        if (row.kai_zhuan_ji_kept === 'true')
          expect(day.headings['開倉庫出貨財'], date).toMatchObject({ ji: true, protectedJi: true })
        // 0 regression: no propagation line reads from 修倉庫, so every day-level field other than
        // the 修倉庫 entries equals P4-C's (completeness, unresolvedJi, scopes included).
        const drop = (v: unknown) =>
          v && typeof v === 'object' && !Array.isArray(v) && '修倉庫' in v
            ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== '修倉庫'))
            : v
        const { version: _v, warehouse: _w, ...p5 } = day
        const { version: _u, ...before } = p4c
        expect(Object.keys(p5).sort(), date).toEqual(Object.keys(before).sort())
        for (const [k, v] of Object.entries(p5))
          expect(drop(v), `${date} ${k}`).toEqual(drop(before[k as keyof typeof before]))
      }
      expect(sourceDependent).toEqual(['2025-10-08'])
    },
  )
})
