# Bazi migration (v3.4B)

**Result: PASS.** Only the Jie / Lập xuân boundary source changed.

## Migrated (through `solarTermsForYear` → authority table)

- `monthOpeningTerms(year)` equals the authority rows for 1899–2100 (all 12 openings per year).
- At **every Jie 1900–2100**, T − 1 ms / T / T + 1 ms (`shared/bazi/authorityMigration.test.ts`):
  - `termContextAt`: active term, its instant and month offset;
  - the month-pillar branch;
  - for Lập xuân (315°): `pillarYear` flips exactly at T (year − 1 before, year at and after).
- `BAZI_VERSIONS` now declares `solarTermAuthority: astronomy-authority-v4` and `clock: clock-v1`. `astronomy: 2.1.19` now refers to TST only.

## Not modified (proven unchanged)

- The day-pillar convention, hour-pillar convention, Zi policy (splitZi / dayStartsAt23) and HourAngle/TST implementation are untouched. Their files are not in the diff except `types.ts` (version metadata).
- `bazi-pre-migration-snapshot.json`: 300 pre-migration production results, seeded random instants 1900–2100 across 3 locations and both Zi policies. Post-migration production reproduces **TST, equation of time, day pillar, hour pillar, Zi resolution, year and month pillars** exactly.
- Full comparison over 27,120 instants (3,000 random plus old and new Jie ± 2 min / ± 1 ms):
  - 0 changes in TST, EoT, day, hour or Zi;
  - 7,250 month-pillar changes and 599 year-pillar changes, all inside the old-to-new boundary windows (EXPECTED_AUTHORITY_MIGRATION_CHANGE);
  - 0 unexpected.

## Boundary movement (Astronomy Engine → authority)

| Set | Median | p95 | Max | Over 30 s |
|---|---|---|---|---|
| Jie | 13.6 s | 111.8 s | 175.3 s | 610 |
| Lập xuân | 12.5 s | 106.1 s | 175.3 s | 49 / 201 |

Births inside a window now get the authority month or year. This is the intended correction.
