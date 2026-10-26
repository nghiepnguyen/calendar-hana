import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import evidence from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage1/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage1/lock.json'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'

// Audit only: F1 Stage 1 (docs/audits/p4-f1-wuli-lijuan-stage1-witness-acquisition.md). Freezes the two
// acquired 戌月 witnesses and the F1-B classification; it locks no production decision on Q4.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

describe('F1 Stage 1 witness acquisition lock', () => {
  it('pins the scans, the evidence and its inputs', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('both witnesses are authenticated, decisive and print 立券交易 on the 忌 line', () => {
    const w = evidence.witnesses
    expect(w.map((x) => [x.witness, x.context])).toEqual([
      ['06067696-n14', '戌-壬申'],
      ['06067696-n62', '戌-庚申'],
    ])
    expect(w.map((x) => x.page.sha256)).toEqual([
      'a3a5180ff7d004d4acbbb7752ef41b192a6e2a8410b0546cf6881c0270b7c127',
      '6c2097b8787c0ea848340c45df1cb379e40503849347721b96349c9092c83a9a',
    ])
    expect(w.map((x) => x.page.jiRaw)).toEqual([
      '會親友結婚姻納采問名嫁娶安牀立券交｜易開渠伐木畋獵取魚乘船渡水',
      '會親友結婚姻納采問名嫁娶安牀經絡立｜券交易伐木畋獵取魚乘船渡水',
    ])
    expect(w.map((x) => x.sourceRule.puzhu06Triggers)).toEqual([['四相'], ['月恩']])
    for (const x of w) {
      expect(x.page.authentication.result).toBe('AUTHENTICATED')
      expect(x.page.predictionCorrect).toBe(true)
      expect(x.sourceRule.wuliActive).toBe(true)
      expect(x.sourceRule.wuliOwnLifters).toEqual([])
      expect(x.sourceRule.lijuanJiOperands).toEqual(['五離'])
      expect(x.sourceRule.lijuanYiOperands).toEqual([])
      expect(x.page.printed.立券交易).toBe('忌')
      expect(x.decisive).toBe(true)
      expect(x.observedMatches).toBe('WULI-NARROW')
    }
  })

  it('classifies F1-B and leaves G2-n117 / W1 closed', () => {
    expect(evidence.classification).toBe('F1-B')
    expect(evidence.baselineN117.decisive).toBe(false)
    expect(evidence.g2n117W1).toBe('CLOSED')
    expect(evidence.productionChanged).toBe(false)
    for (const a of ['contract', 'transaction'])
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
  })
})
