import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p4b-puzhu06-v5.json'

// Q4-REST Stage 3: Golden v5 (authority v5) is derived by p4b-puzhu06-golden-v5/derive.py, a copy of the v4 derive
// with QL_NARROW, the scoped only_ji rule and the v4 → v5 checks; v1–v4 stay frozen.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v5/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

describe('puzhu:06 Golden v5 (Q4-REST)', () => {
  it('matches its lock and rederives byte-identically', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    execFileSync('python3', ['-I', DIR + 'derive.py'], { maxBuffer: 1 << 26 })
  }, 300_000)

  it('pins every block, input, the authority and the v4 parent', () => {
    expect(index.authority.version).toBe('p4b-puzhu06-v5')
    for (const f of [index.parent, index.authority, ...index.inputs, ...index.blocks])
      expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toEqual({ fixtures: 105, dated1095: 5475, context720: 3600, propagation: 0 })
  })

  it('moves exactly the 56 v4 QL lift rows to keep; 37 read only_ji under the scoped rule', () => {
    const summary = JSON.parse(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(summary.decision).toMatchObject({
      Q4: 'yes',
      Q4a: 'block',
      R2: 'block',
      'R-JK': 'block',
      'R-WX': 'block',
      'R-XH': 'block',
    })
    expect(summary.dated1095.byAction.lift).toBeUndefined()
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.engineBaseline.mismatches).toBe(0)
    expect(v.prdCounts.match).toBe(true)
    expect(v.v4ToV5).toMatchObject({
      changedRows: 56,
      unexpected: 0,
      onlyJi: 37,
      tagOnlyRows: 40,
      propagationChanges: 0,
    })
    expect(v.v4ToV5.rows.every((r: string) => / keep /.test(r) && /QL_NARROW/.test(r))).toBe(true)
  })
})
