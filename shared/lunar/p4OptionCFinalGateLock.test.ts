import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import gate from '../../docs/audits/sources/p4-vol10/option-c-final-gate-v1/gate.json'
import lock from '../../docs/audits/sources/p4-vol10/option-c-final-gate-v1/lock.json'
import ruling from '../../docs/audits/sources/p4-vol10/option-c-final-gate-v1/owner-ruling.json'
import golden from '../../docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'
import { lockFileDigests } from './lockAnchor'

const GOLDEN_LOCK = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'

// Audit only: Option C final gate (docs/audits/p4-option-c-final-gate.md).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Option C final gate lock', () => {
  it('pins the gate artifacts', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('records the local owner ruling on 未-戊申 納財 without marking the cell witnessed', () => {
    expect(ruling.ruling).toBe('OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS')
    expect(ruling.scope).toMatch(/^LOCAL/)
    expect(ruling.witnessStatus).toMatch(/NOT SOURCE_WITNESSED/)
    expect(ruling.cellsKept).toHaveLength(5)
  })

  it('丑-丙寅 D-A vs D-B: 2 cells on 99 dates, 198 rows at +15, no event change, gate fails', () => {
    expect(gate.dates).toBe(99)
    expect(gate.cellsDiffering).toEqual([
      '丑-丙寅:construction:avoid→blank',
      '丑-丙寅:warehouse:avoid→blank',
    ])
    expect([gate.verdictRows, gate.activityRows, gate.events]).toEqual([198, 198, 0])
    expect(gate.scoreDelta).toEqual({ '15': 198 })
    expect(gate.classification).toBe('VALUE_AFFECTING_SCOPE_UNCERTAINTY')
  })

  it('Golden v2 lock is untouched', () => {
    const files = golden.files as { path: string; sha256: string }[]
    expect(files.length).toBeGreaterThan(0)
    // Inputs outside the Golden directory as committed at its anchor (G2 Stage 2 adds a 卷十 alias).
    const got = lockFileDigests(
      GOLDEN_LOCK,
      files.map((f) => f.path),
    )
    for (const f of files) expect(got.get(f.path), f.path).toBe(f.sha256)
  })
})
