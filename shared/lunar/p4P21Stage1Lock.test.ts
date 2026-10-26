import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import evidence from '../../docs/audits/sources/p4-vol10/p21-stage1/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/p21-stage1/lock.json'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { committedWithDigest } from './lockAnchor'

// Audit only: P21 Stage 1 (docs/audits/p21-authority-reconstruction.md). Freezes the puzhu:21 不註 scope
// reconstruction (UNDERDETERMINED), its affected set and the analogue tally; production is unchanged.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('P21 Stage 1 authority reconstruction lock', () => {
  it('pins the evidence, projection, harness, sources and witness pages', () => {
    // Out-of-dir files may move on later (owner rule 2026-10-17, lockAnchor.ts): then the committed digest holds.
    const DIR = 'docs/audits/sources/p4-vol10/p21-stage1/'
    for (const [path, hash] of Object.entries(lock.files))
      if (path.startsWith(DIR)) expect(sha(path), path).toBe(hash)
      else expect(sha(path) === hash || committedWithDigest(path, hash), path).toBe(true)
  })

  it('freezes the affected set: 6 contexts, 8 dated cells, all 立券交易 with 五離 independent', () => {
    const s = evidence.affectedCells.summary
    expect([s.contextLevel.cells, s.contextLevel.divergent, s.contextLevel.blocked]).toEqual([
      6, 6, 0,
    ])
    expect([s.dated2025_2027.cells, s.dated2025_2027.divergent]).toEqual([8, 8])
    expect(s.contextLevel.headings).toEqual(['立券交易'])
    for (const c of [
      ...evidence.affectedCells.contextLevel,
      ...evidence.affectedCells.dated2025_2027,
    ])
      expect([c.independent, c.h1, c.h2]).toEqual([['五離'], 'neither_recorded', 'only_ji'])
  })

  it('only 未-戊申 has a settled trigger premise; the rest depend on P4-劫 or X相抵', () => {
    const st = Object.fromEntries(
      Object.entries(evidence.triggerPremise).map(([k, v]) => [k, v.status.split(' ')[0]]),
    )
    expect(st).toEqual({
      '未-壬申': 'P4_LAYER_ONLY:',
      '未-丙申': 'P4_LAYER_ONLY:',
      '未-戊申': 'SETTLED_BY_LOCAL_OWNER_RULING',
      '未-庚申': 'P4_LAYER_ONLY:',
      '亥-癸酉': 'UNAUDITED:',
      '亥-丁酉': 'UNAUDITED:',
    })
  })

  it('the same-system analogue puzhu:22 is split, so the conclusion is UNDERDETERMINED', () => {
    const t = evidence.analogousPatterns.puzhu22Tally
    expect(t.fitsH1).toEqual(['辰-己巳', '辰-辛巳', '辰-癸巳', '辰-乙巳'])
    expect(t.fitsH2).toEqual(['戌-乙亥', '戌-丁亥', '戌-己亥'])
    expect(t.nonDiscriminating).toContain('未-戊申')
    expect(evidence.conclusion).toBe('UNDERDETERMINED')
    expect(evidence.dependencies['Y-CONVENTION']).toMatch(/^NONE/)
    expect(evidence.productionChanged).toBe(false)
  })

  it('production authority is still p4b-puzhu06-v5', () => {
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
    expect(evidence.productionAuthority).toBe(P4_PUZHU06_AUTHORITY_ID)
  })
})
