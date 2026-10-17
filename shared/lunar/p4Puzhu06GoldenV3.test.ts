import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p4b-puzhu06-v3.json'

// puzhu:06 task 5.1 fix: Golden v3 (authority v3, 相抵 state rule + propagation replay) is derived by
// p4b-puzhu06-golden-v3/derive.py and frozen before the composer fix; v1 and v2 stay frozen.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

describe('puzhu:06 Golden v3 (frozen, audit-only)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('pins every block, input, the authority and the v2 parent', () => {
    expect(index.status).toBe('HASH_LOCKED_PRE_IMPLEMENTATION')
    expect(index.authority.version).toBe('p4b-puzhu06-v3')
    for (const f of [index.parent, index.authority, ...index.inputs, ...index.blocks])
      expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toEqual({ fixtures: 105, dated1095: 5475, context720: 3600, propagation: 3 })
  })

  it('records the dated split under Q4a and changes only the 5 相抵 rows from v2', () => {
    const summary = JSON.parse(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(summary.decision).toEqual({ Q1: 'no', Q2: 'no', Q3: 'no', Q4: 'yes', Q4a: 'block' })
    expect(summary.dated1095.byAction.lift).toEqual({
      立券交易: 25,
      納財: 13,
      開倉庫出貨財: 17,
      開市: 13,
    })
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.engineBaseline.mismatches).toBe(0)
    expect(v.prdCounts.match).toBe(true)
    expect(v.v2ToV3).toMatchObject({ changedRows: 5, unexpected: 0, propagationChanges: 2 })
    expect(v.propagationMirror.dated).toEqual({ days: 1095, rows: 31755, mismatches: 0 })
    expect(v.propagationMirror.context).toEqual({ days: 720, rows: 20880, mismatches: 0 })
  })
})
