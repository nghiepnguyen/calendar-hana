// Deterministic double-precision sin, cos and atan2.
//
// ECMAScript leaves Math.sin/cos/atan2 implementation-approximated, so V8,
// SpiderMonkey and JavaScriptCore may differ in the last bit. The solar-term
// engine needs bit-identical results across runtimes, so it uses these ports of
// the FreeBSD msun (fdlibm) routines, built only from IEEE-754 +, -, *, / and
// exact exponent reads. Accuracy is that of fdlibm (< 1 ulp).
//
// Ported from FreeBSD lib/msun/src/{k_sin.c,k_cos.c,e_rem_pio2.c,s_atan.c,e_atan2.c}:
//   Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
//   Developed at SunPro, a Sun Microsystems, Inc. business.
//   Permission to use, copy, modify, and distribute this
//   software is freely granted, provided that this notice
//   is preserved.

const view = new DataView(new ArrayBuffer(8))

/** Biased IEEE-754 exponent of x. DataView fixes the byte order, so the
 * result never depends on host endianness. */
function exponentBits(x: number): number {
  view.setFloat64(0, x)
  return (view.getUint32(0) >>> 20) & 0x7ff
}

// k_sin.c
const S1 = -0.16666666666666632 // 0xBFC55555 0x55555549
const S2 = 0.00833333333332249 // 0x3F811111 0x1110F8A6
const S3 = -0.0001984126982985795 // 0xBF2A01A0 0x19C161D5
const S4 = 0.0000027557313707070068 // 0x3EC71DE3 0x57B1FE7D
const S5 = -2.5050760253406863e-8 // 0xBE5AE5E6 0x8A2B9CEB
const S6 = 1.58969099521155e-10 // 0x3DE5D93A 0x5ACFD57C

function kernelSin(x: number, y: number, iy: 0 | 1): number {
  const z = x * x
  const w = z * z
  const r = S2 + z * (S3 + z * S4) + z * w * (S5 + z * S6)
  const v = z * x
  if (iy === 0) return x + v * (S1 + z * r)
  return x - (z * (0.5 * y - v * r) - y - v * S1)
}

// k_cos.c
const C1 = 0.0416666666666666 // 0x3FA55555 0x5555554C
const C2 = -0.001388888888887411 // 0xBF56C16C 0x16C15177
const C3 = 0.00002480158728947673 // 0x3EFA01A0 0x19CB1590
const C4 = -2.7557314351390663e-7 // 0xBE927E4F 0x809C52AD
const C5 = 2.087572321298175e-9 // 0x3E21EE9E 0xBDB4B1C4
const C6 = -1.1359647557788195e-11 // 0xBDA8FAE9 0xBE8838D4

function kernelCos(x: number, y: number): number {
  const z = x * x
  let w = z * z
  const r = z * (C1 + z * (C2 + z * C3)) + w * w * (C4 + z * (C5 + z * C6))
  const hz = 0.5 * z
  w = 1 - hz
  return w + (1 - w - hz + (z * r - x * y))
}

// e_rem_pio2.c, medium-size branch (|x| < 2^20 * pi/2).
const INVPIO2 = 0.6366197723675814 // 0x3FE45F30 0x6DC9C883
const PIO2_1 = 1.5707963267341256 // 0x3FF921FB 0x54400000
const PIO2_1T = 6.077100506506192e-11 // 0x3DD0B461 0x1A626331
const PIO2_2 = 6.077100506303966e-11 // 0x3DD0B461 0x1A600000
const PIO2_2T = 2.0222662487959506e-21 // 0x3BA3198A 0x2E037073
const PIO2_3 = 2.0222662487111665e-21 // 0x3BA3198A 0x2E000000
const PIO2_3T = 8.4784276603689e-32 // 0x397B839A 0x252049C1
const PIO4 = 0.7853981633974483 // 0x3FE921FB 0x54442D18
const MEDIUM_LIMIT = 1647099.3291652855 // 2^20 * pi/2
const RNINT = 6755399441055744 // 0x1.8p52: round-to-nearest-even trick

let reducedHi = 0
let reducedLo = 0

/** x = n * pi/2 + (reducedHi + reducedLo); returns n mod 4. */
function remPio2(x: number): number {
  if (!(Math.abs(x) < MEDIUM_LIMIT))
    throw new RangeError('detMath: argument outside reduction range')
  const fn = x * INVPIO2 + RNINT - RNINT
  let r = x - fn * PIO2_1
  let w = fn * PIO2_1T
  const j = exponentBits(x)
  reducedHi = r - w
  if (j - exponentBits(reducedHi) > 16) {
    let t = r
    w = fn * PIO2_2
    r = t - w
    w = fn * PIO2_2T - (t - r - w)
    reducedHi = r - w
    if (j - exponentBits(reducedHi) > 49) {
      t = r
      w = fn * PIO2_3
      r = t - w
      w = fn * PIO2_3T - (t - r - w)
      reducedHi = r - w
    }
  }
  reducedLo = r - reducedHi - w
  return fn & 3
}

export function detSin(x: number): number {
  if (Math.abs(x) <= PIO4) return kernelSin(x, 0, 0)
  switch (remPio2(x)) {
    case 0:
      return kernelSin(reducedHi, reducedLo, 1)
    case 1:
      return kernelCos(reducedHi, reducedLo)
    case 2:
      return -kernelSin(reducedHi, reducedLo, 1)
    default:
      return -kernelCos(reducedHi, reducedLo)
  }
}

export function detCos(x: number): number {
  if (Math.abs(x) <= PIO4) return kernelCos(x, 0)
  switch (remPio2(x)) {
    case 0:
      return kernelCos(reducedHi, reducedLo)
    case 1:
      return -kernelSin(reducedHi, reducedLo, 1)
    case 2:
      return -kernelCos(reducedHi, reducedLo)
    default:
      return kernelSin(reducedHi, reducedLo, 1)
  }
}

// s_atan.c
const ATANHI = [
  0.4636476090008061, // 0x3FDDAC67 0x0561BB4F
  0.7853981633974483, // 0x3FE921FB 0x54442D18
  0.982793723247329, // 0x3FEF730B 0xD281F69B
  1.5707963267948966, // 0x3FF921FB 0x54442D18
] as const
const ATANLO = [
  2.2698777452961687e-17, // 0x3C7A2B7F 0x222F65E2
  3.061616997868383e-17, // 0x3C81A626 0x33145C07
  1.3903311031230998e-17, // 0x3C700788 0x7AF0CBBD
  6.123233995736766e-17, // 0x3C91A626 0x33145C07
] as const
const AT = [
  0.3333333333333293, // 0x3FD55555 0x5555550D
  -0.19999999999876483, // 0xBFC99999 0x9998EBC4
  0.14285714272503466, // 0x3FC24924 0x920083FF
  -0.11111110405462356, // 0xBFBC71C6 0xFE231671
  0.09090887133436507, // 0x3FB745CD 0xC54C206E
  -0.0769187620504483, // 0xBFB3B0F2 0xAF749A6D
  0.06661073137387531, // 0x3FB10D66 0xA0D03D51
  -0.058335701337905735, // 0xBFADDE2D 0x52DEFD9A
  0.049768779946159324, // 0x3FA97B4B 0x24760DEB
  -0.036531572744216916, // 0xBFA2B444 0x2C6A6C2F
  0.016285820115365782, // 0x3F90AD3A 0xE322DA11
] as const

/** atan for finite x. Thresholds compare |x| against values whose low words are
 * zero, which is equivalent to fdlibm's high-word comparisons. */
function detAtan(x: number): number {
  const ax = Math.abs(x)
  if (ax >= 7.378697629483821e19) return x < 0 ? -(ATANHI[3] + ATANLO[3]) : ATANHI[3] + ATANLO[3] // 2^66
  let id: number
  let t = x
  if (ax < 0.4375) {
    if (ax < 7.450580596923828e-9) return x // 2^-27
    id = -1
  } else if (ax < 1.1875) {
    if (ax < 0.6875) {
      id = 0
      t = (2 * ax - 1) / (2 + ax)
    } else {
      id = 1
      t = (ax - 1) / (ax + 1)
    }
  } else if (ax < 2.4375) {
    id = 2
    t = (ax - 1.5) / (1 + 1.5 * ax)
  } else {
    id = 3
    t = -1 / ax
  }
  const z = t * t
  const w = z * z
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))))
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))))
  if (id < 0) return t - t * (s1 + s2)
  const r = ATANHI[id]! - (t * (s1 + s2) - ATANLO[id]! - t)
  return x < 0 ? -r : r
}

// e_atan2.c
const PI = 3.141592653589793 // 0x400921FB 0x54442D18
const PI_O_2 = 1.5707963267948966 // 0x3FF921FB 0x54442D18
const PI_LO = 1.2246467991473532e-16 // 0x3CA1A626 0x33145C07

/** atan2 for finite arguments, not both zero. */
export function detAtan2(y: number, x: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError('detAtan2: non-finite')
  if (x === 1) return detAtan(y)
  const m = (y < 0 || Object.is(y, -0) ? 1 : 0) | (x < 0 || Object.is(x, -0) ? 2 : 0)
  if (y === 0) {
    if (m < 2) return y
    return m === 2 ? PI : -PI
  }
  if (x === 0) return y < 0 ? -PI_O_2 : PI_O_2
  const k = exponentBits(y) - exponentBits(x)
  let z: number
  let quadrant = m
  if (k > 60) {
    z = PI_O_2 + 0.5 * PI_LO
    quadrant &= 1
  } else if (x < 0 && k < -60) z = 0
  else z = detAtan(Math.abs(y / x))
  switch (quadrant) {
    case 0:
      return z
    case 1:
      return -z
    case 2:
      return PI - (z - PI_LO)
    default:
      return z - PI_LO - PI
  }
}
