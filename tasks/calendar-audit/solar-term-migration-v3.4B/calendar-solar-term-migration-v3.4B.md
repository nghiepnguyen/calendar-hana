# Phase 3B.4.4B — Canonical solar-term production migration

**Verdict: APPROVE_MIGRATION_RELEASE_BLOCKED_DEVICE_GATE**

The migration is complete and every automated gate passes. The only remaining release blocker is physical Safari/iOS and Android PWA testing (D3), which has not been run.

| | |
|---|---|
| Starting HEAD | `f845444` (3B.4.4A); origin/main `87dd1ba`; tree clean |
| Production boundary source | Frozen JPL DE440s table `astronomy-authority-v4` (golden-v4), shipped as hash-pinned data |
| Clock | `clock-v1` (PRE1972_MODELED_UT1 / UTC_LEAP_HISTORY / PROJECTED_PINNED_TAI_UTC, TAI − UTC = 37 s after 2027-06-28) |
| Current Golden | golden-v4: Group B **611 / 611 PASS** |
| Historical Golden | golden-v3: 606 records checked; 529 unchanged; **77 EXPECTED_AUTHORITY_MIGRATION_CHANGE**; 0 unexplained |
| Unit tests | **2,679 / 2,679 pass** (baseline: 1,977 / 2,027, with 50 known Group B failures) |
| Mutation | P-series and M-series: **33 / 33 KILLED** on a green baseline. G-series re-run: 15 KILLED, 1 equivalent (G10b, explained) |
| ERFA CI verification | 4,824 crossings; max 377 ms, median 74 ms, p95 197 ms; 0 over 0.5 s → PASS |
| Rollback | `git revert` of the migration commit restores the f845444 tree byte for byte (tree `762130e3`). The reverted tree reproduces the exact 50-failure baseline. Rehearsed in both directions. |
| Device gate | UNVERIFIED_DEVICE_GATE → **RELEASE_BLOCKED_DEVICE_GATE** |
| main pushed | **no** |

## What changed

1. **New `shared/astronomy/solarTerms/`** is the single production authority.
   - `authority.data.ts`: generated, 4,872 TT ms values for 1899–2101.
   - `authority.ts`: fail-closed decode and lookup API.
   - `clock.ts`: clock-v1, moved here from `erfa/clockV1.ts`, which now re-exports it.
   - `cache.ts`: versioned caches.
   - `sha256.ts`: synchronous integrity check at load.
2. **`scripts/generate-solar-term-authority.mjs`** re-encodes the frozen golden-v4 TT column. It verifies the manifest hash and never recomputes astronomy. `--check` fails if the shipped file differs from its output.
3. **`shared/lunar/solarTerms.ts`** keeps its public API (`solarTermsForYear`, `getSolarTermAt`, `getSolarMonth`, `getSolarTerm`, `solarTermMonthChi`), now backed by the table. `SOLAR_TERM_METHOD` is now `jpl-de440s-table:astronomy-authority-v4:clock-v1`. The Astronomy Engine `SearchSunLongitude` import has been removed.
4. **Consumers.** Group A, Group B, Officer (daily and exact), Bazi `termInstants`, the daily almanac and the UI already read through `solarTerms.ts`, so they all moved together. No consumer has copied boundary logic.
5. **Caches.**
   - `getDayInfo`, `getAlmanac` and `solarTermsForYear` are keyed by `solar-terms/astronomy-authority-v4/clock-v1`.
   - Entries from any other namespace, including the pre-migration bare-date keys, are never served and can be purged.
6. **Bazi.** `BAZI_VERSIONS` now declares `solarTermAuthority` and `clock`. TST stays on Astronomy Engine 2.1.19.
7. **Tests.**
   - golden-v4 is the blocking Group B Golden.
   - golden-v3 is a HISTORICAL_AUTHORITY_REGRESSION suite: each record must reproduce v3, or must match its reviewed entry in the expected-difference manifest.
   - New suites cover authority integrity, clock-v1, consumer oracles, Bazi and ERFA verification.
8. **Two corrections found during the migration:**
   - The `birth.term-instant-engine` rule evidence still said Astronomy Engine `SearchSunLongitude`. It now describes the authority table.
   - `calendarExtendedAudit.test.ts` overwrote the historical `tasks/calendar-audit/phase2.1-results.json` on every run. It now writes only when `PHASE21_AUDIT_OUTPUT` is set, and the evidence file is unchanged.

## Post-migration dependency split

| Concern | Source |
|---|---|
| Solar terms and Jie boundaries (all consumers) | JPL authority table (golden-v4) + clock-v1 |
| HourAngle / true solar time (Bazi) | Astronomy Engine 2.1.19 (unchanged, separately versioned) |
| Lunar months, new moons, leap months | existing independent lunar core (`shared/lunar/lunar.ts`), unchanged |
| Independent verification of the table | ERFA 2.0.1 port: CI tests only, not imported by application code, not in the bundle |

Astronomy Engine is still bundled because `solarTime.ts` imports it. The package is one module that the bundler cannot tree-shake, so `SearchSunLongitude` code is present in the bundle, but no application code calls it. The source search confirms this: `shared/bazi/solarTime.ts` is the only non-test importer.

## Reviewed behavioural changes (all EXPECTED_AUTHORITY_MIGRATION_CHANGE)

Across 4,824 crossings, the boundaries moved by a median of 13.5 s, p95 110.6 s and max 175.3 s. These figures combine the Astronomy Engine root error and its Delta-T, compared with JPL and clock-v1.

Only two crossings changed Vietnamese civil date:

| Term | Pre-migration | Authority | Visible effect |
|---|---|---|---|
| Thu phân 1938 | 1938-09-23T17:00:01.461Z (VN 09-24) | 1938-09-23T16:59:27.175Z (VN 09-23) | Tứ Ly moves from 1938-09-23 to 1938-09-22; the term label moves from 09-24 to 09-23 |
| Đại tuyết 1946 | 1946-12-07T16:59:57.701Z (VN 12-07) | 1946-12-07T17:00:11.131Z (VN 12-08) | Daily Officer on 1946-12-07 (month Hợi, not Tý); the term label moves from 12-07 to 12-08 |

All other changes are sub-day:
- Exact-instant Month Jian, Officer, Bazi month and Bazi year change only inside each crossing's old-to-new window.
- The displayed crossing time also moves.

Full classification of production pre/post differences is in `production-impact-v3.4B.json`, with **0 UNEXPECTED_REGRESSION**:

| Area | Compared | Expected changes | Unchanged |
|---|---|---|---|
| Daily outputs | 73,414 days | 4 term-label days, 2 Tứ Ly days, 1 Officer day | Almanac content apart from the officer, term, stars and recommendations (all days) |
| Bazi | 27,120 instants | 7,250 month pillars and 599 year pillars, all inside windows | TST, day, hour and Zi (all instants) |
| Exact-instant Officer | 14,472 samples | 7,094, all inside windows | — |

## Reports

`calendar-authority-runtime-data-v3.4B.{md,json}`, `calendar-group-b-migration-v3.4B.md`, `calendar-golden-v3-historical-diff-v3.4B.json`, `calendar-group-a-migration-v3.4B.md`, `calendar-officer-migration-v3.4B.md`, `calendar-bazi-migration-v3.4B.md`, `calendar-clock-v1-migration-v3.4B.md`, `calendar-erfa-ci-verification-v3.4B.json`, `calendar-mutation-results-v3.4B.json`, `calendar-regression-v3.4B.md`, `calendar-rollback-v3.4B.md`, `calendar-device-gate-v3.4B.md`, `integrity-final-v3.4B.json`. Tools to reproduce them are in `tools/`.
