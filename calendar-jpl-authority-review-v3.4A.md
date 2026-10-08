# Independent review of the JPL authority dataset v3.4A

**Result: PASS (round 2).** Round 1 raised 2 findings, both classified GOLDEN_GENERATOR_ERROR (a representation problem). The generator was corrected, regenerated and re-reviewed. No canonical T value changed.

Reviewer: `tasks/calendar-audit/astronomy-authority-v3.4A/review/review_authority.py`. Report: `reviews/review-authority.json`, pinned in `golden-v4/manifest.json`.

## What makes the review independent

| Step | Generator | Reviewer |
|---|---|---|
| Longitude route | `frame_latlon(ecliptic_frame)` | apparent RA/Dec of date, then true obliquity (mean obliquity + Δε), then spherical conversion to ecliptic longitude |
| Seed | calendar offset from 285°, ±12 d | Meeus mean solar longitude L₀, ±6 d |
| Root | Newton + sub-ms refinement + ceil + sign confirmation | **pure integer-millisecond bisection driven only by residual signs**; T comes out directly with no float root or ceil |
| Clock | Python `clock_v1.py` | Node implementation in the Group B reviewer |

The reviewer shares the reference authority itself (DE440s via Skyfield), as it must. It shares no solver, seed or longitude-assembly code.

## Full-dataset results (all 4,872 rows, not a sample)

| Check | Result |
|---|---|
| Independent canonical T equal to generator T | **4,872 / 4,872** |
| Target longitudes | exact (termIndex × 15°), sequence 285° … 270° per year |
| Year/term cardinality and order | 1899–2101 × 24 |
| Monotonicity | strictly increasing TT and civil boundaries |
| Interval consistency | consecutive gaps 14.71–15.74 days |
| `T − 1 < root ≤ T` for non-settled rows | pass |
| Settled rows (root within 1 µs of an integer) | 15; reviewer bisection agrees on all |
| Minimum sign margin | 4.5·10⁻¹³° (90 rows below 1·10⁻¹⁰°; all agree) |
| Kernel and metadata pins | pass |
| clock-v1 civil, ISO and regime (Node reviewer) | 4,872 / 4,872 identical |
| Deterministic hash | regenerated candidate equals frozen bytes (status line aside) |

## Round 1 findings

| # | Row | Finding | Classification | Resolution |
|---|---|---|---|---|
| 1 | 2081, Xuân phân | stored root `…397002.0000` but T = `…397003` | GOLDEN_GENERATOR_ERROR | The float root lies within float noise of an integer, and the sign test (independently confirmed) puts the crossing after `…002`. The 4-dp field overstated the estimate's precision. |
| 2 | 2091, Đại hàn | `…693788.0000` vs T `…693789` | GOLDEN_GENERATOR_ERROR | same |

Fix: `rootTtMs` is now printed at 3 dp, rows within 1 µs of an integer carry `signSettled = 1`, and the dataset documents that T is defined by residual signs. Canonical T values were not changed; the reviewer's independent T values were identical in round 1 and round 2. The round-1 report is kept at `reviews/review-authority-round1.json`. The candidate was not hand-edited to pass.

## Discrepancy classes

REFERENCE_ROOT_ERROR 0, SERIALIZATION_ERROR 0, GOLDEN_GENERATOR_ERROR 2 (round 1, resolved), REVIEWER_ERROR 0, SOURCE_TABLE_ERROR 0, FIXTURE_DESIGN_ERROR 0, UNKNOWN 0.
