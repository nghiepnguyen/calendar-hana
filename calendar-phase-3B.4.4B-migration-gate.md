# Phase 3B.4.4B migration gate

**Recommended status for 3B.4.4B: READY_PENDING_DECISIONS.** The authority, the clock and the Golden are frozen and reviewed. Production migration must not start until the three owner decisions in §1 are recorded.

## 1. Owner decisions required before migration

| # | Decision | Recommendation | Evidence |
|---|---|---|---|
| D1 | Runtime boundary source | **Option B**: ship the reviewed JPL canonical boundary table (about 19 KB gzipped, hash-pinned); keep ERFA as the CI verifier | `calendar-runtime-boundary-architecture-v3.4A.md` |
| D2 | Civil serialization after 2027-06-28 | **clock-v1 pinned TAI − UTC = 37 s** (future displayed times shift up to about 136 s vs. today's production by 2100) | `calendar-astronomy-authority-spec-v3.4A.md` §8 |
| D3 | Physical device gate | Schedule Safari/iOS + Android (offline PWA, timing, memory). Under option B the runtime cost is a table lookup. | Status: **UNVERIFIED_DEVICE_GATE** |

If D1 is answered "A" instead, a new authority generation (`astronomy-authority-v5`) with its own Golden is required first (architecture §4). golden-v4 would not be the production Golden in that case.

## 2. Fixed contract for 3B.4.4B (already approved)

- Authority: JPL DE440s / Skyfield 1.55 / jplephem 2.24; apparent geocentric true ecliptic and equinox of date; TT.
- Boundary: `T = ceil(R)` as integer TT ms; `t ≥ T` is the new term; T − 1 ms OLD, T NEW, T + 1 ms NEW; no epsilon.
- Clock: `clock-v1` (PRE1972_MODELED_UT1 / UTC_LEAP_HISTORY / PROJECTED_PINNED_TAI_UTC); leap-second instants are rejected; ISO with 3 fractional digits.
- Golden: `golden-v4` (REVIEWED_FROZEN, manifest-pinned). `golden-v3` is historical and immutable.
- Engine identity and clock identity are separate, and both go into cache keys.

## 3. Migration checklist for 3B.4.4B

1. Implement the boundary source per D1 behind one shared module consumed by `getSolarTermAt`, `getSolarMonth`, the daily term label, Officer, Group A, Group B and Bazi `termInstants`. Astronomy Engine stays for HourAngle/TST only.
2. Version the cache keys with the authority dataset and clock-v1. Invalidate the stale year caches.
3. Add golden-v4 Group B (611) to the production test suite. Run it **next to** the immutable golden-v3 test, which is expected to fail on the 77 records invalidated by the authority change. Classify those, do not delete them, and get approval for how the historical suite is reported.
4. Group A: add a new-version Golden entry for Tứ Ly 1938-09-22. Keep the old frozen evidence.
5. Bazi: revalidate month and year pillars at every golden-v4 boundary (T − 1 ms / T / T + 1 ms); the TST, day and hour pillars stay unchanged.
6. Officer and almanac: one daily change (1946-12-07) and one Group A change (1938).
7. Run the full mutation campaign: the M-series from 3B.4.3, the G-series from 3B.4.4A, and the production consumer mutants.
8. Run the full regression. Today's baseline is 50 pre-existing Group B failures; after migration they must be re-explained or resolved under the new Golden, never silenced.
9. Rollback: one switch restores the boundary source, clock version, cache namespace and Golden selection together. Rehearse it.
10. Add `THIRD_PARTY_NOTICES.md` entries: ERFA and fdlibm if ERFA ships; for option B, the JPL-derived data provenance note.

## 4. Carried-forward risks

- **Device gate:** UNVERIFIED.
- **Post-2027 display:** shifts by minutes compared with today's production (a clock-policy effect).
- **Historical Golden reporting:** policy needed for the expected golden-v3 failures after migration.
- **Format check:** graphify's generated cache JSON is not prettier-formatted (pre-existing; it grew with the AGENTS.md-mandated graph updates). Unrelated to migration, but it should be resolved or ignored by explicit config.
