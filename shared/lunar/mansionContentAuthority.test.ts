import { describe, expect, it } from 'vitest'
import golden from './audit-fixtures/mansion-content-golden-v1.json'
import manifest from '../almanac-data/manifest.json'
import {
  getMansionContent,
  getMansionContentEvidence,
  presentMansionContent,
} from './mansionContentAuthority'
import { getMansion } from './mansions'

// Interpretation layer changes since the Phase 7 freeze (EXPECTED_AUTHORITY_MIGRATION_CHANGE):
// the source lock and its golden stay untouched; only evidence derived from them changes.
const CATALOG_ADDED: Record<string, string> = {
  door_opening: 'door_opening',
  waterworks: 'waterworks',
}
const NON_OPERATIVE = ['星-4']
const expectedEvidence = (clauses: (typeof golden.items)[number]['clauses']) =>
  clauses
    .filter((c) => !NON_OPERATIVE.includes(c.id))
    .map((c) => ({ ...c, activityId: c.activityId || (CATALOG_ADDED[c.scope] ?? '') }))

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
    const clauses = expectedEvidence(expected.clauses)
    expect(evidence).toHaveLength(clauses.length)
    clauses.forEach((c, i) =>
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
        activityMapping: { authorityId: golden.authorityId, clauseId: c.id },
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
    expect(all.filter((r) => r.activityId === 'door_opening')).toHaveLength(19)
    expect(all.filter((r) => r.activityId === 'waterworks')).toHaveLength(20)
    expect(all.some((r) => r.activityId === 'opening')).toBe(false)
  })
  it('keeps a consequence line in the source lock but out of activity evidence', () => {
    const row = getMansionContent(24)
    expect(row.clauses.some((c) => c.id === '星-4')).toBe(true)
    const evidence = getMansionContentEvidence(row)
    expect(evidence.some((r) => r.ruleId.endsWith(':星-4'))).toBe(false)
    expect(evidence.some((r) => r.activityId === 'wedding')).toBe(false)
    expect(presentMansionContent(row).shouldAvoid).not.toContain('Cưới hỏi')
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
  it('keeps scan corrections verified on full-resolution pages (2026-10-10)', () => {
    // GOLDEN_BUG fix: the 1880 print binds 參 (n64) before 觜 (n65); 角 reads 惟有葬埋不可用.
    const page = (index: number) => getMansionContentEvidence(getMansionContent(index))[0].sourceRef
    expect(page(18)).toMatch(/page\/n63\.jpg$/)
    expect(page(19)).toMatch(/page\/n65\.jpg$/)
    expect(page(20)).toMatch(/page\/n64\.jpg$/)
    expect(page(21)).toMatch(/page\/n66\.jpg$/)
    expect(getMansionContent(0).clauses.find((c) => c.id === '角-3')!.quote).toBe('惟有葬埋不可用')
  })
  it('keeps quotes corrected by the secondary review against the scan (2026-10-20)', () => {
    const quote = (index: number, id: string) =>
      getMansionContent(index).clauses.find((c) => c.id === id)!.quote
    expect(quote(1, '亢-2')).toBe('埋葬若還逢此日')
    expect(quote(3, '房-2')).toBe('埋葬若然用此日')
    expect(quote(4, '心-2')).toBe('埋葬卒暴死相從')
    expect(quote(7, '斗-2')).toBe('墳堂修築富貴來')
    expect(quote(13, '壁-2')).toBe('婚姻吉利生貴子')
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
