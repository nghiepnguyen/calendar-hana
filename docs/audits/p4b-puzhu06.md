# P4-B follow-up — 鋪註 puzhu:06 (audit-only)

Date: 2026-10-16. Branch `claude/p4b-puzhu06`, cut from `origin/main` `1c4bb32`. PRD: [prd-p4b-puzhu06](../../tasks/prd-p4b-puzhu06.md). Tasks: [tasks-p4b-puzhu06](../../tasks/tasks-p4b-puzhu06.md).

> 凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌 (卷十 offset 21817)

This rule came out of P5 finding F1. puzhu:06 was not modeled anywhere in P4. It is now modeled as an opt-in, audit-only layer `resolveP4Puzhu06Day` (`shared/lunar/p4Puzhu06.ts`) over the P4-C day. No runtime, scoring, manifest or flag change.

## Owner decisions (2026-10-16, `OWNER_ADOPTED`, not canonical)

| Q | Question ("yes" = puzhu:06 lifts) | Answer |
|---|---|---|
| Q1 | 如常例 when the 等第 grade is 從忌不從宜 | no |
| Q2 | 「與德…併如常例」 (not 遇德猶忌) | no |
| Q3 | 如常例 without a 等第 column (月破 without 德) | no |
| Q4 | remaining-ji with its own 「與…併則不忌」 list (九空 五虛 小耗 五離 五墓) | yes |
| Q4a | 五墓 「不取德合者不同行也」 blocks the 德合 triggers | block |

In practice puzhu:06 lifts 忌 only when it comes from a Q4 god whose own lift list does not cover the puzhu:06 trigger present on the day.

## Evidence chain

| Step | Artifact | Commit |
|---|---|---|
| Baseline 1.0 | `sources/p4-vol10/p4b-puzhu06-baseline-v1/` (5,475 + 3,600 rows, raw 忌 sources) | `6f970cd` |
| Authority v1 | `p4b-puzhu06-v1.json`, 23 spans | `718e195` |
| Golden v1 freeze | `golden-p4b-puzhu06-v1` (95 fixtures) + proof | `4a7da71`, `00efc32` |
| Authority v2 (Q4a) | `p4b-puzhu06-v2.json`, `liftExclusions` 五墓 | `c3aedf6` |
| Golden v2 freeze | 102 fixtures + proof | `67af7c0`, `1ca34de` |
| Red tests | `p4Puzhu06.test.ts`, red 3/4 on a stub | `43bffe9` |
| Composer | `p4Puzhu06.ts`, green on v2 | `368ecd8` |
| Baseline supplement | `context-p4c.tsv` (29 headings × 720) | `625a579` |
| Authority v3 (相抵 rule) | `p4b-puzhu06-v3.json` | `a5f95e3` |
| Golden v3 freeze | 105 fixtures, propagation replay + proof | `f0454cb`, `df3fded` |
| Red on v3, then fix | test red 3/4 `df3fded`; composer fix | `e032235` |
| Sweep 5.1 | `p4b-puzhu06-2025-2027.tsv`, `p4b-puzhu06-summary.json` | `7a4901a` |

## Results on 2025–2027 (1,095 dates × 29 headings = 31,755 rows)

The 724 candidates (P5 F1: unprotected 忌 on a puzhu:06 day) resolve as:

| Action | 開倉庫出貨財 | 開市 | 立券交易 | 納財 | 安牀 | Total |
|---|---|---|---|---|---|---|
| lift | 17 | 13 | 25 | 13 | 0 | **68** (34 dates) |
| keep | 109 | 139 | 133 | 125 | 139 | 645 |
| hold (P4-B scope open) | 7 | 1 | 1 | 1 | 1 | 11 |

- Of the keep rows, 254 carry a sourced exception: 猶忌 132, 諸事皆忌 112, puzhu:27 10. The other 391 are kept by the owner answers Q1–Q3, plus the 9 rows of Q4a.
- Transitions of the lifted rows:
  - both_present → only_yi: 41;
  - only_ji → not_recorded: 22;
  - undetermined → neither_recorded: 5 (相抵 left, see F1 below).
- Sweep: 70 changed rows. 68 are lifts. The other 2 are propagation-blocked annotations on 開倉庫出貨財 (未戊申 2026-08-02 / 2027-07-28), where puzhu:22 now fires and is blocked by protected 忌.
  - 0 changes to 忌 on a protected row;
  - 0 changes outside the five headings;
  - 宜 unchanged.
- Engine vs Golden: 0 mismatches on 9,075 baseline rows. The Golden propagation mirror rebuilds every P4-C final: 31,755 dated + 20,880 context rows, 0 mismatches.
- 進人口, 經絡 and 醞釀 are not among the 29 P4 headings (`OUT_OF_HEADING_SCOPE`).

## Worked examples (PRD §8, task 5.2)

| Date | Triggers | Source class | Action | Before → after |
|---|---|---|---|---|
| 2025-01-22 丑辛卯 | 月恩 | AN (災煞 中 不遇) | keep ×5 | only_ji → only_ji |
| 2025-01-11 丑庚辰 | 天德+月德 | AD (月煞 平日 下 遇德) | keep ×5 | only_ji → only_ji |
| 2025-01-26 丑乙未 | 天德合+月德合+四相 | YOUJI (月破 猶忌, 又為大耗, 九空 從月破論) | keep ×5 | only_ji → only_ji |
| 2025-04-11 辰庚戌 | 月恩 | AU (月破 without 德) | keep ×5 | only_ji → only_ji |
| 2025-01-15 丑甲申 立券交易 | 四相 | QL (五離) | lift | both_present → only_yi |
| 2025-05-17 巳丙戌 開市/立券/安牀 | 天德合 | QL_EXCLUDED (五墓, Q4a) | keep ×3 | only_ji → only_ji |
| 2026-08-02 未戊申 立券交易 | 四相 | QL (五離) + 相抵 刼煞 | lift | undetermined → neither_recorded; 開倉庫 gets propagationBlocked 開市+立券交易 |

## Findings

| Id | Class | Finding | Handling |
|---|---|---|---|
| F1 | SPEC_BUG (authority v2) | `stateAfterLift` wrote `not_recorded` when a 相抵 subject (刼煞 `cancel_both`) stays on the heading. Affected: 5 dated rows and 2 contexts. The P4-B model gives `neither_recorded`, which can feed propagation. Found by the 5.1 sweep after the v2 composer existed. | Authority v3 and Golden v3, frozen before the composer fix: red `df3fded`, fix `e032235`. The sweep now asserts that every lifted row that was undetermined ends 相抵 or still open. Baseline claim 1.4 corrected. |
| F2 | GOLDEN_BUG (Golden v1, pre-freeze) | The Golden left out the P4-C reading "止忌 scope undetermined with known-false 宜 = not_avoided". 10 rows were off against the PRD counts. | Fixed in `derive.py` before the v1 freeze; 2 fixtures added. |
| F3 | GOLDEN_BUG (Golden v3, pre-freeze) | The propagation mirror missed the NAMING_ONLY 壞/壊 in 破屋壞垣 (36 rows). | Fixed before the v3 freeze; the mirror check rebuilds all P4-C finals. |
| F4 | SOURCE_NOTE → owner Q4a | 五墓 commentary 「不取德合者不同行也」. 9 rows were lifted only by 天德合 (巳丙戌). | Owner: block (v2). |
| F5 | KNOWN_LIMIT | 6 開倉庫 rows stay hold because 月煞 卯/酉 is 相抵 with an open 又為月虛 (= P5 F3). 5 rows stay hold because the 閉日/天吏 scope is undetermined (2027-08-07 未戊午). | Out of scope (P4-B). |

## Mutation gate (PRD FR-11)

`scripts/audit-p4-puzhu06-mutations.py` runs sequentially. Every mutation must be caught by an assertion, and the runner restores the original bytes. Results: [p4b-puzhu06-mutation-results.json](p4b-puzhu06-mutation-results.json). On PR #61 it ran as the CI job `p4b-puzhu06-mutations`, path-gated with the other P4 gates. Since `ac2835e` moved checks to the local pre-push gate (`npm run ci:local`), it runs inside `ci:p4` next to P4-B, P4-C and P5.

Result: **16/16 caught by assertion**, bytes restored (`restored: true`).

| Mutation | Tests | Caught |
|---|---|---|
| `drop_youji_exception` | p4Puzhu06.test.ts | yes |
| `drop_zhushi_exception` | p4Puzhu06.test.ts | yes |
| `invert_q1_grade_not_congji` | p4Puzhu06.test.ts | yes |
| `invert_q2_with_de_ruchangli` | p4Puzhu06.test.ts | yes |
| `invert_q3_ungraded_ruchangli` | p4Puzhu06.test.ts | yes |
| `invert_q4_lift_lists` | p4Puzhu06.test.ts | yes |
| `drop_q4a_exclusion` | p4Puzhu06.test.ts | yes |
| `drop_yueen_sixiang_shide` | p4Puzhu06.test.ts | yes |
| `add_sanhe_liuhe_triggers` | p4Puzhu06.test.ts | yes |
| `touch_protected_ji` | p4Puzhu06.test.ts | yes |
| `touch_out_of_list_heading` | p4Puzhu06.test.ts | yes |
| `youwei_ignores_parent` | p4Puzhu06.test.ts | yes |
| `defer_ignores_target` | p4Puzhu06.test.ts | yes |
| `hold_lifts` | p4Puzhu06.test.ts | yes |
| `xiangdi_state_dropped` | p4Puzhu06.test.ts + p4Puzhu06Sweep.test.ts | yes |
| `lift_after_propagation` | p4Puzhu06.test.ts + p4Puzhu06Sweep.test.ts | yes |

## Acceptance gate (PRD §7)

| # | Gate | Status | Evidence |
|---|---|---|---|
| 1 | Owner answered Q1–Q4 (+ Q4a). Authority locks the quotes, offsets, checksums and readings | PASS | v1 `718e195` → v2 `c3aedf6` (Q4a) → v3 `a5f95e3` (相抵 rule). Gates `p4Puzhu06Authority*.test.ts`: 24 spans |
| 2 | Independent Golden frozen before red tests and code (commit proof); old P4-B/P4-C/P5 locks keep their bytes | PASS* | v1 `4a7da71` and v2 `67af7c0` were frozen before any code. *v3 `f0454cb` was frozen after the v2 composer existed (F1), but before the fix, and its red test came first. `git diff origin/main` touches only new files plus `ci.yml` |
| 3 | 724 candidates resolved with Golden reasons; kept rows cite an exception; undetermined listed | PASS | Sweep: 68 lift / 645 keep / 11 hold. Reasons are read from the Golden v3 `dated.tsv` |
| 4 | 0 changes outside the five headings, 0 changes of 忌 on protected rows, 0 P4-B/P4-C regressions | PASS | Sweep: 70 changes (68 lifts + 2 Golden propagation annotations). The day-field deep-equal holds against P4-C on 1,095 dates and 720 contexts |
| 5 | Every mutation caught; CI green | PASS | 16/16 locally. [CI 38987506933](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38987506933) on [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) (`624ea4d`): every job passes; the new `P4-B puzhu:06 audit mutation gate` takes 5m19s |
| 6 | Runtime, manifest and scoring unchanged | PASS | Builds of `origin/main` and of this branch: 1,125 files. After normalizing chunk hashes and `builtAt`, only the build id and the sw.js revision derived from it differ. `p4Puzhu06` has no runtime import |
| 7 | Report, progress and PROJECT_CONTEXT updated | PASS | This report, `p4-vol10-progress.md`, PROJECT_CONTEXT row F1 |

Checks: full unit 204 files / 8,033 tests; typecheck (main + functions), lint (oxlint) and build all pass; `graphify update .` run.

## Limits

- Single-agent work (Claude); no independent second review.
- Golden v3 was frozen after a composer built against v2 existed (F1). v1 and v2 were frozen before any code.
- The P4-B 忌 source inventory is an engine measurement (baseline 1.0), not re-derived from the 卷十 entries inside the Golden.
- No lifted row has an unmodeled 忌 token (`unresolvedJi`): 114 lifts checked (68 dated + 46 context), 0 with tokens; the composer test asserts this. The state-after-lift rule does not itself look at unresolved tokens, so a future input with tokens on a lifted row would fail that assertion instead of being lifted silently.
- AN/AD rely on grade action `only_ji` (從忌不從宜). The baseline has 0 exceptions, and the composer throws SPEC_GAP for any other grade action.
- P5 (PR #60) is not merged. The trigger literals are copied from its frozen Golden; this branch does not depend on P5 code. 修倉庫 is not a puzhu:06 heading.
