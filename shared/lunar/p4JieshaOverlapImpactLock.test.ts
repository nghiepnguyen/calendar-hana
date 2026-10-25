import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import impact from '../../docs/audits/sources/p4-vol10/jiesha-overlap-impact-v1/impact.json'
import lock from '../../docs/audits/sources/p4-vol10/jiesha-overlap-impact-v1/lock.json'
import { committedWithDigest } from './lockAnchor'

// Audit only: freezes the 劫煞 OVERLAP impact artifact (docs/audits/p4-jiesha-overlap-impact.md).
describe('劫煞 OVERLAP impact artifact', () => {
  it('keeps the harness, raw sweep and summary byte-identical', () => {
    // Files in the lock directory on the working tree. Harness files outside it are a historical proof
    // (owner rule 2026-10-17, lockAnchor.ts): the locked bytes must be a committed version of that file.
    // G2 Stage 2 later changed the harness's Full Golden v2 lock check only (not its simulator or sweep).
    const DIR = 'docs/audits/sources/p4-vol10/jiesha-overlap-impact-v1/'
    for (const f of lock.files)
      if (f.path.startsWith(DIR))
        expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(
          f.sha256,
        )
      else expect(committedWithDigest(f.path, f.sha256), f.path).toBe(true)
  })

  it('records the decision counts', () => {
    expect(impact.supportedRange).toEqual(['1900-01-01', '2100-12-31'])
    const pick = (s: (typeof impact.full)['A']) => ({
      dates: s.affectedDates,
      contexts: s.affectedContexts,
      score: s.scoreChanges.effectiveScoreRows,
      events: s.visibleChanges.eventClassification,
    })
    expect(pick(impact.full.A)).toEqual({
      dates: 1636,
      contexts: 16,
      score: 15457,
      events: { 'caution→not_recommended': 3314 },
    })
    expect(pick(impact.full.B)).toEqual({
      dates: 1636,
      contexts: 16,
      score: 15158,
      events: { 'caution→not_recommended': 3314 },
    })
    expect(impact.vol10LayerPairsCheck.B).toEqual({
      supported: 10284,
      unknownInModel: 2653,
      notSupported: 2085,
    })
    expect(impact.witnessWindow.B.witnessClass).toEqual({
      SUPPORTED_BY_WITNESS: 132,
      CONSISTENT_WITH_CANDIDATE: 12,
      AMBIGUOUS: 2,
    })
  })
})
