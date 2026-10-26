import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import evidence from '../../docs/audits/sources/p4-vol10/g2-n117-stage2/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/g2-n117-stage2/lock.json'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: G2-n117 Stage 2 (docs/audits/p4-g2-n117-stage2-resolution.md). Classification C: still
// UNRESOLVED_CONFLICT pending owner decisions D1/D2; it does not pick 宜 or 忌.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('G2-n117 Stage 2 resolution lock', () => {
  it('pins the evidence, Stage 1, the puzhu:06 sweep and the page scans', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('keeps Stage 1 and the unresolved state', () => {
    expect(evidence.stage1.ruling).toBe('UNRESOLVED_CONFLICT')
    expect(evidence.ruling).toBe('UNRESOLVED_CONFLICT')
    expect(evidence.classification).toBe('C')
    expect(evidence.ownerDecisionRequired).toBe(true)
    expect(evidence.sourceWitnessed).toBe(false)
  })

  it('no stored page isolates 五離 under a non-lifter puzhu:06 trigger; the two targets are QL-only', () => {
    expect(evidence.sweepScope.shenYouPages).toBe(11)
    expect(evidence.decisiveStored).toEqual([])
    expect(evidence.decisiveTargetsNotStored.map((t) => t.context)).toEqual(['戌-壬申', '戌-庚申'])
    for (const t of evidence.decisiveTargetsNotStored) {
      expect(t.derived!.立券交易.classes).toBe('QL')
      expect(t.derived!.rawJiSources立券交易).toEqual([
        { kind: 'remaining', name: '五離', effect: 'keep', state: 'kept' },
      ])
    }
    expect(evidence.puzhu06.inVol10Raw && evidence.puzhu21.inVol10Raw).toBe(true)
  })

  it('the 劫煞 cell stays BLANK (I1)', () => {
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
