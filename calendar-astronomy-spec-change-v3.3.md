# Astronomy SPEC_CHANGE proposal v3.3 — solar-term authority, boundary and clock

**Status: SPEC_CHANGE_PROPOSED** (not applied). No authoritative specification, production code path, Golden file or consumer was changed in Phase 3B.4.3. Applying this proposal requires explicit approval in Phase 3B.4.4.

Scope: the shared solar-term engine (24 crossings, 1900–2100 public range, 1899/2101 internal padding). Lunar conversion, Bazi true solar time (TST), day/hour/Zi policies and the 12-Officer tables are out of scope.

## 1. Why three separate rules

The current wording mixes three quantities that must not share a tolerance:

| Quantity | What it measures | Proposed rule |
|---|---|---|
| A. TT-root accuracy | How close the model's crossing instant (TT) is to an independent physical reference | ≤ 0.5 s vs JPL DE440s, 1900–2100, all 24 terms (reference gate only) |
| B. Civil-time serialization | How a TT instant is written as a civil/POSIX timestamp | Separately versioned clock policy (`clock-v1`) |
| C. Domain-boundary equality | Which term/month an instant belongs to | Zero tolerance, integer-ms `[T, nextT)` |

A is a statement about astronomy. B is a convention about Earth rotation and leap seconds. C is a deterministic rule of the calendar. A tolerance from A or B must never appear in C.

## 2. Proposed rules

### 2.1 Reference validation (A)

- Authority model: `hana-erfa-solar-term@1.0.0-candidate.3b43` — ERFA 2.0.1 EPV00 (1,951 terms), light time, relativistic aberration, IAU 2006 bias-precession, IAU 2000B nutation, apparent geocentric longitude in the **true ecliptic and equinox of date**, TT used as TDB.
- Independent reference: JPL DE440s (SHA-256 `c1c7feea…49f2`) through Skyfield 1.55 / jplephem 2.24, same observable and frame, roots solved independently from calendar-only seeds.
- Gate: max |T_model − T_reference| ≤ **0.5 s** over every crossing 1900–2100 and the padding years. Measured in 3B.4.3: **0.376 s** max, 0.074 s median, 0.197 s p95, 0.255 s p99, 0 above 0.5 s.
- JPL, Skyfield and jplephem stay audit-only. They are never imported by application or browser code.
- This gate certifies the model. It is **not** a tolerance for any domain comparison.

### 2.2 Domain (C)

- `T` = the first integer TT millisecond since J2000.0 TT at or after the numerical crossing (`ceil`), i.e. the smallest integer `t` with `wrap(λ_apparent(t) − target) ≥ 0`.
- An instant `t` belongs to the previous term when `t < T` and to the new term when `t ≥ T`. Intervals are `[T, nextT)`.
- Required invariants for every crossing: `T − 1 ms → OLD`, `T → NEW`, `T + 1 ms → NEW`, on the TT axis and on the clock-v1 civil axis.
- No epsilon, no rounding of roots to seconds or minutes, no dual-answer interval.
- Target longitudes are exact multiples of 15°; index = longitude / 15 (0 = Xuân phân).
- Roots outside 1899–2101 are rejected; failure to bracket or converge is an error, never a fallback.

### 2.3 Clock (B) — `clock-v1`

| Regime | Range (civil) | Mapping | Label |
|---|---|---|---|
| `PRE1972_MODELED_UT1` | before 1972-01-01T00:00:00Z | UT1 = TT − ΔT, Espenak–Meeus 2006 polynomials (argument as in astronomy-engine 2.1.19) | Modeled historical civil time. Not exact physical UTC. |
| `UTC_LEAP_HISTORY` | 1972-01-01 to 2027-06-28 | UTC = TT − 32.184 s − (TAI − UTC), frozen IERS table (Bulletin C 72, July 2026; IANA list expiring 2027-06-28) | Known UTC |
| `PROJECTED_PINNED_TAI_UTC` | from 2027-06-28 | TAI − UTC pinned at 37 s | Projected convention, not a promise of future physical UTC |

- Leap seconds: an instant inside an inserted `23:59:60` second has no POSIX representation and is **rejected** (`LEAP_SECOND_UNREPRESENTABLE`). None of the 4,824 crossings falls in one.
- 1972 switch: civil time is monotone; the 29 ms gap where the modeled UT1 meets UTC is documented and has no ambiguous mapping.
- Serialization: integer epoch ms = first civil ms at or after the TT boundary (`ceil`); ISO-8601 with exactly three fractional digits. Byte-identical across Node, Chromium, Firefox and WebKit (4,872 rows).
- Any change of model, solver, leap table, ΔT model or serialization requires a new clock or model version and a cache-key change.

## 3. Interaction with the existing Bazi ≤ 30 s target

- The Bazi PRD (§9) requires independent fixtures within ≤ 30 s for TST and giao tiết. This proposal keeps that target and makes it explicit: **giao tiết ≤ 30 s is evaluated on TT roots against the independent reference**. The new model meets it with a margin of about 80× (max 0.376 s; 0 crossings above 30 s; production Astronomy Engine 2.1.19 has 210 crossings above 30 s, max 56.29 s, against the same JPL roots).
- The new 0.5 s gate is stricter and supersedes the 30 s figure for the solar-term engine only. TST keeps its own ≤ 30 s target unchanged (`engineErrorBoundSeconds: 30` in `solarTime.ts` belongs to TST).
- Civil timestamps are not promised to ≤ 30 s of physical UTC before 1972 (ΔT model uncertainty) or after 2027-06-28 (unknown future leap seconds and Earth rotation). They are labelled by regime instead.

## 4. Consequences that need approval

Migration projection (`calendar-erfa-migration-impact-v3.3.md`):

- Every one of the 4,824 boundary instants moves. Median 13.5 s, p95 110.6 s, max 175.3 s on the civil axis.
- TT-root differences alone: median 9.8 s, max 56.0 s.
- The remaining shift comes from clock-v1. Production converts TT with the Espenak–Meeus ΔT extrapolation for all years. clock-v1 uses leap seconds from 1972 and pins TAI − UTC after 2027. Clock contribution: ≤ 0.001 s before 1972, ≤ 6.8 s for 1972–2027, up to **135.8 s by 2100**.
- Day-level changes: exactly two. 1938 Thu phân (Group A Tứ Ly date moves) and 1946 Đại tuyết (daily term label, daily Officer and month).
- Exact-instant APIs (Month Jian, instant Officer, Group B, Bazi month/year) change inside each moved interval. The total moved interval is 130,790 s over 201 years.
- Group B Golden records anchored on Astronomy Engine roots will need a new, separately versioned authority Golden. Old Golden stays immutable.

The 2027+ clock decision (pinned 37 s vs. extrapolated ΔT) is a product choice. It changes displayed minutes for future years but no day-level output in 1900–2100. It needs explicit sign-off.

## 5. Tests affected (3B.4.4)

Solar-term root/reference tests, getSolarTermAt/getSolarMonth boundary tests, exact-instant and daily Officer tests, Group A/B boundary fixtures, Bazi giao-tiết benchmarks, clock/serialization fixtures, SEO/prerender snapshots (none affected in the current 2025–2027 window).

## 6. Not changed by this proposal

TST, Zi policy, the lunar core, Officer tables, Group A/B rule tables, and Golden v3 files.
