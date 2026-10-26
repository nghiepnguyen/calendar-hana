import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import plan from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a/acquisition-plan-v2.json'
import corpus from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a/corpus-pattern-search.json'
import grammar from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a/grammar-analysis.json'
import lock from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a/lock.json'
import review from '../../docs/audits/sources/p4-vol10/q4-rest-stage2a/n126-review.json'
import ruling from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json'
import { lockedDigests } from './lockAnchor'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: Q4-REST Stage 2A (docs/audits/p4-q4-rest-stage2a-n126-review.md). Freezes the independent n126
// reading, the two-axis classification, the grammar and corpus results and the acquisition-plan successor.
// It locks no Q4, F1 or 宜-composition decision.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2a/'
const files = lock.files as Record<string, string>
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('Q4-REST Stage 2A n126 review lock', () => {
  it('pins the scan, the artifacts, Stage 1 and every input', () => {
    {
      // lockAnchor rule (owner 2026-10-17): runtime code and harnesses outside the lock dir are checked as
      // committed when the lock was added, so Q4-REST Stage 3 (authority v5) does not break this proof.
      const code = Object.keys(files).filter((p) => p.startsWith('shared/lunar/'))
      const committed = lockedDigests('docs/audits/sources/p4-vol10/q4-rest-stage2a/lock.json', code)
      for (const [path, hash] of Object.entries(files))
        expect(code.includes(path) ? committed.get(path) : sha(path), path).toBe(hash)
    }
    expect(files['docs/audits/sources/p4-vol10/yuebiao/06067692-n126.jpg']).toBe(
      'df862750b772adf9c08ae7fe248a38b310a9ffd3b3ddc1f0a16686b3b6da6a1e',
    )
  })

  it('the builder is deterministic (rebuilt into a temp dir; the tree is never written)', () => {
    const out = mkdtempSync(join(tmpdir(), 'q4r2a-'))
    execFileSync('python3', ['-I', DIR + 'build_review.py', out])
    for (const n of [
      'n126-review.json',
      'grammar-analysis.json',
      'corpus-pattern-search.json',
      'acquisition-review.json',
      'acquisition-plan-v2.json',
    ])
      expect(sha(join(out, n)), n).toBe(files[DIR + n])
    // The rebuilt lock re-hashes live code; compare every non-code entry with the committed lock.
    const built = JSON.parse(readFileSync(join(out, 'lock.json'), 'utf8')).files as Record<string, string>
    for (const [p, h] of Object.entries(lock.files as Record<string, string>))
      if (!p.startsWith('shared/lunar/')) expect(built[p], p).toBe(h)
  })

  it('n126: authenticated 卯-丁巳 滿日; fresh reading prints 開倉庫出貨財 on 忌 only', () => {
    const n = review.n126
    expect(n.authentication.status).toBe('AUTHENTICATED')
    expect([n.fresh.header, n.authentication.monthFromOfficer]).toEqual(['丁巳沙中土專滿日', '卯'])
    expect(n.fresh.jiRaw).toContain('修倉庫開倉庫出貨財修置產室')
    expect(n.normalized.yi).not.toContain('開倉庫')
    expect(n.targetPrinted).toBe('only_ji')
    expect(n.stage1Agreement).toEqual({ yi: true, ji: true })
    expect(n.operands.otherYi).toEqual(['月恩', '四相', '滿日'])
    expect([n.operands.otherJi, n.operands.gradedSubjects]).toEqual([[], []])
  })

  it('two-axis classification and grammar result', () => {
    expect(review.classification).toMatchObject({
      overall: 'N126-B',
      jAxis: 'JI_SUPPORTS_NARROW',
      yAxis: 'YI_SUPPRESSED_UNEXPLAINED',
    })
    expect(review.classification.yCandidates[0]).toMatch(/superseded/)
    expect(grammar.classification).toBe('CLAUSE_BOUNDARIES_CLEAR; CONGJI_SCOPE_UNESTABLISHED')
    expect(grammar.scope.established).toBe(false)
    expect(review.status).toBe('NEEDS_OWNER_REVIEW')
  })

  it('corpus: every comparable row prints only_ji, none both_present', () => {
    expect(corpus.result).toBe('CONSISTENT_JI_DOMINATES')
    expect(corpus.searchable).toBe(55)
    expect(corpus.surviving).toEqual({
      rows: 21,
      byVerdict: { MATCH_JI_DOMINATES: 21 },
      byGod: { 九空: 11, 五虛: 2, 五墓: 6, 五離: 2 },
    })
    expect(corpus.excluded).toEqual({
      EXPLAINED_BY_RULE: ['06067693-n95 安葬'],
      ENGINE_UNDETERMINED: ['06067693-n95 栽種', '06067693-n95 求醫療病'],
    })
    expect(new Set(corpus.hits.map((h) => h.page)).size).toBe(8)
    expect(Object.keys(corpus.suibaoCorrection.pages)).toHaveLength(8)
  })

  it('acquisition successor: 44 targets reduce to 4 primary pages plus the F1-Y page', () => {
    expect(plan.supersedes).toBe(
      'docs/audits/sources/p4-vol10/q4-rest-stage1/acquisition-plan.json',
    )
    expect(plan.primary).toEqual(['午-戊申', '午-戊辰', '子-丙寅', '巳-戊戌', '丑-甲申'])
    expect(plan.byPriority).toEqual({ P0: 13, P3: 2, P2: 1 })
    const f1y = plan.pages.filter((x) => x.tests.some((t) => t.includes('F1-Y')))
    expect(f1y.map((x) => x.context)).toEqual(['午-戊申', '丑-甲申'])
  })

  it('production stays v4; F1 and G2/W1 unchanged', () => {
    // Q4-REST Stage 3 moved production to v5; the v4 authority this stage audited stays pinned above.
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v5')
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
    expect(authority.liftExclusions.五墓.triggers).toEqual(['天德合', '月德合'])
    expect([ruling.decision, ruling.rule[2]]).toEqual([
      'R2_APPROVED',
      'An independent 宜 on 立券交易 does not suppress the surviving 五離 忌 (both_present).',
    ])
    expect(review.f1).toMatchObject({ relationship: 'POTENTIAL_F1_CONFLICT', f1Changed: false })
    expect(review.g2W1).toBe('CLOSED')
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
