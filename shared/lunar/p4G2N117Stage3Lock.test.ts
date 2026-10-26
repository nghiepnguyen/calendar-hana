import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/g2-n117-stage3/lock.json'
import ruling from '../../docs/audits/sources/p4-vol10/g2-n117-stage3/owner-ruling.json'
import authority from '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: G2-n117 Stage 3 (docs/audits/p4-g2-n117-stage3-owner-ruling.md). Freezes owner ruling D1(a):
// LOCAL, 未-戊申 × 劫煞 × 立券交易 = BLANK / I1; W1 closed. Encodes nothing about 五離 heading behaviour (F1).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('G2-n117 Stage 3 owner ruling lock', () => {
  it('pins the ruling and the frozen Stage 1/2 evidence', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('records D1(a) as a LOCAL owner ruling on one cell, W1 closed, F1 open', () => {
    expect(ruling.decision).toBe('D1(a)')
    expect(ruling.ruling).toBe('LOCAL_OWNER_RULING')
    expect(ruling.scope).toMatch(/^LOCAL: 未-戊申 × 劫煞 × 立券交易/)
    expect([ruling.context, ruling.entry, ruling.heading]).toEqual(['未-戊申', 'jie_sha', '立券交易'])
    expect(ruling.activities).toEqual(['contract', 'transaction'])
    expect(ruling.result).toBe('BLANK / I1')
    expect(ruling.witnessStatus).toMatch(/^NOT SOURCE_WITNESSED/)
    expect(ruling.notExtendedTo).toContain('開市')
    expect(ruling.w1).toBe('CLOSED')
    expect(ruling.f1).toMatch(/^OPEN \/ SEPARATE/)
  })

  it('the live cell is BLANK and no provenance claims SOURCE_WITNESSED', () => {
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
    const prov = JSON.stringify(authority.provenance).replaceAll('NOT SOURCE_WITNESSED', '')
    expect(prov).not.toMatch(/SOURCE_WITNESSED/)
  })
})
