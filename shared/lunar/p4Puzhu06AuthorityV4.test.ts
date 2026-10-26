import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v4.json'
import v3 from '../almanac-data/p4b-puzhu06-v3.json'

// F1 Stage 3 (owner R2): authority v4 = v3 + liftExclusions.五離 (p4b-puzhu06-authority-v4/build.py).
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v4/'
const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')
const raw = readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8')

describe('puzhu:06 authority v4 (F1 R2)', () => {
  it('matches its lock', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
  })

  it('excludes exactly the puzhu:06 triggers 五離\'s own entry does not name', () => {
    const own = authority.liftExclusions.五離.basis
    expect([...raw].slice(own.offset, own.offset + own.length).join('')).toBe(own.quote)
    expect(own.quote).toBe('與天德月德天德合月德合天赦三合六合併則不忌')
    expect(authority.liftExclusions.五離.triggers).toEqual(
      authority.triggers.filter((t) => !own.quote.includes(t)),
    )
    expect(authority.liftExclusions.五離.triggers).toEqual(['天願', '月恩', '四相', '時德'])
  })

  it('moves nothing else from v3: other gods, Q4a, triggers, headings', () => {
    const { 五離: _w, ...rest } = authority.liftExclusions
    expect(rest).toEqual(v3.liftExclusions)
    for (const k of ['liftLists', 'triggers', 'headings', 'grades', 'clauses', 'inherit', 'rowRule'] as const)
      expect(authority[k], k).toEqual(v3[k])
    expect(authority.parent).toEqual({
      version: 'p4b-puzhu06-v3',
      path: 'shared/almanac-data/p4b-puzhu06-v3.json',
      sha256: sha256(readFileSync('shared/almanac-data/p4b-puzhu06-v3.json')),
    })
  })
})
