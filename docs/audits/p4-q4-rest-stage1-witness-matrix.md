# Q4-REST Stage 1: witness classification for 九空 / 五虛 / 小耗 / 五墓 (audit only)

2026-10-26, branch `claude/q4-rest-stage1`, cut from `main` at `7a38f09` (PR #106 merge). **No production code or data change.**

**Question.** puzhu:06 Q4 (owner, 2026-10-16) lets any puzhu:06 trigger lift a remaining-ji god that has its own 「與…併則不忌」 list. F1 R2 removed that for 五離 × 立券交易. For the other four gods, which model do the prints support?

- **Q4-GENERIC**: a generic puzhu:06 trigger lifts the god's 忌 (current production).
- **GOD-NARROW**: only the god's own lifters lift it.

**Result.** No god is resolved. 五虛 has one clean witness, and it fits neither model: **UNRESOLVED_CONFLICT**. 九空, 小耗 and 五墓 have no clean witness: **INSUFFICIENT_EVIDENCE**. Stage 2 acquisition is needed.

**Artifacts** in `sources/p4-vol10/q4-rest-stage1/`:

| File | Contents |
|---|---|
| `models.json` | Both models over 720 contexts and the 1,095 dated days. Written by `shared/lunar/p4Q4RestStage1Models.test.ts` with `Q4R_DUMP=1` |
| `build_evidence.py` | Deterministic builder for the files below |
| `evidence.json` | Authority table, Q4a audit, 27 candidates with readings and authentication, findings |
| `matrix.json` | 62 page × god × heading cells, 12 god × heading classifications, aggregates |
| `coverage.json` | QL rows recomputed per god and heading |
| `acquisition-plan.json` | 44 Stage 2 targets (locators are HYPOTHESIS) |
| `lock.json` | Hashes of the scans used, the artifacts, the inputs and the production authority |

Tests: `p4Q4RestStage1Lock.test.ts`, `p4Q4RestStage1Matrix.test.ts`, `p4Q4RestStage1Models.test.ts`.

## 1. Current authority

| God | 忌 headings (puzhu:06 scope) | Own lifters ∩ triggers | Generic triggers outside own | Production (v4) | Authority class |
|---|---|---|---|---|---|
| 九空 | 開市 立券交易 納財 開倉庫出貨財 | 月德 天德合 月德合 | 天德 天赦 天願 月恩 四相 時德 | QL: lift on any trigger | entry SOURCE_FACT; Q4 OWNER_RULING |
| 五虛 | 開倉庫出貨財 | 天德 月德 天德合 月德合 天願 (+ 六合, not a trigger) | 天赦 月恩 四相 時德 | QL: lift on any trigger | entry + note SOURCE_FACT; Q4 OWNER_RULING |
| 小耗 | 開市 立券交易 納財 開倉庫出貨財 | 天德 月德 天德合 月德合 天願 | 天赦 月恩 四相 時德 | QL: lift on any trigger | entry SOURCE_FACT; Q4 OWNER_RULING |
| 五墓 | 安牀 開市 立券交易 | 月德 (午/子 months) | all others | QL, Q4a excludes 天德合 月德合 | entry SOURCE_FACT; Q4 + Q4a OWNER_RULING |

Own lifters are read from the 卷十 entries, not from production. Each entry is quoted in `evidence.json` → `authority`.

- **九空.** 「寅申月值滿日子午卯酉月值開日與月德天德合月德合併則不忌」. The officer clause is descriptive: 九空 always falls on 滿 in 寅/申 months and on 開 in 子午卯酉 months (the builder asserts this). Reading it as "officer and 德" or as "德 alone" gives the same set, so this is not an unclear-lifter stop. In 巳亥 months 九空 defers to 月厭, in 辰戌丑未 months to 月破 (`remainingDefer`). That is not Q4.
- **五虛.** 天願 counts as an own lifter by the 四庫 note 「天願必是六合故不言而已在其中」. The same note says 天赦 never meets 五虛.
- **小耗.** Own exception: 「子午卯酉月值刼煞雖與德合併猶忌」.
- **五墓.** 「五月十一月與月德併則不忌」. 月德 meets the 五墓 day only in 午/子 months (asserted), so the month qualifier is descriptive.

Separation of layers:

| Class | What |
|---|---|
| SOURCE_FACT | 卷十 entries; 卷十一 heading lists; page readings |
| SOURCE_INTERPRETATION | own-lifter sets above; 劵/券 and glyph-variant mapping; CLEAN criteria |
| OWNER_RULING | Q4 = yes, Q4a = block (2026-10-16); F1 R2 (2026-10-26) |
| PRODUCTION_BEHAVIOR | `models.json` generic. Not used as evidence |

### Q4a (五墓)

| | |
|---|---|
| What it says | 五墓's own lift needs 月德 itself. puzhu:06's 天德合/月德合 cannot lift 五墓 |
| Why it exists | 卷十 「不取德合者不同行也」 |
| Headings | 安牀, 開市, 立券交易 |
| Excluded triggers | 天德合, 月德合 |
| Class | OWNER_RULING applying a SOURCE_FACT clause. F1 does not validate it |
| Witness | 06067693-n95 巳-丙戌 (天德合): both models keep. Consistent, non-discriminating |
| Observable Q4 effect | **None.** Across all 720 contexts, generic and narrow agree on every 五墓 row: a non-德合 trigger meets 五墓 only beside a keep-class source |

Q4a is unchanged.

## 2. Witness corpus

**Search.** The search walked every JSON record under `docs/audits/` that carries a god list: 69 stored pages, 104 JPGs in the tree. The nine record files it hit are now a fixed list in the builder (`RECORD_FILES`) and hashed in `lock.json`. Pages without god-list records (`suibao-zhuzhen`, `shixian-tohoku`, `phase-clause`, `n220`–`n223`) are other volumes and have no 月表 day.

**Candidates.** A candidate page has one of the four gods plus a puzhu:06 trigger. There are **27**, the same set as Stage 2. A first pass found 23 because four prior records store god lists as one space-separated string (n105, n117, 06067694-n93, 06067697-n75). The builder now splits them.

**Authentication.** All 27 are **AUTHENTICATED**. The stored hash equals the hash in every prior record, and the month derived from the officer equals the month block. None is unauthenticated.

**Readings.** Nine pages had no full 宜/忌 line in their prior records. They were read from the stored scan in this stage: n126, n58, 06067692-n59, n73, 06067696-n111, n28, n29, n34. n105 has only a prior summary (no 忌 printed, under the puzhu:28 day rule). Every other page uses its prior full lines.

| Status (62 cells) | Count | Meaning |
|---|---|---|
| CLEAN | 1 | 06067692-n126 五虛 × 開倉庫出貨財 |
| NON_DISCRIMINATING | 52 | an own lifter is present (both models lift), or puzhu:06 does not touch the row / both models agree |
| NOT_Q4 | 8 | 九空 in a defer month (n98 未-己丑, n98 亥-己丑) |
| CONTAMINATED | 1 | n65 戌-癸亥: 劫煞 on 開倉庫出貨財. CONTAMINATED_BUT_SUPPORTIVE: 忌 printed, generic predicts none |
| AMBIGUOUS | 0 | |

**Stage 2 correction.** Stage 2 called 丑-戊寅, 丑-壬寅 and 戌-癸亥 "testable" for 五虛. That was **wrong**. 劫煞, plus 天賊 on the 丑 pages, is a second 開倉庫出貨財 忌 operand on all of them, and puzhu:06 does not even touch the 丑-寅 rows.

## 3. CLEAN criteria (fixed before classification)

1. The target god is on the page, has no own lifter, and is not deferred.
2. A puzhu:06 trigger is present.
3. No own lifter of the god is present, including non-trigger 六合 for 五虛.
4. No other 忌 operand is on the heading. That means the 卷十一 list ∩ page operands (gods, officer 日, 甲日/申日), plus any graded or 又為 source the composer reports.
5. No day rule or protected row.
6. The page is authenticated.
7. The heading maps canonically (劵/券 and glyph variants only).
8. The two models predict different final states.

Independent 宜 is recorded per cell (`otherYi`) and is never treated as contamination.

## 4. Prediction models

Both models run the production composer (`resolveP4Puzhu06Day`); grades and propagation come from it, not from hand derivation.

- **Generic** is shipped v4. Over 720 contexts it matches Golden v4 `context.tsv` with 0 mismatches.
- **Narrow** is v4 plus `liftExclusions[god]` = the puzhu:06 triggers outside the god's own lifters. This is a test-only `vi.doMock`, the same mechanism as Q4a and R2.

**Protection against fitting.** Predictions come mechanically from the shipped composer plus own-lifter sets read from the 卷十 text, and the exclusion sets were not tuned to any page. `models.json` was dumped before the printed states were encoded, but n126 had already been read when the harness was written, so the dump order alone proves nothing.

Outside 九空's defer months, puzhu:06 never sees a god together with one of its own lifters: P4-C's remaining-ji layer has already applied the god's own list. This was checked over all 720 contexts in both models; the only such rows are 九空 in 丑/辰-type defer months, classed from 月破/月厭. So every QL row is a row where the two models disagree.

## 5. Evidence matrix

| God | Heading | Clean witnesses | Class | Discriminating contexts (720) |
|---|---|---|---|---|
| 九空 | 開市 | none | D | 7 |
| 九空 | 立券交易 | none | D | 7 |
| 九空 | 納財 | none | D | 7 |
| 九空 | 開倉庫出貨財 | none | D | 5 (all carry 五虛 too: joint only) |
| 五虛 | 開倉庫出貨財 | 06067692-n126 | **C** | 12 |
| 小耗 | 開市 | none | D | 2 |
| 小耗 | 立券交易 | none | D | 2 |
| 小耗 | 納財 | none | D | 2 |
| 小耗 | 開倉庫出貨財 | none | D | 1 (戌-癸卯, contaminated by 大時) |
| 五墓 | 安牀 | none | D | 0 |
| 五墓 | 開市 | none | D | 0 |
| 五墓 | 立券交易 | none | D | 0 |

**n126 (卯-丁巳, 滿日).**

| Operands on 開倉庫出貨財 | |
|---|---|
| Triggers | 月恩, 四相 (neither is a 五虛 own lifter) |
| 忌 operands | 五虛 only. Other 凶神 on the page: 八風, 土符, 大煞, 往亡, 重日, 朱雀. Their 卷十 lists do not name the heading |
| 宜 operands | 月恩, 四相, 滿日 |

| | 宜 | 忌 | State |
|---|---|---|---|
| Printed | no | **yes** | **only_ji** |
| Q4-GENERIC | yes | no | only_yi (wrong on both) |
| GOD-NARROW | yes | yes | both_present (wrong on 宜) |

- On the 忌 axis alone, the page supports GOD-NARROW: 五虛's 忌 survives 月恩+四相.
- On the 宜 axis, the page prints 從忌不從宜, which no model produces.

This is a model-vs-print conflict, not two witnesses contradicting each other. The rules forbid classifying the cell as B while the narrow prediction misses the printed state.

| God | Aggregate |
|---|---|
| 九空 | INSUFFICIENT_EVIDENCE |
| 五虛 | UNRESOLVED_CONFLICT |
| 小耗 | INSUFFICIENT_EVIDENCE |
| 五墓 | INSUFFICIENT_EVIDENCE (no observable difference in any context) |
| **Q4-REST** | **NOT_RULED** |

## 6. QL coverage (2025–2027, recomputed from the v4 composer)

| God | QL rows | Headings | Witness-covered | Clean-covered | Uncovered |
|---:|---:|---|---:|---:|---:|
| 九空 | 37 | 開市 10, 立券交易 10, 納財 10, 開倉庫出貨財 7 | 0 | 0 | 37 |
| 五虛 | 17 | 開倉庫出貨財 | 3 (戌-癸亥, n65) | 0 | 17 |
| 小耗 | 9 | 開市 3, 立券交易 3, 納財 3 | 0 | 0 | 9 |
| 五墓 | 0 | none | 0 | 0 | 0 |

**The 56 reproduces** as the distinct lift rows of Golden v4: `byAction.lift` is 13 + 13 + 17 + 13. Stage 2 hard-coded it as 68 − 12. Per-god attributions sum to 63 because 7 rows (開倉庫出貨財 on 卯-丁丑, 午-戊辰, 酉-癸未, 午-庚辰) carry 九空 and 五虛 together. 3 of the 56 rows also carry a 相抵 劫煞 subject.

n126's context 卯-丁巳 does not fall in 2025–2027. It covers no production row.

## 7. Provenance

| Class | Items |
|---|---|
| DIRECT_SOURCE_WITNESS | n126 (五虛 × 開倉庫出貨財), conflicted |
| SEMANTIC_CONSEQUENCE | none created. F1's 4 extrapolated rows stay outside Q4-REST |
| OWNER_INTERPRETATION | Q4 = yes; Q4a = block; F1 R2 (五離 only) |
| PRODUCTION_PROJECTION | the 56 QL lift rows. Not evidence |

## 8. Stage 2 acquisition plan (`acquisition-plan.json`)

There are 44 targets: discriminating contexts with no clean witness.

| Usable | Targets |
|---|---|
| CLEAN_TARGET (29) | 九空 開市/立券交易/納財 × {子-甲戌, 卯-丁丑, 午-戊辰, 午-庚辰, 午-壬辰, 午-甲辰, 酉-癸未}; 小耗 開市/立券交易/納財 × 巳-戊戌; 五虛 開倉庫出貨財 × {子-丙寅, 子-戊寅, 子-庚寅, 午-戊申, 酉-癸亥} |
| JOINT_ONLY (九空+五虛) | 開倉庫出貨財 × {卯-丁丑, 午-戊辰, 午-庚辰, 午-壬辰, 酉-癸未}, listed once per god (10) |
| CONTAMINATED_TARGET | 戌-癸卯 (大時; 小耗 × 4 headings), 戌-癸亥 (劫煞; 五虛) (5) |
| None possible | 五墓 |

Each target records the required trigger, the own lifters it must exclude, the competing sources and both predictions. Its locator (e.g. 巳-戊戌 → `06067693-n107`) is a **HYPOTHESIS** from the leaf-offset calibration of stored pages, until it is authenticated.

**Highest value.**
- **五虛 at 子-丙寅/戊寅/庚寅 (時德).** These test the 忌 axis again with 時德 as the only trigger (時德 is also a 開倉庫出貨財 宜 operand), so they test the same 宜 question.
- **巳-戊戌 (小耗, 四相).** No independent 宜 on 開市 or 立券交易, so the prediction is not_recorded vs only_ji.
- **九空 午-庚辰/壬辰/甲辰 (時德).** These are 立券交易 not_recorded vs only_ji.

## 9. Production and regression

- **No production change.** No change to `p4b-puzhu06-v4.json`, `p4Puzhu06.ts`, Goldens, scores, aliases, G2/W1, puzhu:21 or P21.
- **Diff vs `main`.** New audit files and three test files only.
- **Projection.** The generic model reproduces Golden v4 (0 mismatches over 720 contexts). The existing Golden v4 / score v5 suites stay green.
- **F1 R2.** Unchanged and not extended.
- **G2/W1.** CLOSED: 劫煞 × 立券交易 = BLANK / I1.

## 10. Open debts

- **Q4-REST.** Unresolved for all four gods. Q4 = yes stays in force.
- **宜 axis (new).** No 鋪註 line in 卷十 and nothing in the warehouse audits (`yi-warehouse-v1`, `p5-warehouse-*`) withholds 開倉庫出貨財 宜 on this day; the only 鋪註 line naming the heading as a 宜 target is puzhu:06 itself. n126 prints only_ji where a surviving remaining-ji 忌 meets independent 宜 (從忌不從宜). F1 R2 rule 3 (owner) sets both_present for 五離 × 立券交易, which covers the 4 extrapolated rows. Different god and heading, so no contradiction is established. It needs a witness of the F1 shape before anyone reads it either way.
- **Unchanged and separate.** P21; puzhu:21 N-A vs N-C on 未-戊申.
