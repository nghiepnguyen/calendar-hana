import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/mansion-content-golden-v1.json'
import manifest from '../almanac-data/manifest.json'
import {
  getMansionContent,
  getMansionContentEvidence,
  presentMansionContent,
} from './mansionContentAuthority'
import { getMansion } from './mansions'

describe('1880 Ngọc Hạp content authority, independent visual golden', () => {
  it.each(golden.items)('$name: clauses, scope, operands and provenance', (expected) => {
    const actual = getMansionContent(expected.index)
    expect(actual).toEqual({
      ...expected,
      authorityId: golden.authorityId,
      version: golden.version,
      source: golden.source,
    })
    const evidence = getMansionContentEvidence(actual)
    expect(evidence).toHaveLength(expected.clauses.length)
    expected.clauses.forEach((c, i) =>
      expect(evidence[i]).toMatchObject({
        activityId: c.activityId,
        scope: c.scope,
        polarity: c.polarity,
        sourceQuote: c.quote,
        conditions: c.conditions,
        exceptions: c.exceptions,
        confidence: 'medium',
        status: 'informational',
        scoreDelta: 0,
        rawDelta: 0,
      }),
    )
    expect(evidence.every((r) => r.sourceRef.includes(`page/n${expected.pdfPage - 1}.jpg`))).toBe(
      true,
    )
    const view = presentMansionContent(actual)
    expect(view.sourceLabel).toBe('Ngọc Hạp · bản 1880')
    expect(view.shouldDo).not.toContain('Mọi việc')
    expect(view.shouldAvoid).not.toContain('Không kỵ')
  })
  it('keeps unmentioned activities unknown and narrowly scoped excerpts separate', () => {
    const all = golden.items.flatMap((r) => getMansionContentEvidence(getMansionContent(r.index)))
    expect(all.filter((r) => r.activityId === 'water_travel').map((r) => r.ruleId)).toEqual([
      'mansion-content-yuxia-1880-v1:氐-4',
    ])
    expect(all.filter((r) => r.activityId === 'travel')).toEqual([])
    expect(
      all.some((r) =>
        ['boat_building', 'boat_launching', 'general_positive', 'general_no_taboos'].includes(
          r.scope,
        ),
      ),
    ).toBe(false)
    expect(
      all
        .filter((r) => r.activityId === 'grave_repair')
        .every((r) => r.scope === 'funeral_grave_repair'),
    ).toBe(true)
    expect(all.some((r) => r.activityId === 'groundbreaking')).toBe(false)
  })
  it('does not infer that a good legacy label permits every activity', () => {
    const row = getMansionContent(3)
    expect(row.clauses.map((c) => c.activityId)).toEqual(['construction', 'burial', 'wedding'])
    expect(getMansionContent(11).clauses.find((c) => c.activityId === 'burial')?.polarity).toBe(
      'negative',
    )
    expect(getMansionContent(19).clauses.some((c) => c.activityId === 'burial')).toBe(true)
    expect(getMansionContent(23).clauses.some((c) => c.activityId === 'burial')).toBe(true)
  })
  it('rejects invalid indices and a clause with a missing/wrong operand', () => {
    for (const index of [-1, 28, NaN, 1.5]) expect(() => getMansionContent(index)).toThrow()
    const row = getMansionContent(0)
    expect(() =>
      getMansionContentEvidence({
        ...row,
        clauses: row.clauses.map((c) => ({ ...c, conditions: [] })),
      }),
    ).toThrow()
    expect(() => getMansionContentEvidence({ ...row, index: 1 })).toThrow()
  })
  it('cannot promote an unaudited record or a different authority', () => {
    const row = getMansionContent(0)
    expect(() =>
      getMansionContentEvidence({ ...row, reviewStatus: 'UNKNOWN' } as unknown as typeof row),
    ).toThrow()
    expect(() => getMansionContentEvidence({ ...row, authorityId: 'other' })).toThrow()
    expect(manifest.policies.mansion28ScoringEnabled).toBe(false)
  })
  it('retains an explicit exception as evidence without turning it into a score', () => {
    const row = getMansionContent(0)
    const clauses = [
      {
        ...row.clauses[0],
        exceptions: ['Synthetic exception: preserve wording; do not apply a score.'],
      },
    ]
    expect(getMansionContentEvidence({ ...row, clauses })[0].exceptions).toEqual(
      clauses[0].exceptions,
    )
  })
  it('production dates attach the correct content while preserving identity and legacy fields', () => {
    for (let jd = 2461319; jd < 2461347; jd++) {
      const row = getMansion(jd)
      expect(row.content.index).toBe(row.index)
      expect(row.content.name).toBe(row.name)
      expect(row.shouldDo).toBeTruthy()
    }
  })
})
