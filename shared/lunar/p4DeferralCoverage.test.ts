import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-deferral-coverage-v3.json'
import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import lockV1 from '../../docs/audits/sources/p4-vol10/deferral-coverage-lock.json'
import lockV2 from '../../docs/audits/sources/p4-vol10/deferral-coverage-lock-v2.json'
import lock from '../../docs/audits/sources/p4-vol10/youwei-scopes-lock.json'
import { getP4DeferralUncovered, resolveP4Headings } from './p4HeadingAnnotation'

const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const expected = art.expectedUncovered as Record<string, { months: string[]; headings: string[] }>
const scope = (month: string, pillar: string, subject: string) => {
  const s = resolveP4Headings(month, pillar).scopes[subject]!
  if (!('headings' in s)) throw new Error(`${subject} unresolved`)
  return s
}

describe('P4 deferral 忌 coverage (A05), audit only', () => {
  it('keeps the artifact and source quotations intact', () => {
    for (const f of [...lockV1.files, ...lockV2.files, ...lock.files])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const r of art.principle.sources)
      expect(source.slice(r.offset, r.offset + Array.from(r.text).length).join('')).toBe(r.text)
    expect(art.scoringReady).toBe(false)
  })

  it('matches the recorded coverage of every named edge and month', () => {
    for (const edge of clauses.namedDeferrals)
      for (const month of edge.months)
        expect(
          getP4DeferralUncovered(edge.subject, edge.target, month).sort(),
          `${edge.id} ${month}`,
        ).toEqual(
          expected[edge.id]?.months.includes(month) ? [...expected[edge.id]!.headings].sort() : [],
        )
    expect(Object.keys(expected).length + art.coveredEdges.length).toBe(
      clauses.namedDeferrals.length,
    )
    const w = art.nonDeferralWitness
    for (const month of w.months)
      expect(getP4DeferralUncovered(w.subject, w.target, month).sort()).toEqual(
        [...w.headings].sort(),
      )
  })

  // Hand-derived contexts.
  it('marks an uncovered 忌 undetermined only when the target does not avoid it', () => {
    // 寅月丁丑: 閉日 → 月煞; 天德 (丁) present → 月煞 如常例 over 刼煞's list.
    const withDe = scope('寅', '丁丑', '閉日')
    expect(withDe).toMatchObject({ owner: '月煞', clauseEffect: 'as_usual' })
    // 針刺 is 血支's 專忌 scope now (p4-vol10-youwei-scopes.json), outside 閉日's base.
    expect([withDe.headings['療目'], withDe.headings['針刺']]).toEqual([
      'undetermined',
      'not_listed',
    ])
    expect(withDe.headings['嫁娶']).toBe('only_ji')
    // 寅月乙丑: no 德 → 諸事皆忌 already covers them.
    const noDe = scope('寅', '乙丑', '閉日')
    expect(noDe.clauseEffect).toBe('avoid_all')
    expect(noDe.headings['療目']).toBe('only_ji')
    // 辰月壬辰: 月建 → 月刑 相抵; 伐木 is 月刑 止不忌, so undetermined, not not_avoided (平治道塗 is 土府's).
    const jian = scope('辰', '壬辰', '月建')
    expect(jian.clauseEffect).toBe('cancel_both')
    expect([jian.headings['伐木'], jian.headings['平治道塗']]).toEqual([
      'undetermined',
      'not_avoided',
    ])
    expect(jian.uncoveredByDeferral).toEqual(['伐木'])
  })

  // Hand-derived: 子月壬午 has 月德 (月破 猶忌 + 仍忌 three headings); 子月甲午 has no 德 (諸事皆忌).
  it('finds 災煞 → 月破 covered after resolution, with and without 德', () => {
    for (const pillar of ['壬午', '甲午']) {
      const s = scope('子', pillar, '災煞')
      for (const h of art.expectedUncovered.zai_po.headings)
        expect(s.headings[h], `${pillar} ${h}`).toBe('only_ji')
    }
  })
})
