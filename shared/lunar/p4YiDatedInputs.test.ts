import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import lunarAuthority from '../almanac-data/p4-lunar-day-taboo-v1.json'
import phaseAuthority from '../almanac-data/p4-lunar-phase-authority-v1.json'
import soilAuthority from '../almanac-data/p4-soil-owner-convention-v1.json'
import remaining from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'

// P4-C 5.6: lunar day / phase / soil inputs and the OWNER_ADOPTED_SOURCE_DEPENDENT status stay
// in the trace; missing or out-of-coverage inputs make only their own scope unknown.
// Expected scopes come from the frozen authority/artifact JSON, never from the resolver.
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const ADOPTED = 'OWNER_ADOPTED_SOURCE_DEPENDENT'
const read = (path: string) => readFileSync(path, 'utf8')
const basis = JSON.parse(
  read('docs/audits/sources/p4-vol10/yi-composition-expected-v1/source-basis.json'),
) as { normalization: { headingMap: Record<string, string> } }
const norm = (h: string) => basis.normalization.headingMap[h] ?? h
const lunarTokens = lunarAuthority.rules.map((r) => r.token)
const datedTokens = new Set([
  soilAuthority.inventoryToken,
  phaseAuthority.inventoryToken,
  ...lunarTokens,
])
const inventory = new Map(
  Object.entries(remaining.jiInventory as Record<string, string[]>).map(([h, tokens]) => [
    norm(h),
    tokens.filter((t) => datedTokens.has(t)),
  ]),
)
const mother = authority.entries.find((e) => e.id === 'mu-cang')!
const motherHeadings = new Set(
  mother.headingScopes
    .filter((s) => s.mode === 'DIRECT_YI' || s.mode === 'P5_DEFERRED_CO_PRESENCE')
    .map((s) => norm(s.normalized)),
)
const pillars = Array.from({ length: 60 }, (_, i) => S[i % 10]! + B[i % 12]!)
const contexts = [...B].flatMap((month) => pillars.map((pillar) => [month, pillar] as const))
type Day = ReturnType<typeof resolveP4YiDay>
const muCang = (day: Day) => day.yiOperands.find((o) => o.han === '母倉')!

/** Only the listed dated tokens of each heading may be unresolved, and only when unknown. */
function expectDatedScope(day: Day, unknownTokens: readonly string[], label: string) {
  for (const [heading, tokens] of Object.entries(day.unresolvedJi)) {
    const dated = tokens.filter((t) => datedTokens.has(t))
    const expected = day.dayRule
      ? []
      : (inventory.get(heading) ?? []).filter((t) => unknownTokens.includes(t))
    expect(dated.sort(), `${label} ${heading}`).toEqual([...expected].sort())
  }
}
function expectMotherScope(day: Day, unknown: boolean, label: string) {
  for (const [heading, evidence] of Object.entries(day.yiEvidence)) {
    const ids = evidence.unresolvedP4cTraceIds
    // Structural contexts resolve the other ten entries; only 母倉 may stay unknown.
    expect(ids, `${label} ${heading}`).toEqual(
      unknown && motherHeadings.has(heading) ? ['p4yi:mu-cang'] : [],
    )
  }
  expect(muCang(day).authorityStatus).toBe(ADOPTED)
}

describe('P4-C 5.6 missing / out-of-coverage inputs stay unknown in their own scope', () => {
  const lunarAll = { authorityId: lunarAuthority.version }
  const variants = [
    {
      name: 'no dated input',
      operands: {},
      unknownTokens: [...datedTokens],
      motherReason: 'MISSING_REQUIRED_INPUT',
      lunarDayInput: { ...lunarAll, value: null },
    },
    {
      name: 'P4-B inputs only, no 母倉 soil',
      operands: {
        lunarDay: 15,
        phase: getP4MoonPhase('2025-04-20'),
        soil: getP4SoilPresence('2025-04-20'),
      },
      unknownTokens: [],
      motherReason: 'MISSING_REQUIRED_INPUT',
      lunarDayInput: { ...lunarAll, value: 15 },
    },
    {
      name: 'outside 2025-2027 coverage',
      operands: {
        phase: getP4MoonPhase('2028-01-03'),
        soil: getP4SoilPresence('2028-01-03'),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil('2028-01-03') },
      },
      unknownTokens: [...datedTokens],
      motherReason: 'OUTSIDE_LOCAL_COVERAGE',
      lunarDayInput: { ...lunarAll, value: null },
    },
    {
      name: '母倉 provider state unknown, P4-B soil known',
      operands: {
        lunarDay: 3,
        phase: { ...getP4MoonPhase('2025-04-20'), phase: 'unknown' },
        soil: getP4SoilPresence('2025-04-20'),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil('2025-04-20') },
        yiProviderStates: { SOIL_REIGN_STATE: 'unknown' },
      },
      unknownTokens: [phaseAuthority.inventoryToken],
      motherReason: 'UNKNOWN_INPUT',
      lunarDayInput: { ...lunarAll, value: 3 },
    },
    {
      name: '母倉 soil unvalidated',
      operands: {
        lunarDay: 12,
        yiInputs: { SOIL_REIGN_STATE: { ...getP4MuCangSoil('2025-04-20'), validated: false } },
      },
      unknownTokens: [soilAuthority.inventoryToken, phaseAuthority.inventoryToken],
      motherReason: 'UNVALIDATED_SOIL_PROVENANCE',
      lunarDayInput: { ...lunarAll, value: 12 },
    },
  ]
  it.each(variants.map((v) => [v.name, v] as const))(
    '%s on 720 contexts',
    (_name, variant) => {
      for (const [month, pillar] of contexts) {
        const day = resolveP4YiDay(month, pillar, variant.operands as never)
        const label = `${month}${pillar}`
        expectDatedScope(day, variant.unknownTokens, label)
        expectMotherScope(day, true, label)
        expect(muCang(day).reason, label).toBe(variant.motherReason)
        expect(day.soilScope).toMatchObject({
          authorityId: soilAuthority.version,
          status: ADOPTED,
          evidence: (variant.operands as { soil?: unknown }).soil,
        })
        expect(day.phaseScope.evidence).toEqual((variant.operands as { phase?: unknown }).phase)
        expect(day.lunarDayInput, label).toEqual(variant.lunarDayInput)
        // Supplied 母倉 evidence (or its absence) is kept as provenance with its status.
        const soilEvidence = muCang(day).inputProvenance.SOIL_REIGN_STATE!.evidence as Record<
          string,
          unknown
        >
        const supplied = (variant.operands as { yiInputs?: Record<string, unknown> }).yiInputs
          ?.SOIL_REIGN_STATE
        expect(soilEvidence, label).toEqual(supplied ?? { kind: 'MISSING_SOIL_EVIDENCE' })
      }
    },
    120000,
  )

  it('rejects dated evidence from different civil days', () => {
    const run = () =>
      resolveP4YiDay('辰', '甲戌', {
        soil: getP4SoilPresence('2025-04-20'),
        phase: getP4MoonPhase('2025-04-20'),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil('2025-04-21') },
      })
    expect(run).toThrow(RangeError)
    expect(run).toThrow(expect.objectContaining({ code: 'CONFLICTING_DATED_INPUT' }))
    expect(() =>
      resolveP4YiDay('辰', '甲戌', {
        soil: getP4SoilPresence('2025-04-20'),
        phase: getP4MoonPhase('2025-04-19'),
      }),
    ).toThrow(expect.objectContaining({ code: 'CONFLICTING_DATED_INPUT' }))
  })
})

describe('P4-C 5.6 dated sweep keeps every input and status in the trace', () => {
  it('matches the frozen dated 母倉 domain and P4-B scopes on 1,095 dates', () => {
    const [head, ...lines] = read('docs/audits/sources/p4-vol10/yi-domains-v1/expected.tsv')
      .trimEnd()
      .split('\n')
    const keys = head!.split('\t')
    const dated = new Map(
      lines
        .map((line) => Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v])))
        .filter((r) => r.domain === 'MU_CANG_DATED_1095')
        .map((r) => [JSON.parse(r.inputs!).SOIL_REIGN_STATE.date as string, JSON.parse(r.inputs!)]),
    )
    expect(dated.size).toBe(1095)
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const lunarDay = a.selectionContext.LUNAR_DAY!
      const phase = getP4MoonPhase(date)
      const soil = getP4SoilPresence(date)
      const yiSoil = getP4MuCangSoil(date)
      const day = resolveP4YiDay(month, pillar, {
        lunarDay,
        phase,
        soil,
        yiInputs: { SOIL_REIGN_STATE: yiSoil },
      })
      expectDatedScope(day, [], date)
      expectMotherScope(day, false, date)
      const frozen = dated.get(date)!.SOIL_REIGN_STATE
      expect(yiSoil, date).toMatchObject({
        state: frozen.state,
        onset: frozen.onset,
        nextLi: frozen.nextLi,
        coverage: frozen.coverage,
        status: ADOPTED,
      })
      // Both owner conventions share the 18-civil-day window before 四立.
      expect(soil.presence, date).toBe(yiSoil.state)
      expect(muCang(day).inputs.SOIL_REIGN_STATE, date).toEqual(yiSoil)
      expect(day.soilScope).toMatchObject({
        status: ADOPTED,
        evidence: soil,
        presence: soil.presence,
      })
      expect(day.phaseScope).toMatchObject({
        evidence: phase,
        presence: phase.phase === 'none' ? 'absent' : 'present',
      })
      expect(day.lunarDayInput).toEqual({ authorityId: lunarAuthority.version, value: lunarDay })
      for (const rule of lunarAuthority.rules)
        expect(day.lunarDayScopes[rule.token]!.presence, date).toBe(
          rule.days.includes(lunarDay) ? 'present' : 'absent',
        )
      for (const heading of motherHeadings)
        expect(day.yiEvidence[heading]!.trace, `${date} ${heading}`).toContainEqual(muCang(day))
    }
  }, 180000)

  it('carries exact-Jie instants through for the 108 frozen crossing records', () => {
    const [head, ...lines] = read('docs/audits/sources/p4-vol10/yi-domains-v1/expected.tsv')
      .trimEnd()
      .split('\n')
    const keys = head!.split('\t')
    const records = lines
      .map((line) => Object.fromEntries(line.split('\t').map((v, i) => [keys[i]!, v])))
      .filter((r) => r.domain === 'MU_CANG_EXACT_JIE_108')
    expect(records).toHaveLength(108)
    for (const record of records) {
      const inputs = JSON.parse(record.inputs!)
      const provenance = JSON.parse(record.inputProvenance!)
      const soil = getP4MuCangSoil(inputs.SOIL_REIGN_STATE.date)
      expect(soil.state, record.id).toBe(inputs.SOIL_REIGN_STATE.state)
      const day = resolveP4YiDay(inputs.MONTH_JIAN_BRANCH, provenance.validPillar, {
        yiInputs: { SOIL_REIGN_STATE: soil },
        yiInputProvenance: provenance,
      })
      const operand = muCang(day)
      expect(operand.presence, record.id).toBe(JSON.parse(record.expected!).outcome)
      expect(operand.inputProvenance.MONTH_JIAN_BRANCH!.evidence, record.id).toMatchObject({
        instantUtc: provenance.instantUtc,
      })
    }
  })
})
