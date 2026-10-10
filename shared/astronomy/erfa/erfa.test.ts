import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { apparentSunTrueEclipticOfDate } from './apparentSun'
import { detAtan2, detCos, detSin } from './detMath'
import { ab, epv00, nut00b, obl06, pfw06, pm, pn, velocityInC } from './erfa'
import * as epvData from './epv00.data'
import { NUT00B_TERMS } from './nut00b.data'

const audit = 'tasks/calendar-audit/erfa-foundation-v3.3'
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

describe('ERFA provenance lock', () => {
  const manifest = json(`${audit}/extraction-manifest.json`)

  it('ports all 1,951 EPV00 harmonic terms and 77 IAU 2000B rows', () => {
    expect(epvData.EPV00_TERM_COUNTS).toEqual(manifest.epv00.termCounts)
    const total = Object.values(epvData.EPV00_TERM_COUNTS).reduce((a, b) => a + b, 0)
    expect(total).toBe(1951)
    for (const [name, count] of Object.entries(epvData.EPV00_TERM_COUNTS)) {
      const table = epvData[name.toUpperCase() as 'E0X'] as readonly number[]
      expect(table.length).toBe(count * 3)
    }
    expect(NUT00B_TERMS).toHaveLength(77)
    for (const row of NUT00B_TERMS) expect(row).toHaveLength(11)
  })

  it('generated data files match the reproducible extraction hashes', () => {
    for (const [path, hash] of Object.entries(manifest.outputHashes as Record<string, string>))
      expect(createHash('sha256').update(readFileSync(path)).digest('hex'), path).toBe(hash)
  })
})

describe('deterministic trigonometry (fdlibm ports)', () => {
  it('documented constants carry the fdlibm bit patterns', () => {
    const source = readFileSync('shared/astronomy/erfa/detMath.ts', 'utf8')
    const view = new DataView(new ArrayBuffer(8))
    const hits = [
      ...source.matchAll(/(-?[\d.]+(?:e-?\d+)?),? \/\/ 0x([0-9A-F]{8}) 0x([0-9A-F]{8})/g),
    ]
    expect(hits.length).toBeGreaterThanOrEqual(40)
    for (const [, value, hi, lo] of hits) {
      view.setFloat64(0, Number(value))
      expect([view.getUint32(0), view.getUint32(4)], value).toEqual([
        parseInt(hi!, 16),
        parseInt(lo!, 16),
      ])
    }
  })

  it('stays within 1 ulp of the host libm and handles special inputs', () => {
    const ulps = (a: number, b: number) => {
      const f = new Float64Array([a, b])
      const i = new BigInt64Array(f.buffer)
      return Number(i[0]! > i[1]! ? i[0]! - i[1]! : i[1]! - i[0]!)
    }
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648)
    for (let k = 0; k < 200000; k++) {
      const x = (rnd() * 2 - 1) * 10 ** (rnd() * 5 - 1)
      expect(ulps(detSin(x), Math.sin(x))).toBeLessThanOrEqual(1)
      expect(ulps(detCos(x), Math.cos(x))).toBeLessThanOrEqual(1)
      const y = rnd() * 2 - 1
      expect(ulps(Math.abs(detAtan2(y, x)), Math.abs(Math.atan2(y, x)))).toBeLessThanOrEqual(1)
    }
    expect(detAtan2(0, -1)).toBe(Math.PI)
    expect(detAtan2(-1, 0)).toBe(-Math.PI / 2)
    expect(() => detSin(1e7)).toThrow(RangeError)
  }, 60_000)
})

describe('official ERFA 2.0.1 t_erfa_c.c vectors', () => {
  // Inputs, expected values and tolerances from upstream t_erfa_c.c; literals longer than a
  // double are written as the shortest round-trip decimal of the same value.
  it('eraEpv00', () => {
    const r = epv00(2400000.5 - 2451545.0 + 53411.52501161)
    const expectClose = (got: readonly number[], want: number[], tol: number) =>
      want.forEach((w, i) => expect(Math.abs(got[i]! - w)).toBeLessThanOrEqual(tol))
    expectClose(
      r.heliocentricPosition,
      [-0.7757238809297706, 0.559805224136334, 0.2426998466481687],
      1e-14,
    )
    expectClose(
      r.heliocentricVelocity,
      [-0.010918918241473138, -0.01247187268440845, -0.005407569418065039],
      1e-15,
    )
    expectClose(
      r.barycentricPosition,
      [-0.7714104440491112, 0.5598412061824172, 0.24259962777224525],
      1e-14,
    )
    expectClose(
      r.barycentricVelocity,
      [-0.010918742681168233, -0.012465254617328616, -0.0054047731809662315],
      1e-15,
    )
    expect(r.outsideNominalRange).toBe(false)
  })

  it('eraNut00b, eraPfw06, eraObl06', () => {
    const n = nut00b(2400000.5 - 2451545.0 + 53736.0)
    expect(Math.abs(n.dpsi - -0.000009632552291148363)).toBeLessThanOrEqual(1e-13)
    expect(Math.abs(n.deps - 0.00004063197106621159)).toBeLessThanOrEqual(1e-13)
    const f = pfw06(2400000.5 - 2451545.0 + 50123.9999)
    expect(Math.abs(f.gamb - -0.0000022433876709979958)).toBeLessThanOrEqual(1e-16)
    expect(Math.abs(f.phib - 0.4091014602391313)).toBeLessThanOrEqual(1e-12)
    expect(Math.abs(f.psib - -0.0009501954178013031)).toBeLessThanOrEqual(1e-14)
    expect(Math.abs(f.epsa - 0.40910143165873675)).toBeLessThanOrEqual(1e-12)
    expect(
      Math.abs(obl06(2400000.5 - 2451545.0 + 54388.0) - 0.4090749229387258),
    ).toBeLessThanOrEqual(1e-14)
  })

  it('eraAb, eraPn, eraPm, eraApcs velocity step', () => {
    const p = ab(
      [-0.76321968546737951, -0.60869453983060384, -0.21676408580639883],
      [2.1044018893653786e-5, -8.9108923304429319e-5, -3.8633714797716569e-5],
      0.99980921395708788,
      0.99999999506209258,
    )
    ;[-0.7631631094219556, -0.6087553082505591, -0.21679262693684712].forEach((w, i) =>
      expect(Math.abs(p[i]! - w)).toBeLessThanOrEqual(1e-12),
    )
    const u = pn([0.3, 1.2, -2.5])
    expect(Math.abs(u.r - 2.7892651361962706)).toBeLessThanOrEqual(1e-12)
    expect(Math.abs(pm([0.3, 1.2, -2.5]) - 2.7892651361962706)).toBeLessThanOrEqual(1e-12)
    const AUDMS = 149597870.7e3 / 86400.0
    const v = velocityInC([
      0.00364365824 + -77.0361767 / AUDMS,
      -0.0154287319 + -133.310856 / AUDMS,
      -0.00668922024 + 0.0971855934 / AUDMS,
    ])
    expect(Math.abs(v.v[0] - 0.000020787049932826855)).toBeLessThanOrEqual(1e-16)
    expect(Math.abs(v.v[1] - -0.00008955360106989405)).toBeLessThanOrEqual(1e-16)
    expect(Math.abs(v.v[2] - -0.00003863338994289409)).toBeLessThanOrEqual(1e-16)
    expect(Math.abs(v.bm1 - 0.9999999950277562)).toBeLessThanOrEqual(1e-12)
  })
})

describe('independent upstream ERFA C parity (pre-registered tolerances)', () => {
  const fixture = json(`${audit}/fixtures/upstream-erfa-c-vectors-v3.3.json`)
  const tol = json(`${audit}/port-review/tolerance-preregistration.json`).tolerances

  it(`matches ${fixture.rows.length} compiled-upstream epochs, 1899–2101`, () => {
    expect(fixture.rows.length).toBeGreaterThanOrEqual(150)
    for (const row of fixture.rows as number[][]) {
      const ms = row[0]!
      const d = ms / 86400000
      const r = epv00(d)
      const n = nut00b(d)
      const f = pfw06(d)
      const ts = [
        ...r.heliocentricPosition,
        ...r.heliocentricVelocity,
        ...r.barycentricPosition,
        ...r.barycentricVelocity,
        n.dpsi,
        n.deps,
        f.gamb,
        f.phib,
        f.psib,
        f.epsa,
        apparentSunTrueEclipticOfDate(ms).longitudeDeg,
      ]
      const limits = [
        ...Array(3).fill(tol.heliocentricPositionAu),
        ...Array(3).fill(tol.heliocentricVelocityAuPerDay),
        ...Array(3).fill(tol.barycentricPositionAu),
        ...Array(3).fill(tol.barycentricVelocityAuPerDay),
        tol.nutationRad,
        tol.nutationRad,
        ...Array(3).fill(tol.fukushimaWilliamsRad),
        tol.meanObliquityRad,
        tol.apparentLongitudeDeg,
      ]
      ts.forEach((v, i) =>
        expect(Math.abs(v - row[i + 1]!), `ttMs ${ms} field ${i}`).toBeLessThanOrEqual(limits[i]),
      )
    }
  })
})
