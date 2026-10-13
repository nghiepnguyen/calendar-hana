import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-puzhu-end-v1.json'
import golden from '../almanac-data/golden-p4-puzhu-end-v1.json'
import lock from '../../docs/audits/sources/p4-vol10/puzhu-end-lock-v1.json'
import { resolveP4FullDay } from './p4FullDayComposition'
import { resolveP4Day } from './p4DayComposition'

describe('P4-B puzhu 27/28 first clause', () => {
  it('preserves pre-code Golden, source and eight scan witnesses', () => {
    for (const f of [...lock.files, ...lock.pages])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const raw = readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8')
    expect(createHash('sha1').update(raw).digest('hex')).toBe(authority.sourceRawSha1)
    for (const ref of authority.source)
      expect(
        Array.from(raw)
          .slice(ref.offset, ref.offset + Array.from(ref.text).length)
          .join(''),
      ).toBe(ref.text)
  })
  it.each(golden.cases)(
    '$month 月 $pillar restores 死敗 and suppresses 宜 according to 月厭',
    (c) => {
      const r = resolveP4FullDay(c.month, c.pillar)
      expect(r).toHaveProperty('puzhuEnd')
      expect(r.puzhuEnd.pillarRuleIds).toContain(c.rule)
      expect(r.puzhuEnd.restoredSubjects).toEqual(c.restoredSubjects)
      for (const [h, yi] of Object.entries(c.yi)) expect(r.headings[h]!.yi, h).toBe(yi)
      for (const [h, ji] of Object.entries(c.ji)) expect(r.headings[h]!.ji, h).toBe(ji)
      // 月厭 raw list does not include 祭祀/沐浴/掃舍宇; retain this day's evidence there.
      const base = resolveP4Day(c.month, c.pillar)
      for (const h of ['祭祀', '掃舍宇'])
        expect(r.prePropagationHeadings[h]!.yi, h).toBe(base.prePropagationHeadings[h]!.yi)
    },
  )
  it('also restores 天吏 when 四廢 meets the normally lifted 月德合 scope', () => {
    const c = golden.fourWasteCase
    const r = resolveP4FullDay(c.month, c.pillar)
    expect(r).toHaveProperty('puzhuEnd')
    expect(r.puzhuEnd.restoredSubjects).toEqual(c.restoredSubjects)
    for (const [h, ji] of Object.entries(c.ji)) expect(r.headings[h]!.ji, h).toBe(ji)
  })
  it('does not add a 月厭 taboo merely because a heading is in the suppression mask', () => {
    const r = resolveP4FullDay('巳', '戊午', { lunarDay: 11 })
    expect(r.headings['整容剃頭']!.yi).toBe(false)
    expect(r.headings['整容剃頭']!.ji).toBe(false)
  })
  it('does not restore 大時 on an ordinary 除日', () => {
    const r = resolveP4FullDay('寅', '丁卯')
    expect(r.subjects).toContain('大時')
    expect(r.puzhuEnd.restoredSubjects).toEqual([])
    expect(r.puzhuEnd.pillarRuleIds).toEqual([])
  })
  it('does not apply the first clause to a puzhu:28 exception day', () => {
    const r = resolveP4FullDay('巳', '丙申')
    expect(r).toHaveProperty('puzhuEnd')
    expect(r.puzhuEnd.pillarRuleIds).toEqual([])
    expect(r.puzhuEnd.restoredSubjects).toEqual([])
  })
})
