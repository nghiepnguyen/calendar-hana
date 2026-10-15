import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import seasonGolden from '../almanac-data/golden-p4-season-days.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { resolveP4FullDay } from './p4FullDayComposition'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { composeP4YiEvidence } from './p4YiEvidence'
import { getP4MuCangSoil } from './p4YiOperands'

// P4-C 5.5: 王日 and the other existing 宜 operands stay as before; 修倉庫 stays P5 deferred
// whatever 母倉 or any other listed operand says. Expected come from frozen Goldens/sources.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const SEASON = '冬冬春春春夏夏夏秋秋秋冬'
const composition = JSON.parse(
  readFileSync('docs/audits/sources/p4-vol10/yi-composition-expected-v1/expected.json', 'utf8'),
) as {
  sections: Record<
    string,
    { id: string; input: Record<string, any>; expected: Record<string, any> }[]
  >
}
const pillars = Array.from({ length: 60 }, (_, i) => S[i % 10]! + B[i % 12]!)
const contexts = [...B].flatMap((month) => pillars.map((pillar) => [month, pillar] as const))
type Final = { state: string; ji: boolean; protectedJi: boolean; yi?: boolean }
const record = (d: Final) => ({ state: d.state, ji: d.ji, protectedJi: d.protectedJi, yi: d.yi })

describe('P4-C 5.5 frozen 3.4 warehouse deferral (isolated evidence)', () => {
  const deferredScope = composition.sections.headingScope!.filter((f) => f.expected.deferred)
  it('covers 11 gods x 3 states for 修倉庫 and the 18 warehouse vectors', () => {
    expect(deferredScope).toHaveLength(33)
    expect(composition.sections.warehouse).toHaveLength(18)
  })
  it.each(deferredScope.map((f) => [f.id, f] as const))('%s', (_id, fixture) => {
    const result = composeP4YiEvidence(fixture.input.heading, [fixture.input.operand])
    expect(result.yi).toBeUndefined()
    expect(result.deferred).toBe('P5')
    // Only 母倉 carries a 修倉庫 (P5 co-presence) source reference; others are not listed.
    expect(result.trace.length > 0).toBe(fixture.expected.sourceRefs.length > 0)
  })
  it.each(composition.sections.warehouse!.map((f) => [f.id, f] as const))('%s', (_id, fixture) => {
    const result = composeP4YiEvidence(fixture.input.heading, fixture.input.candidateOperands)
    expect({
      yi: result.yi ?? null,
      status: result.deferred === 'P5' ? 'P5_DEFERRED' : result.deferred,
      trace: result.trace,
      unresolvedTraceIds: result.unresolvedTraceIds,
    }).toEqual({
      yi: fixture.expected.yi,
      status: fixture.expected.status,
      trace: fixture.expected.trace,
      unresolvedTraceIds: fixture.expected.unresolvedTraceIds,
    })
  })
})

describe('P4-C 5.5 王日 from 卷05 on 720 structural contexts', () => {
  const vol05 = readFileSync('docs/audits/sources/p4-vol10/vol05.raw.txt', 'utf8')
  const text = '王日者春寅夏巳秋申冬亥'
  it('reads the locked source slice', () => {
    expect([...vol05].slice(6824, 6824 + text.length).join('')).toBe(text)
    expect(seasonGolden.cases[0]).toEqual({ monthJian: '寅', dayBranch: '寅', present: ['王日'] })
  })
  const wangBranch = (month: string) => text[text.indexOf(SEASON[B.indexOf(month)]!) + 1]!
  it('keeps 王日 presence and its 宴會/行幸遣使 contribution', () => {
    for (const [month, pillar] of contexts) {
      const day = resolveP4YiDay(month, pillar)
      const present = pillar[1] === wangBranch(month)
      for (const heading of ['宴會', '行幸遣使']) {
        const evidence = day.yiEvidence[heading]!
        expect(evidence.trace, month + pillar + heading).toContainEqual(
          expect.objectContaining({
            traceId: 'p4legacy:王日',
            presence: present ? 'present' : 'absent',
          }),
        )
        if (present) expect(evidence.yi, month + pillar + heading).toBe(true)
      }
    }
  }, 60000)
  it('leaves 修倉庫 and every heading record of the historical resolver for 修倉庫 unchanged', () => {
    for (const [month, pillar] of contexts) {
      const day = resolveP4YiDay(month, pillar)
      const old = resolveP4FullDay(month, pillar)
      expect(record(day.prePropagationHeadings['修倉庫']!), month + pillar).toEqual(
        record(old.prePropagationHeadings['修倉庫']!),
      )
      expect(record(day.headings['修倉庫']!), month + pillar).toEqual(
        record(old.headings['修倉庫']!),
      )
      expect(day.yiEvidence['修倉庫']).toMatchObject({
        yi: undefined,
        deferred: 'P5',
        p4cTraceIds: ['p4yi:mu-cang'],
        unresolvedP4cTraceIds: ['p4yi:mu-cang'],
        headingSourceReferences: [{ traceId: 'p4yi:mu-cang', sourceRefs: [2] }],
      })
    }
  }, 60000)
})

describe('P4-C 5.5 dated sweep: existing operands and 修倉庫 against the frozen baseline', () => {
  it('matches baseline legacy presence and 修倉庫 records on 1,095 dates', () => {
    const [head, ...lines] = readFileSync(
      'docs/audits/sources/p4-vol10/yi-baseline-v1/baseline.tsv',
      'utf8',
    )
      .trimEnd()
      .split('\n')
    const keys = head!.split('\t')
    const baseline = new Map(
      lines.map((line) => {
        const row = Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v]))
        return [`${row.date}:${row.heading}`, row]
      }),
    )
    let warehouseWithMotherPresent = 0
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
      for (const [heading, evidence] of Object.entries(day.yiEvidence)) {
        const row = baseline.get(`${date}:${heading}`)!
        const legacyPresent = evidence.trace
          .filter((o) => String(o.traceId).startsWith('p4legacy:') && o.presence === 'present')
          .map((o) => o.han as string)
        expect(legacyPresent.sort(), `${date}:${heading}`).toEqual(
          // 修倉庫 lists 月德 twice; compare label sets.
          row.known_present_yi_gods
            ? [...new Set(row.known_present_yi_gods.split('+'))].sort()
            : [],
        )
      }
      const row = baseline.get(`${date}:修倉庫`)!
      const pre = day.prePropagationHeadings['修倉庫']!
      const final = day.headings['修倉庫']!
      const bool = (v: string) => (v === 'unknown' ? undefined : v === 'true')
      expect(record(pre), date).toEqual({
        state: row.pre_state,
        ji: row.pre_ji === 'true',
        protectedJi: row.pre_protected_ji === 'true',
        yi: bool(row.pre_yi!),
      })
      expect(record(final), date).toEqual({
        state: row.final_state,
        ji: row.final_ji === 'true',
        protectedJi: row.final_protected_ji === 'true',
        yi: bool(row.final_yi!),
      })
      const mother = day.yiOperands.find((o) => o.han === '母倉')!
      expect(day.yiEvidence['修倉庫']).toMatchObject({ yi: undefined, deferred: 'P5' })
      expect(day.yiEvidence['修倉庫']!.trace).toContainEqual(mother)
      warehouseWithMotherPresent += Number(mother.presence === 'present')
    }
    expect(warehouseWithMotherPresent).toBeGreaterThan(0)
  }, 180000)
})
