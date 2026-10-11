import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import bridge from '../almanac-data/p4-vol10-context-bridge.json'
import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import golden from '../almanac-data/golden-p4-context-bridge.json'
import lock from '../../docs/audits/sources/p4-vol10/context-bridge-lock.json'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { isMonthlyShaPresent } from './xiejiMonthlySha'
import {
  getP4SubjectPresence,
  P4_SUBJECTS,
  resolveP4Context,
  walkP4Deferral,
} from './p4ContextBridge'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const contexts = [...BRANCHES].flatMap((month) =>
  Array.from({ length: 60 }, (_, i) => ({ month, pillar: STEMS[i % 10]! + BRANCHES[i % 12]! })),
)
const edgesFor = (subject: string, month: string) =>
  clauses.namedDeferrals.filter((e) => e.subject === subject && e.months.includes(month))

describe('P4 context bridge, audit only', () => {
  it('keeps the frozen oracle and source quotations intact', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const { source: ref } of bridge.deAsJian)
      expect(source.slice(ref.offset, ref.offset + Array.from(ref.text).length).join('')).toBe(
        ref.text,
      )
    expect(bridge.scoringReady).toBe(false)
  })

  // Expected values hand-derived in golden-p4-context-bridge.json before this module existed.
  it.each(golden.cases)('$monthJian月$pillar: $note', (c) => {
    const r = resolveP4Context(c.monthJian, c.pillar)
    expect(r.officer).toBe(c.officer)
    expect(P4_SUBJECTS.filter((s) => r.subjects[s] === 'present')).toEqual(c.present)
    expect(r.subjects['刼煞']).toBe('unknown')
    expect(r.pillarRules.map((rule) => rule.id)).toEqual(c.pillarRuleIds)
    expect(
      Object.fromEntries(
        Object.entries(r.deferrals).map(([k, d]) => [
          k,
          { status: d.status, path: d.path, terminal: d.terminal },
        ]),
      ),
    ).toEqual(c.deferrals)
    expect(r.terminals).toEqual(c.terminals)
    expect(r.ignoredVirtueGroups).toEqual(c.ignoredVirtueGroups)
    expect(r.deAsJianRuleIds).toEqual(c.deAsJianRuleIds)
  })

  it('derives presence only from audited operands, cross-checked with the 協紀 tables', () => {
    for (let m = 0; m < 12; m++)
      for (let d = 0; d < 12; d++) {
        const p = getP4SubjectPresence(m, d % 10, d)
        const gods = getXiejiGodPresence(m, d % 10, d)
        expect(p['月厭'] === 'present').toBe('nguyet_yem' in gods)
        expect(p['月刑'] === 'present').toBe('nguyet_hinh' in gods)
        expect(p['月破'] === 'present').toBe((d - m + 12) % 12 === 6)
        expect(p['月煞'] === 'present').toBe(isMonthlyShaPresent('yue_sha', m, d))
      }
  })

  it('fires every named edge only toward a co-present or unaudited target, over all 720 contexts', () => {
    let fired = 0
    for (const { month, pillar } of contexts) {
      const r = resolveP4Context(month, pillar)
      for (const [subject, d] of Object.entries(r.deferrals)) {
        expect(r.subjects[subject as (typeof P4_SUBJECTS)[number]]).toBe('present')
        if (d.path.length > 1) fired++
        if (d.status === 'undetermined') {
          expect(r.subjects[d.path.at(-1) as (typeof P4_SUBJECTS)[number]]).toBe('unknown')
          continue
        }
        expect(r.subjects[d.terminal as (typeof P4_SUBJECTS)[number]]).toBe('present')
        expect(edgesFor(d.terminal!, month)).toEqual([])
      }
      expect(r.terminals).toEqual([...new Set(r.terminals)])
    }
    expect(fired).toBeGreaterThan(0)
  })

  it('applies the date predicate of every named pillar context and nothing else', () => {
    const expected = clauses.pillarRules.flatMap((rule) =>
      rule.contexts.map((c) => `${rule.id}:${c.monthJian}${c.pillar}`),
    )
    const actual = contexts.flatMap(({ month, pillar }) =>
      resolveP4Context(month, pillar).pillarRules.map((rule) => `${rule.id}:${month}${pillar}`),
    )
    expect(actual.sort()).toEqual([...expected].sort())
  })

  it('walks multi-hop chains transitively, keeping every hop', () => {
    const edges = [
      { subject: 'A', months: ['子'], target: 'B' },
      { subject: 'B', months: ['子'], target: 'C' },
      { subject: 'C', months: ['丑'], target: 'A' },
    ]
    expect(walkP4Deferral('A', '子', () => 'present', edges)).toEqual({
      status: 'named_deferral',
      path: ['A', 'B', 'C'],
      terminal: 'C',
    })
  })

  it('stops on a cycle and reports it instead of looping', () => {
    const edges = [
      { subject: 'A', months: ['子'], target: 'B' },
      { subject: 'B', months: ['子'], target: 'A' },
    ]
    expect(walkP4Deferral('A', '子', () => 'present', edges)).toEqual({
      status: 'cycle',
      path: ['A', 'B', 'A'],
      terminal: null,
    })
  })

  it('never treats an absent target as a terminal', () => {
    const edges = [{ subject: 'A', months: ['子'], target: 'B' }]
    expect(walkP4Deferral('A', '子', (s) => (s === 'B' ? 'absent' : 'present'), edges)).toEqual({
      status: 'target_absent',
      path: ['A', 'B'],
      terminal: null,
    })
  })

  it('rejects malformed input', () => {
    expect(() => resolveP4Context('正', '甲子')).toThrow(RangeError)
    expect(() => resolveP4Context('子', '甲丑')).toThrow(RangeError)
  })
})
