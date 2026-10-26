import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/lock.json'
import diff from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/migration-diff.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { lockedDigests } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// F1 Stage 3 (docs/audits/p4-f1-wuli-lijuan-stage3-migration.md): freezes the R2 owner ruling and the shipped
// envelope so a later change cannot silently reinterpret them.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const WITNESSED = new Set(['戌-壬申', '戌-庚申'])
const EXTRAPOLATED = new Set(['丑-甲申', '午-戊申'])

describe('F1 Stage 3 R2 migration lock', () => {
  it('pins the ruling, envelope, rollback digests, authority and Goldens', () => {
    {
      // lockAnchor rule (owner 2026-10-17): runtime code and harnesses outside the lock dir are checked as
      // committed when the lock was added, so Q4-REST Stage 3 (authority v5) does not break this proof.
      const code = Object.keys(lock.files).filter((p) => p.startsWith('shared/lunar/'))
      const committed = lockedDigests('docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/lock.json', code)
      for (const [path, hash] of Object.entries(lock.files))
        expect(code.includes(path) ? committed.get(path) : sha(path), path).toBe(hash)
    }
    // Q4-REST Stage 3 moved production to v5; the v4 authority this stage audited stays pinned above.
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
  })

  it('records R2 for 五離 × 立券交易 only', () => {
    expect([ruling.decision, ruling.date]).toEqual(['R2_APPROVED', '2026-10-26'])
    expect(ruling.excludedGods).toEqual(['九空', '五虛', '小耗', '五墓'])
    expect(ruling.rowGroups.directlyWitnessShaped.headingRows).toBe(6)
    expect(ruling.rowGroups.semanticExtrapolation.basis).toMatch(/NOT SOURCE_WITNESSED/)
    expect(ruling.rowGroups.intermediateOnly.contexts).toEqual(['未-戊申'])
  })

  it('the shipped envelope: 12 lift→keep, 10 heading, 20 activity, 100 event records', () => {
    type D = { context: string; current: string[]; r2: string[] }
    const dec = diff.decision as D[]
    const liftKeep = dec.filter((d) => d.current[1]!.startsWith('lift') && d.r2[1]!.startsWith('keep'))
    expect([liftKeep.length, dec.length - liftKeep.length]).toEqual([12, 7])
    const heads = diff.heading as { context: string; heading: string }[]
    expect(heads.every((h) => h.heading === '立券交易')).toBe(true)
    expect(heads.filter((h) => WITNESSED.has(h.context))).toHaveLength(6)
    expect(heads.filter((h) => EXTRAPOLATED.has(h.context))).toHaveLength(4)
    expect(liftKeep.filter((d) => d.context === '未-戊申')).toHaveLength(2)
    const acts = diff.activity as { activityId: string; current: { score: number; hardWarning: boolean }; r2: { score: number; hardWarning: boolean } }[]
    expect(acts).toHaveLength(20)
    expect(new Set(acts.map((a) => a.activityId))).toEqual(new Set(['contract', 'transaction']))
    expect(acts.every((a) => a.r2.score - a.current.score === -15)).toBe(true)
    expect(acts.every((a) => a.current.hardWarning === a.r2.hardWarning)).toBe(true)
    const evs = diff.event as { current: { score: unknown; classification: string }; r2: { score: unknown; classification: string } }[]
    expect(evs).toHaveLength(100)
    expect(evs.filter((e) => e.current.classification !== e.r2.classification)).toHaveLength(69)
    expect(evs.filter((e) => e.current.score !== e.r2.score)).toHaveLength(90)
    expect([diff.outside.heading, diff.outside.activity, diff.outside.event]).toEqual([[], [], []])
  })

  it('G2 / W1 stays CLOSED: 劫煞 × 立券交易 on 未-戊申 is BLANK / I1', () => {
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
