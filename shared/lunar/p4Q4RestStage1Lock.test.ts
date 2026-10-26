import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import evidence from '../../docs/audits/sources/p4-vol10/q4-rest-stage1/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage1/lock.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: Q4-REST Stage 1 (docs/audits/p4-q4-rest-stage1-witness-matrix.md). Freezes the witness corpus,
// the evidence and the production authority it was classified against; it locks no Q4 decision.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage1/'
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Q4-REST Stage 1 lock', () => {
  it('pins the pages, evidence, models, builder, inputs and production authority', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('the evidence builder is deterministic (rebuilt into a temp dir; the tree is never written)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r-'))
    execFileSync('python3', ['-I', DIR + 'build_evidence.py', out])
    for (const n of ['evidence.json', 'matrix.json', 'coverage.json', 'acquisition-plan.json'])
      expect(sha(join(out, n)), n).toBe((lock.files as Record<string, string>)[DIR + n])
    expect(sha(join(out, 'lock.json'))).toBe(sha(DIR + 'lock.json'))
  })

  it('27 candidates, all authenticated, every scan hash frozen', () => {
    expect(evidence.inventory.candidates).toBe(27)
    expect(evidence.candidates).toHaveLength(27)
    for (const c of evidence.candidates) {
      expect(c.authentication.status, c.witness).toBe('AUTHENTICATED')
      expect((lock.files as Record<string, string>)[c.path], c.witness).toBe(c.sha256)
    }
  })

  it('production stays on p4b-puzhu06-v4; Q4/Q4a/R2 untouched', () => {
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
    expect(evidence.productionChanged).toBe(false)
    expect(authority.ownerDecision.answers.Q4.answer).toBe('yes')
    expect(authority.ownerDecision.answers.Q4a.answer).toBe('block')
    expect(authority.liftExclusions.五墓.triggers).toEqual(['天德合', '月德合'])
    expect(Object.keys(authority.liftExclusions)).toEqual(['五墓', '五離'])
  })

  it('F1 R2 unchanged: 五離 × 立券交易 only', () => {
    expect([ruling.decision, ruling.excludedGods]).toEqual(['R2_APPROVED', ['九空', '五虛', '小耗', '五墓']])
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
    expect(evidence.f1.ruling).toBe('R2_APPROVED')
  })

  it('G2 / W1 stays CLOSED: 劫煞 × 立券交易 on 未-戊申 is BLANK / I1', () => {
    expect(evidence.g2W1).toBe('CLOSED')
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
