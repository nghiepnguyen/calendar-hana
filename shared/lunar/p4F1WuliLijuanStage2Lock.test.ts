import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import evidence from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/lock.json'

// Audit only: F1 Stage 2 (docs/audits/p4-f1-wuli-lijuan-stage2-authority-reconciliation.md). Freezes the R2
// determination (pending owner adoption), its scope and the measured envelope; production is unchanged.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('F1 Stage 2 authority reconciliation lock', () => {
  it('pins the evidence, impact dump, harness, Stage 1 and the witness scans', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    expect(evidence.stage1.witnesses).toEqual({
      '06067696-n14': 'a3a5180ff7d004d4acbbb7752ef41b192a6e2a8410b0546cf6881c0270b7c127',
      '06067696-n62': '6c2097b8787c0ea848340c45df1cb379e40503849347721b96349c9092c83a9a',
    })
  })

  it('Q4 enters as an owner ruling; 五離 lists neither 四相 nor 月恩', () => {
    const q4 = evidence.q4Chain.find((l) => l.class === 'OWNER_RULING')!
    expect([q4.layer, q4.date]).toEqual(['owner ruling Q4 = yes', '2026-10-16'])
    expect(evidence.q4Chain[0]!.class).toBe('SOURCE_FACT')
    const w = evidence.wuliAuthority
    expect(w.explicitLifters).toEqual(['天德', '月德', '天德合', '月德合', '天赦', '三合', '六合'])
    expect([w['四相Included'], w['月恩Included']]).toEqual([false, false])
    expect(w.triggersOutsideOwnList).toEqual(['天願', '月恩', '四相', '時德'])
    expect(evidence.witnesses['06067694-n117'].classification).toBe('CONTAMINATED_BUT_SUPPORTIVE')
  })

  it('R2 for 五離 only, pending owner adoption', () => {
    expect(evidence.ruling).toBe('R2')
    expect(evidence.rulingStatus).toMatch(/owner adoption required/)
    expect(evidence.scope).toMatch(/^For 五離 only/)
    expect(evidence.scope).toMatch(/Not 九空\/五虛\/小耗\/五墓/)
    expect(evidence.g2W1).toBe('CLOSED / UNCHANGED')
    expect(evidence.productionChanged).toBe(false)
  })

  it('freezes the measured envelope and its split', () => {
    const i = evidence.impact2025_2027
    expect([i.puzhu06LiftToKeep, i.puzhu06TagOnly, i.headingRows, i.activityRows]).toEqual([12, 7, 10, 20])
    expect([i.eventRecordsChanged, i.eventClassificationChanges, i.eventScoreChanges]).toEqual([100, 69, 90])
    expect(i.scoreDelta).toEqual({ '-15': 20 })
    expect(i.hardWarningChanges).toBe(0)
    expect(i.decisionOnlyRows).toEqual(['2026-08-02 未-戊申', '2027-07-28 未-戊申'])
    const s = i.split
    expect([s.witnessedShape.heading, s.witnessedShape.activity, s.witnessedShape.event]).toEqual([6, 12, 60])
    expect([s.extrapolated.heading, s.extrapolated.activity, s.extrapolated.event]).toEqual([4, 8, 40])
    expect(evidence.outside2025_2027.productionImpact).toBe(0)
  })
})
