import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-p4-lunar-phase-v1.json'
import authority from '../almanac-data/p4-lunar-phase-authority-v1.json'
import lock from '../../docs/audits/sources/p4-vol10/lunar-phase-lock-v1.json'
import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4FullDay } from './p4FullDayComposition'

describe('P4-B lunar phase operand', () => {
  it('preserves the pre-code USNO data, scan transcription and Golden', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const raw = readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8')
    expect(createHash('sha1').update(raw).digest('hex')).toBe(authority.source.sha1)
    expect(
      Array.from(raw)
        .slice(
          authority.source.offset,
          authority.source.offset + Array.from(authority.source.text).length,
        )
        .join(''),
    ).toBe(authority.source.text)
  })
  it.each(golden.cases)('$date = $phase on the Vietnam civil day', (c) => {
    expect(getP4MoonPhase(c.date).phase).toBe(c.phase)
  })
  it('keeps 37 instances of each primary phase on the full 1095-day domain', () => {
    const counts: Record<string, number> = {}
    for (let t = Date.UTC(2025, 0, 1); t < Date.UTC(2028, 0, 1); t += 86400000) {
      const phase = getP4MoonPhase(new Date(t).toISOString().slice(0, 10)).phase
      counts[phase] = (counts[phase] ?? 0) + 1
    }
    expect(counts).toEqual({
      'New Moon': 37,
      'First Quarter': 37,
      'Full Moon': 37,
      'Last Quarter': 37,
      none: 947,
    })
  })
  it.each(['2025-01-07', '2025-01-14', '2025-01-22', '2025-01-29'])(
    'keeps the medical 忌 on every primary phase (%s)',
    (date) => {
      const phase = getP4MoonPhase(date)
      const r = resolveP4FullDay('寅', '丙辰', { lunarDay: 11, phase })
      expect(r).toHaveProperty('phaseScope')
      expect(r.phaseScope.presence).toBe('present')
      expect(r.headings['求醫療病']).toMatchObject({ ji: true, protectedJi: true })
      expect(r.unresolvedJi['求醫療病']).not.toContain('朔望日')
    },
  )
  it('does not manufacture a phase taboo on a known non-phase day', () => {
    const r = resolveP4FullDay('寅', '丙辰', { lunarDay: 11, phase: getP4MoonPhase('2025-01-15') })
    expect(r).toHaveProperty('phaseScope')
    expect(r.phaseScope.presence).toBe('absent')
    expect(r.headings['求醫療病'].ji).toBe(false)
    expect(r.unresolvedJi['求醫療病']).toEqual([])
  })
  it('keeps the fifteenth-day rule independent of the astronomical phase', () => {
    const r = resolveP4FullDay('寅', '丙辰', { lunarDay: 15, phase: getP4MoonPhase('2025-01-15') })
    expect(r.headings['求醫療病']).toMatchObject({ ji: true, protectedJi: true })
    expect(r.lunarDayScopes['每月十五日']!.presence).toBe('present')
  })
  it('keeps missing and out-of-coverage phase unknown', () => {
    for (const phase of [undefined, getP4MoonPhase('2028-01-01')]) {
      const r = resolveP4FullDay('寅', '丙辰', { lunarDay: 11, phase })
      expect(r.unresolvedJi['求醫療病']).toContain('朔望日')
      expect(r.headings['求醫療病'].state).toBe('undetermined')
    }
  })
  it('allows only the explicit puzhu:28 day override to lift the proved phase 忌', () => {
    const r = resolveP4FullDay('巳', '丙申', { lunarDay: 11, phase: getP4MoonPhase('2025-01-07') })
    expect(r.headings['求醫療病']).toMatchObject({ ji: false, protectedJi: false })
    expect(r.unresolvedJi['求醫療病']).toEqual([])
  })
  it.each(['2025-02-30', '2025-1-1', 'bad'])('rejects invalid civil date %s', (date) => {
    expect(() => getP4MoonPhase(date)).toThrow(RangeError)
  })
})
