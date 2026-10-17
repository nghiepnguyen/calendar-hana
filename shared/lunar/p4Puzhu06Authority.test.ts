import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v1.json'
import { P4_DAY_HEADINGS } from './p4DayComposition'

// puzhu:06 task 2.0: the authority is built by p4b-puzhu06-authority-v1/build.py from the locked
// 卷十 raw; this gate keeps its bytes, spans and the owner decision of 2026-10-16 from drifting.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v1/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
type Span = { path: string; offset: number; length: number; quote: string }

describe('puzhu:06 authority (audit-only)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('quotes every span at its code-point offset', () => {
    const spans: Span[] = [
      authority.rule,
      ...Object.values(authority.rule.parts),
      ...Object.values(authority.grades).map((g) => g.prose),
      authority.puzhu27,
      ...Object.values(authority.clauses),
      ...Object.values(authority.liftLists),
    ]
    expect(spans).toHaveLength(23)
    const text = [...readFileSync(authority.raw.path, 'utf8')]
    for (const s of spans)
      expect(text.slice(s.offset, s.offset + s.length).join(''), s.quote).toBe(s.quote)
  })

  it('scopes five P4 headings and records the owner answers', () => {
    for (const h of authority.headings)
      expect(P4_DAY_HEADINGS.includes(h.p4), h.p4).toBe(h.scope === 'IN_SCOPE')
    expect(authority.triggers).toEqual([
      '天德',
      '月德',
      '天德合',
      '月德合',
      '天赦',
      '天願',
      '月恩',
      '四相',
      '時德',
    ])
    const answers = Object.fromEntries(
      Object.entries(authority.ownerDecision.answers).map(([q, a]) => [q, a.answer]),
    )
    expect(answers).toEqual({ Q1: 'no', Q2: 'no', Q3: 'no', Q4: 'yes' })
    const actions = Object.fromEntries(
      Object.entries(authority.classes).map(([c, v]) => [c, v.action]),
    )
    expect(actions).toEqual({
      YOUJI: 'keep',
      ZHUSHI: 'keep',
      PUZHU27: 'keep',
      AN: 'keep',
      AD: 'keep',
      AU: 'keep',
      QL: 'lift',
      UNDETERMINED: 'hold',
      PROTECTED: 'untouched',
    })
  })
})
