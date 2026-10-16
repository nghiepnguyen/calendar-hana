import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p5-warehouse-v1.json'

// P5 task 2: the warehouse authority is built by p5-warehouse-authority-v1/build.py from the
// locked raw sources; this gate keeps its bytes, spans and owner decision D from drifting.
const DIR = 'docs/audits/sources/p4-vol10/p5-warehouse-authority-v1/'
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
type Span = { path: string; offset: number; length: number; quote: string }

describe('P5 warehouse authority (audit-only)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('quotes every clause at its code-point offset', () => {
    const cp = authority.coPresence
    const spans: Span[] = [
      ...Object.values(authority.heading),
      ...Object.values(authority.direct.vol10),
      ...Object.values(cp.R10.clauses),
      ...Object.values(cp.commentary),
    ]
    for (const s of spans) {
      const text = [...readFileSync(s.path, 'utf8')]
      expect(text.slice(s.offset, s.offset + s.length).join(''), s.quote).toBe(s.quote)
    }
  })

  it('records decision D with readings that differ only where the sources differ', () => {
    expect(authority.status).toBe('OWNER_ADOPTED_SOURCE_DEPENDENT')
    expect(authority.ownerDecision.id).toBe('D')
    const cp = authority.coPresence
    expect(cp.connective).toBe('ANY')
    for (const base of cp.bases) {
      const r10 = cp.R10.partners[base as keyof typeof cp.R10.partners]
      const r11 = cp.R11.partners[base as keyof typeof cp.R11.partners]
      expect(r10).toContain('月恩')
      expect(r11).not.toContain('月恩')
      expect(r11).toEqual(['月德', '四相', '時德', '開日'])
      expect(cp.agreedPartners[base as keyof typeof cp.agreedPartners]).toEqual(
        r10.filter((p) => r11.includes(p)),
      )
    }
    const v = JSON.parse(readFileSync(DIR + 'validation.json', 'utf8'))
    expect(v.truthTable.byVerdict).toEqual({ agreed: 135, agreed_absent: 5, source_dependent: 20 })
    expect(v.impossibleCoPresence).toEqual({
      contexts: 720,
      found: { '收日+開日': 0, '天倉+時德': 0 },
    })
  })
})
