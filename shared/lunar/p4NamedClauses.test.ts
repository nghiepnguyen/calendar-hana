import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import golden from '../almanac-data/golden-p4-named-clauses.json'
import lock from '../../docs/audits/sources/p4-vol10/named-clauses-lock.json'
import {
  matchP4PillarRules,
  resolveP4NamedDeferral,
  resolveP4HeadingClause,
} from './p4NamedClauses'

const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
describe('P4 named canonical clauses, audit only', () => {
  it('preserves source-derived predicates and exact quotation offsets', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const refs = [
      ...clauses.pillarRules.flatMap((r) => [r.source, r.paragraph]),
      ...clauses.namedDeferrals.flatMap((r) => [
        r.source,
        ...('additionalSource' in r && r.additionalSource ? [r.additionalSource] : []),
      ]),
      clauses.nonDeferral.source,
      ...Object.values(clauses.headingClause),
    ]
    for (const r of refs)
      expect(source.slice(r.offset, r.offset + Array.from(r.text).length).join('')).toBe(r.text)
    expect(clauses.scoringReady).toBe(false)
  })
  // Hand-derived expectations, deliberately independent of the predicate matcher.
  it.each(golden.pillarCases)(
    'matches $monthJian月$pillar from the independent source oracle',
    ({ monthJian, pillar, expectedRuleIds }) => {
      expect(matchP4PillarRules(monthJian, pillar, true).rules.map((r) => r.id)).toEqual(
        expectedRuleIds,
      )
    },
  )
  it('does not activate predicates when applicability is unknown or false', () => {
    expect(matchP4PillarRules('午', '丙午', undefined)).toEqual({
      status: 'undetermined',
      rules: [],
    })
    expect(matchP4PillarRules('午', '丙午', false)).toEqual({ status: 'not_applicable', rules: [] })
    expect(matchP4PillarRules('午', '甲午', true).status).toBe('no_named_override')
  })
  it.each([
    ['月建', '午', '月厭'],
    ['月建', '酉', '月刑'],
    ['月害', '寅', '月刑'],
    ['月害', '申', '平日'],
    ['月害', '巳', '刼煞'],
    ['月刑', '午', '月厭'],
    ['天吏', '子', '月刑'],
    ['大時', '卯', '月刑'],
    ['平日', '寅', '月刑'],
    ['平日', '子', '月刑'],
    ['平日', '辰', '月煞'],
    ['收日', '寅', '刼煞'],
    ['收日', '丑', '月刑'],
    ['閉日', '亥', '月煞'],
    ['災煞', '酉', '月破'],
  ] as const)('follows the named %s/%s edge', (subject, month, target) => {
    expect(resolveP4NamedDeferral(subject, month, true).target).toBe(target)
    expect(resolveP4NamedDeferral(subject, month, undefined).status).toBe('undetermined')
  })
  it('never substitutes a universal worst grade for missing deferral', () => {
    expect(resolveP4NamedDeferral('月害', '辰', true)).toEqual({ status: 'no_named_deferral' })
    expect(resolveP4NamedDeferral('月害', '戌', true)).toEqual({ status: 'no_named_deferral' })
    expect(resolveP4NamedDeferral('月害', '寅', false)).toEqual({ status: 'not_applicable' })
  })
  it.each(['cancel_annotations', 'lift_ji'] as const)(
    'keeps unknown applicability unresolved for %s',
    (action) => {
      expect(
        resolveP4HeadingClause(
          { yi: true, ji: true, explicitNeither: false },
          action,
          undefined,
          false,
        ),
      ).toBe('undetermined')
    },
  )
  it('cancels only a proven listed heading, without equating blank with neutral', () => {
    expect(
      resolveP4HeadingClause(
        { yi: true, ji: true, explicitNeither: false },
        'cancel_annotations',
        true,
        false,
      ),
    ).toBe('neither_recorded')
    expect(
      resolveP4HeadingClause(
        { yi: false, ji: false, explicitNeither: false },
        'cancel_annotations',
        true,
        false,
      ),
    ).toBe('undetermined')
    expect(
      resolveP4HeadingClause(
        { yi: true, ji: true, explicitNeither: false },
        'cancel_annotations',
        false,
        false,
      ),
    ).toBe('both_present')
  })
  it('preserves a source-named persistent taboo and never manufactures 宜', () => {
    expect(
      resolveP4HeadingClause(
        { yi: true, ji: true, explicitNeither: false },
        'cancel_annotations',
        true,
        true,
      ),
    ).toBe('only_ji')
    expect(
      resolveP4HeadingClause({ yi: true, ji: true, explicitNeither: false }, 'lift_ji', true, true),
    ).toBe('both_present')
    expect(
      resolveP4HeadingClause(
        { yi: false, ji: true, explicitNeither: false },
        'lift_ji',
        true,
        false,
      ),
    ).toBe('undetermined')
    expect(
      resolveP4HeadingClause(
        { yi: true, ji: true, explicitNeither: false },
        'lift_ji',
        true,
        false,
      ),
    ).toBe('only_yi')
  })
  it('rejects invalid pillars instead of matching malformed input', () => {
    expect(() => matchP4PillarRules('午', '甲丑', true)).toThrow(RangeError)
    expect(() => matchP4PillarRules('正', '甲子', true)).toThrow(RangeError)
  })
})
