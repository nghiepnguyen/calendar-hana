import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import envelope from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/migration-envelope.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/migration-lock.json'
import provenance from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/provenance.json'
import rollback from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/rollback.json'
import source from '../../docs/audits/sources/p4-vol10/q4-rest-stage3/source-regression.json'
import { lockedDigests } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Q4-REST Stage 3 (docs/audits/p4-q4-rest-stage3-migration.md): freezes the shipped envelope (= the prediction frozen
// before any engine code), its attribution and evidence classes, the exact v5 → v4 rollback and the source
// regression, so a later change cannot silently reinterpret the owner rulings.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage3/'
const files = lock.files as Record<string, string>
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Q4-REST Stage 3 migration lock', () => {
  it('pins the envelope, the Goldens, the authorities and the code as committed (lockAnchor rule)', () => {
    const code = Object.keys(files).filter((p) => p.startsWith('shared/lunar/'))
    const committed = lockedDigests(DIR + 'migration-lock.json', code)
    for (const [path, hash] of Object.entries(files))
      expect(code.includes(path) ? committed.get(path) : sha(path), path).toBe(hash)
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
  })

  it('the builder is deterministic (rebuilt into a temp dir)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r3m-'))
    execFileSync('python3', ['-I', DIR + 'build_migration.py', out])
    for (const n of [
      'migration-envelope.json',
      'provenance.json',
      'rollback.json',
      'source-regression.json',
      'authority-diff.json',
    ])
      expect(sha(join(out, n)), n).toBe(files[DIR + n])
  })

  it('the shipped envelope equals the frozen prediction row for row', () => {
    expect(envelope.shipped).toMatchObject({
      decisionRows: 96,
      headingRows: 74,
      activityRows: 121,
      eventRows: 366,
      statusChanges: 79,
      activityScoreChanges: 121,
      hardWarningChanges: 0,
      eventClassificationChanges: 104,
      eventScoreChanges: 332,
      headingTransitions: {
        'both_present→only_ji': 21,
        'not_recorded→only_ji': 16,
        'only_yi→only_ji': 37,
      },
    })
    for (const k of ['heading', 'activity', 'event'] as const)
      expect(envelope.vsPrediction[k].identicalRows).toBe(envelope.vsPrediction[k].shipped)
  })

  it('every changed row is attributed; evidence classes keep witnessed cells apart from semantic rows', () => {
    expect(provenance.byClass).toEqual({
      DIRECT_SOURCE_WITNESSED: 29,
      SEMANTIC_OWNER_RULE: 38,
      OVERLAP_OF_APPROVED_RULES: 7,
    })
    expect(provenance.byRule).toEqual({ 'R-JK': 37, 'R-WX': 14, 'R-XH': 9, 'R-F1Y': 21 })
    expect([provenance.f1y.rowsOnWitnessedContexts, provenance.f1y.rowsElsewhere]).toEqual([4, 17])
    expect(envelope.regression).toMatchObject({
      populationRowsChanged: 21,
      u7Changed: 0,
      u4Changed: 0,
      qlExcludedPreserved: true,
    })
  })

  it('rollback v5 → v4 reproduces pre-Stage-3 production on every day', () => {
    expect(rollback).toMatchObject({
      days: 1097,
      rollbackEqualsBaseline: 1097,
      exact: true,
      outsideDomainUnchanged: true,
    })
  })

  it('source regression: every in-scope witnessed cell matches the print', () => {
    expect([source.inScopeMatches, source.inScopeCells]).toEqual([18, 18])
    expect(source.mismatches).toEqual([])
  })

  it('G2 / W1 stays CLOSED: 劫煞 × 立券交易 on 未-戊申 is BLANK / I1', () => {
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
