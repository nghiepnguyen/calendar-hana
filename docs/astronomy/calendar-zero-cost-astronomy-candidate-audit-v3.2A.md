# Zero-cost astronomy candidate audit v3.2A

NON_AUTHORITATIVE_ASTRONOMY_EVALUATION. Production migration and Golden changes were not executed.

## AE

Identity: astronomy-engine@2.1.19 / current SearchSunLongitude. License classification: **PERMISSIVE_OK**. Maximum absolute TT error: 56.288892 seconds; p95: 29.225577 seconds. Jie maximum: 52.145523 seconds; 99 Jie events exceed 30 seconds.

## FULL_VSOP87

Identity: astronomia@4.2.0 / full VSOP87D Earth + Meeus apparentVSOP87. License classification: **REDISTRIBUTION_UNCLEAR**. Maximum absolute TT error: 7.406075 seconds; p95: 6.512099 seconds. Jie maximum: 7.406075 seconds; 0 Jie events exceed 30 seconds.

## OPEN_HIGH_PRECISION

Identity: hana-erfa-solar-eval@0.1.0 / ERFA2.0.1 EPV00 + IAU2006/2000B + relativistic aberration. License classification: **ATTRIBUTION_REQUIRED**. Maximum absolute TT error: 0.376341 seconds; p95: 0.196509 seconds. Jie maximum: 0.353529 seconds; 0 Jie events exceed 30 seconds.

## Algorithm and coefficient provenance

Astronomy Engine 2.1.19 is the installed production model. Its truncated Earth VSOP model, apparent Sun corrections, sequential SearchSunLongitude and default Delta-T/Date conversion remain unchanged. MIT covers its code and embedded coefficients. It has the lowest migration burden and fastest computation, but 99 Jie events fail the retained gate.

FULL_VSOP87 uses astronomia 4.2.0 and complete VSOP87D Earth L/B/R series: 1,080 longitude, 348 latitude and 997 radius terms. All 2,425 triplets match the original CDS source, without truncation. It applies heliocentric inversion, FK5 correction, IAU1980 nutation and scalar aberration. Completeness does not remove the limitations of older frame and apparent-position corrections. Its 7.406-second maximum passes the accuracy gate. The package is MIT, but reviewed original materials did not explicitly establish the upstream coefficient redistribution chain. This is an unresolved provenance gate, not a claim of prohibition. Original data, package and compiled candidate remain in /tmp.

The selected ERFA candidate derives JavaScript from ERFA 2.0.1 EPV00, preserving all 1,951 harmonic terms across 18 arrays and 77 IAU2000B nutation terms. It combines retarded barycentric Sun position, Earth observer position, relativistic aberration, solar-potential correction and IAU2006 bias/precession to yield apparent geocentric true ecliptic/equinox-of-date longitude. TT approximates TDB as permitted upstream. The explicit permissive ERFA license covers code and embedded tables; retain its copyright, conditions, disclaimer and no-endorsement terms. The separate Delta-T helper is MIT. No Swiss runtime or JPL kernel enters the browser bundle.

## Limitations and independent checks

EPV00 warns beyond 100 Julian years from J2000. Late 2100 and padding therefore require explicit extrapolation provenance, although every required root through 2101 was measured and passed. Other-body light deflection and free-core nutation are omitted. EPV00 fits DE405 rather than DE440. This is a research port requiring independent foundation review before migration.

Unmodified upstream C validates the JavaScript numerical port separately from the independent JPL comparison. Controlled omission experiments show the substantial contributions of aberration and nutation, and the smaller retarded-Sun contribution. No empirical JPL fit, residual adjustment or stored transition table was used.

The canonical root is the first integer TT millisecond since J2000 reaching the target; the year bracket is generic and checked. clock-v1 models UT1 before 1972, uses known leap seconds thereafter and freezes TAI−UTC at 37 seconds after 2017. Future serialized dates are projections, not guaranteed physical UTC. Final epoch milliseconds are rounded upward. Domain equality uses only serialized T, with no astronomy error allowance.

## Platform and reproducibility receipts

All 4,824 serialized events agree exactly between Node and each tested Chromium, Firefox and WebKit engine for all three candidates. Chromium and Firefox offline reloads pass. WebKit online calculations pass, but offline navigation fails internally for every candidate, including current Astronomy Engine. Actual Safari/iOS offline remains a release gate. Mobile viewport emulation is not physical-device proof. Memory observations are process/page snapshots, not retained per-engine allocations.

The evidence JSON links the complete 4,872-row comparison for each candidate by SHA256, including padding, mandatory cases, worst 50, decade/longitude/Jie/Zhongqi distributions and civil-date risks. It also records coefficient provenance, source sizes, exact bundle hashes, repeated-build equality, native-port checks, correction omissions and actual browser timings. Node 23.7.0 and Vite 8.3.0 were used. Temporary Python reference dependencies are pinned to Skyfield 1.55 and jplephem 2.24. Production packages and locks remain unchanged.
