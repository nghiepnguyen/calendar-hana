import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/weishen-nacai-puzhu21-v1/lock.json'
import result from '../../docs/audits/sources/p4-vol10/weishen-nacai-puzhu21-v1/result.json'
import witness from '../../docs/audits/sources/p4-vol10/weishen-nacai-puzhu21-v1/witness.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'

// Audit only: lock of the 未-戊申 納財 / puzhu:21 audit (docs/audits/p4-weishen-nacai-puzhu21.md).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const raw = readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8')
const vol11 = readFileSync('docs/audits/sources/p4-vol10/yi-sources-v1/vol11.raw.txt', 'utf8')

describe('未-戊申 納財 / puzhu:21 audit lock', () => {
  it('pins every artifact and the reused page bytes', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    expect(sha(witness.page.path)).toBe(witness.page.sha256)
  })

  it('N1 source: 四相 宜 納財 in 卷十 and 卷十一; no other god on the page avoids 納財', () => {
    expect(raw).toMatch(/四相　時德\s*宜祭祀[^\n]*納財開倉庫出貨財栽種牧養/)
    expect(vol11).toContain('宜母倉天願月恩四相時徳民日三合滿日收日六合五富天倉')
    expect(raw).toMatch(/天賊\}\}\s*忌行幸遣使修倉庫開倉庫出貨財\s/)
    expect(raw).toMatch(/五虛\}\}\s*忌修倉庫開倉庫出貨財\s/)
    expect(raw).toMatch(/五離\}\}\s*忌慶賜賞賀宴㑹結婚姻納采問名立劵交易與/)
    const jie = (vol10.entries as { id: string; avoid: string }[]).find((e) => e.id === 'jie_sha')!
    expect(jie.avoid).toContain('開市立劵交易納財開倉庫出貨財')
    expect(witness.page.jiShen).toContain('四相')
  })

  it('N2 source: puzhu:21 is a symmetric triad with no exception clause', () => {
    expect(raw).toContain(
      '凡吉凶相抵不註忌開市亦不註忌立劵交易納財不註忌納財亦不註忌開市立劵交易不註忌立劵交易亦不註忌開市納財',
    )
  })

  it('witness: every reading contradicts at least one deciding cell', () => {
    const s = result.witnessScore
    expect(s['N-A'].contradicts).toEqual(['納財', '立券交易'])
    expect(s['N-C'].contradicts).toEqual(['納財'])
    expect(s['N-B'].contradicts).toEqual(['開市'])
    expect(s['N-B6'].contradicts).toEqual(['納財'])
  })

  it('tables: 384 cells; source reading = P17-A table; page-literal N-B changes 5 cells', () => {
    const t = result.tables
    expect(t.cells).toEqual([384, 384, 384])
    expect(t.varyingAcrossDates).toEqual([])
    expect(Object.keys(t.faithfulToP17A).sort()).toEqual(
      ['未-壬申:engagement', '未-壬申:moving', '未-壬申:wedding'].sort(),
    )
    expect(t.p17AToSourceReading).toEqual({})
    expect(Object.keys(t.p17AToPageLiteralNB).sort()).toEqual(
      ['business', 'contract', 'finance', 'opening', 'transaction']
        .map((a) => `未-戊申:${a}`)
        .sort(),
    )
    expect(t.avoidCounts).toEqual({ faithful: 174, 'P17-A': 177, 'N-B': 182 })
  })

  it('sensitivity (hypothetical N-B): 108 dates, 328 rows at −15, 108 events', () => {
    const s = result.sensitivityNB
    expect([s.dates, s.activityRows]).toEqual([108, 328])
    expect(s.scoreDelta).toEqual({ '-15': 328 })
    expect(s.ratings).toEqual({ 'neutral→watch': 324, 'watch→avoid': 4 })
    expect(s.events).toEqual({ 'open_business:caution→not_recommended': 108 })
  })
})
