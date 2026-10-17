import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p4b-puzhu06-v1.json'

// puzhu:06 task 3.0: the Golden is derived by p4b-puzhu06-golden-v1/derive.py (independent Python)
// and frozen before the red tests and code; this gate keeps its bytes and record counts fixed.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

describe('puzhu:06 Golden (frozen, audit-only)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('pins every block, input and the authority', () => {
    expect(index.status).toBe('HASH_LOCKED_PRE_IMPLEMENTATION')
    for (const f of [index.authority, ...index.inputs, ...index.blocks])
      expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toEqual({ fixtures: 95, dated1095: 5475, context720: 3600 })
  })

  it('records the dated split under Q1-Q3 no, Q4 yes and 0 engine-baseline mismatches', () => {
    const summary = JSON.parse(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(summary.decision).toEqual({ Q1: 'no', Q2: 'no', Q3: 'no', Q4: 'yes' })
    expect(summary.dated1095.byAction.lift).toEqual({
      安牀: 3,
      立券交易: 28,
      納財: 13,
      開倉庫出貨財: 17,
      開市: 16,
    })
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.engineBaseline.mismatches).toBe(0)
    expect(v.prdCounts.match).toBe(true)
  })
})
