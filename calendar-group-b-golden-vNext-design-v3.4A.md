# Group B Golden vNext design v3.4A (`golden-v4/group-b`)

**Status: REVIEWED_FROZEN.** There are 611 fixtures across 5 rules. Expected values are derived only from the JPL authority (golden-v4 astronomy) and the frozen source rule tables (`calendar-rule-extraction-v3.json`). The audit generator `generator/groupb_generator.py` imports no production code. `golden-v3` is untouched.

## Fixed conventions (unchanged from the reviewed v3.1 decisions)

- Rules: month-breaker 月破, robbery-sha 劫煞, disaster-sha 災煞, month-sha 月煞, month-virtue 月德. **Heaven Virtue 天德 stays EXCLUDED** (DAY semantics unresolved).
- Month Jian: `[Jie_n, Jie_n+1)` with exact canonical T, where `t ≥ T` is the new Jian. There is no epsilon.
- Day operand: Asia/Ho_Chi_Minh, UTC+7, civil 00:00 boundary. There is no 23:00 turnover. The cycle index is anchored on the reviewed HKO oracle (2014-02-05 = 丁未, index 43).
- Source rule cells: the 60 cells (12 Month Jian × 5 rules) are not re-extracted. They are independently re-derived by the reviewer (see the review report).

## Fixture classes (per rule)

The design was rebuilt from the test design. It does not patch the old failing records.

| Class | v4 per rule | v3 per rule | Construction |
|---|---|---|---|
| interior-positive | 26 | 26 | Noon UTC+7 on the first interior day (≥ 1 civil day from both boundaries) whose operand matches. Covers all 12 Jian in the 2024 and 2014 cycles, plus range-edge cases in 1900 (PRE1972 clock regime) and 2100 (projected regime). |
| interior-negative | 26 | 26 | Same, with a non-matching operand. |
| exact-boundary | 63 | 63 | The 21 reviewed representative transitions, re-anchored at **T − 1 ms, T, T + 1 ms** of the new canonical JPL T. v3 used T_old ± 60 s. They cover all 12 Jie types and the years 2014, 2023, 2024 and 2025. `effectiveCutoffKiller` is recomputed. |
| timezone-equivalent | 3 | 3 | The new T of Thanh minh 2024 (jie-2024-015) written as +08:00, Z and +09:00. Same instant as the `at` record. |
| timezone-civil-date | 1 | 1 | 23:30 UTC+7 in the Tiểu hàn 2024 month, where UTC+8 is already the next civil day. The rule matches at UTC+7 and not on the UTC+8 date. |
| lunar-leap-regression | 1 | 1 | 2023-04-10 noon, inside the leap 2nd lunar month (HKO). Lunar data is not an operand. |
| rounded-minute-discriminator | **2** | 1 | Recomputed from the new T. (a) jie-2014-315 (T at :16.676): an instant between the published minute and T. Expected OLD; nearest-minute and truncated-minute implementations say NEW. (b) jie-2014-015 (T at :39.793): an instant between T and the next minute. Expected NEW; nearest-minute rounding says OLD. |
| alias-identity (month-sha only) | 1 | 1 | Labels 月煞 / 月殺 / 月虚 map to the single canonical `month-sha` id, with a match count of 1. |
| **Total** | 122 (month-sha 123) | 121 (122) | 611 vs 606 |

Coverage has only increased: one more discriminator per rule, interior cases at both range edges, and 1 ms boundary samples instead of 60 s.

## Per-fixture provenance

Each fixture records:

- `instant` (ISO, 3 fractional digits) and `civilEpochMs`
- `context` (monthJian, dayStem, dayBranch, civilDate)
- `expected`
- `derivation`: rule id, operand type, observed operand, target, source row, extraction JSON pointer
- `provenance.activeJie`: year, longitude, canonical TT ms, civil ms, clock regime
- `provenance.dayCycleIndex` and the oracle

Boundary fixtures also carry `transitionId`, `sample`, `offsetMs`, `canonicalTtMs`, `rootTtMs` and `canonicalCivilEpochMs`.

## File metadata

`goldenVersion`, `reviewStatus`, `authorityVersion`, `authorityDataset`, `authorityDatasetSha256` (the reviewed candidate), `referenceEngine`, `referenceKernelSha256`, `observable`, `frame`, `timeScale`, `numericalBoundaryPolicy`, `clockPolicy`, `serializationPolicy`, `monthJianConvention`, `dayBoundary`, `excludedRules`, `generatorVersion`, `productionUsed = false`.

## Not done (by design)

The vNext Golden is not wired into the production test suite. The production Group B evaluator still uses Astronomy Engine, and testing it against golden-v4 belongs to Phase 3B.4.4B.
