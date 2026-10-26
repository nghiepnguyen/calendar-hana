import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import dashi from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/dashi-authority.json'
import diag from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/diagnostic-impact.json'
import drafts from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/draft-rulings.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/lock.json'
import packets from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/owner-packets.json'
import page from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/page.json'
import scope from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/scope-matrix.json'
import trans from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/transcription.json'
import xh from '../../docs/audits/sources/p4-vol10/q4-rest-stage2c/xiaohao-replication.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { lockedDigests } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: Q4-REST Stage 2C (docs/audits/p4-q4-rest-stage2c-xiaohao-replication.md). Freezes the 戌-癸卯 witness,
// the 大時 authority finding, the four owner packets and the diagnostic impact of each DRAFT ruling. No draft ruling
// is a production expectation.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2c/'
const files = lock.files as Record<string, string>
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const sha8 = (s: string) => createHash('sha256').update(s).digest('hex')

describe('Q4-REST Stage 2C 小耗 replication lock', () => {
  it('pins the scan, the artifacts, earlier stage locks, production code and Golden v4', () => {
    {
      // lockAnchor rule (owner 2026-10-17): runtime code and harnesses outside the lock dir are checked as
      // committed when the lock was added, so Q4-REST Stage 3 (authority v5) does not break this proof.
      const code = Object.keys(files).filter((p) => p.startsWith('shared/lunar/'))
      const committed = lockedDigests('docs/audits/sources/p4-vol10/q4-rest-stage2c/lock.json', code)
      for (const [path, hash] of Object.entries(files))
        expect(code.includes(path) ? committed.get(path) : sha(path), path).toBe(hash)
    }
    expect(page.sha256).toBe('71d6b5e87c16ee79de3b7109cff03898f307c97cfc74ad1a30b80b1b36a6208f')
  })

  it('the builder is deterministic (rebuilt into a temp dir; the tree is never written)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r2c-'))
    execFileSync('python3', ['-I', DIR + 'build_evidence.py', out])
    for (const n of [
      'page.json',
      'transcription.json',
      'dashi-authority.json',
      'xiaohao-replication.json',
      'owner-packets.json',
      'scope-matrix.json',
      'diagnostic-impact.json',
      'draft-rulings.json',
    ])
      expect(sha(join(out, n)), n).toBe(files[DIR + n])
    // The rebuilt lock re-hashes live code; compare every non-code entry with the committed lock.
    const built = JSON.parse(readFileSync(join(out, 'lock.json'), 'utf8')).files as Record<string, string>
    for (const [p, h] of Object.entries(lock.files as Record<string, string>))
      if (!p.startsWith('shared/lunar/')) expect(built[p], p).toBe(h)
  })

  it('戌-癸卯 authenticated at 06067696-n45; transcription frozen', () => {
    expect([page.context, page.witness, page.authentication.status]).toEqual([
      '戌-癸卯',
      '06067696-n45',
      'AUTHENTICATED',
    ])
    expect([sha8(trans.yiRaw), sha8(trans.jiRaw)]).toEqual([trans.sha256.yi, trans.sha256.ji])
    expect(trans.jiNormalized).toBe('修倉庫開市立券交易納財開倉庫出貨財穿井')
  })

  it('大時 is neutralised on the tested headings by its own entry (SOURCE_FACT)', () => {
    expect(dashi.condition.met).toEqual({ month: true, officer執: true, 六合: true })
    expect(dashi.conclusion).toMatch(/^SOURCE_FACT/)
  })

  it('小耗 replication: four clean J-NARROW cells (XH-R1)', () => {
    expect(xh.cells.map((c) => [c.heading, c.otherJi, c.printed, c.jResult])).toEqual([
      ['開市', [], 'only_ji', 'J-NARROW'],
      ['立券交易', [], 'only_ji', 'J-NARROW'],
      ['納財', [], 'only_ji', 'J-NARROW'],
      ['開倉庫出貨財', [], 'only_ji', 'J-NARROW'],
    ])
    expect(xh.classification).toBe('XH-R1')
  })

  it('owner packets, scope matrix and drafts', () => {
    expect(packets.A_九空.cleanCells).toHaveLength(6)
    expect(packets.B_五虛.directWitnesses).toHaveLength(3)
    expect(packets.C_小耗.directWitnesses).toHaveLength(2)
    expect(packets.D_F1Y.independentYi).toEqual({ '午-戊申': ['滿日'], '丑-甲申': ['五富'] })
    for (const p of [packets.A_九空, packets.B_五虛, packets.C_小耗, packets.D_F1Y])
      expect(p.counterexamples).toBe(0)
    expect(scope.crossGod).toMatch(/^NOT AUTHORIZED/)
    expect(drafts.status).toMatch(/^DRAFT/)
  })

  it('diagnostic impact per draft ruling and combined (not production)', () => {
    const pick = (x: {
      decisionRows: number
      headingRows: number
      activityRows: number
      eventRows: number
    }) => [x.decisionRows, x.headingRows, x.activityRows, x.eventRows]
    expect(pick(diag.perRuling.jk)).toEqual([37, 37, 57, 120])
    expect(pick(diag.perRuling.wx)).toEqual([39, 14, 14, 0])
    expect(pick(diag.perRuling.xh)).toEqual([30, 9, 15, 36])
    expect(pick(diag.perRuling.f1y)).toEqual([0, 21, 42, 210])
    expect(pick(diag.combined)).toEqual([96, 74, 121, 366])
    expect(diag.combined.hardWarningChanges).toBe(0)
    expect(diag.headingSplit).toEqual({
      jk: { a_tested_trigger: 30, c_kaicang_joint: 7 },
      wx: { a_tested_trigger: 14 },
      xh: { a_tested_trigger: 9 },
      f1y: { a_witnessed_context: 4, b_other_context: 17 },
    })
    expect(diag.overlap['jk∩wxRows']).toBe(7)
    expect(diag.wxDecisionBreakdown).toEqual({
      heading_moved: 14,
      tag_only: 22,
      lift_to_keep_final_unchanged: 3,
    })
    expect(diag.goldensChanged).toBe(false)
  })

  it('production stays v4; F1 R2, F1-Y production state and G2/W1 unchanged', () => {
    // Q4-REST Stage 3 moved production to v5; the v4 authority this stage audited stays pinned above.
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
    expect(Object.keys(authority.liftExclusions)).toEqual(['五墓', '五離'])
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
    expect(ruling.decision).toBe('R2_APPROVED')
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
