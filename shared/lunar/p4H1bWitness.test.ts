import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import lock from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
import predictions from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/predictions.json'
import premise from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/premise-predictions.json'
import yuebiaoLock from '../../docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json'

// Audit only (H1-B 月表 witness review). Locks evidence and the prediction freeze; it does not
// assert that H1-B is historically correct, and it reads no engine output.
const COMPOSE = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/compose'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const OFFICERS = '建除滿平定執破危成收開閉'
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const tsv = (name: string) => {
  const [head, ...lines] = readFileSync(`${COMPOSE}/${name}`, 'utf8').trimEnd().split('\n')
  const keys = head.split('\t')
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [keys[i], v])))
}
const ctxOf = (p: { monthJian: string; pillar: string }) => `${p.monthJian}-${p.pillar}`

describe('H1-B 月表 witness lock (audit only)', () => {
  it('keeps every page byte-identical and on the frozen locator', () => {
    const urls = new Map(
      [...predictions.targets, ...premise.liftPremise, ...premise.jieshaClass].map((t) => [
        t.context,
        t.yuebiao.url,
      ]),
    )
    expect(lock.pages).toHaveLength(29)
    for (const page of lock.pages) {
      expect(sha256(page.path), page.path).toBe(page.sha256)
      expect(page.url).toBe(urls.get(ctxOf(page)))
    }
  })

  it('reads a 建除 officer that matches Month Jian and day branch on every page', () => {
    for (const page of lock.pages) {
      const offset = (BRANCHES.indexOf(page.pillar[1]) - BRANCHES.indexOf(page.monthJian) + 12) % 12
      expect(page.officer, ctxOf(page)).toBe(OFFICERS[offset])
    }
  })
})

describe('H1-B prediction freeze', () => {
  const changes = tsv('h1b-changes.tsv')

  it('keeps the freeze artifacts byte-identical', () => {
    expect(lock.freeze).toHaveLength(4)
    for (const f of lock.freeze) expect(sha256(f.path), f.path).toBe(f.sha256)
  })
  const dated = new Map(tsv('dated.tsv').map((r) => [`${r.date}|${r.heading}`, r]))

  it('matches the Golden v2 H1-B rows', () => {
    const only = changes.filter((c) => c.final_state === 'only_ji')
    expect(predictions.counts).toEqual({
      h1bRows: { dated: 95, context: 58 },
      h1bContexts: 32,
      distinguishingRows: { dated: 33, context: 23 },
      distinguishingTargets: 24,
      distinguishingPages: 22,
      nonDistinguishingRows: 97,
    })
    const keys = new Set(
      only.map((c) => {
        if (c.domain === 'context') return `${c.id}|${c.heading}`
        const d = dated.get(`${c.id}|${c.heading}`)!
        return `${d.month_jian}-${d.pillar}|${c.heading}`
      }),
    )
    expect(new Set(predictions.targets.map((t) => `${t.context}|${t.heading}`))).toEqual(keys)
    expect(predictions.targets.flatMap((t) => t.dates)).toHaveLength(33)
  })

  it('classifies every distinguishing target exactly once', () => {
    const byCtx = new Map(lock.pages.map((p) => [ctxOf(p), p]))
    const tally: Record<string, number> = {}
    for (const t of predictions.targets) {
      const page = byCtx.get(t.context)
      expect(page, t.context).toBeDefined()
      tally[page!.classification] = (tally[page!.classification] ?? 0) + t.dates.length
    }
    expect(tally).toEqual({ CONFIRMS_H1B: 11, PRESENCE_MISMATCH: 14, SOURCE_AMBIGUOUS: 8 })
  })
})

describe('H1-B transcription consistency', () => {
  const printed = (line: string) => line.includes('安葬')

  it('prints 安葬 on every 安葬 page classified CONFIRMS_H1B', () => {
    for (const page of lock.pages.filter((p) => p.classification === 'CONFIRMS_H1B')) {
      expect(printed(page.jiLine), ctxOf(page)).toBe(true)
      expect(page.goldenDiff.printedButUnnoted).toEqual([])
    }
  })

  it('omits 安葬 on every 重日/復日 + 德 premise page, reused or new', () => {
    const reused = new Map(yuebiaoLock.pages.map((p) => [ctxOf(p), p.jiLine]))
    for (const ctx of lock.reused.liftPremise) expect(printed(reused.get(ctx)!), ctx).toBe(false)
    for (const page of lock.pages.filter((p) => p.classification === 'LIFT_PREMISE_HOLDS'))
      expect(printed(page.jiLine), ctxOf(page)).toBe(false)
  })

  it('records Golden-unnoted 劫煞 headings on every PRESENCE_MISMATCH page', () => {
    for (const page of lock.pages.filter((p) => p.classification === 'PRESENCE_MISMATCH'))
      expect(page.goldenDiff.printedButUnnoted.length, ctxOf(page)).toBeGreaterThanOrEqual(5)
  })
})
