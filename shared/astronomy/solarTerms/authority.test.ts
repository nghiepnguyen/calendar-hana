/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  GENERATOR_VERSION,
  OUTPUT_PATH,
  renderAuthorityData,
} from '../../../scripts/generate-solar-term-authority.mjs'
import { AUTHORITY_DATA } from './authority.data'
import {
  assertSolarTermAuthority,
  decodeSolarTermAuthority,
  getCanonicalSolarMonth,
  getCanonicalSolarTermAt,
  getCanonicalSolarTermAtTT,
  getCanonicalSolarTermBoundary,
  getCanonicalSolarTermsForYear,
  monthJianBranchForTermIndex,
  SOLAR_TERM_AUTHORITY,
  type SolarTermAuthorityData,
} from './authority'
import { sha256AsciiHex } from './sha256'
import { SolarTermAuthorityError } from './types'

const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
const frozen = JSON.parse(
  readFileSync('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', 'utf8'),
) as { rows: string[] }
const rows = frozen.rows.map((r) => r.split('|'))
const all = Array.from({ length: 203 }, (_, i) => getCanonicalSolarTermsForYear(1899 + i)).flat()

describe('authority runtime data integrity', () => {
  it('is the deterministic generator output of the frozen golden-v4 source', () => {
    const manifest = JSON.parse(readFileSync('golden-v4/manifest.json', 'utf8'))
    const source = readFileSync('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')
    expect(sha(source)).toBe(manifest.files[AUTHORITY_DATA.sourcePath].sha256)
    expect(AUTHORITY_DATA.sourceSha256).toBe(sha(source))
    const rendered = renderAuthorityData()
    expect(readFileSync(OUTPUT_PATH, 'utf8')).toBe(rendered.text)
    expect(GENERATOR_VERSION).toBe(SOLAR_TERM_AUTHORITY.generatorVersion)
    expect(sha(AUTHORITY_DATA.encoded)).toBe(SOLAR_TERM_AUTHORITY.encodedSha256)
    expect(sha256AsciiHex(AUTHORITY_DATA.encoded)).toBe(sha(AUTHORITY_DATA.encoded))
  })

  it('pins authority, clock and Golden identity', () => {
    expect(assertSolarTermAuthority()).toMatchObject({
      authorityVersion: 'astronomy-authority-v4',
      datasetId: 'solar-terms-jpl-de440s-clock-v1',
      clockVersion: 'clock-v1',
      goldenVersion: 'golden-v4',
      rowCount: 4872,
    })
  })

  it('reproduces every frozen row: T, clock-v1 civil ms, ISO and regime', () => {
    expect(all).toHaveLength(4872)
    all.forEach((b, i) => {
      const r = rows[i]!
      expect([b.year, b.termIndex, b.ttMs, b.civilEpochMs, b.civilIso, b.clockRegime]).toEqual([
        +r[0]!,
        +r[1]!,
        +r[3]!,
        +r[4]!,
        r[5],
        r[6],
      ])
    })
  })

  it('sync SHA-256 matches node crypto', () => {
    for (const s of ['', 'abc', 'x'.repeat(55), 'y'.repeat(56), 'z'.repeat(1000)])
      expect(sha256AsciiHex(s)).toBe(sha(s))
    expect(() => sha256AsciiHex('ạ')).toThrow(RangeError)
  })
})

describe('fail closed on missing, corrupt or wrong-version data', () => {
  const base = AUTHORITY_DATA as SolarTermAuthorityData
  const parts = AUTHORITY_DATA.encoded.split(',')
  const reencode = (next: string[]) => ({ ...base, encoded: next.join(',') })
  const cases: [string, SolarTermAuthorityData, string][] = [
    [
      'authority version',
      { ...base, authorityVersion: 'astronomy-authority-v3' },
      'VERSION_MISMATCH',
    ],
    ['clock version', { ...base, clockVersion: 'clock-v0' }, 'VERSION_MISMATCH'],
    ['generator version', { ...base, generatorVersion: 'x 0.0.0' }, 'VERSION_MISMATCH'],
    ['source hash', { ...base, sourceSha256: '0'.repeat(64) }, 'VERSION_MISMATCH'],
    ['declared hash', { ...base, encodedSha256: '0'.repeat(64) }, 'HASH_MISMATCH'],
    [
      'one timestamp',
      reencode(parts.map((p, i) => (i === 2400 ? (parseInt(p, 36) + 1).toString(36) : p))),
      'HASH_MISMATCH',
    ],
    ['missing rows', reencode(parts.slice(0, -1)), 'HASH_MISMATCH'],
    ['empty', { ...base, encoded: '' }, 'HASH_MISMATCH'],
  ]
  for (const [name, data, code] of cases)
    it(name, () => {
      expect(() => decodeSolarTermAuthority(data)).toThrow(SolarTermAuthorityError)
      expect(() => decodeSolarTermAuthority(data)).toThrow(code)
    })

  it('structural checks reject well-hashed but malformed tables', () => {
    const swapped = [...parts]
    ;[swapped[100], swapped[101]] = [swapped[101]!, swapped[100]!]
    const badShift = parts.map((p, i) =>
      i === 100 ? (parseInt(p, 36) + 20 * 86_400_000).toString(36) : p,
    )
    for (const next of [swapped, badShift, parts.slice(0, -1)]) {
      const encoded = next.join(',')
      const pinned = { ...SOLAR_TERM_AUTHORITY, encodedSha256: sha(encoded), rowCount: 4872 }
      const data = { ...base, encoded, encodedSha256: sha(encoded) }
      const run = () => decodeSolarTermAuthority(data, pinned)
      if (next === swapped) {
        // A swap of two deltas keeps sizes plausible, so it must surface as a T change.
        const decoded = run()
        expect(decoded.ttMs[100]).not.toBe(all[100]!.ttMs)
      } else expect(run).toThrow('MALFORMED')
    }
  })

  it('rejects out-of-range years, terms and instants', () => {
    for (const year of [1898, 2102, 1900.5]) {
      expect(() => getCanonicalSolarTermsForYear(year)).toThrow('OUT_OF_RANGE')
      expect(() => getCanonicalSolarTermBoundary(year, 0)).toThrow('OUT_OF_RANGE')
    }
    expect(() => getCanonicalSolarTermBoundary(2000, 24)).toThrow('OUT_OF_RANGE')
    const first = all[0]!
    const last = all.at(-1)!
    expect(() => getCanonicalSolarTermAt(first.civilEpochMs - 1)).toThrow('OUT_OF_RANGE')
    expect(getCanonicalSolarTermAt(first.civilEpochMs)).toBe(first)
    expect(() => getCanonicalSolarTermAt(last.civilEpochMs)).toThrow('OUT_OF_RANGE')
    expect(() => getCanonicalSolarTermAtTT(last.ttMs)).toThrow('OUT_OF_RANGE')
    expect(() => getCanonicalSolarTermAt(1.5)).toThrow(RangeError)
  })
})

describe('full-range properties 1899–2101 (all 24 terms)', () => {
  it('24 terms per year, target sequence, strict monotonic, no duplicates, 0° wrap', () => {
    for (let year = 1899; year <= 2101; year++) {
      const terms = getCanonicalSolarTermsForYear(year)
      expect(terms.map((t) => t.termIndex)).toEqual(
        Array.from({ length: 24 }, (_, i) => (19 + i) % 24),
      )
      for (const t of terms) {
        expect(t.targetLongitudeDeg).toBe(t.termIndex * 15)
        expect(getCanonicalSolarTermBoundary(year, t.termIndex)).toBe(t)
        expect(new Date(t.civilEpochMs).getUTCFullYear()).toBe(year)
      }
    }
    for (let i = 1; i < all.length; i++) {
      expect(all[i]!.ttMs).toBeGreaterThan(all[i - 1]!.ttMs)
      expect(all[i]!.civilEpochMs).toBeGreaterThan(all[i - 1]!.civilEpochMs)
      expect(all[i]!.termIndex).toBe((all[i - 1]!.termIndex + 1) % 24)
    }
    expect(new Set(all.map((b) => b.ttMs)).size).toBe(4872)
  })

  it('T − 1 ms OLD, T NEW, T + 1 ms NEW on both the TT and civil axes', () => {
    for (let i = 1; i < all.length - 1; i++) {
      const b = all[i]!
      const prev = all[i - 1]!
      expect(getCanonicalSolarTermAtTT(b.ttMs - 1)).toBe(prev)
      expect(getCanonicalSolarTermAtTT(b.ttMs)).toBe(b)
      expect(getCanonicalSolarTermAtTT(b.ttMs + 1)).toBe(b)
      expect(getCanonicalSolarTermAt(b.civilEpochMs - 1)).toBe(prev)
      expect(getCanonicalSolarTermAt(b.civilEpochMs)).toBe(b)
      expect(getCanonicalSolarTermAt(b.civilEpochMs + 1)).toBe(b)
    }
  })

  it('Month Jian changes exactly at every Jie and never at a Qi', () => {
    let jie = 0
    for (let i = 1; i < all.length - 1; i++) {
      const b = all[i]!
      const before = getCanonicalSolarMonth(b.civilEpochMs - 1)
      const at = getCanonicalSolarMonth(b.civilEpochMs)
      expect(getCanonicalSolarMonth(b.civilEpochMs + 1)).toBe(at)
      if (b.targetLongitudeDeg % 30 === 15) {
        jie++
        expect(at).toBe((before + 1) % 12)
        expect(at).toBe(monthJianBranchForTermIndex(b.termIndex))
      } else expect(at).toBe(before)
    }
    expect(jie).toBe(2435)
    // Lập xuân (315°) opens Dần (2); Đại tuyết (255°) opens Tý (0); Tiểu hàn opens Sửu.
    expect(monthJianBranchForTermIndex(21)).toBe(2)
    expect(monthJianBranchForTermIndex(17)).toBe(0)
    expect(monthJianBranchForTermIndex(19)).toBe(1)
  })
})
