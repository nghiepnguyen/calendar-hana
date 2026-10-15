import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { composeP4YiEvidence } from './p4YiEvidence'
import { getP4MuCangSoil } from './p4YiOperands'

// P4-C 5.4: raw/protected 忌, puzhu:28 and propagation against Golden derived before these
// assertions (yi-propagation-v1 lock) and the frozen 3.4 composition sections.
const DIR = 'docs/audits/sources/p4-vol10/yi-propagation-v1/'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const read = (path: string) => readFileSync(path, 'utf8')
const lock = JSON.parse(read(DIR + 'lock.json')) as {
  files: { path: string; sha256: string }[]
  inputs: Record<string, { path: string; sha256: string }>
}
type Expected = { ji: boolean; protectedJi: boolean; state?: string }
const golden = JSON.parse(read(DIR + 'expected.json')) as {
  counts: Record<string, number>
  sections: {
    propagationBound: {
      candidateTargets: { date: string; heading: string }[]
      revealCandidates: string[]
    }
    stopJiReveal: { date: string; heading: string; expected: Expected }[]
    override: {
      contexts: {
        monthJian: string
        pillar: string
        applies: boolean
        rawProtectedBaiji: string[]
      }[]
      dated: {
        date: string
        heading: string
        applies: boolean
        rawProtectedBaiji: boolean
        expected: Expected & { propagatedFrom?: null; propagationBlocked?: null }
      }[]
    }
  }
}
const composition = JSON.parse(read(lock.inputs.composition!.path)) as {
  sections: Record<
    string,
    { id: string; input: Record<string, any>; expected: Record<string, any> }[]
  >
}
const tsv = (path: string) => {
  const [head, ...lines] = read(path).trimEnd().split('\n')
  const keys = head!.split('\t')
  return lines.map((line) => Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v])))
}
const decode = (v: string) => (v === 'null' ? undefined : v === 'true')
const key = (date: string, heading: string) => `${date}:${heading}`

describe('P4-C 5.4 Golden integrity', () => {
  it('uses the locked Golden bytes and unchanged frozen inputs', () => {
    for (const file of lock.files) expect(sha(file.path), file.path).toBe(file.sha256)
    for (const input of Object.values(lock.inputs))
      expect(sha(input.path), input.path).toBe(input.sha256)
  })
})

describe('P4-C 5.4 dated sweep: evidence, raw/protected 忌 and propagation bound', () => {
  it('matches Golden on 1,095 dates x 29 headings', () => {
    const baseline = new Map(
      tsv(lock.inputs.baseline!.path).map((row) => [key(row.date!, row.heading!), row]),
    )
    const evidence = tsv(DIR + 'evidence.tsv')
    const candidates = new Set(
      golden.sections.propagationBound.candidateTargets.map((c) => key(c.date, c.heading)),
    )
    const reveal = new Set(golden.sections.propagationBound.revealCandidates)
    const stop = new Map(golden.sections.stopJiReveal.map((x) => [key(x.date, x.heading), x]))
    const override = new Map(golden.sections.override.dated.map((x) => [key(x.date, x.heading), x]))
    const observed = { propagationChanged: [] as string[], jiChanged: [] as string[] }
    const days = new Map<string, ReturnType<typeof resolveP4YiDay> & { month: string }>()
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      days.set(date, {
        month,
        ...resolveP4YiDay(month, pillar, {
          lunarDay: a.selectionContext.LUNAR_DAY!,
          phase: getP4MoonPhase(date),
          soil: getP4SoilPresence(date),
          yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
        }),
      })
    }
    expect(evidence).toHaveLength(31755)
    for (const row of evidence) {
      const id = key(row.date!, row.heading!)
      const day = days.get(row.date!)!
      const base = baseline.get(id)!
      const pre = day.prePropagationHeadings[row.heading!]!
      const final = day.headings[row.heading!]! as typeof pre & {
        propagatedFrom?: string
        propagationBlocked?: string
      }
      const ev = day.yiEvidence[row.heading!]!
      expect(day.month, id).toBe(row.month_jian)
      expect(ev.yi, id).toBe(decode(row.expected_evidence_yi!))
      expect(ev.unresolvedP4cTraceIds, id).toEqual(
        row.expected_unresolved_p4c ? row.expected_unresolved_p4c.split('+') : [],
      )
      expect(pre.yi, id).toBe(decode(row.expected_recorded_yi!))
      const propagation = [final.propagatedFrom ?? '', final.propagationBlocked ?? '']
      if (propagation.join() !== [base.propagated_from, base.propagation_blocked].join()) {
        observed.propagationChanged.push(id)
        expect(candidates.has(id), `${id} propagation change outside Golden bound`).toBe(true)
      }
      const ji = [pre.ji, pre.protectedJi]
      if (ji.join() !== [base.pre_ji === 'true', base.pre_protected_ji === 'true'].join()) {
        observed.jiChanged.push(id)
        expect(reveal.has(id), `${id} raw/protected 忌 change outside reveal bound`).toBe(true)
      }
      const stopCase = stop.get(id)
      if (stopCase)
        expect({ ji: pre.ji, protectedJi: pre.protectedJi, state: pre.state }, id).toEqual(
          stopCase.expected,
        )
      const o = override.get(id)
      if (o?.applies) {
        expect(day.dayRule, id).toBe('puzhu:28')
        expect(
          {
            ji: pre.ji,
            protectedJi: pre.protectedJi,
            state: pre.state,
            propagatedFrom: final.propagatedFrom ?? null,
            propagationBlocked: final.propagationBlocked ?? null,
          },
          id,
        ).toEqual(o.expected)
        if (o.rawProtectedBaiji)
          expect(day.rawJiHeadings?.[row.heading!], id).toMatchObject({
            ji: true,
            protectedJi: true,
          })
      } else if (o) {
        expect(day.dayRule, id).toBeUndefined()
        expect({ ji: pre.ji, protectedJi: pre.protectedJi }, id).toEqual(o.expected)
      }
    }
    // Every Golden stop-忌 reveal is observed; nothing else changed raw/protected 忌.
    expect(observed.jiChanged.sort()).toEqual(
      golden.sections.stopJiReveal
        .filter((x) => x.expected.ji && reveal.has(key(x.date, x.heading)))
        .map((x) => key(x.date, x.heading))
        .sort(),
    )
    if (process.env.P4C_54_REPORT)
      writeFileSync(process.env.P4C_54_REPORT, JSON.stringify(observed, null, 1) + '\n')
  }, 180000)
})

describe('P4-C 5.4 puzhu:28 on 720 structural contexts (frozen 3.4 mask)', () => {
  const contexts = new Map(
    golden.sections.override.contexts.map((c) => [c.monthJian + c.pillar, c]),
  )
  it.each(composition.sections.dayOverride!.map((f) => [f.id, f] as const))(
    '%s',
    (_id, fixture) => {
      const { monthJian, validPillar } = fixture.input
      const day = resolveP4YiDay(monthJian, validPillar)
      expect(day.dayRule === 'puzhu:28').toBe(fixture.expected.applies)
      for (const heading of Object.keys(day.prePropagationHeadings)) {
        const raw = day.rawJiHeadings?.[heading]
        const pre = day.prePropagationHeadings[heading]!
        const final = day.headings[heading]! as typeof pre & {
          propagatedFrom?: string
          propagationBlocked?: string
        }
        if (fixture.expected.applies) {
          expect([pre.ji, pre.protectedJi, final.propagationBlocked, final.propagatedFrom]).toEqual(
            [false, false, undefined, undefined],
          )
        } else
          expect({ ji: raw?.ji, protectedJi: raw?.protectedJi }).toEqual({
            ji: pre.ji,
            protectedJi: pre.protectedJi,
          })
      }
      const ctx = contexts.get(monthJian + validPillar)
      for (const heading of ctx?.rawProtectedBaiji ?? [])
        expect(day.rawJiHeadings?.[heading], heading).toMatchObject({ ji: true, protectedJi: true })
      if (ctx && !ctx.applies)
        for (const heading of ctx.rawProtectedBaiji)
          expect(day.prePropagationHeadings[heading], heading).toMatchObject({
            ji: true,
            protectedJi: true,
          })
    },
  )
  it('keeps 宜 evidence and the 母倉 unresolved trace through the override', () => {
    const day = resolveP4YiDay('未', '甲午')
    expect(day.dayRule).toBe('puzhu:28')
    expect(day.yiEvidence['納財']!.unresolvedP4cTraceIds).toEqual(['p4yi:mu-cang'])
    expect(resolveP4YiDay('未', '甲子').dayRule).toBeUndefined()
  })
})

describe('P4-C 5.4 frozen 3.4 source-context controls on real contexts', () => {
  it.each(composition.sections.sourceContextControls!.map((f) => [f.id, f] as const))(
    '%s',
    (id, fixture) => {
      const han = id.split(':')[1]!
      const { monthJian, validPillar, heading } = fixture.input
      const day = resolveP4YiDay(monthJian, validPillar)
      const operand = day.yiOperands.find((o) => o.han === han)!
      expect(operand.presence).toBe(fixture.expected.presence)
      const pre = day.prePropagationHeadings[heading]!
      expect({ ji: pre.ji, protectedJi: pre.protectedJi }).toEqual({
        ji: fixture.expected.effectiveJi,
        protectedJi: true,
      })
      expect(day.rawJiHeadings?.[heading]).toMatchObject({
        ji: fixture.expected.rawJi,
        protectedJi: true,
      })
      // The control fixes one source scope only. Its operand always reaches the heading's
      // evidence; on the real day another scope may still suppress recording (子月己酉: 收日 如常例).
      expect(day.yiEvidence[heading]).toMatchObject({
        yi: true,
        p4cTraceIds: expect.arrayContaining([operand.traceId]),
      })
      if (!fixture.expected.recordedYiFromThisOperand) expect(pre.yi).toBe(false)
    },
  )
})

describe('P4-C 5.4 frozen 3.4 protection projections: evidence half', () => {
  // Cancel/suppression/lift/override halves are isolated contracts with no exported seam;
  // their real-day counterparts are the dated sweep and override tests above.
  it.each(composition.sections.protection!.map((f) => [f.id, f] as const))('%s', (_id, fixture) => {
    const result = composeP4YiEvidence(fixture.input.heading, fixture.input.operands)
    expect({
      evidenceYi: result.yi ?? null,
      trace: result.trace,
      unresolvedTraceIds: result.unresolvedTraceIds,
    }).toEqual({
      evidenceYi: fixture.expected.evidenceYi,
      trace: fixture.expected.trace,
      unresolvedTraceIds: fixture.expected.unresolvedTraceIds,
    })
  })
})
