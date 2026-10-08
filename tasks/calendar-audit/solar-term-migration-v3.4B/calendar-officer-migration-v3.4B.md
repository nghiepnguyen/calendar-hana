# 12 Officer migration (v3.4B)

**Result: PASS.**

## Exact-instant Officer (`getOfficerAtInstant`)

- The Month Jian comes from the canonical table (`getSolarMonth` → `getCanonicalSolarTermAt`).
- For **every Jie 1900–2100 (2,412)** the test samples T − 1 ms, T and T + 1 ms (7,236 samples). It compares against an oracle built directly from the frozen rows:
  - Month Jian: branch of the last Jie with civil T ≤ t;
  - day branch: independent JDN of the UTC+7 date.
- Month Jian advances by exactly one at T and never changes at a Qi. This is tested for all 4,870 interior crossings at the authority level.
- Pre/post comparison: 7,094 exact-instant Officer changes across 14,472 samples. All lie inside the old-to-new boundary windows (EXPECTED_AUTHORITY_MIGRATION_CHANGE); 0 unexpected.

## Daily Officer (`getOfficer`, the whole crossing day uses the new month)

- Checked against the same oracle for **every civil day 1900–2100 (73,414)**.
- Pre/post comparison: exactly **1** changed day, 0 unexpected.

| Date | Cause | Pre-migration | After |
|---|---|---|---|
| 1946-12-07 | Đại tuyết moves from 1946-12-07T16:59:57.701Z (VN 12-07) to 1946-12-07T17:00:11.131Z (VN 12-08) | month Tý | month **Hợi** (Officer index (chi − 11) mod 12) |

The 1946 case is verified from the authority row and the impact record. It is not hard-coded in production. The daily solar-term label moves with it: 1946-12-08 is now the Đại tuyết start day.
