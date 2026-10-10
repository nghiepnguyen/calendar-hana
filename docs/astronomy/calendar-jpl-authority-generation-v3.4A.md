# JPL authority generation v3.4A

**Result: PASS.** Dataset `golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json`, status **REVIEWED_FROZEN**. It holds 4,872 rows: 4,824 supported crossings for 1900–2100 and 48 internal padding crossings for 1899 and 2101.

Generator: `tasks/calendar-audit/astronomy-authority-v3.4A/generator/jpl_authority.py` (version `jpl-authority-generator 1.0.0`), with `clock_v1.py`.

## Inputs (pinned and verified)

| Input | Pin |
|---|---|
| JPL DE440s kernel | SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2` |
| Skyfield / jplephem / NumPy | 1.55 / 2.24 / 2.4.4 |
| IERS `Leap_Second.dat` (Bulletin C 72) | SHA-256 `6cb6f5d4…68d7` |
| Seeds | Gregorian calendar only: TT Jan 1 + 5 d + mean motion from 285° |

The generator reads no production engine, no ERFA output, no Astronomy Engine value and no old Golden timestamp. The Group B reviewer enforces this with a static guard, and mutation tests G10/G11 showed the guard works.

## Method

1. Observable: `earth.at(t).observe(sun).apparent().frame_latlon(ecliptic_frame)`, giving the apparent geocentric longitude in the true ecliptic and equinox of date, on TT.
2. Bracket the seed ±12 days and require a sign change for all 4,872 rows. A failure would raise REFERENCE_ROOT_ERROR.
3. Run 10 Newton steps with a central-difference slope, clipped to the bracket.
4. Refine to sub-millisecond with the local slope per millisecond. This gives the float root R; its estimate noise is about 0.5 µs, the ulp of about 3·10¹² ms.
5. Set **T = ceil(R)**, then confirm with the residual sign at the integer milliseconds T − 1 (must be < 0) and T (must be ≥ 0).
   - In 2 rows the float estimate fell on the wrong side of an integer, so the sign test moved T by one.
   - 15 rows lie within 1 µs of an integer and are flagged `signSettled`. Their T is fixed by the sign test, not by the float.
6. Serialize to civil time with clock-v1: integer epoch ms and an ISO string with 3 fractional digits.

## Output (per row, pipe-delimited)

`year | termIndex | rootTtMs (3 dp float, audit only) | ttMs (canonical T) | civilEpochMs | civilIso | clockRegime | signSettled`

The metadata declares:

- `authorityVersion`, `referenceEngine`, `referenceKernel`, `referenceKernelSha256`
- `observable`, `frame`, `timeScale`
- `numericalBoundaryPolicy`, `clockPolicy`, `serializationPolicy`
- `generatedAt` (deterministic, not stamped), `generatorVersion`, `reviewStatus`

## Results

| Check | Value |
|---|---|
| Rows | 4,872, in order 1899–2101 × (285°, 300°, … 270°) |
| T strictly increasing; gaps | 14.71–15.74 days |
| Minimum residual magnitude at T−1 / T | 4.5·10⁻¹³° / 7.1·10⁻¹³°, near the floating-point floor |
| Rows settled by sign test | 2 adjusted, 15 flagged `signSettled` |
| Leap-second collisions | 0 |
| Determinism | regenerating gives byte-identical output (`reproduce.sh` step 3) |
| Runtime | about 2.4 s (vectorized) |

## Note on numerical sensitivity

T is defined to the millisecond. For 90 of the 4,872 roots the crossing lies within about 9 µs (1·10⁻¹⁰° of solar motion) of an integer millisecond. For 15 roots it lies within 1 µs. Two *correct* implementations of the same reference agree on all of them; the independent reviewer checked this. No engine with a different ephemeris can be expected to reproduce them. This is the root of the runtime-boundary question in `calendar-runtime-boundary-architecture-v3.4A.md`.
