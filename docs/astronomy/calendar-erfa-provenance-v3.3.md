# ERFA port provenance lock v3.3

**Result: PROVENANCE_PASS.** Every coefficient in `shared/astronomy/erfa/` traces to a token in pinned upstream ERFA 2.0.1 source. The generated data reproduces byte-for-byte. Machine-readable record: `calendar-erfa-provenance-v3.3.json`.

## Upstream

| Item | Value |
|---|---|
| Project | ERFA (liberfa/erfa), a re-licensed derivative of IAU SOFA |
| Version | 2.0.1 |
| Archive | `erfa-2.0.1.tar.gz`, SHA-256 `d5469fbd0b212b3c7270c1da15c9bd82f37da9218fc89627f98283d27b416cbf` (obtained in 3B.4.2A; re-verified by every script) |
| Files used | `src/epv00.c` `4568b280…de57`, `src/nut00b.c` `a5246d52…5f49`, `src/pfw06.c` `085f4986…ef1987`, `src/obl06.c` `55026087…b37c2`, `src/ab.c` `ff4bac5f…2527`, `src/fw2m.c`, `pn.c`, `pm.c`, `rx.c`, `rz.c`, `erfam.h`; the full list with hashes is in the JSON |
| License | `LICENSE`, SHA-256 `b1858f9a…3b51`, copied verbatim to `shared/astronomy/erfa/LICENSE-ERFA.txt` |

## Coefficient accounting

| Table | Expected | Ported |
|---|---|---|
| EPV00 Sun→Earth T⁰ (e0x/e0y/e0z) | 501 / 501 / 137 | 501 / 501 / 137 |
| EPV00 Sun→Earth T¹ (e1x/e1y/e1z) | 79 / 80 / 12 | 79 / 80 / 12 |
| EPV00 Sun→Earth T² (e2x/e2y/e2z) | 5 / 5 / 3 | 5 / 5 / 3 |
| EPV00 SSB→Sun T⁰ (s0x/s0y/s0z) | 212 / 213 / 69 | 212 / 213 / 69 |
| EPV00 SSB→Sun T¹ (s1x/s1y/s1z) | 50 / 50 / 14 | 50 / 50 / 14 |
| EPV00 SSB→Sun T² (s2x/s2y/s2z) | 9 / 9 / 2 | 9 / 9 / 2 |
| **EPV00 total harmonic terms** | **1,951** | **1,951** (5,853 scalars) |
| EPV00 ecliptic→BCRS matrix | 7 | 7 |
| IAU 2000B luni-solar rows | 77 | 77 (847 scalars) |
| IAU 2000B fixed planetary offsets | 2 | 2 |
| Delaunay arguments (nut00b) | 10 | 10, hand-transcribed |
| F-W angles (pfw06) | 18 | 18, hand-transcribed |
| Mean obliquity (obl06) | 6 | 6, hand-transcribed |

There are no unexplained coefficients. Each EPV00 and nutation number is re-parsed after generation and must be `Object.is`-equal to the upstream token. The unit tests check term counts and the hashes of the generated files.

## How the data was produced

1. `extract-erfa.mjs` verifies the archive hash, extracts the listed members and strips C comments.
2. It copies numeric tokens in upstream order into `epv00.data.ts`, `nut00b.data.ts` and `constants.data.ts`.
3. It formats the output with the repository's prettier and re-verifies every value.
4. `--check` regenerates the output in memory and fails on any byte difference.

Transformations, all value-preserving:

- prettier normalises literal spelling (`0.1753485171504e+01` → `0.1753485171504e1`).
- `erfam.h` constants are written as the shortest round-trip decimal of the same double, with the upstream text kept in a trailing comment.
- `nut00b` struct rows become 11-element arrays.

**Hand-written code:**

- `erfa.ts`: transcription of eraEpv00, eraNut00b, eraPfw06, eraObl06, eraPm, eraPn, eraAb, eraRx, eraRz and the eraApcs velocity step. Operation order is preserved.
- `apparentSun.ts`: composition of the pipeline.
- `detMath.ts`: fdlibm sin/cos/atan2.
- `solarTermRoots.ts`, `clockV1.ts`, `index.ts`, `model.ts`: project code.

## Runtime assumptions

- IEEE-754 binary64 with round-to-nearest-even for `+ − × ÷`.
- `%` is exact, matching C `fmod`.
- `Math.sqrt` is assumed correctly rounded. It is an IEEE-754 required operation, and cross-runtime parity confirms it.
- `Math.floor` is exact.
- No `Math.sin/cos/atan2`, no `Math.hypot`, no `**`.
- No endianness dependence: the only bit reads go through `DataView` with an explicit byte order.
- No FMA contraction in JavaScript. The upstream C reference is compiled with `-ffp-contract=off` to match.
- No WASM, BigInt, dynamic code, network or storage.

## Attribution obligations

- Keep the NumFOCUS copyright, the three conditions, the disclaimer and the no-endorsement clause with source and binary distributions.
- Identify the code as ERFA-derived, not SOFA.
- Keep the Sun Microsystems fdlibm notice in `detMath.ts`.
- When the engine ships (3B.4.4), add ERFA and fdlibm entries to `THIRD_PARTY_NOTICES.md`.
