import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import h1b from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
import golden from '../../docs/audits/sources/p4-vol10/p4-full-golden-v2/lock.json'
import faithful from '../../docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/faithful.json'
import candidate from '../../docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json'
import lock from '../../docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/lock.json'
import check from '../../docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/yuede-check.json'
import xiangdi from '../../docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/witness-lock.json'
import v2 from '../../docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { evaluateGroupBContext } from './groupB'

// Audit only: 丑-丙寅 月德 source audit and the Option C candidate (docs/audits/p4-chou-bingyin-yuede.md).
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const BR = '子丑寅卯辰巳午未申酉戌亥'
const vol05 = readFileSync('docs/audits/sources/p4-vol10/vol05.raw.txt', 'utf8')

describe('丑-丙寅 月德 audit lock', () => {
  it('pins every artifact', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
    expect(sha(check.n75.path)).toBe(check.n75.sha256)
  })

  it('source: 歴例 月德 puts 十二月 on 庚, and the project transcribes it on a 月建 basis', () => {
    expect(vol05).toContain('歴例曰月徳者正五九月在丙二六十月在甲三七十一月在壬四八十二月在庚')
    expect(check.source.mapping['丑']).toBe('庚')
    for (const [m, stem] of Object.entries(check.source.mapping)) {
      expect(getCatHungAuthorityByMonthJian(BR.indexOf(m)).yueDe, m).toBe(stem)
      const r = evaluateGroupBContext({ monthJian: m, dayStem: stem, dayBranch: '子' })
      expect(r.find((x) => x.id === 'month-virtue')!.matched, m).toBe(true)
    }
  })

  it('月表: 66/67 pages follow the 歴例 月德 table; the only miss is 丑-丙寅', () => {
    const pages = [...h1b.pages, ...xiangdi.pages, ...v2.pages] as {
      monthJian: string
      pillar: string
      jiShen?: string[]
    }[]
    const seen = new Set<string>()
    const miss: string[] = []
    for (const p of pages) {
      const ctx = `${p.monthJian}-${p.pillar}`
      if (seen.has(ctx)) continue
      seen.add(ctx)
      const want = (check.source.mapping as Record<string, string>)[p.monthJian] === p.pillar[0]
      if ((p.jiShen ?? []).includes('月德') !== want) miss.push(ctx)
    }
    expect(seen.size).toBe(67)
    expect(miss).toEqual(['丑-丙寅'])
    expect(check.decision).toBe('D-A')
  })

  it('candidate: 16 × 24 = 384 cells, 177 avoid; faithful table + exactly the 3 P17-A cells', () => {
    expect(candidate.status).toBe('AUDIT_ONLY_NOT_WIRED')
    expect(candidate.counts).toEqual({ contexts: 16, cells: 384, avoid: 177, blank: 207 })
    const old = faithful.verdictTable.table as Record<string, Record<string, string>>
    const diff: string[] = []
    for (const [ctx, row] of Object.entries(old))
      for (const [a, v] of Object.entries(row)) {
        const now = (candidate.cells as Record<string, Record<string, string>>)[
          ctx.replace('-', '')
        ]![a]
        if (now !== v) diff.push(`${ctx}:${a}:${v}→${now}`)
      }
    expect(diff.sort()).toEqual(
      [
        '未-壬申:engagement:blank→avoid',
        '未-壬申:moving:blank→avoid',
        '未-壬申:wedding:blank→avoid',
      ].sort(),
    )
    for (const [path, hash] of Object.entries(candidate.inputs)) expect(sha(path), path).toBe(hash)
    expect(sha(candidate.generator.path)).toBe(candidate.generator.sha256)
  })

  it('Golden v2 lock is untouched', () => {
    for (const f of golden.files as { path: string; sha256: string }[])
      expect(sha(f.path), f.path).toBe(f.sha256)
  })
})
