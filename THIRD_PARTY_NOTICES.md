# Third-party notices

## Astronomy Engine

- Package: `astronomy-engine` 2.1.19
- Project: <https://github.com/cosinekitty/astronomy>
- License: MIT

Astronomy Engine is bundled in the application to calculate true solar time (HourAngle of the
Sun) offline. Since the 3B.4.4B migration it no longer computes solar-term instants. Its
copyright and license terms are available in the installed package at
`node_modules/astronomy-engine/LICENSE`.

## Solar-term boundary data (JPL-derived)

The application ships a table of solar-term boundaries (`shared/astronomy/solarTerms/authority.data.ts`)
derived deterministically from the reviewed `golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json`.
That dataset was computed offline during the project audit from the JPL DE440s planetary
ephemeris (NASA/JPL, <https://ssd.jpl.nasa.gov/planets/eph_export.html>) using Skyfield 1.55
(MIT) and jplephem 2.24 (MIT). No JPL computation, ephemeris file, Skyfield or jplephem code
runs in or ships with the application; only the resulting integer millisecond boundaries do.

## ERFA (audit tooling only, not bundled)

The ERFA 2.0.1 port under `shared/astronomy/erfa` (BSD-3-Clause, derived from IAU SOFA; see
`shared/astronomy/erfa/LICENSE-ERFA.txt`), together with its fdlibm-derived math routines
(Sun Microsystems notice retained in `shared/astronomy/erfa/detMath.ts`), is used only by tests
and audit tooling to verify the shipped boundary table. It is not imported by application code and is not part of the
production bundle.
