# Phase 3B.4.3 — ERFA solar-term foundation and independent port review

**Final verdict: APPROVE_FOUNDATION_WITH_DEVICE_GATE**

Every gate passed except physical Safari/iOS (and Android) device testing, which was unavailable and stays **UNVERIFIED_DEVICE_GATE**. Production migration: **not performed**. SPEC_CHANGE: **SPEC_CHANGE_PROPOSED**.

| Gate | Result | Evidence |
|---|---|---|
| Provenance | PASS: 1,951/1,951 EPV00 terms, 77/77 nutation rows, byte-reproducible | `calendar-erfa-provenance-v3.3.{md,json}` |
| Port fidelity vs upstream C | PASS: ≤ 1 ulp on all intermediates, 4,872/4,872 roots identical, 32/32 official vectors | `calendar-erfa-port-review-v3.3.md`, `tasks/…/erfa-port-parity.json` |
| Independent JPL reference | PASS: max 0.376 s (gate 0.5 s), 0 civil-date disagreements | `calendar-erfa-reference-comparison-v3.3.json` |
| Exact integer-ms semantics | PASS: T−1 OLD / T NEW / T+1 NEW on TT and civil axes, all 4,824 crossings | unit tests |
| Mutations M1–M12 | PASS: 14/14 executed and KILLED | `tasks/…/mutation/mutation-results.json` |
| Cross-runtime determinism | PASS: Node, Chromium, Firefox, WebKit, main thread + worker, desktop + mobile emulation, all byte-identical | `calendar-erfa-runtime-parity-v3.3.json` |
| Browser / CSP / PWA | PASS; physical devices UNVERIFIED | `calendar-erfa-browser-gate-v3.3.md` |
| License | PASS | `calendar-erfa-license-v3.3.md` |
| Scope / protected hashes | PASS: no protected file changed | `integrity-final-v3.3.json` |
| Regression | PASS: 0 new failures; the 50 pre-existing Group B failures are unchanged | `integrity-final-v3.3.json` |
| SPEC_CHANGE | PROPOSED (not applied) | `calendar-astronomy-spec-change-v3.3.md` |

## 1. What was built (isolated, not wired)

`shared/astronomy/erfa/`. No production module imports it; this is verified by the protected-hash comparison and by the impact harness, which had to inject it through `vi.mock`.

| File | Role |
|---|---|
| `epv00.data.ts`, `nut00b.data.ts`, `constants.data.ts` | Generated from ERFA 2.0.1 by `extract-erfa.mjs` (reproducible) |
| `LICENSE-ERFA.txt` | Upstream license, verbatim |
| `erfa.ts` | Transcribed eraEpv00, eraNut00b, eraPfw06, eraObl06, eraAb, eraPn/Pm, eraRx/Rz, eraApcs velocity step |
| `detMath.ts` | Deterministic fdlibm sin/cos/atan2 (bit-identical across JS engines) |
| `apparentSun.ts` | `apparentSunTrueEclipticOfDate(ttMs)`: apparent geocentric longitude, **true ecliptic and equinox of date**, TT |
| `solarTermRoots.ts` | 24 exact 15° targets, integer-grid bracketed solver, `[T, nextT)` classification |
| `clockV1.ts` | `clock-v1` TT → civil mapping, leap-second rejection, ISO serialization |
| `index.ts`, `model.ts` | Serialization, civil classification, versioned model identity `hana-erfa-solar-term@1.0.0-candidate.3b43` |

Requirements A–G: TT Julian representation (`ttMs` since J2000.0 TT; ERFA J2000 two-part date), named apparent-longitude frame, true ecliptic/equinox-of-date, exact 15° targets, deterministic root solving, integer-ms canonical TT boundary, versioned metadata. Each is implemented and named explicitly; there is no generic `getSunLongitude()`.

## 2. Numerical results

**Port review vs compiled upstream C** (`-ffp-contract=off`, 10,356 epochs; tolerances pre-registered):

- positions 2.2e-16 au
- velocities 5.2e-18 au/d
- nutation 2.7e-20 rad
- F-W angles and obliquity 0
- longitude 5.7e-14°
- roots 4,872/4,872 identical, from a different solver (bisection vs Illinois)

**Independent reference** (JPL DE440s / Skyfield 1.55 / jplephem 2.24, roots solved independently from calendar seeds):

| Set | Max | Median | p95 | p99 | >0.1 s | >0.25 s | >0.5 s | >1 s | >30 s |
|---|---|---|---|---|---|---|---|---|---|
| All 4,824 (1900–2100) | 0.3763 s | 0.0735 | 0.1965 | 0.2553 | 1,749 | 55 | 0 | 0 | 0 |
| Jie 2,412 | 0.3535 s | 0.0733 | 0.1962 | 0.2532 | 871 | 26 | 0 | 0 | 0 |
| Padding 1899/2101 (48) | 0.2016 s | 0.0815 | 0.1682 | 0.1920 | 20 | 0 | 0 | 0 | 0 |

- Worst crossings cluster in 1941 (Cốc vũ −0.376 s, Xuân phân −0.365 s, Lập hạ −0.354 s) and 2003 (Lập xuân +0.343 s).
- The decade maximum is 0.376 s (1940s) and the minimum is 0.176 s (2070s). Per-term breakdowns are in the JSON.
- Civil dates under a common clock: 0 disagreements in UTC, UTC+7 and UTC+8.
- For context, current production Astronomy Engine against the same roots: max 56.29 s, 210 crossings above 30 s.

**Domain invariants:** all 4,824 crossings satisfy residual(T−1) < 0 ≤ residual(T). `erfaSolarTermAtTT` and `erfaSolarTermAtCivil` return OLD at T−1 and NEW at T and T+1. The solver fails closed on unsupported years, invalid terms, an unbracketed root or non-convergence.

**Finding:** ERFA's own range flag ends at 2100-01-01.5 TT (|t| ≤ 100 Julian years), so the 24 crossings of 2100 carry upstream's warning. Their accuracy against JPL is unaffected (2100s max 0.238 s). The flag is exposed (`outsideNominalRange`) and tested.

## 3. Clock / serialization (`clock-v1`)

- Separated from the TT authority.
- Regimes: `PRE1972_MODELED_UT1` (Espenak–Meeus ΔT, labelled modeled), `UTC_LEAP_HISTORY` (IERS Bulletin C 72; TT−TAI = 32.184 s), `PROJECTED_PINNED_TAI_UTC` (from 2027-06-28, when the pinned leap list expires; TAI−UTC = 37 s, labelled projection).
- An instant inside a leap second is rejected.
- Serialization: ceil to integer epoch ms; ISO with exactly 3 fractional digits.
- None of the 4,824 crossings falls inside a leap second.
- The pre-1972 ΔT matches `astronomy-engine.DeltaT_EspenakMeeus` exactly. Civil time is monotone across the 1972 switch.

## 4. Runtime and performance

- Determinism: byte-identical across 11 runtime contexts (digest `80a24dae…e5cc`).
- Bundle: 108 KB minified, 47 KB gzip, 39 KB brotli. No dependencies, no network, CSP-clean, worker- and SSR-safe, deterministic rebuild.
- Timing:
  - One root ≈ 4 ms (Node).
  - One year ≈ 27 ms cold.
  - Full 4,872-root sweep ≈ 4.9 s in Node and 4.0–6.3 s in browsers; 19 s on emulated mid-range mobile with 4× CPU throttle.
- The earlier WebKit offline failure is a Playwright `setOffline` emulation artefact: with a real server shutdown, WebKit serves the page from the service worker and computes identical output. Classified as BROWSER_INFRA_FAILURE.
- Physical Safari/iOS and Android: UNVERIFIED_DEVICE_GATE.

## 5. Migration impact (projection only)

- Every one of the 4,824 boundary instants would move: civil median 13.5 s, max 175.3 s; TT roots alone max 56.0 s.
- Up to 135.8 s after 2027 comes from the clock-policy choice (pinned TAI−UTC vs extrapolated ΔT).
- Day-level changes: exactly 2.
  - 1938 Thu phân: Group A Tứ Ly date and daily term label.
  - 1946 Đại tuyết: daily term label, daily Month Jian and daily Officer.
- Exact-instant Month Jian, Officer and Bazi change inside all 2,412 moved Jie intervals. Group B raw matches flip inside 1,560 of them.
- SEO/prerender: none.

Details: `calendar-erfa-migration-impact-v3.3.md`.

## 6. Mutation testing

The campaign used real in-place source edits, serial full-suite runs (23 tests) and hash-verified restoration, starting from a green baseline.

| ID | Mutant | Status | Killing evidence |
|---|---|---|---|
| M1 | floor instead of ceil | KILLED | residual(T) ≥ 0 fails; T classified OLD |
| M2 | round instead of ceil | KILLED | same invariant, for about half of the crossings |
| M3 | `t > T` in TT classifier | KILLED | `erfaSolarTermAtTT(T)` returns the previous term |
| M3b | `t > T` in civil classifier | KILLED | `erfaSolarTermAtCivil(civil T)` returns the previous term |
| M4 | T + 1 ms | KILLED | residual(T−1) < 0 fails |
| M5 | T − 1 ms | KILLED | residual(T) ≥ 0 fails |
| M6 | no 0°/360° wrap | KILLED | Xuân phân unbracketed (fail-closed error) and the wrap test |
| M7 | adjacent 15° target | KILLED | target check and JPL gate |
| M8 | mean instead of apparent | KILLED | JPL gate (hundreds of seconds) and the upstream-vector fixture |
| M9 | remove nutation | KILLED | JPL gate and upstream-vector fixture |
| M10 | remove aberration | KILLED | JPL gate (about 490 s) and upstream-vector fixture |
| M11 | remove bias-precession | KILLED | JPL gate and upstream-vector fixture |
| M12 | truncate EPV00 to 50 terms per table | KILLED | upstream-vector fixture (1e-13 au) and JPL gate |
| M12b | drop only the smallest term of each table | KILLED | upstream-vector fixture |

M1 and M5 are near-equivalent in an integer-bracket solver: they differ only when the residual is exactly 0. Both were executed and killed independently.

## 7. Regression and integrity

- Starting HEAD = origin/main = `87dd1ba`; the tree was clean.
- Protected hashes: all 1,248 tracked files and 4 external specs are unchanged (see `integrity-final-v3.3.json`). The only tracked-file changes are graphify metadata regenerated per AGENTS.md.
- Unit suite, compared against a pristine HEAD worktree:
  - Baseline: 1,999 tests, 50 failed.
  - Current: 2,022 tests, 50 failed.
  - **0 new failures, 0 status changes**, 23 tests added (the new foundation tests).
  - The 50 failures are the known Group B astronomy-model conflict, classified PRE_EXISTING_EXPECTED_FAILURE: 42 frozen Golden exact-boundary/rounded-minute records and 8 P2 independently reviewed Jie records.
- The full suite is therefore **not** green, and this report does not claim it is.
- typecheck: pass. lint (oxlint): 0 warnings, as in the baseline. build (tsc + vite + PWA): pass.
- format:check fails in both trees with the same pre-existing files; no new file is flagged.
- Firebase emulator integration tests and Playwright e2e were not run in this phase. Production code is unchanged, so they are not affected; reported as NOT_RUN.

## 8. Recommendation: Phase 3B.4.4

1. Obtain explicit approval of `calendar-astronomy-spec-change-v3.3.md`, including the post-2027 clock decision (pinned 37 s vs extrapolated ΔT).
2. Run the physical Safari/iOS and Android device gate: installed-PWA offline launch, timing and memory.
3. Build a new, separately versioned authority Golden from the independent JPL reference and get an independent review. Re-anchor the Group B T−1/T/T+1 records. Keep every old Golden immutable. Never derive expected values from this engine.
4. Migrate `solarTermsForYear` behind a versioned cache key. Keep Astronomy Engine for HourAngle/TST. Revalidate Group A, Group B, Bazi, Officer, almanac and SEO; repeat the full mutation and regression runs; add ERFA and fdlibm to `THIRD_PARTY_NOTICES.md`.
5. Prepare a rollback plan that restores model, clock, cache and Golden versions together.

Reproduce everything: `WORK=<scratch> sh tasks/calendar-audit/erfa-foundation-v3.3/reproduce.sh` (inputs pinned by SHA-256).
