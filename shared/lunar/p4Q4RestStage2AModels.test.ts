import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getP4YouweiScopes, resolveP4Headings } from './p4HeadingAnnotation'
import { resolveP4Puzhu06Day } from './p4Puzhu06'

// Q4-REST Stage 2A (docs/audits/p4-q4-rest-stage2a-n126-review.md), audit only. For the corpus pattern search
// "surviving remaining-ji 忌 + independent 宜": per context and heading, the production (v4) final state with the
// 忌 sources split by kind. Q4R2A_DUMP=1 writes q4-rest-stage2a/pattern-input.json (720 contexts); npm test
// re-derives the contexts the search uses. Production code and data are untouched.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2a/'
const OUT = DIR + 'pattern-input.json'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'

function rows(month: string, pillar: string) {
  const day = resolveP4Puzhu06Day(month, pillar)
  const yiKnown = Object.fromEntries(
    Object.entries(day.yiEvidence as Record<string, { yi?: boolean }>)
      .filter(([, e]) => e.yi !== undefined)
      .map(([k, e]) => [k, e.yi!]),
  )
  const { scopes } = resolveP4Headings(month, pillar, yiKnown)
  const youwei = getP4YouweiScopes(day.subjects)
  const out: Record<string, unknown> = {}
  for (const [h, f] of Object.entries(day.headings)) {
    const remaining = Object.entries(day.remaining.scopes)
      .filter(([, s]) => s.presence === 'present' && s.headings[h] === 'kept')
      .map(([n]) => n)
    if (!remaining.length) continue
    const subjects = Object.entries(scopes)
      .filter(
        ([, sc]) =>
          !('headings' in sc) ||
          ['only_ji', 'both_present', 'neither_recorded', 'undetermined'].includes(sc.headings[h]!),
      )
      .map(([n, sc]) => `${n}:${'headings' in sc ? sc.headings[h] : 'undetermined'}`)
    const yw = Object.entries(youwei)
      .filter(([, y]) => y.headings[h] === 'only_ji')
      .map(([n]) => n)
    const yi = (
      day.yiEvidence as unknown as Record<
        string,
        { yi?: boolean; trace?: { han: string; presence: string }[] }
      >
    )[h]
    out[h] = {
      final: f.state,
      protectedJi: f.protectedJi,
      yiOperand: yi?.yi ?? null,
      yiGods: (yi?.trace ?? []).filter((t) => t.presence === 'present').map((t) => t.han),
      remaining: remaining.sort(),
      subjects: subjects.sort(),
      youwei: yw.sort(),
      puzhu06: day.puzhu06[h]?.action ?? 'n/a',
    }
  }
  return out
}

const contexts = () =>
  [...B].flatMap((m) => Array.from({ length: 60 }, (_, i) => `${m}-${S[i % 10]!}${B[i % 12]!}`))

describe('Q4-REST Stage 2A pattern input', () => {
  it.skipIf(!process.env.Q4R2A_DUMP)(
    'dumps 720 contexts',
    () => {
      const out = Object.fromEntries(contexts().map((c) => [c, rows(c[0]!, c.slice(2))]))
      writeFileSync(OUT, JSON.stringify({ authority: 'p4b-puzhu06-v4', contexts: out }) + '\n')
    },
    600_000,
  )

  it('the frozen input re-derives for every page context the search uses', () => {
    expect(existsSync(OUT)).toBe(true)
    const dump = JSON.parse(readFileSync(OUT, 'utf8'))
    const search = JSON.parse(readFileSync(DIR + 'corpus-pattern-search.json', 'utf8')) as {
      pages: { context: string }[]
    }
    const ctx = [...new Set(search.pages.map((p) => p.context))]
    expect(ctx.length).toBeGreaterThan(40)
    for (const c of ctx) expect(rows(c[0]!, c.slice(2)), c).toEqual(dump.contexts[c])
  }, 300_000)
})
