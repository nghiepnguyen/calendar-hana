import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import conclusion from '../../docs/audits/sources/p4-vol10/p21-stage2/conclusion.json'
import lock from '../../docs/audits/sources/p4-vol10/p21-stage2/lock.json'
import witnesses from '../../docs/audits/sources/p4-vol10/p21-stage2/witnesses.json'
import { committedWithDigest } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'

// Audit only: P21 Stage 2 (docs/audits/p21-stage2-discriminating-witness.md). Freezes the witness tally and the
// H2_SUPPORTED conclusion (scoped to puzhu:21); production is unchanged.
const DIR = 'docs/audits/sources/p4-vol10/p21-stage2/'
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const git = (...args: string[]) => execFileSync('git', args).toString().trim()
const added = (path: string) =>
  git('log', '--diff-filter=A', '--format=%H', '--', path).split('\n').pop()!

describe('P21 Stage 2 discriminating witness lock', () => {
  it('pins the evidence, harnesses, 卷十一 lists and every witness page', () => {
    for (const [path, hash] of Object.entries(lock.files))
      if (path.startsWith(DIR)) expect(sha(path), path).toBe(hash)
      else expect(sha(path) === hash || committedWithDigest(path, hash), path).toBe(true)
    expect(witnesses.newPages['06067696-n82.jpg'].sha256).toBe(
      '734614ab6f267635a62070c5517bd76b10046e363611766c26265fc08e7dab7e',
    )
    expect(witnesses.newPages['06067696-n106.jpg'].sha256).toBe(
      '805a2be9d61acd22e9a8516aaed3a68370b85b0c075dc8c198e8c2abf246212c',
    )
  })

  it('the predictions were committed before the new pages (freeze proof)', () => {
    const freeze = added(DIR + 'predictions.json')
    for (const page of ['pages/06067696-n82.jpg', 'pages/06067696-n106.jpg']) {
      const c = added(DIR + page)
      expect(c, page).not.toBe(freeze)
      expect(() => git('merge-base', '--is-ancestor', freeze, c)).not.toThrow()
    }
  })

  it('two blind CLEAN_H2 witnesses, no CLEAN_H1, conclusion scoped to puzhu:21', () => {
    const clean = witnesses.witnesses.filter((w) => w.classification.startsWith('CLEAN'))
    expect(clean.map((w) => [w.context, w.classification, w.observedTarget, w.blind])).toEqual([
      ['亥-癸酉', 'CLEAN_H2', 'printed', true],
      ['亥-丁酉', 'CLEAN_H2', 'printed', true],
    ])
    expect(conclusion.tally).toEqual({ CLEAN_H2: 2, NOT_DISCRIMINATING: 4, CONTAMINATED: 12 })
    expect(conclusion.conclusion).toBe('H2_SUPPORTED')
    expect(conclusion.scope).toMatch(/^puzhu:21 only/)
    expect(conclusion.gate.cleanH1).toEqual([])
    expect(conclusion.productionChanged).toBe(false)
  })

  it('production authority is still p4b-puzhu06-v5', () => {
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
  })
})
