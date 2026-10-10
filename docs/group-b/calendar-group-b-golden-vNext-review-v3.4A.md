# Independent review of Group B Golden vNext v3.4A

**Result: PASS.** All 611 fixtures were independently re-derived with **0 findings**. Reviewer: `review/review_groupb.mjs`, in Node — a different language and different code from the Python generator. Report: `reviews/review-groupb.json`, pinned in `golden-v4/manifest.json`.

## Independence

- The reviewer imports nothing from `shared/` or `src/`. It does not use the production Group B evaluator, `getSolarMonth`, `getSolarTermAt`, ERFA or Astronomy Engine.
- **Month Jian** comes from the *reviewer's own* canonical T (the integer bisection in `review_authority.py`), not the generator's values.
- **Civil time** comes from the reviewer's own clock-v1 implementation. It is bit-identical to the generator's for all 4,872 rows.
- **Day stem/branch** comes from its own Gregorian arithmetic, anchored on the HKO oracle.
- **Static guard:** the generator sources must not reference production Group B, solar-term, ERFA or Astronomy Engine code, golden-v3 or the old exact-Jie evidence.

## Source table: all 60 cells re-derived

Each cell is derived from the classical definitions, then compared with the extraction JSON:

| Rule | Definition used by the reviewer |
|---|---|
| 月破 month-breaker | branch opposite the month's 建 |
| 劫煞 robbery-sha | 絕 of the month's triad (three branches before 長生) |
| 災煞 disaster-sha | branch opposite the triad's 帝旺 |
| 月煞 month-sha | three branches after the triad's 墓 |
| 月德 month-virtue (DAY_STEM) | yang stem of the triad element (丙 / 甲 / 壬 / 庚) |

Results:

- **60/60** cells agree with `calendar-rule-extraction-v3.json`, including the operand type.
- **606/606** Month Jian → target pairs recorded by the old reviewed Golden agree. This is corroboration only, not a source of values.
- SOURCE_TABLE_ERROR: 0.

## Per-fixture checks (611)

- Context (monthJian, dayStem, dayBranch, civilDate), derivation (rule, operand type, observed operand, target) and the expected boolean all equal the reviewer's own derivation.
- `instant` is ISO with exactly 3 fractional digits and equals `civilEpochMs`. The provenance `activeJie` equals the reviewer's Jie.
- **Exact boundary:** each sample sits exactly at the reviewer's T − 1 ms, T or T + 1 ms. All 12 Jie types are covered for every rule.
- **Timezone-equivalent:** same instant as the group's `at` record, written with a different offset.
- **Timezone civil-date trap:** the UTC+8 date gives a different match than UTC+7, so the fixture discriminates.
- **Rounded-minute discriminators:** the reviewer recomputes the nearest-minute and truncated-minute boundaries and confirms that each would give the wrong Month Jian. At least one fixture per rule also kills truncation.
- **Coverage:** 12/12 Month Jian for both interior positives and negatives; years 1900, 2014, 2015, 2023, 2024, 2025 and 2100.

## Discrepancy classes

REFERENCE_ROOT_ERROR 0, SERIALIZATION_ERROR 0, GOLDEN_GENERATOR_ERROR 0, REVIEWER_ERROR 0, SOURCE_TABLE_ERROR 0, FIXTURE_DESIGN_ERROR 0, UNKNOWN 0.

## Mutation evidence (Golden tooling)

Each mutant ran the real pipeline: a mutated generator copy, full generation, then the unmodified reviewers. The unmutated baseline passed first.

| ID | Mutant | Outcome | Caught by |
|---|---|---|---|
| G1 | floor instead of ceil | KILLED | authority review: T not ceil(root) / bisection mismatch |
| G2 | round instead of ceil | KILLED | authority review |
| G3 | `>` instead of `>=` | KILLED | Group B review: expectation differs at the `at` samples |
| G4 | T + 1 ms | KILLED | authority review |
| G5 | T − 1 ms | KILLED | authority review |
| G6 | adjacent Jie target | KILLED | authority review: order and monotonicity broken |
| G7 | nearest-minute rounding | KILLED | Group B review |
| G8 | wrong Month Jian after crossing | KILLED | Group B review |
| G9 | one wrong table cell (月煞 辰 → 戌) | KILLED | Group B review: SOURCE_TABLE_ERROR |
| G10 | production engine used as oracle | KILLED | static guard |
| G10b | same, evading the static guard | KILLED | dynamic: provenance and expectations differ |
| G11 | old Golden T reused | KILLED | static guard |
| G11b | same, evading the static guard | KILLED | dynamic: boundary samples and provenance differ |
| G12 | clock policy label clock-v2 | KILLED_BY_GENERATOR_ABORT | the generator's own policy assertion |
| G12c | G12 with that assertion removed | KILLED | authority review: clock metadata |
| G12b | TAI−UTC 36 s while labelled clock-v1 | KILLED | Group B review: SERIALIZATION_ERROR |

Totals: 15 KILLED by review, 1 KILLED_BY_GENERATOR_ABORT, 0 SURVIVED. Full evidence: `mutation/mutation-results.json`.
