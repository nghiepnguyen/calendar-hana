// NON_AUTHORITATIVE_ASTRONOMY_EVALUATION; modified JS derivation of ERFA 2.0.1.
// Copyright NumFOCUS Foundation. Redistribution terms: ERFA-LICENSE.txt.
import { epv, nut } from './erfa-coefficients.mjs'
const AS = Math.PI / 648000,
  C = 173.14463267424,
  poly = (t, a) => a.reduceRight((v, x) => v * t + x, 0)
const rotate = ([x, y, z]) => [
  x + 0.000000211284 * y - 0.000000091603 * z,
  -0.000000230286 * x + 0.917482137087 * y - 0.397776982902 * z,
  0.397776982902 * y + 0.917482137087 * z,
]
export function epv00(jd) {
  let t = (jd - 2451545) / 365.25
  let hp = [],
    hv = [],
    bp = [],
    bv = []
  for (const axis of 'xyz') {
    let p = 0,
      v = 0
    for (const family of 'es') {
      for (let k = 0; k < 3; k++) {
        let a = epv[family + k + axis]
        for (let j = 0; j < a.length; j += 3) {
          let amp = a[j],
            phase = a[j + 1] + a[j + 2] * t,
            c = a[j + 2],
            cos = Math.cos(phase),
            sin = Math.sin(phase)
          p += amp * t ** k * cos
          v +=
            k === 0
              ? -amp * c * sin
              : k === 1
                ? amp * (cos - c * t * sin)
                : amp * t * (2 * cos - c * t * sin)
        }
      }
      if (family === 'e') {
        hp.push(p)
        hv.push(v / 365.25)
      } else {
        bp.push(p)
        bv.push(v / 365.25)
      }
    }
  }
  return {
    hp: rotate(hp),
    hv: rotate(hv),
    bp: rotate(bp),
    bv: rotate(bv),
    outsideNominalRange: Math.abs(t) > 100,
  }
}
export function nut00b(jd) {
  let t = (jd - 2451545) / 36525,
    args = [
      [485868.249036, 1717915923.2178],
      [1287104.79305, 129596581.0481],
      [335779.526232, 1739527262.8478],
      [1072260.70369, 1602961601.209],
      [450160.398036, -6962890.5431],
    ].map(([a, b]) => ((a + b * t) % 1296000) * AS)
  let p = 0,
    e = 0
  for (let i = nut.length - 1; i >= 0; i--) {
    let a = nut[i],
      phase = a.slice(0, 5).reduce((v, x, j) => v + x * args[j], 0) % (2 * Math.PI),
      s = Math.sin(phase),
      c = Math.cos(phase)
    p += (a[5] + a[6] * t) * s + a[7] * c
    e += (a[8] + a[9] * t) * c + a[10] * s
  }
  return [(p * AS) / 1e7 - (0.135 * AS) / 1000, (e * AS) / 1e7 + (0.388 * AS) / 1000]
}
const rx = (v, a) => [
  v[0],
  Math.cos(a) * v[1] + Math.sin(a) * v[2],
  -Math.sin(a) * v[1] + Math.cos(a) * v[2],
]
const rz = (v, a) => [
  Math.cos(a) * v[0] + Math.sin(a) * v[1],
  -Math.sin(a) * v[0] + Math.cos(a) * v[1],
  v[2],
]
export function trueEcliptic(v, jd, omitNutation = false) {
  let t = (jd - 2451545) / 36525,
    g = poly(t, [-0.052928, 10.556378, 0.4932044, -0.00031238, -0.000002788, 0.000000026]) * AS,
    phi =
      poly(t, [84381.412819, -46.811016, 0.0511268, 0.00053289, -0.00000044, -0.0000000176]) * AS,
    psi =
      poly(t, [-0.041775, 5038.481484, 1.5584175, -0.00018522, -0.000026452, -0.0000000148]) * AS,
    eps = poly(t, [84381.406, -46.836769, -0.0001831, 0.0020034, -0.000000576, -0.0000000434]) * AS
  let [dp, de] = omitNutation ? [0, 0] : nut00b(jd)
  v = rz(v, g)
  v = rx(v, phi)
  v = rz(v, -psi - dp)
  v = rx(v, -eps - de)
  return rx(v, eps + de)
}
export function longitude(
  jd,
  { omitLightTime = false, omitAberration = false, omitNutation = false } = {},
) {
  let earth = epv00(jd),
    distance = Math.hypot(...earth.hp),
    sun = epv00(jd - (omitLightTime ? 0 : distance / C))
  let vector = sun.bp.map((x, i) => x - sun.hp[i] - earth.bp[i])
  let r = Math.hypot(...vector),
    p = vector.map((x) => x / r)
  if (!omitAberration) {
    let v = earth.bv.map((x) => x / C),
      bm = Math.sqrt(1 - v.reduce((s, x) => s + x * x, 0)),
      pd = p.reduce((s, x, i) => s + x * v[i], 0),
      w1 = 1 + pd / (1 + bm),
      w2 = 1.97412574336e-8 / distance
    p = p.map((x, i) => x * bm + w1 * v[i] + w2 * (v[i] - pd * x))
    let norm = Math.hypot(...p)
    p = p.map((x) => x / norm)
  }
  let ecl = trueEcliptic(p, jd, omitNutation)
  return ((Math.atan2(ecl[1], ecl[0]) * 180) / Math.PI + 360) % 360
}
