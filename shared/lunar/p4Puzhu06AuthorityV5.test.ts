import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4b-puzhu06-v5.json'
import v4 from '../almanac-data/p4b-puzhu06-v4.json'

// Q4-REST Stage 3 (owner R-JK / R-WX / R-XH / R-F1Y): authority v5 = v4 + QL_NARROW exclusions for 九空 / 五虛 /
// 小耗, the scoped only_ji rule and yiComposition R-F1Y (p4b-puzhu06-authority-v5/build.py).
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v5/'
const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')

describe('puzhu:06 authority v5 (Q4-REST)', () => {
  it('matches its lock and rebuilds byte-identically', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    for (const f of lock.files) expect(sha256(readFileSync(f.path)), f.path).toBe(f.sha256)
    execFileSync('python3', ['-I', DIR + 'build.py'])
  })

  it('excludes, per god, the puzhu:06 triggers outside its own 卷十 lifters (class QL_NARROW)', () => {
    const x = authority.liftExclusions
    expect(x.九空.triggers).toEqual(['天德', '天赦', '天願', '月恩', '四相', '時德'])
    expect(x.五虛.triggers).toEqual(['天赦', '月恩', '四相', '時德'])
    expect(x.小耗.triggers).toEqual(['天赦', '月恩', '四相', '時德'])
    for (const g of ['九空', '五虛', '小耗'] as const) expect(x[g].class, g).toBe('QL_NARROW')
    expect(authority.classes.QL_NARROW.action).toBe('keep')
    expect(authority.yiComposition).toEqual([
      expect.objectContaining({
        id: 'R-F1Y',
        heading: '立券交易',
        soleJi: '五離',
        from: 'both_present',
        to: 'only_ji',
      }),
    ])
  })

  it('moves nothing else from v4: 五墓 Q4a, 五離 R2, lift lists, triggers, headings', () => {
    const { 九空: _a, 五虛: _b, 小耗: _c, ...rest } = authority.liftExclusions
    expect(rest).toEqual(v4.liftExclusions)
    for (const k of [
      'liftLists',
      'triggers',
      'headings',
      'grades',
      'clauses',
      'inherit',
      'rowRule',
    ] as const)
      expect(authority[k], k).toEqual(v4[k])
    const { QL_NARROW: _n, ...classes } = authority.classes
    expect(classes).toEqual(v4.classes)
    expect(authority.parent).toEqual({
      version: 'p4b-puzhu06-v4',
      path: 'shared/almanac-data/p4b-puzhu06-v4.json',
      sha256: sha256(readFileSync('shared/almanac-data/p4b-puzhu06-v4.json')),
    })
  })
})
