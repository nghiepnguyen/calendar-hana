import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolveP4OwnerRulesDay } from './p4OwnerRules'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { resolveP4YiDay } from './p4YiDayComposition'

// Q4-REST Stage 2B (docs/audits/p4-q4-rest-stage2b-witness-acquisition.md), audit only. Production (v4) owner-rules
// rows for the six acquired contexts: state, 忌 sources, protection, puzhu:06 decision and the 宜 gods of the trace.
// Q4R2B_DUMP=1 writes q4-rest-stage2b/runtime.json; npm test re-derives it. Production is untouched.
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2b/'
const OUT = DIR + 'runtime.json'
// The six acquired contexts, plus 戌-癸卯 (小耗 replication candidate; not acquired).
const CONTEXTS = ['午-戊申', '子-丙寅', '巳-戊戌', '卯-丁丑', '丑-甲申', '午-戊辰', '戌-癸卯']

function rows(c: string) {
  const [m, p] = [c[0]!, c.slice(2)]
  const day = resolveP4OwnerRulesDay(m, p)
  const yi = resolveP4YiDay(m, p).yiEvidence as unknown as Record<
    string,
    { trace?: { han: string; presence: string }[] }
  >
  return Object.fromEntries(
    Object.entries(day).map(([h, r]) => [
      h,
      {
        state: r.state,
        ji: r.trace?.ji ?? [],
        prot: r.trace?.prot ?? [],
        puzhu06: r.puzhu06 ?? '',
        yiGods: (yi[h]?.trace ?? []).filter((t) => t.presence === 'present').map((t) => t.han),
      },
    ]),
  )
}

describe('Q4-REST Stage 2B runtime', () => {
  it.runIf(process.env.Q4R2B_DUMP === '1')('dumps the six contexts', () => {
    writeFileSync(
      OUT,
      JSON.stringify({
        authority: P4_PUZHU06_AUTHORITY_ID,
        contexts: Object.fromEntries(CONTEXTS.map((c) => [c, rows(c)])),
      }) + '\n',
    )
  })

  it('the frozen runtime re-derives on v4', () => {
    expect(existsSync(OUT)).toBe(true)
    const dump = JSON.parse(readFileSync(OUT, 'utf8'))
    expect(dump.authority).toBe('p4b-puzhu06-v4')
    for (const c of CONTEXTS) expect(rows(c), c).toEqual(dump.contexts[c])
  })
})
