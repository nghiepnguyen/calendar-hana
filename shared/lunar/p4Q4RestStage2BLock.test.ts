import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import classification from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/classification.json'
import f1y from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/f1-y.json'
import jaxis from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/j-axis.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/lock.json'
import pages from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/pages.json'
import trans from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/transcriptions.json'
import yaxis from '../../docs/audits/sources/p4-vol10/q4-rest-stage2b/y-axis.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { lockedDigests } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: Q4-REST Stage 2B (docs/audits/p4-q4-rest-stage2b-witness-acquisition.md). Freezes the six acquired
// 月表 scans, their readings and the J / Y / F1-Y classifications; it locks no Q4, F1 or Y decision.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2b/'
const files = lock.files as Record<string, string>
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const sha8 = (s: string) => createHash('sha256').update(s).digest('hex')

describe('Q4-REST Stage 2B acquisition lock', () => {
  it('pins the six scans, the artifacts, earlier stage locks, production code and Golden v4', () => {
    {
      // lockAnchor rule (owner 2026-10-17): runtime code and harnesses outside the lock dir are checked as
      // committed when the lock was added, so Q4-REST Stage 3 (authority v5) does not break this proof.
      const code = Object.keys(files).filter((p) => p.startsWith('shared/lunar/'))
      const committed = lockedDigests('docs/audits/sources/p4-vol10/q4-rest-stage2b/lock.json', code)
      for (const [path, hash] of Object.entries(files))
        expect(code.includes(path) ? committed.get(path) : sha(path), path).toBe(hash)
    }
  })

  it('the builder is deterministic (rebuilt into a temp dir; the tree is never written)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r2b-'))
    execFileSync('python3', ['-I', DIR + 'build_evidence.py', out])
    for (const n of [
      'pages.json',
      'transcriptions.json',
      'operands.json',
      'j-axis.json',
      'y-axis.json',
      'f1-y.json',
      'classification.json',
      'replication-plan.json',
    ])
      expect(sha(join(out, n)), n).toBe(files[DIR + n])
    // The rebuilt lock re-hashes live code; compare every non-code entry with the committed lock.
    const built = JSON.parse(readFileSync(join(out, 'lock.json'), 'utf8')).files as Record<string, string>
    for (const [p, h] of Object.entries(lock.files as Record<string, string>))
      if (!p.startsWith('shared/lunar/')) expect(built[p], p).toBe(h)
  })

  it('six pages authenticated at the predicted locators', () => {
    expect(pages.pages.map((p) => [p.context, p.witness])).toEqual([
      ['午-戊申', '06067694-n50'],
      ['子-丙寅', '06067697-n8'],
      ['巳-戊戌', '06067693-n107'],
      ['卯-丁丑', '06067692-n86'],
      ['丑-甲申', '06067697-n93'],
      ['午-戊辰', '06067694-n10'],
    ])
    for (const p of pages.pages) {
      expect(p.authentication.status, p.witness).toBe('AUTHENTICATED')
      expect(files[p.path], p.witness).toBe(p.sha256)
      const t = (
        trans.pages as Record<
          string,
          { yiRaw: string; jiRaw: string; sha256: Record<string, string> }
        >
      )[p.witness]!
      expect([sha8(t.yiRaw), sha8(t.jiRaw)]).toEqual([t.sha256.yiRaw, t.sha256.jiRaw])
    }
  })

  it('J: every clean cell keeps its 忌 under a non-own trigger; aggregates derive from the cells', () => {
    for (const c of jaxis.cells.filter((x) => x.clean)) {
      expect(c.otherJi).toEqual([])
      expect(c.ownLifters).toEqual([])
      expect(c.classification).toBe(
        c.printed === 'only_ji' || c.printed === 'both_present' ? 'J-NARROW' : 'J-GENERIC',
      )
    }
    for (const g of ['九空', '五虛', '小耗'] as const) {
      const k = new Set(
        jaxis.cells.filter((c) => c.god === g && c.clean).map((c) => c.classification),
      )
      expect(jaxis.aggregate[g].classification, g).toBe(
        !k.size ? 'J-D' : k.size > 1 ? 'J-C' : k.has('J-NARROW') ? 'J-B' : 'J-A',
      )
    }
    expect(
      Object.fromEntries(
        (['九空', '五虛', '小耗'] as const).map((g) => [g, jaxis.aggregate[g].pageCount]),
      ),
    ).toEqual({
      九空: 2,
      五虛: 3,
      小耗: 1,
    })
  })

  it('Y: 26 cells, all only_ji; 15 sole-ungraded, U4/U7 quarantined, undetermined and 百忌 split out', () => {
    expect([
      yaxis.cells.length,
      yaxis.newOnlyJi,
      yaxis.newBothPresent,
      yaxis.counterexamples,
    ]).toEqual([26, 26, 0, 0])
    expect([yaxis.newOnlyJiUngraded, yaxis.newOnlyJiSoleFamilies, yaxis.newOnlyJiBaiji]).toEqual([
      20, 15, 3,
    ])
    expect(yaxis.byFamily).toEqual({
      'BAIJI_ONLY (not ungraded)': { 'Y-ONLY-JI': 3 },
      ENGINE_UNDETERMINED: { 'Y-ONLY-JI': 3 },
      U1: { 'Y-ONLY-JI': 2 },
      U2: { 'Y-ONLY-JI': 2 },
      U3: { 'Y-ONLY-JI': 9 },
      U4: { 'Y-ONLY-JI': 2 },
      U5: { 'Y-ONLY-JI': 2 },
      U7: { 'Y-ONLY-JI': 3 },
    })
  })

  it('F1-Y: two clean direct 立券交易 witnesses print only_ji (F1Y-E1); production unchanged', () => {
    expect(
      f1y.rows.map((r) => [r.context, r.independentYi, r.otherJi, r.printed, r.clean]),
    ).toEqual([
      ['午-戊申', ['滿日'], [], 'only_ji', true],
      ['丑-甲申', ['五富'], [], 'only_ji', true],
    ])
    expect(f1y.classification).toBe('F1Y-E1')
    // Control: the same 宜 source prints on 開市 / 納財 (no 忌) and disappears only where 忌 survives.
    for (const r of f1y.rows) {
      expect(r.yiSourceControl.開市.printed).toBe('only_yi')
      expect(r.yiSourceControl.納財.printed).toBe('only_yi')
      expect(r.yiSourceControl.立券交易.printed).toBe('only_ji')
    }
    expect(f1y.productionStillBothPresent).toBe(true)
  })

  it('gates, production v4, F1 R2 J-axis and G2/W1 unchanged', () => {
    expect(classification.gates).toMatchObject({
      九空: 'READY_FOR_OWNER_RULING',
      五虛: 'READY_FOR_OWNER_RULING',
    })
    expect(classification.productionChanged).toBe(false)
    // Q4-REST Stage 3 moved production to v5; the v4 authority this stage audited stays pinned above.
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
    expect(ruling.decision).toBe('R2_APPROVED')
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
