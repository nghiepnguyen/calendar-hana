import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-heading-annotation.json'
import golden from '../almanac-data/golden-p4-heading-annotation-v2.json'
import lock from '../../docs/audits/sources/p4-vol10/heading-annotation-lock.json'
import { resolveP4Grades } from './p4GradeResolution'
import { P4_HEADINGS, resolveP4Headings } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const quoted = (r: { offset: number; text: string }) =>
  source.slice(r.offset, r.offset + Array.from(r.text).length).join('')

describe('P4 per-scope heading annotation (A04a), audit only', () => {
  it('keeps the frozen oracle and source quotations intact', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const refs = [
      ...art.entryLists.flatMap((e) => [
        e.source,
        ...(e.readings ?? []).flatMap((r) => (typeof r.evidence === 'string' ? [] : [r.evidence])),
        ...(e.extraAvoid ?? []).map((x) => x.source),
      ]),
      art.effectRules.only_avoid.source,
      art.effectRules.cancel_both.source,
      art.effectRules.cancel_both.clause,
      ...art.propagationInventory.lines.map((l) => l.source),
    ]
    for (const r of refs) expect(quoted(r)).toBe(r.text)
    expect(art.scoringReady).toBe(false)
  })

  it('transcribes each list from its quote, changing only the recorded readings', () => {
    for (const e of art.entryLists) {
      let raw = e.source.text.replace(/^忌/, '')
      for (const r of e.readings ?? []) raw = raw.replace(r.raw, r.read)
      expect(e.avoid.startsWith(raw)).toBe(true)
      expect(() => splitHeadings(e.avoid)).not.toThrow()
      for (const stop of Object.values(e.stopLists))
        for (const h of splitHeadings(stop)) expect(splitHeadings(e.avoid)).toContain(h)
    }
  })

  // Expected values hand-derived in golden-p4-heading-annotation.json before the resolver existed.
  it.each(golden.cases)('$monthJian月$pillar: $note', (c) => {
    const r = resolveP4Headings(c.monthJian, c.pillar, c.yi as Record<string, boolean>)
    expect(Object.keys(r.scopes)).toEqual(Object.keys(c.scopes))
    for (const [subject, want] of Object.entries(c.scopes)) {
      const got = r.scopes[subject]!
      if ('status' in want) {
        expect(got).toEqual(want)
        continue
      }
      expect(got).toMatchObject({ owner: want.owner, clauseEffect: want.clauseEffect })
      if (!('headings' in got)) throw new Error(`${subject} unresolved`)
      for (const [h, state] of Object.entries(want.headings))
        expect(got.headings[h], `${subject} ${h}`).toBe(state)
    }
  })

  it('agrees with A03 on every subject and keeps 相抵 as 不註 over all 720 contexts', () => {
    const counts: Record<string, number> = {}
    for (const month of BRANCHES)
      for (let i = 0; i < 60; i++) {
        const pillar = STEMS[i % 10]! + BRANCHES[i % 12]!
        const grades = resolveP4Grades(month, pillar).subjects as Record<
          string,
          { clauseEffect?: string; consistency?: string; status?: string }
        >
        const { scopes } = resolveP4Headings(month, pillar)
        for (const [subject, scope] of Object.entries(scopes)) {
          const g = grades[subject]!
          if ('status' in scope) {
            expect(g.status).toBe('undetermined')
            continue
          }
          if (g.clauseEffect) expect(scope.clauseEffect).toBe(g.clauseEffect)
          if (g.consistency === 'xiangdi')
            expect(Object.values(scope.headings)).toContain('neither_recorded')
          for (const state of Object.values(scope.headings))
            counts[state] = (counts[state] ?? 0) + 1
          // Without 宜 evidence nothing may resolve to a 宜-bearing state.
          expect(Object.values(scope.headings)).not.toContain('only_yi')
          expect(Object.values(scope.headings)).not.toContain('both_present')
        }
      }
    expect(counts['neither_recorded']).toBeGreaterThan(0)
    expect(counts['undetermined']).toBeGreaterThan(0)
  }, 60_000) // full-domain sweep: CI runners are ~4× slower than local

  // Hand-derived: 求醫療病 is in 平日's 止忌 list on 申月癸亥, so 忌 stays; unknown 宜 cannot tell
  // both_present from only_ji.
  it('keeps a kept-忌 heading undetermined while 宜 is unknown', () => {
    const scope = resolveP4Headings('申', '癸亥').scopes['平日']!
    if (!('headings' in scope)) throw new Error('平日 unresolved')
    expect(scope.headings['求醫療病']).toBe('undetermined')
    const known = resolveP4Headings('申', '癸亥', { 求醫療病: false }).scopes['平日']!
    if (!('headings' in known)) throw new Error('平日 unresolved')
    expect(known.headings['求醫療病']).toBe('only_ji')
  })

  // Hand-derived: 辰月丁未 平日 defers to 月煞 (忌同刼煞); 天德合/月德合 present → 如常例.
  it('reads 月煞/災煞 lists through 忌同刼煞', () => {
    const scope = resolveP4Headings('辰', '丁未').scopes['平日']!
    expect(scope).toMatchObject({ owner: '月煞', clauseEffect: 'as_usual' })
    if (!('headings' in scope)) throw new Error('平日 unresolved')
    expect(scope.headings['嫁娶']).toBe('only_ji')
    expect(scope.headings['伐木']).toBe('not_avoided')
  })

  it('never lets 宜 evidence change a scope that does not follow 宜', () => {
    const all = Object.fromEntries(P4_HEADINGS.map((h) => [h, true]))
    for (const [month, pillar] of [
      ['申', '乙亥'],
      ['卯', '甲午'],
      ['子', '壬子'],
      ['子', '壬午'],
    ] as const)
      expect(resolveP4Headings(month, pillar, all)).toEqual(resolveP4Headings(month, pillar))
  })

  it('inventories the cross-heading lines without applying them', () => {
    expect(art.propagationInventory.lines.map((l) => l.id)).toEqual([
      'puzhu:11',
      'puzhu:16',
      'puzhu:17',
      'puzhu:18',
      'puzhu:19',
      'puzhu:20',
      'puzhu:21',
      'puzhu:22',
      'puzhu:23',
      'puzhu:24',
    ])
    expect(art.propagationInventory.status).toBe('INVENTORY_ONLY_A04B')
  })
})
