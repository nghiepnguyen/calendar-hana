# Group A migration (v3.4B)

**Result: PASS. 1 reviewed date change (1938 Tứ Ly); 0 unexplained.**

The source rules were not re-extracted. The v3 extraction is unchanged:
- Tứ Ly / Tứ Tuyệt: the Vietnamese civil day (UTC+7) before the day of the seasonal crossing.
- Nguyệt Kỵ: lunar days 5, 14 and 23.

The frozen golden-v3 Group A files (`yue-ji`, `four-separations`, `four-extinctions`) are byte-identical and still pass. They contain no record that the authority change affects.

## New versioned evidence

`group-a-authority-v4-evidence.json`:
- Derived from the frozen golden-v4 authority rows only. It is migration evidence, not a new reviewed Golden.
- Lists all 804 Tứ Ly dates and 804 Tứ Tuyệt dates for 1900–2100.
- Includes the migration change set.
- Production is checked against it for **every civil day 1900–2100** (`shared/lunar/authorityMigration.test.ts`).

## Changes vs pre-migration production

| Rule | Term | Pre-migration crossing | Authority crossing | Matched day before → after | Class |
|---|---|---|---|---|---|
| Tứ Ly (四離) | Thu phân 1938 (180°) | 1938-09-23T17:00:01.461Z (VN 09-24) | 1938-09-23T16:59:27.175Z (VN 09-23) | 1938-09-23 → **1938-09-22** | EXPECTED_AUTHORITY_MIGRATION_CHANGE |

- Tứ Tuyệt: no change.
- Nguyệt Kỵ: no solar-term input, so NO_CHANGE.

The full pre/post comparison of production over 73,414 days (`production-impact-v3.4B.json`) shows exactly 2 Tứ Ly day flips (09-22 on, 09-23 off) and 0 unexpected changes.

The explicit test checks Tứ Ly on 1938-09-21, 09-22 and 09-23 → false, true, false. No date is hard-coded in production; the change comes from the authority T alone.
