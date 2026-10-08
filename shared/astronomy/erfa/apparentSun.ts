// Apparent geocentric Sun in the TRUE ECLIPTIC AND EQUINOX OF DATE, from ERFA.
//
// Observable: direction from the geocentre to the Sun as seen at TT instant t,
// including light-time, annual (relativistic) aberration, IAU 2006 bias +
// precession and IAU 2000B nutation in longitude. Latitude is diagnostic only.
//
// Pipeline (all ERFA 2.0.1 routines, see erfa.ts):
//   1. eraEpv00(t): Earth heliocentric + barycentric position/velocity (BCRS).
//   2. Light time: Sun evaluated at t - |Earth_helio| / c (one retardation, the
//      Sun's barycentric position being pb - ph at that retarded time).
//   3. eraPn: unit Earth-to-Sun vector in BCRS/GCRS axes.
//   4. eraApcs velocity step + eraAb: relativistic annual aberration using the
//      Earth's barycentric velocity and Sun–Earth distance.
//   5. Fukushima-Williams rotation R3(-(psib + dpsi)) R1(phib) R3(gamb):
//      GCRS -> true ecliptic and equinox of date (eraPfw06 + eraNut00b). This
//      equals R1(eps + deps) applied after eraFw2m's equator-of-date matrix.
//   6. Longitude = atan2(y, x), in [0, 360) degrees.
// TT is used as TDB (|TDB - TT| < 2 ms, below the model's own error).

import { ERFA_DR2D } from './constants.data'
import { detAtan2 } from './detMath'
import { ab, epv00, ERFA_DC, nut00b, pfw06, pm, pn, rx, rz, velocityInC, type Vec3 } from './erfa'

export const MS_PER_DAY = 86400000

/** Apparent geocentric Sun, true ecliptic and equinox of date, at TT. */
export interface ApparentSunTrueEclipticOfDate {
  /** Integer or fractional TT milliseconds since J2000.0 TT (JD 2451545.0 TT). */
  readonly ttMsSinceJ2000: number
  /** Ecliptic longitude, degrees in [0, 360). */
  readonly longitudeDeg: number
  /** Ecliptic latitude, degrees (diagnostic). */
  readonly latitudeDeg: number
  /** Unit vector in the true ecliptic/equinox-of-date frame. */
  readonly direction: Vec3
  /** True when eraEpv00 flagged the date outside 1900–2100. */
  readonly outsideNominalRange: boolean
}

export function apparentSunTrueEclipticOfDate(
  ttMsSinceJ2000: number,
): ApparentSunTrueEclipticOfDate {
  if (!Number.isFinite(ttMsSinceJ2000)) throw new RangeError('Expected finite TT milliseconds')
  const days = ttMsSinceJ2000 / MS_PER_DAY
  const earth = epv00(days)
  const sunEarthDistance = pm(earth.heliocentricPosition)
  const retarded = epv00(days - sunEarthDistance / ERFA_DC)
  const sunBarycentric: Vec3 = [
    retarded.barycentricPosition[0] - retarded.heliocentricPosition[0],
    retarded.barycentricPosition[1] - retarded.heliocentricPosition[1],
    retarded.barycentricPosition[2] - retarded.heliocentricPosition[2],
  ]
  const earthToSun: Vec3 = [
    sunBarycentric[0] - earth.barycentricPosition[0],
    sunBarycentric[1] - earth.barycentricPosition[1],
    sunBarycentric[2] - earth.barycentricPosition[2],
  ]
  const natural = pn(earthToSun).u
  const { v, bm1 } = velocityInC(earth.barycentricVelocity)
  const apparent = ab(natural, v, sunEarthDistance, bm1)
  const { gamb, phib, psib } = pfw06(days)
  const { dpsi } = nut00b(days)
  const ecliptic = rz(-(psib + dpsi), rx(phib, rz(gamb, apparent)))
  let longitudeDeg = detAtan2(ecliptic[1], ecliptic[0]) * ERFA_DR2D
  if (longitudeDeg < 0) longitudeDeg += 360
  // -tiny + 360 can round to 360; keep the half-open range.
  if (longitudeDeg >= 360) longitudeDeg -= 360
  const latitudeDeg =
    detAtan2(ecliptic[2], Math.sqrt(ecliptic[0] * ecliptic[0] + ecliptic[1] * ecliptic[1])) *
    ERFA_DR2D
  return {
    ttMsSinceJ2000,
    longitudeDeg,
    latitudeDeg,
    direction: ecliptic,
    outsideNominalRange: earth.outsideNominalRange || retarded.outsideNominalRange,
  }
}
