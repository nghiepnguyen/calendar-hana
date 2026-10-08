# ERFA port review v3.3 — independent upstream comparison

**Result: PORT_FIDELITY_PASS.** The TypeScript port in `shared/astronomy/erfa/` reproduces unmodified upstream ERFA 2.0.1 C at machine precision, under tolerances that were registered before any comparison was run.

Evidence: `tasks/calendar-audit/erfa-foundation-v3.3/erfa-port-parity.json`. Tooling: `port-review/build-upstream.sh`, `port-review/erfa-harness.c`, `port-review/run-parity.mjs`.

## 1. Independent path

- Upstream: `erfa-2.0.1.tar.gz`, SHA-256 `d5469fbd…6cbf`, hash-checked by every script. Every upstream `.c` file is compiled unmodified into `liberfa.a` with Apple clang 21.0.0.
- Upstream self-test: `t_erfa_c` passes ("validation successful") in both builds.
- Two builds:
  - **Strict**: `-O2 -ffp-contract=off`. This is the pre-registered comparison, because JavaScript never fuses `a*b+c`.
  - **Default**: `-O2` with clang's default FMA contraction. Informational only.
- The C harness only calls upstream functions, and where ERFA allows it, it uses a *different* route from the port:
  - `eraApcs` supplies distance, velocity and Lorentz factor.
  - `eraFw2m` builds the matrix to the true equator, then `eraRx(ε+Δε)` rotates to the true ecliptic. The port rotates directly.
  - Roots are found by plain integer **bisection** on the harness's own ±12-day bracket. The port uses Illinois false position on a ±10-day bracket.
- Both sides receive the same integer TT millisecond and compute `days = ms / 86400000` identically.

## 2. Pre-registered tolerances

Registered in `port-review/tolerance-preregistration.json` (SHA-256 `25c9ffa4…8f93`). The driver refuses to run if the file changes.

| Quantity | Tolerance | Basis |
|---|---|---|
| Earth heliocentric / barycentric position | 1e-13 au | Σ\|a\|·2⁻⁵² ≈ 2.3e-16 au, with a 400× margin for libm differences |
| Heliocentric / barycentric velocity | 1e-15 au/d | Σ\|a·c\| ≈ 6.3 au/yr, about 250 ulp-equivalents |
| Nutation Δψ, Δε | 1e-16 rad | about 10⁴ ulp of the result |
| F-W angles, mean obliquity | 0 (bit-identical) | pure polynomials, no libm |
| Apparent longitude | 1e-11° | about 175 ulp at 300°, equal to 0.86 µs of solar motion |
| Canonical root | exact; ±1 ms only if the upstream residual at the disputed ms is ≤ 1e-11° | — |

These are port-equivalence limits. They are not the 0.5 s JPL reference gate.

## 3. Epochs

There are 10,357 epochs, all integer TT ms:

- 609 seasonal grid epochs: three per year from 1899 to 2101, one in each third of the year, placed randomly within it with a fixed seed.
- J2000.0.
- Padding probes at 1899-01-01 and 2101-12-31.
- T−1 and T for every one of the 4,872 crossings from 1899 to 2101 (9,744 near-crossing epochs).

## 4. Results (strict build)

| Quantity | Max \|TS − C\| | Tolerance |
|---|---|---|
| Heliocentric position | 2.2e-16 au | 1e-13 |
| Barycentric position | 2.2e-16 au | 1e-13 |
| Heliocentric velocity | 5.2e-18 au/d | 1e-15 |
| Barycentric velocity | 5.2e-18 au/d | 1e-15 |
| Nutation | 2.7e-20 rad | 1e-16 |
| F-W angles / obliquity | 0 | 0 |
| Apparent longitude | 5.7e-14° (1 ulp) | 1e-11 |
| Canonical roots | **4,872 / 4,872 identical** | exact |

- **Official vectors:** the port passes all 32 upstream `t_erfa_c.c` assertions for `eraEpv00`, `eraNut00b`, `eraPfw06`, `eraObl06`, `eraAb`, `eraPn`, `eraPm` and the `eraApcs` velocity step, at upstream tolerances.
- **Default (FMA) build, informational:** positions differ by up to 1.16e-13 au and longitude by up to 6.7e-12°. The position figure is slightly above the strict tolerance, because contraction changes the *upstream* C result itself. Roots are still 4,872 / 4,872 identical. This shows that the strict build is the right reference for a non-fusing runtime.

## 5. Port decisions reviewed

- Coefficients are byte-reproducible from upstream (`extract-erfa.mjs --check`): 1,951 EPV00 terms in 18 tables, 77 nutation rows, and the rotation matrix.
- The port preserves operation order, including the non-reset accumulation of SSB terms onto the heliocentric sums, `eraPn` multiplying by the reciprocal, and summing nutation smallest-first.
- `Math.sin/cos/atan2` are replaced with deterministic fdlibm ports (≤ 1 ulp of V8 over 200,000 random arguments in tests). Their 42 constants are checked against the documented IEEE bit patterns.
- The pipeline uses TT as TDB, which ERFA's notes allow (|Δ| < 2 ms, below model error).
- One finding about range: `eraEpv00` flags |t| > 100 Julian years, which ends at **2100-01-01.5 TT** and not at 2100-12-31. All 24 crossings in 2100, plus the padding years, carry upstream's warning flag. JPL accuracy in the 2100 decade is still 0.238 s max. The flag is exposed as `outsideNominalRange` and tested.

## 6. Mutation sensitivity of the port tests

Both a 50-term truncation (M12) and dropping only the smallest term of each table (M12b) are killed by the compiled-upstream vector fixture (156 epochs). See `calendar-erfa-foundation-report-v3.3.md` §6.
