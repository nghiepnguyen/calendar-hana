# Group B migration (v3.4B)

**Result: PASS. golden-v4 611 / 611; golden-v3 fully classified; 0 unexplained.**

## Current Golden: golden-v4 (blocking)

- **611 / 611 PASS** against the production `evaluateGroupBAtInstant` (`shared/lunar/groupB.test.ts`, "Current Group B Golden").
- The fixtures were not regenerated or edited. The manifest pins of all six golden-v4 files are verified in the test.
- By class:

  | Class | Fixtures |
  |---|---|
  | exact-boundary (T − 1 / T / T + 1 ms, 21 transitions × 5 rules) | 315 |
  | interior-positive | 130 |
  | interior-negative | 130 |
  | timezone-equivalent | 15 |
  | rounded-minute-discriminator | 10 |
  | timezone-civil-date | 5 |
  | lunar-leap-regression | 5 |
  | alias-identity | 1 |

- No fixture failed, so no PRODUCTION_* / CLOCK_BUG / AUTHORITY_DATA_LOAD_BUG / GOLDEN_DEFECT_CANDIDATE classification was needed.

## Historical Golden: golden-v3 (HISTORICAL_AUTHORITY_REGRESSION)

golden-v3 is byte-identical: all 11 protected hashes in `group-b-freeze-hashes.json` are verified. Every v3 record is still evaluated; none is skipped. Each record must either:

- reproduce its v3 expectation exactly (**529**), or
- match its entry in `calendar-golden-v3-historical-diff-v3.4B.json` (**77**, all EXPECTED_AUTHORITY_MIGRATION_CHANGE): Month Jian, target and boolean as recomputed under the v4 authority.

Anything else fails as UNEXPECTED_REGRESSION.

The expected-difference set was **recomputed**, not assumed (`tools/historical-diff.mjs`). The inputs are frozen data only:
- golden-v3 fixtures;
- JPL authority rows (clock-v1 civil ms);
- the v3 rule-extraction lookup.

No production code is involved. A record is EXPECTED only if all three hold:
1. its instant lies 0 < d ≤ 1,000 ms before the v4 Jie that opens its v3 month;
2. the v4 values follow from the source table;
3. the 3B.4.4A audit diff independently records the same v4 values.

Result:

| Check | Value |
|---|---|
| Fixture differences | 77 = 65 exact-boundary `at` samples (13 transitions × 5 rules) + 12 timezone-equivalent |
| Set equal to the 3B.4.4A audit's 77 invalid cases | yes |
| Unexpected | 0 |
| Production failures before restructuring the suite | exactly these 77 IDs (set-equal, checked) |

The v3.1 exact-Jie evidence check (P2) samples the Swiss DE441 instants at T_old − 60 s, T_old and T_old + 60 s:
- All ±60 s samples are unchanged.
- **13** `at` samples are EXPECTED_AUTHORITY_MIGRATION_CHANGE, because T_JPL is 3–31 ms later than T_old. These are manifest-pinned.

## Baseline resolution

The pre-migration baseline had 50 failures: 42 golden-v3 records and 8 P2 checks. Each was caused by Astronomy Engine roots being up to 56 s away from the reviewed authority. After migration:
- **0 failures**;
- the current-authority Golden is green;
- historical differences are reported and classified, not silenced.

## Source rules unchanged

- The five tables are unchanged: month-breaker, robbery-sha, disaster-sha, month-sha, month-virtue.
- A new test verifies all **60 cells** against `calendar-rule-extraction-v3.json` and against `evaluateGroupBContext`.
- Heaven Virtue remains EXCLUDED: `normalizeGroupBRuleId('heaven-virtue')` returns undefined.

## Mutation (green baseline)

All 33 executed variants are KILLED (`calendar-mutation-results-v3.4B.json`):

| Mutant | Change | Failing assertions |
|---|---|---|
| M3 | strict > | 129 |
| M10 | minute rounding | 241 |
| M11 | wrong Month Jian | 1,242 |
| M4 | wrong table row | 1,220 |
| M12 | wrong table cell | 35 |
| M7 | alias duplication | 614 |
| M9 | HK civil date | 45 |
| M9b | UTC civil date | 259 |

The rest: M1 lunar month 502; M2 midnight switch 318; M5a–d robbery variants 246 each; M6 forward Tai Sát 122; M8 Month Virtue uses branch 160.
