import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import a04b from '../almanac-data/golden-p4-day-composition.json'
import puzhuEnd from '../almanac-data/golden-p4-puzhu-end-v1.json'
import remainingJi from '../almanac-data/golden-p4-remaining-ji-v8.json'
import youwei from '../almanac-data/golden-p4-youwei-scopes-v2.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { resolveP4Day } from './p4DayComposition'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { assembleP4YiDay } from './p4YiDayCore'
import { getP4MuCangSoil } from './p4YiOperands'

// P4-C 5.7 composition gate: frozen A04b/P4-B hand-derived Goldens on the new 宜 path, and the
// full 1,095-day diff against the frozen baseline. Every difference needs a Golden reason.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const P4C = 'docs/audits/sources/p4-vol10/yi-propagation-v1/'
const newDay = (month: string, pillar: string) => {
  const evidence = resolveP4YiDay(month, pillar).yiEvidence
  return assembleP4YiDay(
    month,
    pillar,
    Object.fromEntries(Object.entries(evidence).map(([h, e]) => [h, e.yi])),
  )
}
/** A hand-derived 'undetermined' may resolve only where the new 宜 evidence is known and the
 * historical lookup was not; anything else is an unexplained difference. */
function expectDayState(month: string, pillar: string, heading: string, golden: string) {
  const state = newDay(month, pillar).headings[heading]?.state
  if (state === golden) return 'same'
  expect(golden, `${month}${pillar} ${heading}`).toBe('undetermined')
  expect(resolveP4Day(month, pillar).prePropagationHeadings[heading]!.yi).toBeUndefined()
  expect(resolveP4YiDay(month, pillar).yiEvidence[heading]!.yi).not.toBeUndefined()
  return 'RECORDED_YI_RESOLVED'
}

describe('P4-C 5.7 frozen A04b / P4-B Goldens on the new 宜 path', () => {
  it.each(a04b.cases)('A04b $monthJian月$pillar', (c) => {
    for (const [h, state] of Object.entries(c.headings))
      expectDayState(c.monthJian, c.pillar, h, state)
  })
  it.each(youwei.cases.filter((c) => c.day))('又為 $monthJian月$pillar', (c) => {
    for (const [h, state] of Object.entries(c.day!)) expectDayState(c.monthJian, c.pillar, h, state)
  })
  it.each(puzhuEnd.cases)('puzhu-end $month月$pillar', (c) => {
    const r = resolveP4YiDay(c.month, c.pillar)
    expect(r.puzhuEnd.pillarRuleIds).toContain(c.rule)
    expect(r.puzhuEnd.restoredSubjects).toEqual(c.restoredSubjects)
    for (const [h, yi] of Object.entries(c.yi)) expect(r.headings[h]!.yi, h).toBe(yi)
    for (const [h, ji] of Object.entries(c.ji)) expect(r.headings[h]!.ji, h).toBe(ji)
    // 月厭 mask leaves 祭祀/掃舍宇 alone: the recorded 宜 is this day's (new) evidence.
    for (const h of ['祭祀', '掃舍宇'])
      expect(r.prePropagationHeadings[h]!.yi, h).toBe(r.yiEvidence[h]!.yi)
  })
  it('puzhu-end 四廢 case', () => {
    const c = puzhuEnd.fourWasteCase
    const r = resolveP4YiDay(c.month, c.pillar)
    expect(r.puzhuEnd.restoredSubjects).toEqual(c.restoredSubjects)
    for (const [h, ji] of Object.entries(c.ji)) expect(r.headings[h]!.ji, h).toBe(ji)
  })
  it.each(remainingJi.dayCases)('puzhu:28 $month月$pillar', (c) => {
    const r = resolveP4YiDay(c.month, c.pillar)
    expect(r.dayRule ?? null).toBe(c.rule)
    if (c.rule)
      for (const [h, d] of Object.entries(r.headings)) {
        expect(d, h).toMatchObject({ ji: false, protectedJi: false })
        expect(r.unresolvedJi[h], h).toEqual([])
      }
    for (const [h, ji] of Object.entries((c as { ji?: Record<string, boolean> }).ji ?? {}))
      expect(r.headings[h]!.ji, h).toBe(ji)
  })
})

describe('P4-C 5.7 dated diff against the frozen baseline', () => {
  it('explains every changed row on 1,095 dates x 29 headings', () => {
    const table = (path: string) => {
      const [head, ...lines] = readFileSync(path, 'utf8').trimEnd().split('\n')
      const keys = head!.split('\t')
      return new Map(
        lines.map((line) => {
          const row = Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v]))
          return [`${row.date}:${row.heading}`, row]
        }),
      )
    }
    const baseline = table('docs/audits/sources/p4-vol10/yi-baseline-v1/baseline.tsv')
    const evidence = table(P4C + 'evidence.tsv')
    const golden = JSON.parse(readFileSync(P4C + 'expected.json', 'utf8')) as {
      sections: { stopJiReveal: { date: string; heading: string; reveal: boolean }[] }
    }
    const stop = new Set(golden.sections.stopJiReveal.map((x) => `${x.date}:${x.heading}`))
    const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
    const tally: Record<string, number> = {}
    const undetermined = { before: 0, after: 0 }
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const day = resolveP4YiDay(
        B[a.selectionContext.MONTH_JIAN_BRANCH!]!,
        S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!,
        {
          lunarDay: a.selectionContext.LUNAR_DAY!,
          phase: getP4MoonPhase(date),
          soil: getP4SoilPresence(date),
          yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
        },
      )
      for (const [heading, final] of Object.entries(day.headings) as [
        string,
        (typeof day.headings)[string] & { propagatedFrom?: string; propagationBlocked?: string },
      ][]) {
        const id = `${date}:${heading}`
        const base = baseline.get(id)!
        const pre = day.prePropagationHeadings[heading]!
        const now = [
          pre.state,
          final.state,
          yi(pre.yi),
          yi(final.yi),
          pre.ji,
          pre.protectedJi,
          final.ji,
          final.protectedJi,
          final.propagatedFrom ?? '',
          final.propagationBlocked ?? '',
        ].join('|')
        const was = [
          base.pre_state,
          base.final_state,
          base.pre_yi,
          base.final_yi,
          base.pre_ji,
          base.pre_protected_ji,
          base.final_ji,
          base.final_protected_ji,
          base.propagated_from,
          base.propagation_blocked,
        ].join('|')
        undetermined.before += Number(base.final_state === 'undetermined')
        undetermined.after += Number(final.state === 'undetermined')
        if (now === was) continue
        const resolved =
          base.pre_yi === 'unknown' && evidence.get(id)!.expected_recorded_yi !== 'null'
        // A suppressed (recorded false) heading still reads the pre-suppression evidence.
        const evidenceResolved =
          base.raw_yi === 'unknown' && evidence.get(id)!.expected_evidence_yi !== 'null'
        const reason = stop.has(id)
          ? 'STOP_JI_REVEAL'
          : resolved
            ? 'RECORDED_YI_RESOLVED'
            : evidenceResolved
              ? 'EVIDENCE_YI_RESOLVED'
              : 'UNEXPLAINED'
        expect(reason, `${id} ${was} -> ${now}`).not.toBe('UNEXPLAINED')
        // Recorded 宜 only goes from unknown to the Golden value; known values never move.
        expect(yi(pre.yi), id).toBe(
          evidence.get(id)!.expected_recorded_yi === 'null'
            ? 'unknown'
            : evidence.get(id)!.expected_recorded_yi,
        )
        const key = `${reason} ${base.final_state}>${final.state}`
        tally[key] = (tally[key] ?? 0) + 1
      }
    }
    expect(undetermined.after).toBeLessThan(undetermined.before)
    if (process.env.P4C_57_REPORT)
      writeFileSync(
        process.env.P4C_57_REPORT,
        JSON.stringify({ undeterminedFinal: undetermined, transitions: tally }, null, 1) + '\n',
      )
  }, 180000)
})
