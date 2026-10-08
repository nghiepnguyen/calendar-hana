/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import {
  evaluateGroupBAtInstant,
  evaluateGroupBContext,
  normalizeGroupBRuleId,
  type GroupBRuleId,
} from './groupB'
import { solarTermsForYear } from './solarTerms'
import { solarToLunar } from './lunar'
import { starApplies } from './stars'
import { STARS } from './stars.data'

const timezone = 'Asia/Ho_Chi_Minh'
const branches = '子丑寅卯辰巳午未申酉戌亥'
const stems = '甲乙丙丁戊己庚辛壬癸'
// Independent admitted symbolic source rows, not derived from production output.
const tables = {
  'month-breaker': '申酉戌亥子丑寅卯辰巳午未',
  'robbery-sha': '亥申巳寅亥申巳寅亥申巳寅',
  'disaster-sha': '子酉午卯子酉午卯子酉午卯',
  'month-sha': '丑戌未辰丑戌未辰丑戌未辰',
  'month-virtue': '丙甲壬庚丙甲壬庚丙甲壬庚',
} as const
const ids = Object.keys(tables) as GroupBRuleId[]
interface Fixture {
  id: string
  instant: string
  timezone: string
  context: { monthJian: string; dayStem: string; dayBranch: string; civilDate: string }
  expected: boolean
  derivation: {
    ruleId: GroupBRuleId
    operandType: string
    observedOperand: string
    expectedTarget: string
  }
  fixtureClass: string
  boundary?: { transitionId: string; sample: string; effectiveCutoffKiller?: boolean }
  identityContract?: {
    inputLabels: string[]
    expectedCanonicalRuleIds: string[]
    expectedCanonicalMatchCount: number
  }
}
const fixtures: Fixture[] = ids.flatMap(
  (id) => JSON.parse(readFileSync(resolve(`golden-v3/group-b/${id}.json`), 'utf8')).fixtures,
)
const evidence: {
  transitions: {
    id: string
    year: number
    longitudeDegrees: number
    oldMonthJian: string
    newMonthJian: string
    instantUTC: string
  }[]
} = JSON.parse(readFileSync(resolve('calendar-group-b-exact-jie-evidence.json'), 'utf8'))
const frozen: Record<string, string> = JSON.parse(
  readFileSync(resolve('tasks/calendar-audit/group-b-freeze-hashes.json'), 'utf8'),
)
const audit: Record<string, unknown> = {}
const fixtureResults: Record<string, unknown>[] = []

test('freeze integrity: all eleven protected artifact hashes', () => {
  for (const [path, expected] of Object.entries(frozen)) {
    const actual = createHash('sha256')
      .update(readFileSync(resolve(path)))
      .digest('hex')
    expect(actual, path).toBe(expected)
  }
  expect(fixtures).toHaveLength(606)
})

describe('Frozen Group B Golden', () => {
  for (const f of fixtures) {
    test(`${f.id} ${f.fixtureClass}`, () => {
      const actual = evaluateGroupBAtInstant(f.instant, f.timezone, f.identityContract?.inputLabels)
      const rule = actual.rules.find((r) => r.id === f.derivation.ruleId)!
      const expected = {
        context: f.context,
        rule: {
          id: f.derivation.ruleId,
          operandType: f.derivation.operandType,
          observedOperand: f.derivation.observedOperand,
          targetOperand: f.derivation.expectedTarget,
          matched: f.expected,
        },
        ids: f.identityContract?.expectedCanonicalRuleIds ?? ids,
      }
      const observed = {
        context: {
          monthJian: actual.context.monthJian,
          dayStem: actual.context.dayStem,
          dayBranch: actual.context.dayBranch,
          civilDate: actual.context.civilDate,
        },
        rule: {
          id: rule.id,
          operandType: rule.operandType,
          observedOperand: rule.observedOperand,
          targetOperand: rule.targetOperand,
          matched: rule.matched,
        },
        ids: actual.rules.map((r) => r.id),
      }
      const passed = JSON.stringify(observed) === JSON.stringify(expected)
      fixtureResults.push({
        id: f.id,
        ruleId: f.derivation.ruleId,
        fixtureClass: f.fixtureClass,
        boundary: f.boundary,
        expected,
        actual: observed,
        passed,
      })
      expect(observed).toEqual(expected)
      expect(new Set(actual.rules.map((r) => r.id)).size).toBe(actual.rules.length)
      if (f.identityContract)
        expect(actual.rules.filter((r) => r.matched)).toHaveLength(
          f.identityContract.expectedCanonicalMatchCount,
        )
    })
  }
})

describe('Group B properties', () => {
  test('P1: only Jie changes Jian; inclusive equality at the production crossing', () => {
    let checks = 0
    for (const year of [1900, 2014, 2023, 2024, 2025, 2100]) {
      for (const term of solarTermsForYear(year)) {
        const t = Date.parse(term.instantUtc)
        const before = evaluateGroupBAtInstant(new Date(t - 1).toISOString(), timezone).context
          .monthJian
        const at = evaluateGroupBAtInstant(term.instantUtc, timezone).context.monthJian
        const after = evaluateGroupBAtInstant(new Date(t + 1).toISOString(), timezone).context
          .monthJian
        const isJie = term.longitude % 30 === 15
        expect(at).toBe(after)
        expect(at === before).toBe(!isJie)
        checks += 2
      }
    }
    audit['P1'] = {
      passed: true,
      assertions: checks,
      reference: 'production roots; semantic invariant, not independent astronomy accuracy',
    }
  })
  for (const t of evidence.transitions) {
    test(`P2: independently reviewed exact ${t.id}`, () => {
      const before = evaluateGroupBAtInstant(
        new Date(Date.parse(t.instantUTC) - 60_000).toISOString(),
        timezone,
      )
      const at = evaluateGroupBAtInstant(t.instantUTC, timezone)
      const after = evaluateGroupBAtInstant(
        new Date(Date.parse(t.instantUTC) + 60_000).toISOString(),
        timezone,
      )
      const actual = [before.context.monthJian, at.context.monthJian, after.context.monthJian]
      expect(actual).toEqual([t.oldMonthJian, t.newMonthJian, t.newMonthJian])
    })
  }
  test('P3–P7: twelve source rows, all sixty valid day operands; stem/branch distinction', () => {
    let assertions = 0
    for (let row = 0; row < 12; row++) {
      const monthJian = '寅卯辰巳午未申酉戌亥子丑'[row]!
      for (let cycle = 0; cycle < 60; cycle++) {
        const context = { monthJian, dayStem: stems[cycle % 10]!, dayBranch: branches[cycle % 12]! }
        const rules = evaluateGroupBContext(context)
        expect(rules).toHaveLength(5)
        for (const rule of rules) {
          const target = tables[rule.id][row]!
          const operandType = rule.id === 'month-virtue' ? 'DAY_STEM' : 'DAY_BRANCH'
          const operand = operandType === 'DAY_STEM' ? context.dayStem : context.dayBranch
          expect({
            target: rule.targetOperand,
            type: rule.operandType,
            operand: rule.observedOperand,
            matched: rule.matched,
          }).toEqual({ target, type: operandType, operand, matched: operand === target })
          assertions += 4
        }
        expect(branches.indexOf(rules[0]!.targetOperand)).toBe(
          (branches.indexOf(monthJian) + 6) % 12,
        )
        assertions += 2
      }
    }
    audit['P3–P7'] = { passed: true, cases: 720, fieldChecks: assertions, assertionCalls: 5040 }
  })
  test('P8: lunar ordinal and leap metadata never enter raw rule calculation', () => {
    let assertions = 0
    for (const f of fixtures.filter((r) => r.fixtureClass === 'lunar-leap-regression')) {
      const context = evaluateGroupBAtInstant(f.instant, timezone).context
      const baseline = evaluateGroupBContext(context)
      for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
        for (const isLeapMonth of [false, true]) {
          const counterfactual = { ...context, lunarMonth, isLeapMonth }
          expect(evaluateGroupBContext(counterfactual)).toEqual(baseline)
          assertions++
        }
      }
    }
    audit['P8'] = { passed: true, assertions, counterfactual: true }
  })
  test('P9: equivalent UTC, +07 and +08 instants; Vietnam midnight turnover', () => {
    let assertions = 0
    for (const f of fixtures.filter((r) => r.fixtureClass === 'timezone-equivalent')) {
      const original = evaluateGroupBAtInstant(f.instant, timezone)
      const utc = evaluateGroupBAtInstant(new Date(f.instant).toISOString(), timezone)
      expect({ ...original.context, instant: '' }).toEqual({ ...utc.context, instant: '' })
      expect(original.rules).toEqual(utc.rules)
      assertions += 2
    }
    const a = evaluateGroupBAtInstant('2024-01-15T23:59:59+07:00', timezone).context
    const b = evaluateGroupBAtInstant('2024-01-16T00:00:00+07:00', timezone).context
    expect(a.monthJian).toBe(b.monthJian)
    expect((branches.indexOf(a.dayBranch) + 1) % 12).toBe(branches.indexOf(b.dayBranch))
    expect((stems.indexOf(a.dayStem) + 1) % 10).toBe(stems.indexOf(b.dayStem))
    audit['P9'] = { passed: true, assertions: assertions + 3 }
  })
  test('P10: all admitted aliases select one canonical identity', () => {
    const aliases = [
      ['月破'],
      ['劫煞', '刼煞'],
      ['災煞', '月災煞', '天獄'],
      ['月煞', '月殺', '月虚', '月虛'],
      ['月徳', '月德'],
    ]
    aliases.forEach((labels, i) => {
      for (const label of labels) expect(normalizeGroupBRuleId(label)).toBe(ids[i])
      expect(
        evaluateGroupBAtInstant('2024-04-07T12:00:00+07:00', timezone, labels).rules.map(
          (r) => r.id,
        ),
      ).toEqual([ids[i]])
    })
    audit['P10'] = { passed: true, assertions: 17 }
  })
  test('P11/P12: no heaven-virtue, Group C, activity resolver or scoring output', () => {
    const output = evaluateGroupBAtInstant('2024-04-07T12:00:00+07:00', timezone)
    expect(output.rules.map((r) => r.id)).toEqual(ids)
    for (const excluded of ['heaven-virtue', '天德', '天徳', 'thu-tu', 'sat-chu', 'tam-nuong']) {
      expect(normalizeGroupBRuleId(excluded)).toBeUndefined()
      expect(
        evaluateGroupBAtInstant('2024-04-07T12:00:00+07:00', timezone, [excluded]).rules,
      ).toEqual([])
    }
    expect(Object.keys(output).sort()).toEqual(['astronomyMethod', 'context', 'rules'])
    audit['P11/P12'] = { passed: true, assertions: 14 }
  })
  test('explicit zone, zoned instant, supported range and valid context are required', () => {
    expect(() => evaluateGroupBAtInstant('2024-04-07T12:00:00', timezone)).toThrow(RangeError)
    expect(() => evaluateGroupBAtInstant('invalidZ', timezone)).toThrow(RangeError)
    expect(() => evaluateGroupBAtInstant('2024-04-07T12:00:00Z', '')).toThrow(RangeError)
    expect(() => evaluateGroupBAtInstant('2024-04-07T12:00:00Z', 'Asia/Hong_Kong')).toThrow(
      RangeError,
    )
    expect(() => evaluateGroupBAtInstant('1899-04-07T12:00:00Z', timezone)).toThrow(RangeError)
    expect(() => evaluateGroupBContext({ monthJian: '', dayStem: '丙', dayBranch: '辰' })).toThrow(
      RangeError,
    )
  })
})

test('1900–2100: every civil noon satisfies source tables; diagnostic legacy comparison', () => {
  const legacyNames = [
    'Nguyệt Phá',
    'Kiếp Sát',
    'Phi Ma Sát (Tai Sát)',
    'Nguyệt Hư (Nguyệt Sát)',
    'Nguyệt Đức',
  ]
  const legacy = ids.map((id, i) => ({
    id,
    definition: STARS.find((s) => s.name === legacyNames[i])!,
    days: 0,
    differences: 0,
    monthBasisDifferences: 0,
    lookupDifferences: 0,
    examples: [] as unknown[],
  }))
  let days = 0
  let assertions = 0
  for (let t = Date.UTC(1900, 0, 1); t < Date.UTC(2101, 0, 1); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10)
    const output = evaluateGroupBAtInstant(`${date}T12:00:00+07:00`, timezone)
    const row = '寅卯辰巳午未申酉戌亥子丑'.indexOf(output.context.monthJian)
    const day = Math.floor(t / 86_400_000) + 2440588
    // Independent Gregorian epoch to JDN; source operands do not come from API.
    const dayStem = stems[(day + 9) % 10]!
    const dayBranch = branches[(day + 1) % 12]!
    expect(output.context.dayStem).toBe(dayStem)
    expect(output.context.dayBranch).toBe(dayBranch)
    expect(row).toBeGreaterThanOrEqual(0)
    const [year, month, d] = date.split('-').map(Number)
    const lunar = solarToLunar(d!, month!, year!)
    for (const entry of legacy) {
      const rule = output.rules.find((r) => r.id === entry.id)!
      const target = tables[entry.id][row]!
      const observed = entry.id === 'month-virtue' ? dayStem : dayBranch
      expect({
        target: rule.targetOperand,
        observed: rule.observedOperand,
        matched: rule.matched,
      }).toEqual({ target, observed, matched: observed === target })
      const ctx = {
        lunarMonth: lunar.month,
        lunarDay: lunar.day,
        can: stems.indexOf(dayStem),
        chi: branches.indexOf(dayBranch),
        canChi: (day + 49) % 60,
        officer: 0,
        mansion: 0,
      }
      const oldMatch = starApplies(entry.definition.rule, ctx)
      const rebound = starApplies(entry.definition.rule, { ...ctx, lunarMonth: row + 1 })
      entry.days++
      if (oldMatch !== rule.matched) {
        entry.differences++
        const classification =
          rebound === rule.matched ? 'MONTH_BASIS_DIFFERENCE' : 'LOOKUP_DIFFERENCE'
        if (classification === 'MONTH_BASIS_DIFFERENCE') entry.monthBasisDifferences++
        else entry.lookupDifferences++
        if (entry.examples.length < 5)
          entry.examples.push({
            date,
            lunarMonth: lunar.month,
            monthJian: output.context.monthJian,
            legacy: oldMatch,
            canonical: rule.matched,
            classification,
          })
      }
    }
    days++
    assertions += 18
  }
  expect(days).toBe(73414)
  audit['range'] = {
    passed: true,
    days,
    fieldChecks: assertions + 1,
    assertionCalls: days * 8 + 1,
    from: '1900-01-01',
    through: '2100-12-31',
    time: 'UTC+7 civil noon',
    note: 'table/day arithmetic invariants; independent exact-Jie accuracy tested separately',
  }
  audit['legacy'] = {
    rules: legacy.map(({ definition, ...entry }) => ({ ...entry, legacyName: definition.name })),
    note: 'Tai Sát legacy display is Phi Ma Sát; comparison does not admit its activity prose or equate traditions. Legacy tables and call sites unchanged.',
  }
}, 120_000)

afterAll(() => {
  const path = process.env['GROUP_B_AUDIT_OUTPUT']
  if (path)
    writeFileSync(
      path,
      JSON.stringify(
        {
          fixtureResults,
          properties: audit,
          astronomyComparisons: evidence.transitions.map((t) => {
            const actual = solarTermsForYear(t.year).find(
              (term) => term.longitude === t.longitudeDegrees,
            )!.instantUtc
            return {
              id: t.id,
              expected: t.instantUTC,
              actual,
              deltaSecondsAtMillisecondResolution:
                (Date.parse(actual) - Date.parse(t.instantUTC)) / 1000,
              source: 'shared/lunar/solarTerms.ts: solarTermsForYear, actual production path',
              independentEvidence:
                'calendar-group-b-independent-review.json#/exactJie; Swiss DE441 fresh independent solver and pinned data',
            }
          }),
        },
        null,
        2,
      ) + '\n',
    )
})
