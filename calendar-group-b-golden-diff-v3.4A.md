# Group B Golden: golden-v3 → golden-v4 semantic diff (v3.4A)

The differences below are **not bugs** in either Golden. golden-v3 is the correct Golden for its authority (Swiss Ephemeris compressed DE441 via pyswisseph 2.10.3.2, leap-second-aware UTC, samples at T_old ± 60 s). golden-v4 is the correct Golden for the new authority (JPL DE440s via Skyfield, canonical ceil-ms T, clock-v1, samples at T_new ± 1 ms). golden-v3 is unchanged byte-for-byte.

Data: `tasks/calendar-audit/astronomy-authority-v3.4A/analysis/golden-diff.json`.

## 1. The 21 representative transitions: old T vs new T

| Transition | Old (Swiss DE441) UTC | New (JPL DE440s) UTC | Civil Δ (ms) | Root Δ TT (ms) | Clock Δ (ms) |
|---|---|---|---|---|---|
| Lập xuân 2014 | 22:03:16.684536 | 22:03:16.676 | −8.5 | −9.3 | −0.015 |
| Kinh trập 2014 | 16:02:15.805446 | 16:02:15.813 | +7.6 | +7.6 | −0.015 |
| Thanh minh 2014 | 20:46:39.787483 | 20:46:39.793 | +5.5 | +4.9 | −0.016 |
| Lập hạ 2014 | 13:59:26.221400 | 13:59:26.251 | +29.6 | +29.4 | −0.016 |
| Kinh trập 2023 | 20:36:14.214332 | 20:36:14.224 | +9.7 | +8.9 | +0.014 |
| Thanh minh 2023 | 01:13:03.657937 | 01:13:03.657 | −0.9 | −1.5 | +0.014 |
| Lập hạ 2023 | 18:18:45.556920 | 18:18:45.549 | −7.9 | −8.7 | +0.015 |
| Tiểu hàn 2024 | 20:49:22.512852 | 20:49:22.540 | +27.1 | +26.5 | +0.014 |
| Lập xuân 2024 | 08:27:07.611503 | 08:27:07.593 | −18.5 | −19.0 | +0.014 |
| Kinh trập 2024 | 02:22:46.184919 | 02:22:46.137 | −47.9 | −48.5 | +0.014 |
| Thanh minh 2024 | 07:02:17.672062 | 07:02:17.697 | +24.9 | +24.8 | +0.014 |
| Lập hạ 2024 | 00:10:05.052803 | 00:10:05.059 | +6.2 | +6.0 | +0.015 |
| Mang chủng 2024 | 04:09:53.688941 | 04:09:53.672 | −16.9 | −17.3 | +0.014 |
| Tiểu thử 2024 | 14:20:03.398193 | 14:20:03.408 | +9.8 | +9.0 | +0.015 |
| Lập thu 2024 | 00:09:16.449044 | 00:09:16.455 | +6.0 | +5.2 | +0.014 |
| Bạch lộ 2024 | 03:11:20.866192 | 03:11:20.837 | −29.2 | −30.0 | +0.015 |
| Hàn lộ 2024 | 18:59:57.335789 | 18:59:57.339 | +3.2 | +3.2 | +0.014 |
| Lập đông 2024 | 22:20:04.521878 | 22:20:04.552 | +30.1 | +30.0 | +0.014 |
| Đại tuyết 2024 | 15:17:02.605598 | 15:17:02.637 | +31.4 | +31.2 | +0.014 |
| Tiểu hàn 2025 | 02:32:46.338815 | 02:32:46.355 | +16.2 | +15.4 | +0.014 |
| Tiểu thử 2025 | 20:04:59.099337 | 20:04:59.098 | −1.3 | −2.3 | +0.014 |

- The authorities differ by **up to 48 ms**. Each row's civil Δ is within 1 ms of its root Δ (the remainder is canonical ceil-ms rounding).
- The clock contributes ≤ 0.016 ms: microsecond-to-millisecond representation only. Both authorities apply identical leap-second UTC in 2014–2025.
- Old T is a microsecond float. New T is the canonical ceil-ms boundary.

## 2. Old fixtures re-evaluated under the new authority

Using the audit evaluator (JPL authority Month Jian + day operand + rule table):

| | Count |
|---|---|
| Old fixtures still semantically valid | **529 / 606** |
| Invalid: exact-boundary `at` samples placed at T_old where T_new > T_old | 65 (13 transitions × 5 rules) |
| Invalid: timezone-equivalent records anchored on T_old where T_new > T_old | 12 |
| Interior, civil-date, leap, discriminator, alias, ±60 s `before`/`after` samples | all still valid |

## 3. Classification of changes (old → new)

Boundary records paired by design (rule, transition, sample): 315 pairs.

| Label | Count | Meaning |
|---|---|---|
| AUTHORITY_ROOT_CHANGE | 315 | T moved (Swiss DE441 → JPL DE440s) by 0.9–48 ms |
| CANONICAL_MS_REANCHOR | 315 | samples moved from ±60 s to ±1 ms around ceil-ms T |
| CLOCK_POLICY_CHANGE | 0 | clock effect < 1 ms (representation only) |
| EXPECTED_MONTH_JIAN_CHANGE | 0 | each pair keeps its OLD/NEW role |
| EXPECTED_GROUP_B_CHANGE | 0 | booleans per paired sample are unchanged |
| FIXTURE_REDESIGN | interior 260, timezone-equivalent 15, civil-date 5, leap 5, discriminator 5 → 10, alias 1 | rebuilt from the design (new interior days, new anchors, extra discriminator) |
| UNCHANGED (byte-identical fixture) | 0 | every v4 record is newly constructed |
| UNKNOWN | 0 | |

Summary counts:

- **Retained semantically:** 529 old fixtures stay true under the new authority. All 315 boundary pairs keep their OLD/NEW meaning.
- **Re-anchored:** 315 exact-boundary, 15 timezone-equivalent and 10 rounded-minute records.
- **Expected-context change on paired records:** 0. Under the *old instants*, 77 records change context, all because of the root move.
- **Expected-boolean change on paired records:** 0.
- **Timestamp representation only:** the clock and serialization contribution is < 0.02 ms for every transition.
- **Affected by clock policy:** 0. clock-v1 equals the old leap-second UTC for 2014–2025.

## 4. Why an exact-boundary Golden cannot move between authorities

The domain rule is exact: T − 1 ms is OLD and T is NEW. A Golden written against authority X places a record *at* T_X. Under another authority Y, whose root is a few milliseconds later, that instant is still OLD. The record must then fail, even though both authorities are accurate to well under a second.

Here, 13 of the 21 transitions have T_new > T_old, by 3–31 ms, so 65 old `at` records and 12 timezone-equivalent records are false under the new authority. This is the same mechanism behind the 50 historical production failures: Astronomy Engine is up to 56 s away. It also explains why ERFA cannot pass golden-v4 at exact T (see `calendar-erfa-vs-authority-v3.4A.json`).

An exact-boundary Golden is therefore valid only for **one** numerical authority and serialization. Changing authority requires a new Golden version, never edits to the old one.
