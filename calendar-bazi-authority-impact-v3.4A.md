# Bazi impact of the new astronomy authority v3.4A (projection only)

No Bazi code was changed. The day pillar, hour pillar, Zi-hour convention and the Astronomy Engine HourAngle/TST subsystem stay as they are. The comparison is between the current production Jie instants (Astronomy Engine 2.1.19) and the frozen JPL authority under clock-v1, for the 2,412 Jie of 1900–2100.

Data: `tasks/calendar-audit/astronomy-authority-v3.4A/analysis/impact.json`.

| Item | Projection | Classification |
|---|---|---|
| Jie-based month pillar boundaries | All 2,412 move: median 13.6 s, p95 111.7 s, max 175.3 s. 610 move by more than 30 s. Births inside a moved interval change month pillar. Total moved time is 65,385 s over 201 years. | EXPECTED_AUTHORITY_MIGRATION_CHANGE |
| Lập xuân (year pillar) | All 201 move: max 175.3 s, 49 by more than 30 s. Births inside these intervals change year and month pillar. | EXPECTED_AUTHORITY_MIGRATION_CHANGE |
| Exact giao tiết context (`termContextAt`) | Active term, month offset and pillar year change only inside the moved intervals. | EXPECTED_AUTHORITY_MIGRATION_CHANGE |
| VN civil date of a Jie | 1 change: **Đại tuyết 1946**, 07 Dec → 08 Dec in VN civil date (production 1946-12-07T16:59:57.701Z, authority 17:00:11.131Z) | EXPECTED_AUTHORITY_MIGRATION_CHANGE |
| Serialized time shown to users (VN HH:mm) | 885 of 2,412 Jie show a different minute | DISPLAY change |
| Day pillar, hour pillar, Zi policy, TST | none | NO_CHANGE |

## Where the movement comes from

| Component | Effect |
|---|---|
| Astronomy: Astronomy Engine vs JPL TT root | up to 56.3 s; 210 crossings above 30 s (all 24 terms) |
| Clock: production extrapolates Espenak–Meeus ΔT for every year; clock-v1 uses leap seconds and then pins TAI − UTC | 0 before 1972; ≤ 6.8 s for 1972–2027; up to about 136 s by 2100 |

The post-2027 part, which reaches minutes, is the clock-policy decision. It is not a correction of astronomy. Both parts are visible to users of the Bazi giao-tiết time display.

## Relation to the ≤ 30 s Bazi target

- Against the JPL authority, the current production root misses the PRD giao-tiết ≤ 30 s target for 210 terms.
- The ERFA candidate meets the much stricter 0.5 s gate: max 0.376 s.
- The TST ≤ 30 s requirement is a separate target and is unaffected.

## For Phase 3B.4.4B

- Revalidate the Bazi month and year pillars at each moved boundary against golden-v4 T − 1 ms / T / T + 1 ms. The authority should feed Bazi through the same shared boundary source chosen in the runtime-architecture decision.
- Version the Bazi cache keys by authority and clock.
- Show the clock regime when displaying projected (2027+) or pre-1972 modeled times.
