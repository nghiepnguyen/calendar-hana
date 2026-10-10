# Canonical astronomy authority spec v3.4A

**Status: APPROVED for authority generation `astronomy-authority-v4` (Phase 3B.4.4A).** This finalizes the SPEC_CHANGE proposed in `calendar-astronomy-spec-change-v3.3.md`. Every statement below was re-checked against the 3B.4.2A, 3B.4.3 and 3B.4.4A evidence; corrections to v3.3 are listed in §9.

Production behaviour is unchanged by this spec. Phase 3B.4.4B applies it to production.

Machine-readable form: `calendar-astronomy-authority-spec-v3.4A.json`.

## 1. Four layers — never collapse them

| Layer | What | Role | Must not |
|---|---|---|---|
| **A. Independent reference authority** | JPL DE440s (SHA-256 `c1c7feea…49f2`), Skyfield 1.55, jplephem 2.24 | Defines the crossing; constructs Golden; validates engines | Run in production or the browser |
| **B. Production numerical engine candidate** | `hana-erfa-solar-term` (ERFA 2.0.1 EPV00, IAU 2006, IAU 2000B), APPROVE_FOUNDATION_WITH_DEVICE_GATE | Runtime astronomy; must pass the accuracy gate | Generate Golden; define the canonical boundary on its own |
| **C. Canonical numerical boundary** | `T = ceil(R)` in integer TT ms since J2000.0 TT, where R is the Layer-A crossing | The domain boundary used by Golden | Carry any tolerance |
| **D. Civil serialization** | `clock-v1` | Maps TT boundaries to POSIX ms / ISO | Be confused with root accuracy |

ERFA ≠ Golden generator. Astronomy Engine ≠ authority. JPL ≠ production engine. An old Golden that disagrees with a new authority at exact T is not an error (§8).

## 2. Observable

- Sun: **apparent, geocentric, tropical** ecliptic longitude in the **true ecliptic and equinox of date**. This includes light time, annual aberration (with relativistic terms), precession and nutation.
- Solar terms: 24 crossings at **exact 15° intervals**; term index = longitude / 15 (0 = Xuân phân, 0°).
- Jie are the odd indices (longitudes 15° mod 30°). Month Jian = `[Jie_n, Jie_n+1)`, with Lập xuân (315°) opening 寅.

## 3. Time scale

- Reference time scale: **TT**. Roots are solved on TT.
- Layer B may use TT in place of TDB (|TDB − TT| < 2 ms).

## 4. Independent reference (Layer A)

- Kernel: `de440s.bsp`, SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`.
- Software: Skyfield 1.55, jplephem 2.24 (NumPy 2.4.4 recorded). All three are pinned and verified by `reproduce.sh`.
- Frame: `skyfield.framelib.ecliptic_frame`. The reviewer independently cross-checks it through RA/Dec of date plus true obliquity.
- The reference is audit and construction tooling only.

## 5. Production accuracy gate (Layer B)

- Rule: `|productionRootTT − referenceRootTT| ≤ 0.5 s` for all 24 terms, every year 1900–2100. Padding years 1899 and 2101 are reported separately.
- Current ERFA candidate: max 0.376 s, median 0.074 s, p95 0.197 s, p99 0.255 s, 0 above 0.5 s; padding max 0.202 s. **PASS.**
- The historical Bazi ≤ 30 s target stays documented for Bazi/TST compatibility. It is **not** the acceptance target for this solar-term engine.
- **This is an accuracy gate, not an identity.** Passing it does *not* mean the engine reproduces canonical T. The ERFA candidate equals canonical T to the millisecond in only 16 of 4,824 crossings (§7).

## 6. Exact domain semantics (Layers C/D)

- Zero tolerance. For canonical integer boundary T: `t < T` → previous interval; `t ≥ T` → new interval.
- Mandatory for every boundary: **T − 1 ms → OLD, T → NEW, T + 1 ms → NEW**.
- Never choose a month, Officer or rule with `abs(t − T) < ε`.
- **Numerical boundary representation:** T is the first integer TT millisecond at or after the reference crossing. Operationally, it is the smallest integer t whose residual `wrap(λ(t) − target) ≥ 0`. Where the float root estimate lies within 1 µs of an integer (15 of 4,872 rows, flagged `signSettled`), the residual sign at the integer milliseconds decides. An independent integer bisection reproduced all 4,872 values.
- Civil comparison: the civil boundary is the first civil ms at or after T (clock-v1). For a civil instant c, `c ≥ civil(T)` exactly when its TT image is ≥ T, so civil comparisons are equivalent to TT comparisons.

## 7. Versioning

| Identifier | Value | Changes when |
|---|---|---|
| Authority version | `astronomy-authority-v4` | reference, observable, frame, boundary rule |
| Reference dataset | `solar-terms-jpl-de440s-clock-v1` (golden-v4) | any authority or clock change → new Golden version |
| Engine/model version (Layer B) | `hana-erfa-solar-term@1.0.0-candidate.3b43` | any engine change |
| Clock/serialization version | `clock-v1` | any leap table, ΔT model, pin or serialization change |

Engine and clock identifiers are separate and must both appear in any cache key.

## 8. Clock policy decision: `clock-v1` (APPROVED for this authority generation)

| Regime | Civil range | Rule | Label |
|---|---|---|---|
| `PRE1972_MODELED_UT1` | < 1972-01-01T00:00:00Z | civil = ceil(TT − ΔT), Espenak–Meeus 2006 polynomials, `y = 2000 + (ut − 14)/365.24217`, fixed 6-step iteration, pinned operation order | Modeled historical civil time; **not** exact historical UTC |
| `UTC_LEAP_HISTORY` | 1972-01-01 … < 2027-06-28 | UTC = TT − 32.184 s − (TAI − UTC), from the pinned IERS `Leap_Second.dat` (Bulletin C 72, SHA-256 `6cb6f5d4…68d7`) | Known UTC |
| `PROJECTED_PINNED_TAI_UTC` | ≥ 2027-06-28 | TAI − UTC frozen at **37 s** | Deterministic project convention; **not** a prediction of physical UTC |

- **Leap seconds:** an instant inside an inserted `23:59:60` second cannot be represented in POSIX time, and clock-v1 **fails explicitly**. No smear, no mapping. None of the 4,872 authority boundaries falls inside one.
- **Serialization:** integer epoch ms; ISO-8601 UTC with exactly 3 fractional digits.
- **Future leap seconds:** an announced leap second, or a change of pin, requires **clock-v2**. clock-v1 output never changes silently.
- **Implementations:** three independent implementations (Python generator, Node reviewer, TS `clockV1.ts`) agree bit-for-bit on all 4,824 supported boundaries.

### Why pinned civil serialization instead of extrapolated ΔT

1. **Reproducibility.** A pinned offset is exact and identical everywhere. Extrapolated ΔT changes whenever the model is revised and differs between libraries.
2. **Correct near-term values.** From 2017 to the 2027-06-28 file expiry, the pinned value *is* physical UTC. Extrapolated Espenak–Meeus ΔT is already about 4.7 s off physical UTC in 2024 (73.9 s vs 69.184 s).
3. **No false precision.** Future UTC is unknowable either way. CGPM 2022 Resolution 4 decided to relax the UT1 − UTC limit by or before 2035, which is widely expected to end leap seconds; a frozen TAI − UTC is therefore at least as plausible as an Earth-rotation extrapolation. Labelling the regime `PROJECTED_PINNED_TAI_UTC` states the uncertainty instead of hiding it in a polynomial.
4. **Clean separation.** Astronomy (Layer A/C) never depends on Earth rotation after 1972. The clock is a replaceable, versioned layer.

Cost, which needs product sign-off in 3B.4.4B: relative to the current production clock (Espenak–Meeus extrapolation for all years), future displayed times shift by up to 135.8 s by 2100. No day-level output changes because of the clock (see the migration impact projection).

## 9. Corrections to the v3.3 proposal

- v3.3 §2.1 named the ERFA model as the "authority model". **Corrected:** the authority is Layer A (JPL). ERFA is the Layer-B engine that must pass the accuracy gate.
- v3.3 implied that domain T would be produced by the engine. **Corrected:** canonical T is defined by Layer A (§6). How production realizes it is the open architecture gate (`calendar-runtime-boundary-architecture-v3.4A.md`).
- The known-UTC horizon of 2027-06-28 (leap-file expiry) is confirmed. The pre-1972 ΔT operation order is now pinned explicitly, so all implementations give bit-identical results.
- The v3.3 numbers (0.376 s max, 0 civil-date disagreements, 210 Astronomy Engine crossings > 30 s) are confirmed.

## 10. Golden contract

- New authority Golden: `golden-v4/` (REVIEWED_FROZEN).
- `golden-v3/` stays the immutable Golden of the previous authority (Swiss Ephemeris DE441, ±60 s samples).
- Golden values come only from Layer A plus the frozen source rule tables, and are verified by an independent review.
- Production may be compared with Golden. Production never generates Golden.
