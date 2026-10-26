import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import families from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/semantic-families.json'
import diag from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/diagnostic-impact.json'
import f1y from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/f1-y.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/lock.json'
import population from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/production-population.json'
import provenance from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/provenance.json'
import source from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a1/source-pattern.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: Q4-REST Stage 2A.1 (docs/audits/p4-q4-rest-stage2a1-y-axis-impact.md). Freezes audit facts: the
// source pattern, the production both_present population, provenance and the DIAGNOSTIC Y-NARROW impact.
// Y-NARROW is not approved behaviour; nothing here expects production to follow it.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2a1/'
const files = lock.files as Record<string, string>
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Q4-REST Stage 2A.1 Y-axis lock', () => {
  it('pins the runtime dump, the artifacts, Stage 1/2A locks, production code and Golden v4', () => {
    for (const [path, hash] of Object.entries(files)) expect(sha(path), path).toBe(hash)
  })

  it('the builder is deterministic (rebuilt into a temp dir; the tree is never written)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r2a1-'))
    execFileSync('python3', ['-I', DIR + 'build_evidence.py', out])
    for (const n of [
      'source-pattern.json',
      'production-population.json',
      'semantic-families.json',
      'f1-y.json',
      'provenance.json',
      'diagnostic-impact.json',
      'acquisition-plan-v3.json',
    ])
      expect(sha(join(out, n)), n).toBe(files[DIR + n])
    expect(sha(join(out, 'lock.json'))).toBe(sha(DIR + 'lock.json'))
  })

  it('source pattern: 21 rows, all only_ji, 5 god × 宜-source patterns on 7 pages, suppressors excluded', () => {
    expect(source.rawRows).toBe(21)
    expect(
      source.rows.every((r) => r.printed === 'only_ji' && r.production === 'both_present'),
    ).toBe(true)
    expect([
      source.independentPatternCount,
      source.witnessPages.length,
      source.counterexamples,
    ]).toEqual([5, 7, 0])
    expect(source.families).toEqual({ U2_SOLE_OFFICER_YI: 13, U3_SOLE_JISHEN_YI: 8 })
    expect(source.excluded.EXPLAINED_BY_RULE).toEqual(['06067693-n95 安葬'])
  })

  it('production population: 1,110 both_present rows with a surviving ungraded 忌 (2025–2027)', () => {
    expect([population.total, population.days, population.contexts]).toEqual([1110, 348, 158])
    expect(population.byTarget).toEqual({
      九空: 80,
      五虛: 69,
      小耗: 29,
      五墓: 99,
      五離: 67,
      other: 779,
    })
    expect(population.coverage.total).toEqual({
      DIRECT_SOURCE_COVERED: 47,
      PATTERN_COVERED: 152,
      UNCOVERED: 911,
    })
  })

  it('both_present provenance is an implementation default, inherited by F1 rule 3', () => {
    expect(provenance.classification).toMatch(
      /^IMPLEMENTATION_DEFAULT, accepted wholesale in Golden v2/,
    )
    expect(families.u7Split).toEqual({
      U7a_SELF_PROTECTED_UNGRADED: 741,
      U7b_BAIJI_ZHUANJI: 14,
      U7c_DATED: 6,
      U7d_SUBJECT_OR_OTHER: 6,
    })
    expect(provenance.sixGrades.ungradedVsYiDefined).toBe(false)
    expect(provenance.sixGrades.absenceImplies).toMatch(/^NO_CONCLUSION/)
  })

  it('F1-Y: 4 R2 rows on 丑-甲申 / 午-戊申, semantic only; 67 五離 rows in all', () => {
    expect(f1y.lijuanRows.map((r) => [r.date, r.context])).toEqual([
      ['2025-01-15', '丑-甲申'],
      ['2025-06-08', '午-戊申'],
      ['2026-01-10', '丑-甲申'],
      ['2027-01-05', '丑-甲申'],
    ])
    expect([f1y.lijuanDirectlyCovered, f1y.lijuanAllRows, f1y.productionRows]).toEqual([0, 21, 67])
    expect(f1y.classification).toBe('F1Y-B')
  })

  it('diagnostic Y-NARROW impact (not production)', () => {
    expect(diag.model).toMatch(/diagnostic only/)
    const pick = (x: { headingRows: number; activityRows: number; eventRecords: number }) => [
      x.headingRows,
      x.activityRows,
      x.eventRecords,
    ]
    expect(pick(diag.all)).toEqual([1110, 1082, 1330])
    expect(pick(diag.evidence)).toEqual([198, 211, 354])
    expect(pick(diag.f1y)).toEqual([61, 68, 224])
    expect(pick(diag.u7)).toEqual([767, 714, 648])
    for (const x of [diag.all, diag.evidence, diag.f1y, diag.u7])
      expect([x.hardWarningChanges, x.eventClassificationChanges]).toEqual([0, 0])
    expect(diag.goldensChanged).toBe(false)
  })

  it('production stays v4; F1 R2 J-axis and G2/W1 unchanged', () => {
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
    expect(ruling.decision).toBe('R2_APPROVED')
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
