import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/ruling-lock.json'
import ruling from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/owner-ruling.json'
import summary from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/prediction-summary.json'

// Q4-REST Stage 3, commit 1 (docs/audits/p4-q4-rest-stage3-migration.md): the owner rulings and the prediction
// frozen on the v4 tree before any engine change. Later commits may not rewrite them.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Q4-REST Stage 3 owner ruling and prediction lock', () => {
  it('pins the ruling, the prediction and their inputs', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    execFileSync('python3', ['-I', 'docs/audits/sources/p4-vol10/q4-rest-stage3/build_ruling.py'])
  })

  it('four independent rulings adopted on 2026-10-26; non-decisions frozen', () => {
    expect([ruling.date, ruling.ruling]).toEqual(['2026-10-26', 'OWNER_RULING'])
    expect(
      Object.fromEntries(Object.entries(ruling.rulings).map(([k, v]) => [k, v.decision])),
    ).toEqual({
      'R-JK': 'ADOPT',
      'R-WX': 'ADOPT',
      'R-XH': 'ADOPT',
      'R-F1Y': 'ADOPT_ALL_21',
    })
    expect(ruling.nonDecisions).toContain('global Y-CONVENTION')
    expect(ruling.scopedY.measuredCombined).toBe(37)
  })

  it('the prediction reproduces Stage 2C and differs from it only on the 37 scoped-Y rows', () => {
    expect(summary.stage2C.reproduced).toBe(true)
    expect(summary.full.headingTransitions).toEqual({
      'both_present→only_ji': 21,
      'not_recorded→only_ji': 16,
      'only_yi→only_ji': 37,
    })
    expect([
      summary.full.decisionRows,
      summary.full.headingRows,
      summary.full.activityRows,
      summary.full.eventRows,
    ]).toEqual([96, 74, 121, 366])
    expect(summary.full.hardWarningChanges).toBe(0)
  })
})
