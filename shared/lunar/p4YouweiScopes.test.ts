import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-youwei-scopes.json'
import golden from '../almanac-data/golden-p4-youwei-scopes-v2.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import lock from '../../docs/audits/sources/p4-vol10/youwei-scopes-lock.json'
import { resolveP4Day } from './p4DayComposition'
import { P4_YOUWEI, resolveP4Headings } from './p4HeadingAnnotation'

const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const quoted = (r: { offset: number; text: string }) =>
  source.slice(r.offset, r.offset + Array.from(r.text).length).join('')

describe('P4 又為X scopes (owner decision B by source), audit only', () => {
  it('keeps the decision, its quotes and the frozen oracle intact', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const a of art.aliases) {
      expect(quoted(a.source)).toBe(a.source.text)
      for (const r of a.counterEvidence ?? []) expect(quoted(r)).toBe(r.text)
      // 專忌 status only where the source writes 專忌.
      expect(a.status === 'zhuanji').toBe(a.source.text.includes('專忌'))
    }
    expect(art.scoringReady).toBe(false)
  })

  it('covers every 又為 list of the 卷十 entries, and only those', () => {
    const lists = vol10.entries.flatMap((e) =>
      e.extraAvoid.filter((x) => source.join('').includes(`又為${x.as}`)).map((x) => x.as),
    )
    expect([...lists, '咸池'].sort()).toEqual(art.aliases.map((a) => a.alias).sort())
    expect(P4_YOUWEI.map((a) => a.alias)).not.toContain('死神')
  })

  // Hand-derived before the scopes were coded (v1 df4e1f9); v2 adds a co-present scope v1 missed.
  it.each(golden.cases)('$monthJian月$pillar: $note', (c) => {
    const r = resolveP4Headings(c.monthJian, c.pillar)
    expect(Object.keys(r.youweiScopes).sort()).toEqual(Object.keys(c.youwei).sort())
    for (const [alias, want] of Object.entries(c.youwei)) {
      const got = r.youweiScopes[alias]!
      expect([got.parent, got.status]).toEqual([want.parent, want.status])
      for (const [h, state] of Object.entries(want.headings))
        expect(got.headings[h], `${alias} ${h}`).toBe(state)
    }
    for (const [subject, want] of Object.entries(c.scopes ?? {})) {
      const got = r.scopes[subject]!
      if (!('headings' in got)) throw new Error(`${subject} unresolved`)
      for (const [h, state] of Object.entries(want.headings))
        expect(got.headings[h], `${subject} ${h}`).toBe(state)
      if ('uncoveredByDeferral' in want)
        expect(got.uncoveredByDeferral?.sort()).toEqual([...want.uncoveredByDeferral!].sort())
    }
    for (const [h, state] of Object.entries(c.day ?? {}))
      expect(resolveP4Day(c.monthJian, c.pillar).headings[h]?.state, h).toBe(state)
  })
  // Hand-derived: 辰月壬辰 月建 → 月刑 is 相抵 (不註) for 興造動土, while 又為土府 專忌 lists it. 專忌
  // survives 相抵 (鋪註 05/22), so the day keeps 忌 and 宜 stays suppressed.
  it('keeps 專忌 忌 against a 相抵 scope on the same heading', () => {
    const scope = resolveP4Headings('辰', '壬辰').scopes['月建']!
    if (!('headings' in scope)) throw new Error('月建 unresolved')
    expect(scope.headings['興造動土']).toBe('neither_recorded')
    expect(resolveP4Day('辰', '壬辰').headings['興造動土']!.state).toBe('only_ji')
  })
})
