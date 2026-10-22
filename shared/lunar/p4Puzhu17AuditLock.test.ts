import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import h1b from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
import lock from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/lock.json'
import result from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/result.json'
import witness from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/witness.json'
import xiangdi from '../../docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/witness-lock.json'
import v2 from '../../docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json'
import { getXiejiGodPresence } from './xiejiGodPresence'

// Audit only: lock of the puzhu:17 不將 audit (docs/audits/p4-puzhu17-bujiang.md).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'

describe('puzhu:17 不將 audit lock', () => {
  it('pins every artifact and the reused page bytes', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    for (const p of witness.pages) expect(sha(p.path), p.context).toBe(p.sha256)
  })

  it('384 cells: date-invariant; P17-A/B change 3, P17-C 4; witnesses decide A/B', () => {
    const t = result.table
    expect([t.contexts, t.cells, t.varyingAcrossDates.length]).toEqual([16, 384, 0])
    expect(t.representativeDatesAgreeWithFullRange).toBe(true)
    const keys = (v: keyof typeof t.diffVsP17_0) => Object.keys(t.diffVsP17_0[v]).sort()
    const ab = ['未-壬申:engagement', '未-壬申:moving', '未-壬申:wedding']
    expect(keys('P17-A')).toEqual(ab)
    expect(keys('P17-B')).toEqual(ab)
    expect(keys('P17-C')).toEqual([...ab, '未-戊申:wedding'].sort())
    for (const v of Object.values(t.diffVsP17_0))
      for (const d of Object.values(v)) expect(d).toEqual(['CONFIRMED:blank', 'CONFIRMED:avoid'])
    const s = result.witness.score
    expect(result.witness.distinguishingPages).toEqual(['未-壬申', '未-戊申'])
    expect([s['P17-A'].supports, s['P17-A'].contradicts]).toEqual([7, 0])
    expect([s['P17-B'].supports, s['P17-B'].contradicts]).toEqual([7, 0])
    expect([s['P17-0'].supports, s['P17-0'].contradicts]).toEqual([2, 5])
    expect([s['P17-C'].supports, s['P17-C'].contradicts]).toEqual([5, 2])
  })

  it('P4 layer: A/B change exactly 4 heading rows; second sub-clause precondition in 71 contexts', () => {
    const rows = (v: keyof typeof result.p4.observableChanges) =>
      result.p4.observableChanges[v].map((r) => `${r[0]}:${r[1]}`).sort()
    const four = ['未-壬申:結婚姻', '未-壬申:納采問名', '未-戊申:結婚姻', '未-戊申:納采問名'].sort()
    expect(rows('P17-A')).toEqual(four)
    expect(rows('P17-B')).toEqual(four)
    expect(result.p4.bujiangContexts).toBe(149)
    expect(result.p4.clause2PreconditionContexts).toHaveLength(71)
  })

  it('16-page check under P17-A: only the 戌 開倉庫 and 未-戊申 納財/立券交易 rows contradict', () => {
    const pc = result.pageCheckP17A as Record<
      string,
      { compared: number; contradictions: { heading: string }[] }
    >
    expect(Object.values(pc).reduce((n, x) => n + x.compared, 0)).toBe(342)
    const bad = Object.entries(pc).flatMap(([c, x]) =>
      x.contradictions.map((d) => `${c}:${d.heading}`),
    )
    expect(bad.sort()).toEqual(
      [
        '戌-丁亥:開倉庫出貨財',
        '戌-乙亥:開倉庫出貨財',
        '戌-己亥:開倉庫出貨財',
        '戌-癸亥:開倉庫出貨財',
        '未-戊申:立券交易',
        '未-戊申:納財',
      ].sort(),
    )
  })

  it('不將 presence: the 歴例 table agrees with every locked 月表 吉神 line', () => {
    const pages = [...h1b.pages, ...xiangdi.pages, ...v2.pages] as {
      monthJian: string
      pillar: string
      jiShen?: string[]
    }[]
    const seen = new Set<string>()
    const mismatch: string[] = []
    for (const p of pages) {
      const ctx = `${p.monthJian}-${p.pillar}`
      if (seen.has(ctx) || !p.jiShen) continue
      seen.add(ctx)
      const gods = getXiejiGodPresence(
        BR.indexOf(p.monthJian),
        ST.indexOf(p.pillar[0]!),
        BR.indexOf(p.pillar[1]!),
      )
      if ('bat_tuong' in gods !== p.jiShen.includes('不將')) mismatch.push(ctx)
    }
    expect(seen.size).toBe(67)
    expect(mismatch).toEqual([])
  })
})
