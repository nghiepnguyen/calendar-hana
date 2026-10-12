import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-soil-owner-convention-v1.json'
import golden from '../almanac-data/golden-p4-soil-owner-convention-v1.json'
import lock from '../../docs/audits/sources/p4-vol10/soil-owner-convention-lock-v1.json'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4FullDay } from './p4FullDayComposition'
import { thoVuongDungSuPeriods } from './thoVuongDungSu'

describe('P4-B owner-adopted soil convention', () => {
  it('preserves the pre-code independent Golden and raw source', () => {
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
    expect(authority.status).toBe('OWNER_ADOPTED_SOURCE_DEPENDENT')
    expect(authority.canonicalWitnessAudit.status).toBe('OPEN')
  })
  it.each(golden.periods)(
    '$term $li: Vietnam boundary agrees with independent HKO civil date',
    (p) => {
      expect(thoVuongDungSuPeriods(Number(p.li.slice(0, 4)))).toContainEqual(
        expect.objectContaining({ li: p.li, onset: p.onset, eve: p.eve }),
      )
    },
  )
  it.each(golden.cases)('$date presence=$presence', (c) => {
    expect(getP4SoilPresence(c.date)).toMatchObject({
      presence: c.presence,
      authorityId: authority.version,
      status: 'OWNER_ADOPTED_SOURCE_DEPENDENT',
    })
  })
  it('adds protected raw 忌 only to the six catalog headings, even with 德', () => {
    const soil = getP4SoilPresence('2025-01-16')
    for (const [month, pillar] of [
      ['寅', '丙辰'],
      ['寅', '丁卯'],
    ]) {
      const before = resolveP4FullDay(month!, pillar!)
      const after = resolveP4FullDay(month!, pillar!, { soil })
      for (const h of golden.headings) {
        expect(after.prePropagationHeadings[h], h).toMatchObject({ ji: true, protectedJi: true })
        expect(after.unresolvedJi[h], h).not.toContain('土王用事後')
      }
      for (const h of Object.keys(before.prePropagationHeadings))
        if (!golden.headings.includes(h))
          expect(after.prePropagationHeadings[h], h).toEqual(before.prePropagationHeadings[h])
    }
  })
  it('records known absence without manufacturing a taboo', () => {
    const before = resolveP4FullDay('寅', '丙辰')
    const r = resolveP4FullDay('寅', '丙辰', { soil: getP4SoilPresence('2025-01-15') })
    expect(r.soilScope.presence).toBe('absent')
    for (const h of golden.headings) {
      expect(r.prePropagationHeadings[h]!.ji).toBe(before.prePropagationHeadings[h]!.ji)
      expect(r.unresolvedJi[h]).not.toContain('土王用事後')
    }
  })
  it('keeps missing or out-of-coverage presence unknown on all six headings', () => {
    for (const soil of [
      undefined,
      getP4SoilPresence('1851-01-01'),
      getP4SoilPresence('2028-01-01'),
    ]) {
      const r = resolveP4FullDay('寅', '丙辰', { soil })
      expect(r.soilScope.presence).toBe('unknown')
      for (const h of golden.headings) expect(r.unresolvedJi[h]).toContain('土王用事後')
    }
  })
  it('retains presence evidence while puzhu:28 lifts every soil 忌', () => {
    const r = resolveP4FullDay('巳', '丙申', { soil: getP4SoilPresence('2025-01-16') })
    expect(r.soilScope.presence).toBe('present')
    for (const h of golden.headings)
      expect(r.headings[h]).toMatchObject({ ji: false, protectedJi: false })
  })
  it.each(['bad', '2025-02-30', '2025-1-1'])('rejects invalid civil date %s', (date) => {
    expect(() => getP4SoilPresence(date)).toThrow(RangeError)
  })
})
