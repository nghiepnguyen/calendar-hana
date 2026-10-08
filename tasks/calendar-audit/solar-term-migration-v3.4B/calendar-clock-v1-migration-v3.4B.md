# clock-v1 production migration (v3.4B)

**Result: PASS.**

- **Policy (ratified D2):** `clock-v1`. TT authority and civil serialization are separate layers.
  - The table stores TT only.
  - Civil time = first civil ms at or after T.
  - ISO output has exactly 3 fractional digits.
- **Implementation:** `shared/astronomy/solarTerms/clock.ts`, the single implementation. `shared/astronomy/erfa/clockV1.ts` re-exports it for the verifier.
- **Regimes:**

  | Regime | Civil range | Rule | Authority rows |
  |---|---|---|---|
  | PRE1972_MODELED_UT1 | before 1972-01-01 | UT1 from Espenak–Meeus Delta-T | 1,752 |
  | UTC_LEAP_HISTORY | 1972-01-01 … 2027-06-28 | IERS leap-second history; TT − TAI = 32.184 s | 1,332 |
  | PROJECTED_PINNED_TAI_UTC | from 2027-06-28 | TAI − UTC pinned at 37 s | 1,788 |

- The pinned TAI − UTC is a project convention, not a claim about future physical UTC. Any change requires a new clock version.
- Future civil serialization never uses Astronomy Engine Delta-T. A test checks the last 2100 crossing: civil = TT − 32.184 s − 37 s.

## Tests (`clock.test.ts`, `authority.test.ts`, erfa `clockV1.test.ts`)

| Case | Result |
|---|---|
| Pre-1972 | 1938 Thu phân = 1938-09-23T16:59:27.175Z; ΔT in (23 s, 25 s) |
| 1972 transition | the first UTC ms maps exactly; the regime switches at 1972-01-01 |
| Known leap eras | 1980 (19 s), 1999 (32 s), 2016 (36 s) and 2026 (37 s) map exactly |
| Post-2027 / 2050 / 2100-12-31T23:59:59.999Z | PROJECTED_PINNED_TAI_UTC, exact |
| Leap-second instant (2016-12-31T23:59:60.5) | throws `ClockPolicyError` LEAP_SECOND_UNREPRESENTABLE |
| All 4,872 authority rows | TS clock equals the frozen civil ms, ISO and regime (independent Python generator) |

## Display impact

Compared with pre-migration production:
- Post-2027 displayed crossing times shift by up to about 2–3 minutes by 2100. This combines the Astronomy Engine Delta-T projection versus the pinned 37 s with root differences. It was accepted under D2.
- Within the prerendered SEO range (2025–2027), the 1,095 day pages are byte-identical apart from asset hashes.
