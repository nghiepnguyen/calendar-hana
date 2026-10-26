import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../../docs/audits/sources/p4-vol10/p21-stage3/authority.json'
import eligibility from '../../docs/audits/sources/p4-vol10/p21-stage3/eligibility.json'
import golden from '../../docs/audits/sources/p4-vol10/p21-stage3/golden-manifest.json'
import impact from '../../docs/audits/sources/p4-vol10/p21-stage3/impact.json'
import lock from '../../docs/audits/sources/p4-vol10/p21-stage3/lock.json'
import spec from '../../docs/audits/sources/p4-vol10/p21-stage3/migration-spec.json'
import s2 from '../../docs/audits/sources/p4-vol10/p21-stage2/witnesses.json'
import { committedWithDigest } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'

// Audit only: P21 Stage 3 (docs/audits/p21-stage3-authority-freeze.md). Freezes the H2 semantic authority
// (not active) and the per-date migration eligibility; production is unchanged.
const DIR = 'docs/audits/sources/p4-vol10/p21-stage3/'
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('P21 Stage 3 authority freeze and eligibility lock', () => {
  it('pins Stage 3 artifacts and the Stage 1/2 locks they rest on', () => {
    for (const [path, hash] of Object.entries(lock.files))
      if (path.startsWith(DIR)) expect(sha(path), path).toBe(hash)
      else expect(sha(path) === hash || committedWithDigest(path, hash), path).toBe(true)
    expect(s2.newPages['06067696-n82.jpg'].sha256).toBe(
      '734614ab6f267635a62070c5517bd76b10046e363611766c26265fc08e7dab7e',
    )
    expect(s2.newPages['06067696-n106.jpg'].sha256).toBe(
      '805a2be9d61acd22e9a8516aaed3a68370b85b0c075dc8c198e8c2abf246212c',
    )
  })

  it('H2 is frozen as supported semantic authority, not active production authority', () => {
    expect([
      authority.rule,
      authority.semantic,
      authority.status,
      authority.productionStatus,
    ]).toEqual([
      'puzhu:21',
      'contribution-scoped-suppression',
      'SUPPORTED_SEMANTIC_AUTHORITY',
      'NOT_MIGRATED',
    ])
    expect(authority.evidence).toEqual(['P21S2-06067696-n82', 'P21S2-06067696-n106'])
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
  })

  it('every projected row has exactly one status', () => {
    const by = (s: string) => eligibility.rows.filter((r) => r.eligibility === s).map((r) => r.date)
    expect(eligibility.rows).toHaveLength(8)
    for (const r of eligibility.rows) expect(eligibility.statuses).toContain(r.eligibility)
    expect(by('MIGRATE')).toEqual(['2025-11-24', '2026-11-19', '2027-11-14'])
    expect(by('HOLD')).toEqual(['2026-08-02', '2027-07-28'])
    expect(by('QUARANTINE')).toEqual(['2025-07-26', '2026-07-21', '2027-07-16'])
    expect(by('NO_CHANGE')).toEqual([])
  })

  it('the Stage 4 spec and Golden manifest carry MIGRATE rows only', () => {
    const migrate = eligibility.rows.filter((r) => r.eligibility === 'MIGRATE').map((r) => r.date)
    const other = eligibility.rows.filter((r) => r.eligibility !== 'MIGRATE').map((r) => r.date)
    expect(spec.eligibleRows).toEqual(migrate)
    expect(spec.mustStayIdentical).toEqual(other)
    expect(spec.eligibleContexts).toEqual(['亥-丁酉', '亥-癸酉'])
    expect(golden.excludedRows).toEqual(other)
    expect(golden.changes.map((g) => g.expectedRecords)).toEqual([3, 2, 5, 6, 6])
    expect(impact.MIGRATION_ELIGIBLE_ONLY).toMatchObject({
      activityRows: 6,
      eventRecords: 27,
      eventClassificationChanges: 18,
      hardWarningChanges: 0,
    })
    expect(impact.ALL_H2_PROJECTED).toMatchObject({ activityRows: 16, eventRecords: 72 })
  })
})
