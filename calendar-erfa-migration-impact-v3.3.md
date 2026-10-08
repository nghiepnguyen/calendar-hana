# ERFA migration impact projection v3.3

**PROJECTION ONLY. No production behaviour, data or Golden file was changed.**

This projection answers one question: what would change if the production solar-term source (Astronomy Engine 2.1.19 `SearchSunLongitude`, with Espenak–Meeus ΔT for every year) were replaced by the ERFA foundation (canonical integer-ms TT roots, serialized by clock-v1)?

Data:

- `calendar-erfa-migration-impact-v3.3.json` (summary, all day-level cases, per-decade figures)
- `tasks/calendar-audit/erfa-foundation-v3.3/impact/migration-impact-rows-v3.3.tsv` (all 4,824 crossings)

## Method

Production modules are evaluated **unmodified**, twice, in Vitest:

1. **Baseline**: as shipped.
2. **ERFA**: `vi.mock('astronomy-engine')` replaces only `SearchSunLongitude` with ERFA roots. HourAngle/TST and every other export stay real. A sanity check confirms that the mocked production `solarTermsForYear` emitted exactly the ERFA clock-v1 instants for all 4,824 crossings.

Probes:

- 24,118 instants: T−1, T, the midpoint, upper−1 and upper of every moved interval.
- 14,474 Vietnamese civil days: the old and new crossing dates, ±1 day.

Consumers evaluated:

- `getSolarTermAt`, `getSolarMonth`
- `getOfficerAtInstant` (exact) and `getOfficer` (daily)
- `evaluateGroupAAtInstant`, `evaluateGroupBAtInstant`
- Bazi `termContextAt` and `calculatePillars` (year/month)
- `getSolarTerm` (daily label and start-time display)
- `getAlmanac` (daily aggregation, timestamp separated from semantics)
- `getDaySeo` (prerender/SEO model)

## Headline numbers (1900–2100, 4,824 crossings)

| Quantity | Median | p95 | Max | > 30 s |
|---|---|---|---|---|
| Civil instant shift (what users would see) | 13.5 s | 110.6 s | 175.3 s | 1,230 |
| TT-root shift alone (astronomy) | 9.8 s | 29.3 s | 56.0 s | 211 |

Why the civil shift exceeds the root shift, by clock regime:

| clock-v1 regime | Crossings | Max civil shift | Max root shift | Max clock contribution |
|---|---|---|---|---|
| PRE1972_MODELED_UT1 | 1,728 | 51.3 s | 51.3 s | 0.001 s (same ΔT model; ceil vs truncation only) |
| UTC_LEAP_HISTORY (1972–2027-06) | 1,332 | 55.7 s | 56.0 s | 6.8 s (leap seconds vs ΔT polynomial) |
| PROJECTED_PINNED_TAI_UTC (2027+) | 1,764 | 175.3 s | 52.7 s | 135.8 s (pinned TAI−UTC = 37 s vs extrapolated ΔT) |

Up to 135.8 s of future displayed time is a **clock-policy choice**, not an astronomy correction. It needs explicit approval (see the SPEC_CHANGE §4).

## Classification

| Label | Crossings | Meaning |
|---|---|---|
| EXACT_INTERVAL_CHANGE | 4,824 | every boundary instant moves; exact-instant answers differ inside [old, new) |
| ROOT_TIME_ONLY | 2,444 | moved, but no day-level output and no displayed HH:mm changes |
| DISPLAY_TIMESTAMP_CHANGE | 4,824 | `startsAtUtc` string changes |
| DISPLAY_MINUTE_CHANGE | 2,380 | the Vietnamese HH:mm of the term start changes |
| DISPLAY_ONLY | 2,378 | only the displayed minute changes at day level |
| MONTH_JIAN_CHANGE | 2,412 | all Jie: exact-instant Month Jian differs inside the moved interval; daily level in 1 case |
| OFFICER_CHANGE | 2,412 | all Jie: exact-instant 12 Officer differs inside the interval; daily Officer in 1 case |
| BAZI_CHANGE | 2,412 | all Jie: month (and, at Lập xuân, year) pillar differs for births inside the interval |
| GROUP_B_CHANGE | 1,560 | Jie crossings where a Group B raw match flips inside the interval |
| GROUP_A_CHANGE | 1 | 1938 Thu phân |
| CIVIL_DATE_CHANGE | 2 | 1938 Thu phân, 1946 Đại tuyết |
| ALMANAC_DAILY_CHANGE | 2 | the same two days |
| SEO_CHANGE | 0 | no prerendered or SEO text changes; the 2025–2027 prerender window is unaffected |
| UNKNOWN | 0 | — |

Interpretation: each Jie crossing opens a new Month Jian. That is why the exact-instant Month, Officer and Bazi labels change for every Jie inside its moved interval. The total moved interval is 130,790 s over 201 years.

## The two day-level changes

| Crossing | Production (UTC) | ERFA clock-v1 (UTC) | Vietnamese date | Effect |
|---|---|---|---|---|
| 1938 Thu phân (180°) | 1938-09-23T17:00:01.461Z | 1938-09-23T16:59:27.120Z | 24 Sep → **23 Sep** | Group A Tứ Ly (day before the equinox) moves from 23 Sep to 22 Sep. Daily term label and almanac change. |
| 1946 Đại tuyết (255°) | 1946-12-07T16:59:57.701Z | 1946-12-07T17:00:10.986Z | 7 Dec → **8 Dec** | Daily term label, daily Month Jian and daily 12 Officer for 7 Dec 1946 change. Almanac changes. |

Both match the 3B.4.2A prediction exactly. Both crossings lie within 35 s of Vietnamese midnight. JPL places them on the same side as ERFA (0 civil-date disagreements between ERFA and JPL under the same clock).

## Consumers by area

- **getSolarTermAt / getSolarMonth:** shifted boundary instants only.
- **Exact-instant 12 Officer:** changes inside the interval for every Jie.
- **Daily 12 Officer:** 1 day (7 Dec 1946).
- **Group A:** 1 day (Tứ Ly 1938).
- **Group B:** instant-level changes inside 1,560 Jie intervals. The frozen Group B Golden (anchored on the old roots at T−1/T/T+1) will need a new, separately versioned authority Golden. The existing 606-record Golden stays immutable.
- **Bazi month pillar / giao tiết:** month pillar changes for instants inside each Jie interval. The year pillar changes inside Lập xuân intervals. TST, day and hour pillars are unaffected.
- **Solar-term display:** HH:mm changes in 2,380 cases. Most are small before 2027 (median 13.5 s overall). Shifts reach minutes after 2027 because of clock-v1.
- **Almanac daily aggregation:** 2 days.
- **SEO/prerender:** none.
- **Lunar conversion:** out of scope; it uses its own sun-longitude routine.

## Not done here (by design)

Production code was not modified, and nothing downstream was migrated or fixed. No Golden was regenerated. These belong to Phase 3B.4.4 after SPEC_CHANGE approval.
