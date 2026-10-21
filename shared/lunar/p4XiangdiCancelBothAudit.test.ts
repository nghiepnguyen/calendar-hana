import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import h1bLock from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
import freeze from '../../docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/freeze.json'
import holdout from '../../docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/holdout-predictions.json'
import lock from '../../docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/witness-lock.json'

// Audit only (相抵 / cancel_both). Locks evidence, the freeze and the holdout scores; it
// asserts no runtime rule and reads no engine output.
const COMPOSE = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/compose'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const OFFICERS = '建除滿平定執破危成收開閉'
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const ctxOf = (p: { monthJian: string; pillar: string }) => `${p.monthJian}-${p.pillar}`
const term = h1bLock.headingTerms.map as Record<string, string>
const context = (() => {
  const [head, ...lines] = readFileSync(`${COMPOSE}/context.tsv`, 'utf8').trimEnd().split('\n')
  const keys = head.split('\t')
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [keys[i], v])))
})()
const xd = (code: string) =>
  code.includes('xd=') ? code.split('xd=')[1].split(';')[0].split('+') : []

describe('相抵 audit witness lock', () => {
  it('keeps the 14 new pages byte-identical on their frozen locators', () => {
    const urls = new Map(
      [...holdout.cancelTest, ...holdout.controls].map((t) => [t.context, t.yuebiao.url]),
    )
    expect(lock.pages).toHaveLength(14)
    for (const page of lock.pages) {
      expect(sha256(page.path), page.path).toBe(page.sha256)
      expect(page.url).toBe(urls.get(ctxOf(page)))
      const offset = (BRANCHES.indexOf(page.pillar[1]) - BRANCHES.indexOf(page.monthJian) + 12) % 12
      expect(page.officer, ctxOf(page)).toBe(OFFICERS[offset])
    }
  })

  it('keeps the freeze, holdout and dry-run artifacts byte-identical', () => {
    expect(lock.freeze).toHaveLength(6)
    for (const f of lock.freeze) expect(sha256(f.path), f.path).toBe(f.sha256)
  })
})

describe('frozen 劫煞 contradiction', () => {
  it('matches the Golden v2 rows naming 刼煞 as 相抵 subject on the 16 locked pages', () => {
    const pages = new Set(freeze.pages)
    const expected = context
      .filter((r) => pages.has(r.id) && xd(r.code).includes('刼煞'))
      .map((r) => `${r.id}|${r.heading}|${r.state}`)
    expect(freeze.rows.map((r) => `${r.context}|${r.heading}|${r.goldenState}`)).toEqual(expected)
    expect(freeze.rows).toHaveLength(298)
  })

  it('keeps the month-class matrix, controls included', () => {
    expect(freeze.summary).toEqual({
      '丑|A_CONTRADICTION': 1,
      '丑|C_MATCH': 63,
      '丑|NOT_COMPARED': 4,
      '戌|A_CONTRADICTION': 24,
      '戌|B_AMBIGUOUS': 4,
      '戌|C_MATCH': 48,
      '戌|NOT_COMPARED': 17,
      '未|A_CONTRADICTION': 21,
      '未|B_AMBIGUOUS': 10,
      '未|C_MATCH': 33,
      '未|NOT_COMPARED': 4,
      '辰|A_CONTRADICTION': 35,
      '辰|C_MATCH': 30,
      '辰|NOT_COMPARED': 4,
    })
    const witnessed = new Map(h1bLock.pages.map((p) => [ctxOf(p), p.sha256]))
    for (const r of freeze.rows) expect(r.witness.sha256).toBe(witnessed.get(r.context))
  })
})

describe('holdout (predictions frozen in 5c35a9e before the pages were fetched)', () => {
  const lines = new Map(lock.pages.map((p) => [ctxOf(p), p.jiLine]))
  const score = (t: (typeof holdout.cancelTest)[number]) => {
    const s = { n: 0, cancelBoth: 0, overlap: 0 }
    for (const h of t.headings) {
      if (!(h.heading in term) || h.cancelBoth === null || h.cancelBoth === h.overlap) continue
      const printed = lines.get(t.context)!.includes(term[h.heading])
      s.n++
      if (printed === h.cancelBoth) s.cancelBoth++
      if (printed === h.overlap) s.overlap++
    }
    return s
  }

  it('records how each frozen reading scored, by 相抵 subject', () => {
    const bySubject: Record<string, { n: number; cancelBoth: number; overlap: number }> = {}
    for (const t of holdout.cancelTest) {
      const s = score(t)
      const acc = (bySubject[t.subject] ??= { n: 0, cancelBoth: 0, overlap: 0 })
      acc.n += s.n
      acc.cancelBoth += s.cancelBoth
      acc.overlap += s.overlap
    }
    expect(bySubject).toEqual({
      災煞: { n: 5, cancelBoth: 1, overlap: 4 },
      月煞: { n: 6, cancelBoth: 0, overlap: 6 },
      月刑: { n: 4, cancelBoth: 4, overlap: 0 },
      天吏: { n: 4, cancelBoth: 4, overlap: 0 },
    })
  })

  it('agrees with Golden v2 on every compared heading of the 8 劫煞 control pages', () => {
    for (const t of holdout.controls)
      for (const h of t.headings) {
        if (!(h.heading in term) || h.cancelBoth === null) continue
        expect(lines.get(t.context)!.includes(term[h.heading]), `${t.context} ${h.heading}`).toBe(
          h.cancelBoth,
        )
      }
  })
})
