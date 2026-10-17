import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import index from '../almanac-data/golden-p4-full-v1.json'

// Roadmap 7: full Golden P4 (resolution layer), derived in Python independently of the engine and frozen
// before any Golden ↔ engine comparison. Hash checks only; no engine import.
const DIR = 'docs/audits/sources/p4-vol10/p4-full-golden-v1/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
type Lock = {
  files: { path: string; sha256: string; role: string }[]
  noEngineInput: { violations: number; oracleOnly: Record<string, string> }
  diffClasses: { owner: Record<string, string>; golden: Record<string, string>; generic: string[] }
  engineComparisonPlan: Record<string, string>
}

describe('full Golden P4 v1 (frozen, audit-only)', () => {
  const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as Lock

  it('matches its lock', () => {
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('pins every block of the index', () => {
    expect(index.status).toBe('HASH_LOCKED_PRE_ENGINE_COMPARISON')
    for (const b of index.blocks) expect(sha256(readFileSync(b.path)), b.path).toBe(b.sha256)
    const counts = Object.fromEntries(index.blocks.map((b) => [b.kind, b.count]))
    expect(counts).toMatchObject({
      dated1095: 31755,
      context720: 20880,
      presenceDated: 1095,
      presenceContext: 720,
    })
  })

  it('records no engine input and the oracle-only files', () => {
    expect(lock.noEngineInput.violations).toBe(0)
    const oracle = lock.files.filter((f) => f.role === 'oracle_only').map((f) => f.path)
    expect(oracle.sort()).toEqual(Object.keys(lock.noEngineInput.oracleOnly).sort())
    for (const f of lock.files.filter((x) => x.role !== 'oracle_only'))
      expect(f.path, f.path).not.toMatch(/^shared\/lunar\/.*\.ts$|-2025-2027\.tsv$|-baseline-v1\//)
  })

  it('pre-registers the diff classes and the engine comparison plan', () => {
    expect(Object.keys(lock.diffClasses.owner).sort()).toEqual(
      ['E1', 'E3', 'E5', 'F1', 'F4', 'H1-B/F5', 'H2-A'].sort(),
    )
    expect(Object.keys(lock.diffClasses.golden)).toEqual(
      expect.arrayContaining(['E2', 'E4', 'E6', 'CONTEXT_DATE_OPERAND_POLICY', 'LATER_SCOPE']),
    )
    expect(lock.diffClasses.generic).toContain('ENGINE_BUG')
    expect(Object.keys(lock.engineComparisonPlan)).toEqual(
      expect.arrayContaining(['dated', 'context', 'acceptance']),
    )
  })
})
