# Runtime authority data (v3.4B)

**Status: PASS.** Machine-readable details: `calendar-authority-runtime-data-v3.4B.json`.

## Provenance chain

```
JPL DE440s (sha256 c1c7feea…)  --3B.4.4A generator + 2 independent reviews-->
golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json (REVIEWED_FROZEN, sha256 1db7a155…, manifest-pinned)
  --scripts/generate-solar-term-authority.mjs (re-encode the canonical ttMs column only)-->
shared/astronomy/solarTerms/authority.data.ts (encoded sha256 9fbc1506…)
```

The runtime table is never recomputed from production, from ERFA or from JPL. The generator rejects the source if:
- its SHA-256 differs from the golden-v4 manifest, or its contract fields differ (REVIEWED_FROZEN, TT, clock-v1);
- any row is out of order;
- any T is not an exact integer.

## Contents

| Property | Value |
|---|---|
| Rows | 4,872 = 203 years (1899–2101) × 24 terms; public range 1900–2100, with 1899 and 2101 as internal padding |
| Per row | canonical T, integer TT ms since J2000.0 TT. The row's year and term index are positional (index `(19 + i mod 24) mod 24`); target longitude = index × 15° |
| Encoding | first T in base 36, then strictly positive base-36 deltas |
| Size | 35,077 bytes raw, 21,193 bytes gzip (main JS chunk +24.7 KB gzip) |
| Identity | `astronomy-authority-v4`, `solar-terms-jpl-de440s-clock-v1`, `clock-v1`, `golden-v4`, generator `solar-term-authority-runtime-generator 1.0.0` |

Civil instants are computed at load by clock-v1. They reproduce the frozen `civilEpochMs`, `civilIso` and `clockRegime` of all 4,872 rows exactly. The TS clock and the independent Python generator clock agree to the millisecond, including every pre-1972 Delta-T row.

## Integrity (fail closed)

| When | Check |
|---|---|
| Module load (first use) | pinned identity (version, dataset, clock, generator, source hash) · synchronous SHA-256 of the encoded table · row count · charset · safe integers · 14–16 day gaps · strictly increasing TT and civil ms · civil year equals row year |
| Test / CI | source SHA-256 equals the golden-v4 manifest · shipped file equals generator output byte for byte · every decoded row equals the frozen row · ERFA within 0.5 s |
| On failure | `SolarTermAuthorityError` (VERSION_MISMATCH / HASH_MISMATCH / MALFORMED / OUT_OF_RANGE), memoised. No Astronomy Engine fallback, no ERFA fallback, no network |

Lookups outside the table fail with OUT_OF_RANGE. This covers instants before the first 1899 crossing, at or after the last 2101 crossing, and years outside 1899–2101.

## API (`shared/astronomy/solarTerms`)

`getCanonicalSolarTermBoundary(year, termIndex)`, `getCanonicalSolarTermsForYear(year)`, `getCanonicalSolarTermAt(civilMs)`, `getCanonicalSolarTermAtTT(ttMs)`, `getCanonicalSolarMonth(civilMs)`, `monthJianBranchForTermIndex`, `assertSolarTermAuthority`, `SOLAR_TERM_AUTHORITY`, `SOLAR_TERM_CACHE_NAMESPACE`, `memoizeSolarTermDerived`.

Semantics: the active term is the last boundary with T ≤ t. T − 1 ms belongs to the old term; T and T + 1 ms belong to the new term. This is tested on both the TT and civil axes for all 4,870 interior crossings.

## Performance (Node 23, Apple Silicon)

| Step | Time |
|---|---|
| Import | 61 ms (includes vitest transform) |
| First load + SHA-256 + decode + clock | 27.5 ms |
| Lookup | 0.12 µs |

Physical-device numbers are pending (see the device gate).
