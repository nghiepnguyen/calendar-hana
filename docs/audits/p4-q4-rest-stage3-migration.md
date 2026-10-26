# Q4-REST Stage 3: owner rulings and scoped production migration

2026-10-26. Branch `claude/q4-rest-stage3-migration`, cut from Stage 2C `2e8fe2d`. Stages 1–2C are frozen and not amended. Production now imports puzhu:06 authority **v5**; v4 is kept byte-identical as the rollback. Reviewer: Claude, single agent; no independent second review.

## 1. Owner rulings (frozen first, commit `ae5b13f`)

The rulings are recorded in `sources/p4-vol10/q4-rest-stage3/owner-ruling.json` (2026-10-26, `OWNER_RULING`).

| Ruling | Decision | Scope | Direct evidence |
|---|---|---|---|
| R-JK | ADOPT | 九空 × its own puzhu:06 headings (開市 立券交易 納財 開倉庫出貨財, derived from 卷十) | 卯-丁丑, 午-戊辰 (開市, 立券交易, 納財) |
| R-WX | ADOPT | 五虛 × 開倉庫出貨財 exactly | 卯-丁巳, 午-戊申, 子-丙寅 (月恩, 四相, 時德 alone) |
| R-XH | ADOPT | 小耗 × its own puzhu:06 headings; 子午卯酉 + 劫煞 猶忌 unchanged | 巳-戊戌, 戌-癸卯 (四相; 7 cells) |
| R-F1Y | ADOPT_ALL_21 | 五離 × 立券交易, when 五離 is the sole surviving 忌 and an independent 宜 applies: only_ji | 午-戊申 (宜 滿日), 丑-甲申 (宜 五富) |

- **Provenance.** Each ruling is OWNER_RULING backed by direct source evidence. Source-witness provenance stays page/cell specific.
- **Not decided:** global GOD-NARROW, global Y-CONVENTION, U4, U7, BAIJI-Y, 五墓, P21.
- **Unchanged:** 五墓/Q4a, F1 R2 (J axis), G2/W1, P21.

**Scoped Y count.** The owner text says 44 rows go only_yi → both_present under the J rulings alone; that is the Stage 2C per-ruling sum (27 + 14 + 3). With the rulings combined the count is **37**, because the 7 joint 九空+五虛 開倉庫 rows were counted twice. The ruling file records both numbers.

### Prediction, frozen before any engine code

`prediction.json` was taken on the v4 tree with test-only models only. It defines scoped Y independently of the implementation: v4 decision lift, model decision keep, final state both_present.

- **J-only model.** Reproduces Stage 2C's combined decisions row for row. Its heading rows plus 2C's R-F1Y rows equal 2C's combined heading rows.
- **J + scoped Y + R-F1Y model.** 96 decision / 74 heading / 121 activity / 366 event rows: the same keys and counts as Stage 2C. Values differ only on the **37 scoped-Y rows** (only_yi → only_ji, where Stage 2C gave both_present) and their activity/event consequences.
- **Baseline.** Digests of every 2025–2027 day plus two outside dates.

## 2. Authority v5 (commit `09a65cb`)

**Build.** `p4b-puzhu06-authority-v5/build.py` produces `shared/almanac-data/p4b-puzhu06-v5.json`, with parent v4.

| Change vs v4 | Content |
|---|---|
| `liftExclusions.九空/五虛/小耗` | Triggers the god's own 卷十 lift text does not name. Computed with longest-first tokens, so 天德合 never reads as 天德; 五虛 also takes 天願 from 「天願必是六合故不言而已在其中」. 九空 → [天德 天赦 天願 月恩 四相 時德]; 五虛, 小耗 → [天赦 月恩 四相 時德]. Each carries `class: QL_NARROW` |
| `classes.QL_NARROW` | keep, with scoped 宜 rule tag `Q4_REST_OWNER_ONLY_JI` |
| `yiComposition` | R-F1Y: `{heading: 立券交易, soleJi: 五離, from: both_present, to: only_ji}` |
| `ownerDecision` | R-JK, R-WX, R-XH (block), R-F1Y (only_ji) |

**Build checks.**
- The derived own-lifter sets equal the owner packets.
- Each god's 卷十 忌 line ∩ puzhu:06 headings equals the ruling scope.
- 五墓 and 五離 exclusions and all lift lists are byte-equal to v4.
- `diffFromV4` is exactly `classes, liftExclusions, ownerDecision, parent, version, yiComposition`.

## 3. Implementation

| | |
|---|---|
| R-JK / R-WX / R-XH | `p4Puzhu06.ts` `classify()`: a remaining-ji god whose present triggers are all excluded gets its exclusion's class (QL_NARROW, keep). This is the Q4a/R2 mechanism; there is no date or witness condition |
| Scoped Y | After propagation, so a later lift still restores 宜: a row whose classes are QL_NARROW plus lift-only classes, and that reads both_present, becomes only_ji with `yiRule: Q4_REST_OWNER_ONLY_JI`. Implemented in `p4OwnerRules.ts` (production) and in `resolveP4Puzhu06Day` (audit composer). Rows also kept by AN/YOUJI/QL_EXCLUDED etc. stay unchanged (tag only) |
| R-F1Y | `p4OwnerRules.ts`, after propagation and separate from the J rules: for each `yiComposition` rule, a both_present row on its heading whose `trace.ji` is exactly `[五離]` becomes only_ji with `yiRule: R-F1Y`. No other heading, god or family |
| Global composer | Unchanged. Remaining-ji facts still never suppress 宜 in general |
| Inert under rollback | v4/v3 carry no QL_NARROW and no yiComposition, so the new paths do nothing when the v5 path is mocked with them |

## 4. Envelope (rollback v4 vs shipped v5, 2025–2027)

`Q4R3M_DUMP=1 vitest run shared/lunar/p4Q4RestStage3Migration.test.ts` writes `migration-diff.json`.

| Measure | Shipped | Prediction (frozen) | Stage 2C |
|---|---|---|---|
| Decision rows | 96 | 96 (class name QL_EXCLUDED → QL_NARROW) | 96 |
| Heading rows | 74 (both_present→only_ji 21, not_recorded→only_ji 16, only_yi→only_ji 37) | 74, identical row for row | 74 (37 differ in value) |
| Activity rows | 121 | 121 identical | 121 |
| Event rows | 366 | 366 identical | 366 |
| Status changes | 79 | 79 | 79 |
| Event classification changes | 104 | 104 | 104 |
| Activity score changes | 121 | 121 | 121 |
| Event score changes | 332 | 332 | 332 |
| Hard-warning changes | 0 | 0 | 0 |

**Against the prediction: MATCH**, row for row. **Against Stage 2C: same keys and counts, explained difference.** The 37 scoped-Y rows read only_ji, not both_present, as the owner directed; this was frozen in `prediction-summary.json` before any engine code.

### Attribution and evidence classes (`provenance.json`)

**Attribution.** Every changed heading row is attributed by a per-ruling rollback, i.e. v5 minus that rule. The 7 joint 九空+五虛 開倉庫 rows revert only when both R-JK and R-WX are removed; Stage 2C's single-ruling runs name them.

| Class | Rows | Breakdown |
|---|---:|---|
| DIRECT_SOURCE_WITNESSED | 29 | dated rows on a page-witnessed context × heading: R-JK 12, R-WX 4, R-XH 9, R-F1Y 4 |
| SEMANTIC_OWNER_RULE | 38 | R-JK 18, R-WX 3, R-F1Y 17 |
| OVERLAP_OF_APPROVED_RULES | 7 | 九空 + 五虛 開倉庫出貨財 (R-JK ∩ R-WX) |

- **DIRECT means the cell.** The page proves the context × heading cell, not every date.
- **R-F1Y split.** 4 rows sit on the witnessed contexts (丑-甲申 ×3, 午-戊申 ×1); 17 sit on other contexts and are SEMANTIC.

## 5. Goldens (old ones retained)

| New | Predecessor (kept) | Generator | Diff |
|---|---|---|---|
| puzhu:06 Golden v5: `golden-p4b-puzhu06-v5.json` + `p4b-puzhu06-golden-v5/` | v4 | `derive.py`, a copy of v4's with the QL_NARROW class, the scoped rule and the v4→v5 checks | 56 rows lift → keep (all QL_NARROW), 37 scoped only_ji, 40 tag-only, 0 propagation changes, 0 unexpected; PRD counts hold (q4a 9, r2 19) |
| Full Golden P4 v4: `p4-full-golden-v4/` | v3 | `compose.py`, which loads the v3 composer (sha) and through it v2. It replaces `puzhu06_classes`, wraps `propagate` and `oracles` | Dated: the 74 predicted state changes + 43 decision-only rows (40 tag, 3 戌-癸亥 neither). Context: QL_NARROW / R-F1Y rows only. Anything else stops the run. Oracles against puzhu:06 Golden v5: all equal or owner-classified; R-F1Y counted apart (21 dated, 11 context) |
| Score Golden v6: `p4-score-golden-v6/` | v5 | `golden.py`, which loads v5 (sha) with layer A = full Golden v4 | Layer C = exactly the 121 predicted activity rows (same old/new score and status); 0 hard-warning changes |

**Unexpected churn: none.**

**Engine checks.**
- The shipped engine equals full Golden v4 on every date and context (`P4_OWNER_RULES_FULL=1`).
- The composer equals puzhu:06 Golden v5 on fixtures, 720 contexts and 1,095 dates.

## 6. Rollback

| | |
|---|---|
| Mechanism | `shared/lunar/q4RestRollback.ts` mocks the v5 path with v4 and asserts the loaded id |
| v5 → v4 | Reproduces the frozen pre-Stage-3 baseline on **all 1,097 days**, exactly (`rollback.json`) |
| Per ruling | Removing R-JK reverts 30 rows (+7 joint), R-WX 7 (+7 joint), R-XH 9, R-F1Y 21 |
| Outside P4_DOMAIN | 2024-11-04 and 2028-10-14 shipped equal the baseline |

**Pinned proofs.**
- **To v4:** puzhu:06 Golden v4 composer, owner rules vs full Golden v3, score Golden v5, the F1 R2 migration harness ("shipped" model), and the Stage 1/2A/2A.1/2B/2C harnesses.
- **To v3 at the v5 path:** the pre-R2 proofs.
- **Locks.** Stage locks check runtime code and their harnesses as committed (lockAnchor rule) and assert the retained v4 file.

## 7. Source regression (`source-regression.json`)

**In scope: 18 of 18 witnessed cells match the print.**

| Debt | Cells |
|---|---|
| 九空 | 卯-丁丑 and 午-戊辰 × 開市, 立券交易, 納財 |
| 五虛 | 卯-丁巳, 午-戊申, 子-丙寅 × 開倉庫出貨財 |
| 小耗 | 巳-戊戌 × 3; 戌-癸卯 × 4 |
| F1-Y | 午-戊申 and 丑-甲申 × 立券交易 |

All read only_ji at context level.

**Remaining mismatches (out of scope, listed, not fixed).** 9 cells still read both_present where the page prints only_ji:

| Cell | Why it is out of scope |
|---|---|
| 巳-戊戌 開倉庫出貨財 | U7: 天賊 protected |
| 丑-甲申 開倉庫出貨財, 安牀 | BAIJI-Y |
| 子-丙寅 結婚姻, 納采問名 | 滿日, another ungraded god |
| 午-戊申 / 丑-甲申 結婚姻, 納采問名 | 五離 on headings outside R-F1Y |

## 8. Regression

| Boundary | Result |
|---|---|
| F1 R2 J axis | 五離's QL_EXCLUDED kept on every decision; `liftExclusions.五離` byte-equal to v4 |
| G2/W1 | 未-戊申 劫煞 × 立券交易 = BLANK / I1 |
| 五墓 / Q4a | Exclusion byte-equal; QL_EXCLUDED preserved; Golden v5 q4aRows 9 |
| Other ungraded gods / U4 / U7 / BAIJI | Of the 1,110 Stage 2A.1 both_present rows, only the 21 R-F1Y rows changed; U7 0, U4 0, other gods 0. The 7 joint 開倉庫 rows changed only because R-JK and R-WX reach them |
| P21 | Untouched |

## 9. Gates

**New suites.**
- AuthorityV5, GoldenV5, Puzhu06V5;
- OwnerRulesV4 (FULL in ci:p4);
- ScoreGoldenV6 (FULL in ci:p4);
- Stage3 RulingLock, Migration, MigrationLock.

**ci:p4 additions.**
- The authority v5 build.
- The Golden v5 derive.
- The full Golden v4 compose.
- The score Golden v6 generator.

**Mutation gates (commit 4).**
- puzhu:06: 19 of 19, adding QL_NARROW → QL_EXCLUDED, QL_NARROW lifting and the scoped rule dropped.
- Owner rules: 14 of 14, adding the scoped rule dropped and R-F1Y dropped.

## 10. Open debts

| Debt | Status |
|---|---|
| Y-CONVENTION | open; only the scoped and R-F1Y rules exist |
| U4, U7 | quarantined |
| BAIJI-Y | open |
| P21 | open |
| 五離 on 結婚姻 / 納采問名 (both_present vs printed only_ji) | open; not authorized here |
| 滿日 and the other ungraded gods | untested |
