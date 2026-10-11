import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-season-days.json'
import golden from '../almanac-data/golden-p4-season-days.json'
import lock from '../../docs/audits/sources/p4-vol10/season-days-lock.json'
import { getP4SeasonDays, P4_SEASON_DAYS } from './p4SeasonDays'
import { getXiejiGodPresence } from './xiejiGodPresence'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const raw = (path: string) => Array.from(readFileSync(path, 'utf8'))

describe('P4 四時 days and 月令長生, audit only', () => {
  it('keeps sources, quotes and the frozen oracle intact', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const s of Object.values(art.sources))
      expect(createHash('sha1').update(readFileSync(s.path)).digest('hex')).toBe(s.sha1)
    const files: Record<string, string[]> = {
      卷04: raw(art.sources['04'].path),
      卷05: raw(art.sources['05'].path),
      卷10: raw('docs/audits/sources/p4-vol10/vol10.raw.txt'),
    }
    for (const day of Object.values(art.days))
      for (const r of day.source)
        expect(
          files[r.volume]!.slice(r.offset, r.offset + Array.from(r.text).length).join(''),
        ).toBe(r.text)
  })

  // Hand-read in golden-p4-season-days.json before the module existed.
  it.each(golden.cases)('$monthJian月 $dayBranch日', (c) => {
    const p = getP4SeasonDays(BRANCHES.indexOf(c.monthJian), BRANCHES.indexOf(c.dayBranch))
    expect(P4_SEASON_DAYS.filter((d) => p[d] === 'present')).toEqual(c.present)
    expect(P4_SEASON_DAYS.filter((d) => p[d] === 'unknown')).toEqual(c.unknown ?? [])
  })

  it('agrees with the audited 民日 table and keeps the five days on distinct branches', () => {
    for (let m = 0; m < 12; m++) {
      const hits: string[] = []
      for (let d = 0; d < 12; d++) {
        const p = getP4SeasonDays(m, d)
        expect(p['民日'] === 'present').toBe('dan_nhat' in getXiejiGodPresence(m, d % 10, d))
        hits.push(...['王日', '官日', '相日', '民日', '守日'].filter((x) => p[x] === 'present'))
      }
      expect(hits.sort()).toEqual(['王日', '官日', '相日', '民日', '守日'].sort())
    }
  })
})
