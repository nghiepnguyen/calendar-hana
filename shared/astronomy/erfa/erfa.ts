// Hand-written TypeScript transcription of the ERFA 2.0.1 routines used by the
// solar-term foundation: eraEpv00, eraNut00b, eraPfw06, eraObl06, eraAb,
// eraPn/eraPm and the eraApcs velocity/Lorentz-factor step.
//
// Copyright (C) 2013-2023, NumFOCUS Foundation. All rights reserved.
// Derived, with permission, from the IAU SOFA library. This is a modified
// derivative of ERFA (not SOFA itself); see ./LICENSE-ERFA.txt for the
// redistribution conditions, disclaimer and no-endorsement clause.
//
// Fidelity rules for this file:
// - Arithmetic is written in the same order and association as upstream C, so
//   results differ from compiled ERFA only through libm sin/cos rounding (the
//   engine uses deterministic fdlibm ports, see detMath.ts).
// - Dates follow ERFA's "J2000 method": date1 = ERFA_DJ00, date2 = days since
//   J2000.0. TT is used in place of TDB, as ERFA's own notes permit.
// - Nothing here truncates, rescales or reorders upstream coefficients.

import {
  ERFA_CMPS,
  ERFA_D2PI,
  ERFA_DAS2R,
  ERFA_DAU,
  ERFA_DAYSEC,
  ERFA_DJC,
  ERFA_DJY,
  ERFA_SRS,
  ERFA_TURNAS,
} from './constants.data'
import { detCos, detSin } from './detMath'
import {
  E0X,
  E0Y,
  E0Z,
  E1X,
  E1Y,
  E1Z,
  E2X,
  E2Y,
  E2Z,
  EPV00_ROTATION,
  S0X,
  S0Y,
  S0Z,
  S1X,
  S1Y,
  S1Z,
  S2X,
  S2Y,
  S2Z,
} from './epv00.data'
import { NUT00B_DEPLAN_MAS, NUT00B_DPPLAN_MAS, NUT00B_TERMS } from './nut00b.data'

export type Vec3 = readonly [number, number, number]

/** Light time for 1 au, days (erfam.h ERFA_AULT / ERFA_DAYSEC). */
const AULT = ERFA_DAU / ERFA_CMPS
/** eraApcs: light time for 1 au in days, multiplies au/d velocity into units of c. */
export const ERFA_CR = AULT / ERFA_DAYSEC
/** erfam.h ERFA_DC: speed of light, au per day. */
export const ERFA_DC = ERFA_DAYSEC / AULT
const ERFA_DMAS2R = ERFA_DAS2R / 1e3

export interface Epv00 {
  /** Heliocentric Earth position, au, BCRS axes. */
  readonly heliocentricPosition: Vec3
  /** Heliocentric Earth velocity, au/day. */
  readonly heliocentricVelocity: Vec3
  /** Barycentric (SSB) Earth position, au, BCRS axes. */
  readonly barycentricPosition: Vec3
  /** Barycentric (SSB) Earth velocity, au/day. */
  readonly barycentricVelocity: Vec3
  /** eraEpv00 status +1: date outside 1900–2100 AD (|t| > 100 Julian years). */
  readonly outsideNominalRange: boolean
}

const CE0 = [E0X, E0Y, E0Z]
const CE1 = [E1X, E1Y, E1Z]
const CE2 = [E2X, E2Y, E2Z]
const CS0 = [S0X, S0Y, S0Z]
const CS1 = [S1X, S1Y, S1Z]
const CS2 = [S2X, S2Y, S2Z]

/** eraEpv00(ERFA_DJ00, daysSinceJ2000). */
export function epv00(daysSinceJ2000: number): Epv00 {
  const t = daysSinceJ2000 / ERFA_DJY
  const t2 = t * t
  const ph = [0, 0, 0]
  const vh = [0, 0, 0]
  const pb = [0, 0, 0]
  const vb = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    let xyz = 0
    let xyzd = 0
    // Sun to Earth, T^0, T^1, T^2 terms.
    let coeffs = CE0[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const p = b + c * t
      xyz += a * detCos(p)
      xyzd -= a * c * detSin(p)
    }
    coeffs = CE1[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const ct = c * t
      const p = b + ct
      const cp = detCos(p)
      xyz += a * t * cp
      xyzd += a * (cp - ct * detSin(p))
    }
    coeffs = CE2[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const ct = c * t
      const p = b + ct
      const cp = detCos(p)
      xyz += a * t2 * cp
      xyzd += a * t * (2.0 * cp - ct * detSin(p))
    }
    ph[i] = xyz
    vh[i] = xyzd / ERFA_DJY
    // SSB to Sun terms accumulate onto the heliocentric sums (upstream does not reset).
    coeffs = CS0[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const p = b + c * t
      xyz += a * detCos(p)
      xyzd -= a * c * detSin(p)
    }
    coeffs = CS1[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const ct = c * t
      const p = b + ct
      const cp = detCos(p)
      xyz += a * t * cp
      xyzd += a * (cp - ct * detSin(p))
    }
    coeffs = CS2[i]!
    for (let j = 0; j < coeffs.length; j += 3) {
      const a = coeffs[j]!
      const b = coeffs[j + 1]!
      const c = coeffs[j + 2]!
      const ct = c * t
      const p = b + ct
      const cp = detCos(p)
      xyz += a * t2 * cp
      xyzd += a * t * (2.0 * cp - ct * detSin(p))
    }
    pb[i] = xyz
    vb[i] = xyzd / ERFA_DJY
  }
  return {
    heliocentricPosition: rotateEclipticToBcrs(ph),
    heliocentricVelocity: rotateEclipticToBcrs(vh),
    barycentricPosition: rotateEclipticToBcrs(pb),
    barycentricVelocity: rotateEclipticToBcrs(vb),
    outsideNominalRange: !(Math.abs(t) <= 100.0),
  }
}

function rotateEclipticToBcrs(v: readonly number[]): Vec3 {
  const { am12, am13, am21, am22, am23, am32, am33 } = EPV00_ROTATION
  const x = v[0]!
  const y = v[1]!
  const z = v[2]!
  return [x + am12 * y + am13 * z, am21 * x + am22 * y + am23 * z, am32 * y + am33 * z]
}

export interface Nutation {
  /** Nutation in longitude, radians. */
  readonly dpsi: number
  /** Nutation in obliquity, radians. */
  readonly deps: number
}

/** eraNut00b(ERFA_DJ00, daysSinceJ2000): IAU 2000B nutation. */
export function nut00b(daysSinceJ2000: number): Nutation {
  const U2R = ERFA_DAS2R / 1e7
  const DPPLAN = NUT00B_DPPLAN_MAS * ERFA_DMAS2R
  const DEPLAN = NUT00B_DEPLAN_MAS * ERFA_DMAS2R
  const t = daysSinceJ2000 / ERFA_DJC
  const el = ((485868.249036 + 1717915923.2178 * t) % ERFA_TURNAS) * ERFA_DAS2R
  const elp = ((1287104.79305 + 129596581.0481 * t) % ERFA_TURNAS) * ERFA_DAS2R
  const f = ((335779.526232 + 1739527262.8478 * t) % ERFA_TURNAS) * ERFA_DAS2R
  const d = ((1072260.70369 + 1602961601.209 * t) % ERFA_TURNAS) * ERFA_DAS2R
  const om = ((450160.398036 + -6962890.5431 * t) % ERFA_TURNAS) * ERFA_DAS2R
  let dp = 0.0
  let de = 0.0
  // Smallest terms first, as upstream.
  for (let i = NUT00B_TERMS.length - 1; i >= 0; i--) {
    const x = NUT00B_TERMS[i]!
    const arg = (x[0]! * el + x[1]! * elp + x[2]! * f + x[3]! * d + x[4]! * om) % ERFA_D2PI
    const sarg = detSin(arg)
    const carg = detCos(arg)
    dp += (x[5]! + x[6]! * t) * sarg + x[7]! * carg
    de += (x[8]! + x[9]! * t) * carg + x[10]! * sarg
  }
  return { dpsi: dp * U2R + DPPLAN, deps: de * U2R + DEPLAN }
}

export interface FukushimaWilliams {
  /** F-W angle gamma_bar, radians. */
  readonly gamb: number
  /** F-W angle phi_bar, radians. */
  readonly phib: number
  /** F-W angle psi_bar, radians. */
  readonly psib: number
  /** Mean obliquity of date (IAU 2006), radians. */
  readonly epsa: number
}

/** eraPfw06(ERFA_DJ00, daysSinceJ2000): IAU 2006 bias-precession F-W angles. */
export function pfw06(daysSinceJ2000: number): FukushimaWilliams {
  const t = daysSinceJ2000 / ERFA_DJC
  const gamb =
    (-0.052928 +
      (10.556378 + (0.4932044 + (-0.00031238 + (-0.000002788 + 0.000000026 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  const phib =
    (84381.412819 +
      (-46.811016 + (0.0511268 + (0.00053289 + (-0.00000044 + -0.0000000176 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  const psib =
    (-0.041775 +
      (5038.481484 + (1.5584175 + (-0.00018522 + (-0.000026452 + -0.0000000148 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  return { gamb, phib, psib, epsa: obl06(daysSinceJ2000) }
}

/** eraObl06(ERFA_DJ00, daysSinceJ2000): IAU 2006 mean obliquity, radians. */
export function obl06(daysSinceJ2000: number): number {
  const t = daysSinceJ2000 / ERFA_DJC
  return (
    (84381.406 +
      (-46.836769 + (-0.0001831 + (0.0020034 + (-0.000000576 + -0.0000000434 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  )
}

/** eraPm: modulus of a p-vector. */
export function pm(p: Vec3): number {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2])
}

/** eraPn: modulus and unit vector (multiplying by the reciprocal, as upstream). */
export function pn(p: Vec3): { readonly r: number; readonly u: Vec3 } {
  const w = pm(p)
  if (w === 0.0) return { r: w, u: [0, 0, 0] }
  const s = 1.0 / w
  return { r: w, u: [s * p[0], s * p[1], s * p[2]] }
}

/** eraApcs step: barycentric velocity in units of c and reciprocal Lorentz factor. */
export function velocityInC(barycentricVelocity: Vec3): { readonly v: Vec3; readonly bm1: number } {
  let v2 = 0.0
  const v = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    const w = barycentricVelocity[i]! * ERFA_CR
    v[i] = w
    v2 += w * w
  }
  return { v: [v[0]!, v[1]!, v[2]!], bm1: Math.sqrt(1.0 - v2) }
}

/** eraAb: stellar aberration, relativistic model. s = Sun–observer distance (au). */
export function ab(pnat: Vec3, v: Vec3, s: number, bm1: number): Vec3 {
  const pdv = pnat[0] * v[0] + pnat[1] * v[1] + pnat[2] * v[2]
  const w1 = 1.0 + pdv / (1.0 + bm1)
  const w2 = ERFA_SRS / s
  let r2 = 0.0
  const p = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    const w = pnat[i]! * bm1 + w1 * v[i]! + w2 * (v[i]! - pdv * pnat[i]!)
    p[i] = w
    r2 = r2 + w * w
  }
  const r = Math.sqrt(r2)
  return [p[0]! / r, p[1]! / r, p[2]! / r]
}

/** eraRz applied to a vector: rotation about z by angle psi. */
export function rz(psi: number, v: Vec3): Vec3 {
  const s = detSin(psi)
  const c = detCos(psi)
  return [c * v[0] + s * v[1], -s * v[0] + c * v[1], v[2]]
}

/** eraRx applied to a vector: rotation about x by angle phi. */
export function rx(phi: number, v: Vec3): Vec3 {
  const s = detSin(phi)
  const c = detCos(phi)
  return [v[0], c * v[1] + s * v[2], -s * v[1] + c * v[2]]
}
