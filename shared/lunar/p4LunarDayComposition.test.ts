import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-p4-lunar-day-v1.json'
import authority from '../almanac-data/p4-lunar-day-taboo-v1.json'
import lock from '../../docs/audits/sources/p4-vol10/lunar-day-lock-v1.json'
import { resolveP4FullDay } from './p4FullDayComposition'

describe('P4-B lunar day operands', () => {
  it('verifies the authority and hand-derived pre-code Golden bytes', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const { source } of authority.rules) {
      const raw = readFileSync(`docs/audits/sources/p4-vol10/vol${source.volume}.raw.txt`, 'utf8')
      expect(createHash('sha1').update(raw).digest('hex')).toBe(source.sha1)
      expect(
        Array.from(raw)
          .slice(source.offset, source.offset + Array.from(source.text).length)
          .join(''),
      ).toBe(source.text)
    }
  })
  it.each(golden.cases)(
    'reads day $day independently of Month Jian',
    ({ day, haircut, medical }) => {
      const r = resolveP4FullDay('寅', '丙辰', { lunarDay: day })
      expect(r).toHaveProperty('lunarDayScopes')
      expect(r.lunarDayScopes['每月十二日十五日']!.presence).toBe(haircut ? 'present' : 'absent')
      expect(r).toHaveProperty('lunarDayScopes')
      expect(r.lunarDayScopes['每月十五日']!.presence).toBe(medical ? 'present' : 'absent')
      expect(r.unresolvedJi['整容剃頭']).not.toContain('每月十二日十五日')
      expect(r.unresolvedJi['求醫療病']).not.toContain('每月十五日')
      expect(r.unresolvedJi['求醫療病']).toContain('朔望日')
      if (haircut) expect(r.headings['整容剃頭']).toMatchObject({ ji: true, protectedJi: true })
      if (medical)
        expect(r.headings['求醫療病']).toMatchObject({
          ji: true,
          protectedJi: true,
          state: 'undetermined',
        })
    },
  )
  it('keeps missing operands unknown and identifies only the 剃頭 component', () => {
    const r = resolveP4FullDay('寅', '丙辰')
    expect(r).toHaveProperty('lunarDayScopes')
    expect(r.lunarDayScopes['每月十二日十五日']).toMatchObject({
      presence: 'unknown',
      sourceActivity: '剃頭',
    })
    expect(r.unresolvedJi['整容剃頭']).toContain('每月十二日十五日')
    expect(resolveP4FullDay('寅', '丙辰', {})).toEqual(r)
  })
  it('lets the explicit puzhu:28 day exception lift these 忌 while retaining their presence', () => {
    const r = resolveP4FullDay('巳', '丙申', { lunarDay: 15 })
    expect(r).toHaveProperty('lunarDayScopes')
    expect(r.lunarDayScopes['每月十五日']!.presence).toBe('present')
    for (const h of ['整容剃頭', '求醫療病']) {
      expect(r.headings[h]).toMatchObject({ ji: false, protectedJi: false })
      expect(r.unresolvedJi[h]).toEqual([])
    }
  })
  it.each([0, 31, -1, 12.5, NaN, Infinity])('rejects invalid lunar day %s', (lunarDay) => {
    expect(() => resolveP4FullDay('寅', '丙辰', { lunarDay })).toThrow(RangeError)
  })
})
