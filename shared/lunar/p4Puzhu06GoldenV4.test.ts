import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p4b-puzhu06-v4.json'

// F1 Stage 3 (owner R2): Golden v4 (authority v4) is derived by p4b-puzhu06-golden-v4/derive.py, a copy of the
// v3 derive with the authority and the v3 → v4 checks moved; v1–v3 stay frozen.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v4/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

describe('puzhu:06 Golden v4 (F1 R2)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('pins every block, input, the authority and the v3 parent', () => {
    expect(index.authority.version).toBe('p4b-puzhu06-v4')
    for (const f of [index.parent, index.authority, ...index.inputs, ...index.blocks])
      expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toEqual({ fixtures: 105, dated1095: 5475, context720: 3600, propagation: 0 })
  })

  it('moves exactly the 12 R2 立券交易 rows from lift to keep', () => {
    const summary = JSON.parse(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(summary.decision).toEqual({ Q1: 'no', Q2: 'no', Q3: 'no', Q4: 'yes', Q4a: 'block', R2: 'block' })
    expect(summary.dated1095.byAction.lift).toEqual({
      立券交易: 13,
      納財: 13,
      開倉庫出貨財: 17,
      開市: 13,
    })
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.engineBaseline.mismatches).toBe(0)
    expect(v.prdCounts.match).toBe(true)
    expect(v.v3ToV4).toMatchObject({ changedRows: 12, unexpected: 0, propagationChanges: 0 })
    expect(v.v3ToV4.rows.every((r: string) => / 立券交易 keep /.test(r))).toBe(true)
    // The two 未-戊申 開倉庫出貨財 propagation-blocked notes of v3 disappear; their state stays only_ji.
    expect(v.v3ToV4.propagationDiffVsV3).toHaveLength(2)
    expect(v.propagationMirror.dated).toEqual({ days: 1095, rows: 31755, mismatches: 0 })
  })
})
