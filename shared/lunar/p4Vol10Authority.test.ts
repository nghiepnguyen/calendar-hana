import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-vol10-authority.json'
import classes from '../almanac-data/p4-vol10-god-classes.json'
import golden from '../almanac-data/golden-p4-vol10-authority.json'
import good from '../almanac-data/good-gods.json'
import bad from '../almanac-data/bad-gods.json'
import lock from '../../docs/audits/sources/p4-vol10/lock.json'
import { classifyP4Annotation } from './p4Annotation'

const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

// These are pre-scoring authority/contract gates. No production resolver or scorer supplies expected.
describe('P4 frozen source and partial Golden', () => {
  it.each(lock.files)('preserves frozen bytes: $path', ({ path, sha256 }) => {
    expect(hash(path)).toBe(sha256)
  })

  it('checks every quoted Unicode code-point offset against the frozen raw source', () => {
    const quotes = [
      ...authority.grades.map((g) => g.prose),
      ...authority.puzhu.map((p) => p.raw),
      ...classes.items.flatMap((g) => g.sourceRefs),
    ]
    for (const q of quotes) {
      expect(source.slice(q.offset, q.offset + Array.from(q.text).length).join('')).toBe(q.text)
    }
    expect(authority.puzhu).toHaveLength(28)
  })

  it('accounts for all 66 cells, including blanks, without conflating blank with no annotation', () => {
    const expected = authority.columns.flatMap((c) =>
      authority.grades.map((g) => `${c.han}:${g.id}`),
    )
    const actual = authority.cells.map((c) => `${c.subject}:${c.gradeRows[0]}`)
    expect(new Set(actual).size).toBe(66)
    expect([...actual].sort()).toEqual([...expected].sort())
    for (const cell of authority.cells) {
      expect(cell.gradeRows).toHaveLength(1)
      expect(cell.isBlank).toBe(cell.displayReading === '')
      expect(cell.locator).toContain(cell.subject)
    }
  })

  it('covers every catalog god without introducing a fixed source rank from a product weight', () => {
    const ids = [...good.items, ...bad.items].map((g) => g.id)
    expect(classes.items.map((g) => g.godId).sort()).toEqual(ids.sort())
    expect(new Set(classes.items.map((g) => g.godId)).size).toBe(53)
    for (const god of classes.items) {
      expect(god.canonicalRank).toBeNull()
      expect(god.classes.length).toBeGreaterThan(0)
      expect(god.sourceRefs.length).toBeGreaterThan(0)
      expect(god.classOrigin).toBe('encoding_of_source_role_not_numeric_rank')
    }
    expect(classes.deHeGodIds).toEqual([
      'thien_duc',
      'nguyet_duc',
      'thien_duc_hop',
      'nguyet_duc_hop',
    ])
    expect(classes.deHeGodIds).not.toContain('thoi_duc')
    expect(classes.bareDeResolved).toBe(false)
  })

  it.each(golden.localGradeCases)('has a source-table witness for $id', (c) => {
    const cell = authority.cells.find(
      (cell) => cell.subject === c.subject && cell.gradeRows[0] === c.expectedLocalGrade,
    )
    expect(cell).toBeDefined()
    const months = cell!.displayReading.split(' / ').map((s) => s.split('：')[0]!)
    expect(months.some((s) => s.includes(c.monthJian))).toBe(true)
    expect(c.expectedGlobalGrade).toBe('undetermined')
  })

  it.each(golden.gradeActionCases)(
    'keeps grade action separate from final annotation: $id',
    (c) => {
      const grade = authority.grades.find((g) => g.id === c.grade)!
      expect(c.hasDe ? grade.withDe : grade.withoutDe).toBe(c.expectedGradeAction)
      expect(c.finalAnnotation).toBe('undetermined')
    },
  )

  it('enumerates exactly the valid 720 context inputs without claiming a score oracle', () => {
    expect(golden.contexts).toHaveLength(720)
    expect(new Set(golden.contexts.map((c) => `${c.monthJian}:${c.dayPillar}`)).size).toBe(720)
    const stems = '甲乙丙丁戊己庚辛壬癸'
    const branches = '子丑寅卯辰巳午未申酉戌亥'
    for (const c of golden.contexts) {
      expect(stems.indexOf(c.dayPillar[0]!) % 2).toBe(branches.indexOf(c.dayPillar[1]!) % 2)
      expect(c.expectedGlobalGrade).toBe('undetermined')
      expect(c.scoreExpected).toBeNull()
    }
  })

  it('retains source reading corrections and prevents premature scoring certification', () => {
    expect(authority.scoringReady).toBe(false)
    expect(lock.scoringReady).toBe(false)
    const conflict = authority.cells.find((c) => c.id === 'hai:ci')!
    expect(conflict.displayReading).toContain('寅月：相日、六害、月刑')
    expect(conflict.unresolved).not.toContain('P4-A02')
    expect(
      authority.editorialCorrections.some(
        (c) => 'resolvedIssue' in c && c.resolvedIssue === 'P4-A02',
      ),
    ).toBe(true)
    expect(authority.issues.map((i) => i.id)).toEqual(['P4-A03', 'P4-A04', 'P4-A05'])
    expect(authority.issues.find((i) => i.id === 'P4-A05')!.activation).toContain('No universal')
  })

  it('keeps all nine 百忌日 outside balancing', () => {
    expect(golden.protectedCases).toHaveLength(9)
    for (const c of golden.protectedCases) {
      const god = classes.items.find((g) => g.godId === c.godId)!
      expect(god.classes).toContain('protected_baiji')
      expect(god.balancingCandidate).toBe(c.expectedBalancingEligible)
      expect(c.expectedProtectedJi).toBe(true)
    }
  })

  it('requires policy labels and excludes default penalties from balancing', () => {
    // Contract fixture only: penalty adapter must not be implemented until the source gate is met.
    for (const c of golden.policyPenaltyCases) {
      if (c.expectedDelta < 0) {
        expect(c.clauseMatch).toBe('match')
        expect(c.expectedOrigin).toBe('product_policy')
        expect(c.expectedBalancingEligible).toBe(false)
      } else {
        expect(c.expectedDelta).toBe(0)
      }
    }
    expect(golden.policyPenaltyCases.find((c) => c.clauseMatch === 'unknown')!.expectedDelta).toBe(
      0,
    )
    expect(golden.policyPenaltyCases.find((c) => c.existingNegative)!.expectedDelta).toBe(0)
  })
})

describe('P4 annotation contract (audit only)', () => {
  it.each(golden.annotationCases)('distinguishes source annotation: $id', (c) => {
    expect(classifyP4Annotation(c)).toBe(c.expected)
  })
  it('preserves unknown when either side has not been resolved', () => {
    expect(classifyP4Annotation({ yi: true, ji: undefined, explicitNeither: false })).toBe(
      'undetermined',
    )
    expect(classifyP4Annotation({ yi: undefined, ji: false, explicitNeither: false })).toBe(
      'undetermined',
    )
  })
  it('rejects contradictory no-annotation evidence instead of silently overriding it', () => {
    expect(() => classifyP4Annotation({ yi: true, ji: false, explicitNeither: true })).toThrow(
      RangeError,
    )
    expect(() => classifyP4Annotation({ yi: false, ji: true, explicitNeither: true })).toThrow(
      RangeError,
    )
  })
})
