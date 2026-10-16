import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p5-warehouse-v1.json'

// P5 task 3: the warehouse Golden is derived by p5-warehouse-golden-v1/derive.py (independent
// Python) and frozen before implementation; this gate keeps its bytes and record counts fixed.
const DIR = 'docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

describe('P5 warehouse Golden (frozen, audit-only)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('pins every block and the authority', () => {
    expect(index.status).toBe('HASH_LOCKED_PRE_IMPLEMENTATION')
    expect(sha256(readFileSync(index.authority.path)), index.authority.path).toBe(
      index.authority.sha256,
    )
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toEqual({ fixtures: 167, propagation: 16, context1440: 1440, dated1095: 1095 })
    for (const b of index.blocks) expect(sha256(readFileSync(b.path)), b.path).toBe(b.sha256)
  })

  it('records the dated 修倉庫 split and 0 engine-baseline mismatches', () => {
    const summary = JSON.parse(readFileSync(DIR + 'summary.json', 'utf8'))
    expect(summary.dated1095.xiu_cang_ku).toEqual({ no_yi: 506, source_dependent: 1, yi: 588 })
    expect(summary.dated1095.sourceDependentDates).toEqual(['2025-10-08'])
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.engineBaseline.mismatches).toBe(0)
    expect(v.priorLocks.drift).toEqual([])
  })
})
