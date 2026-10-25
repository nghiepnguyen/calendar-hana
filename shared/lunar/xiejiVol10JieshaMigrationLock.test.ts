import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import p4Golden from '../../docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'
import lock from '../../docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/lock.json'
import summary from '../../docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/migration-summary.json'
import { lockFileDigests } from './lockAnchor'

const GOLDEN_LOCK = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'

// Audit lock of the 卷十 劫煞 Option C v1 production projection (docs/audits/p4-jiesha-option-c-migration.md).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('卷十 劫煞 Option C v1 migration lock', () => {
  it('pins the artifacts, the approved candidate and the old Golden bytes', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    for (const [path, hash] of Object.entries(lock.unchanged)) expect(sha(path), path).toBe(hash)
    expect(sha(lock.approvedCandidate.path)).toBe(lock.approvedCandidate.sha256)
  })

  it('P4 Golden v2 is byte-identical', () => {
    // Inputs outside the Golden directory as committed at its anchor (G2 Stage 2 adds a 卷十 alias).
    const files = p4Golden.files as { path: string; sha256: string }[]
    const got = lockFileDigests(
      GOLDEN_LOCK,
      files.map((f) => f.path),
    )
    for (const f of files) expect(got.get(f.path), f.path).toBe(f.sha256)
  })

  it('actual impact 1900–2100: in scope only, -15 per changed activity, no 2025–2027 activity change', () => {
    const i = summary.impact
    expect([i.scopeDates, i.affectedDates, i.rowsOutsideScope]).toEqual([1636, 1615, 0])
    expect([i.verdictChanges, i.verdictChangesWithoutScoreEffect2025_2027]).toEqual([17631, 211])
    expect([i.rawScoreChanges, i.effectiveScoreChanges, i.visibleActivityChanges]).toEqual([
      17420, 17420, 17420,
    ])
    expect(i.scoreDelta).toEqual({ '-15': 17420 })
    expect(i.cellOfChangedRows).toEqual({ avoid: 17420 })
    expect(i.activityRowsIn2025_2027).toBe(0)
    expect(i.eventClassificationChanges).toEqual({
      'move_house:caution→not_recommended': 1022,
      'wedding:caution→not_recommended': 818,
      'groundbreaking:caution→not_recommended': 424,
      'open_business:caution→not_recommended': 312,
    })
  })

  it('reconciles with the d79b08e simulator in approved categories only, no residual', () => {
    const r = summary.reconciliation.d79b08eSimulator
    expect(r.residualActivities).toEqual([])
    expect(r.residualEvents).toEqual([])
    expect(Object.keys(r.activities).sort()).toEqual([
      'identical',
      'productionOnly 未-壬申 (P17-A, approved authority)',
      'simulatorOnly2025_2027 (P4 candidate; P4 not migrated)',
    ])
    for (const a of ['demolition', 'contract', 'transaction'] as const) {
      const g = r.glyphActivities[a]
      expect([g.simulatorOutside2025_2027, g.productionOutside2025_2027], a).toEqual([0, 0])
    }
  })
})
