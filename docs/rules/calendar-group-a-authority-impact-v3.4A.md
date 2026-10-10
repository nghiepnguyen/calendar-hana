# Group A impact of the new astronomy authority v3.4A (projection only)

No Group A code, rule table or old Golden was changed. The comparison is between the current production solar-term instants (Astronomy Engine 2.1.19, as shipped) and the frozen JPL authority (golden-v4, clock-v1), over 1900–2100, using the Vietnamese civil date (UTC+7).

Data: `tasks/calendar-audit/astronomy-authority-v3.4A/analysis/impact.json`.

| Rule | Solar-term dependency | Projected changes 1900–2100 | Classification |
|---|---|---|---|
| **Tứ Ly** 四離 | the civil day before Xuân phân, Hạ chí, Thu phân and Đông chí (0°/90°/180°/270°) | **1** | EXPECTED_AUTHORITY_MIGRATION_CHANGE |
| **Tứ Tuyệt** 四絕 | the civil day before Lập xuân, Lập hạ, Lập thu and Lập đông (315°/45°/135°/225°) | 0 | NO_CHANGE |
| **Nguyệt Kỵ** 月忌 | lunar days 5, 14 and 23 only; no solar-term input | 0 | NO_CHANGE |

## The one change

| Crossing | Production (UTC) | Authority (UTC) | VN civil date of crossing | Tứ Ly day |
|---|---|---|---|---|
| Thu phân 1938 | 1938-09-23T17:00:01.461Z | 1938-09-23T16:59:27.175Z | 24 Sep → **23 Sep** | **23 Sep → 22 Sep 1938** |

- The authority crossing falls 32.8 s before Vietnamese midnight; the production crossing falls 1.5 s after it. Astronomy Engine's root is 34 s late here.
- The ERFA candidate and JPL agree on the civil date: 0 civil-date mismatches.
- 1938 uses the `PRE1972_MODELED_UT1` regime, so the civil date depends on the modeled ΔT. Both pipelines use the same Espenak–Meeus ΔT, so the difference is purely astronomical.

This matches the 3B.4.2A and 3B.4.3 projections.

## For Phase 3B.4.4B

- Group A needs a new authority Golden entry for Tứ Ly 1938, as a new version. The old Group A frozen evidence stays as historical evidence.
- Nguyệt Kỵ and Tứ Tuyệt need no change.
