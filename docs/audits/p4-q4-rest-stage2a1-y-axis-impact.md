# Q4-REST Stage 2A.1: Y-axis impact and provenance (audit only)

2026-10-26, branch `claude/q4-rest-stage2a1-y-axis`, cut from `cf4c1e9` (Stage 2A). Stage 1 (`6b9a9e2`) and Stage 2A are frozen and not amended. **No production change, no Golden change, no migration.** Reviewer: Claude, single agent; no independent second review.

**Owner direction (frozen for this stage)**

| Item | Direction |
|---|---|
| Y axis | SOURCE_PATTERN_CONFIRMED, SEMANTICS_UNRESOLVED. The old-practice sentence 「舊本凡吉神遇凶煞皆從忌而不從宜」 is not authority |
| F1-Y | New, separate debt: does a surviving 五離 忌 + independent 宜 print only_ji or both_present? |
| F1 R2 | Valid and untouched (v4, R2_APPROVED). Only F1 rule 3, the Y composition, is under review |

**Result**

- **Where both_present comes from.** Production makes both_present for "surviving ungraded 忌 + 宜" through an **implementation default**: the A05 composition rule suppresses 宜 only for scopes marked 從忌不從宜 or 不註, and ungraded scopes carry neither mark. The owner accepted Golden v2 wholesale, but no question or check in that review addressed Y. This holds for the sole-ungraded families (U1–U3, U5); U4 and U7 are unverified.
- **Population.** **1,110** such production rows in 2025–2027 (348 days, 158 contexts, 21 gods). Only **4.2 %** of them are directly covered by a page.
- **Source pattern.** **21 rows, all only_ji**. They come down to **5 god × 宜-source patterns on 7 pages**, spanning 2 of 6 semantic families.
- **F1-Y is not local.** The 4 F1 立券交易 rows are 4 of 21 五離 × 立券交易 both_present rows; the other 17 never touched puzhu:06.
- **Diagnostic impact.** If only_ji applied to every row, 1,110 heading / 1,082 activity / 1,330 event records would change. If it applied only to rows the evidence covers, **198 / 211 / 354** would.
- **Gates:** Y-B and F1Y-B. **NEEDS_OWNER_REVIEW.**

**Artifacts** in `sources/p4-vol10/q4-rest-stage2a1/`:

| File | Contents |
|---|---|
| `runtime.json` | Production population, page-context rows and the diagnostic impact. Written by `p4Q4RestStage2A1Impact.test.ts` with `Q4R2A1_DUMP=1` |
| `page-contexts.json` | The 79 contexts the dump covers: every stored page, plus 丑-甲申 and 午-戊申 |
| `build_evidence.py` | Deterministic builder (optional OUTDIR) |
| `source-pattern.json` | §4 |
| `production-population.json` | §2, §10 |
| `semantic-families.json` | §3 |
| `f1-y.json` | §5–6 |
| `provenance.json` | §7–8 |
| `diagnostic-impact.json` | §9 |
| `acquisition-plan-v3.json` | §11 |
| `lock.json` | Hashes |

Test: `shared/lunar/p4Q4RestStage2A1Lock.test.ts`.

**Note on Stage 2A.** It used the P4-C composer. This stage uses the production owner-rules runtime (`resolveP4OwnerRulesDay`, which feeds `getP4DayHeadings`). All 21 source rows were re-checked there: each is both_present, and the ungraded god is the sole 忌 source.

## 2–3. Production population and families

**Filter.** Final production state both_present, and at least one surviving 忌 id is a 卷十 remaining-ji (ungraded) entry. Every P4 heading counts, not only puzhu:06.

**Size.** 1,110 rows, 348 days, 158 contexts.

**By god** (a row with two ungraded gods counts under each):

| Group | Rows |
|---|---|
| 九空 | 80 |
| 五虛 | 69 |
| 小耗 | 29 |
| 五墓 | 99 |
| 五離 | 67 |
| Other | 779: 往亡 148, 土符 132, 遊禍 102, 八專 80, 死氣 77, 地囊 74, 四窮 45, 滿日 45, 天賊 40, 歸忌 37, 九焦 28, 厭對 19, 四廢 14, 四忌 12, 天狗 8, 復日 2 |

**Transformations.**
- puzhu:06 participated in 4 rows (the F1 R2 keeps).
- puzhu:21/22 and 相抵 never yield both_present: their rows end in neither_recorded or lifted.
- No row has propagationBlocked.

| Family | Definition | Production | Source rows |
|---|---|---:|---:|
| U7_PROTECTED_CO_OPERAND | 忌 protected by a co-operand (百忌, 專忌, 八專 …) | 767 | 0 |
| U3_SOLE_JISHEN_YI | one ungraded 忌; 宜 from 吉神 only | 221 | 8 |
| U2_SOLE_OFFICER_YI | one ungraded 忌; 宜 from the officer only (滿日 …) | 82 | 13 |
| U1_SOLE_MIXED_YI | one ungraded 忌; officer + 吉神 宜 | 29 | 0 |
| U4_MULTIPLE_JI | two or more surviving 忌 | 7 | 0 |
| U5_PUZHU06_KEPT | one ungraded 忌 kept by puzhu:06 (F1 R2) | 4 | 0 |

The source spans **U2 and U3 only**.

**U7, split by what protects the 忌:**

| Subfamily | Rows | Notes |
|---|---:|---|
| U7a: the ungraded god protects itself | 741 | 往亡 148, 土符 132, 遊禍 102, 八專 80, 地囊 74, 四窮 45, 天賊 40, 死氣 39, 歸忌 37, 九焦 28, 四廢 14, 四忌 12, 天狗 8 |
| U7b: 百忌 (專忌) | 14 | |
| U7c: dated (朔望日, 土王用事後, 每月十五日) | 6 | |
| U7d: subject stop / other | 6 | |

**Source lines bearing on U7:**
- 「…及專忌之日無庸分别…」 takes 專忌 days out of the grade framework.
- puzhu:22 「如遇專忌之日則仍註忌」 keeps their 忌.
- 「凡土府土符地囊止註忌補垣亦不註宜塞穴」 and 「凡四忌四窮止忌安葬…亦不註宜破土啟攢」 speak of 宜 only for specific headings (塞穴 is not a P4 heading).
- 六黑道 「與凶神併則從所忌與吉神併則從所宜」 concerns the 黑道 gods themselves.

**No general line covers 宜 against a protected 忌.** U7 reaches both_present through the same A05 default in code, but its provenance is **unverified**.

## 4. Source pattern (21 raw rows → 5 propositions)

| God | Family | 宜 source | Rows | Pages |
|---|---|---|---:|---|
| 九空 | U2 | 滿日 | 11 | n10 寅-戊辰, n46 寅-甲辰, 95-n52 申-庚戌 |
| 五虛 | U2 | 滿日 | 2 | n90 卯-辛巳, n114 卯-乙巳 |
| 五墓 | U3 | 天德合 | 5 | n95 巳-丙戌 |
| 五墓 | U3 | 天德合 + 不將 | 1 | n95 |
| 五離 | U3 | 四相 | 2 | n14 戌-壬申 |

- **Every row:** the production state is both_present, the ungraded god is the sole 忌 source, and the page prints only_ji.
- **Counterexamples:** 0.
- **Excluded:** n95 安葬 (explained by 復日 + 天德合 「則不忌亦不註宜」; production already reads only_ji through E1). n95 栽種 and 求醫療病 (production undetermined).
- **Q4-lift row, not counted:** n126 (卯-丁巳 五虛 × 開倉庫出貨財; production only_yi, printed only_ji).
- **Independence.** The 21 rows are 5 god × 宜-source propositions, or 4 god × family patterns, on 7 pages. They are not 21 rules.

## 5–6. F1-Y

| | |
|---|---|
| Production rows with a surviving 五離 忌 + 宜 | 67 (宴會 26, 立券交易 21, 納采問名 10, 結婚姻 10) |
| F1 R2 立券交易 rows | **4**: 2025-01-15, 2026-01-10, 2027-01-05 (丑-甲申; 宜 五富) and 2025-06-08 (午-戊申; 宜 滿日). puzhu:06 `keep:QL_EXCLUDED`. Matches F1 Stage 3 |
| Pre-existing 五離 × 立券交易 both_present | 17 more (丑-丙申/戊申, 午-庚申/壬申/甲申, 酉-甲申/丙申). No trigger, so both_present before and after F1 |
| Directly source-covered | 立券交易: **0, SEMANTIC_ONLY**. Other headings: 6 rows (n14's 戌-壬申 結婚姻/納采問名 dates) |

**Scope: WIDER_COMPOSER.** F1 rule 3 restates the composer default that already governs all 67 五離 rows, and the 1,110 rows in general.

**F1 witnesses, Y only:**

| Witness | Heading | Independent 宜 | Surviving 五離 忌 | Production | Printed | Y evidence |
|---|---|---|---|---|---|---|
| n14 戌-壬申 | 結婚姻 | 四相 | sole | both_present | only_ji | **Y only_ji (sole)** |
| n14 | 納采問名 | 四相 | sole | both_present | only_ji | **Y only_ji (sole)** |
| n14 | 立券交易 | none | sole | only_ji | only_ji | no independent 宜 |
| n14 | 宴會 | yes | sole | both_present | printed as 會親友 | not compared (not aliased) |
| n62 戌-庚申 | 結婚姻 | 月恩 | with protected 八專 | both_present | only_ji | Y only_ji (protected co-operand) |
| n62 | 納采問名 | 月恩 | with protected 八專 | both_present | only_ji | same |
| n62 | 立券交易 | none | sole | only_ji | only_ji | no independent 宜 |
| n117 未-戊申 | 結婚姻, 納采問名, 立券交易 | none | with 劫煞 (相抵) | neither_recorded | only_ji | not Y (相抵) |

**What 五離 shows.** It follows the only_ji convention on two headings, once sole (n14) and once with a protected co-operand (n62).

**Classification: F1Y-B.** The indirect evidence is strong; a direct 立券交易 witness with independent 宜 is still required. F1 R2 (J axis) is not affected.

## 7. Provenance of both_present

| Layer | Class | Where |
|---|---|---|
| 等第 prose | SOURCE_FACT, **graded subjects only** | 卷十 ~9736: both_present = 從宜亦從忌, only for 上次 (no 德) and 中次 (with 德) |
| State vocabulary (P4HeadingState) | IMPLEMENTATION | `p4HeadingAnnotation.ts` (`3800d99`, 2026-10-16) |
| **A05 composition rule** | **IMPLEMENTATION_DEFAULT** | `docs/audits/p4-vol10-day-composition.md`: 「宜 bị chặn nếu có phạm vi 從忌不從宜 / 不註 liệt kê heading đó」; `p4DayComposition.ts` (`3800d99`, 2026-10-16). Ungraded scopes carry no such mark, so ji + 宜 falls through to both_present |
| P4-B remaining-ji | IMPLEMENTATION | `p4-vol10-remaining-ji.md`: remaining scopes carry 忌 only (「both_present = kept」 is about the 宜-fixed-true read) |
| Owner-rules runtime | IMPLEMENTATION | `p4OwnerRules.ts:401-423` (`aef0a1e`/`4d6ad5c`, 2026-10-17). Suppression = 不註宜 lines, 相抵, puzhu:27, subject as_usual/still_avoid/avoid_all; remaining facts never suppress |
| puzhu:06 PRD | inherited | reads 丑甲申 立券交易 「both_present」 as the current state |
| Full Golden v2 acceptance | OWNER_ACCEPTED_GOLDEN, wholesale | `p4-full-golden-review.md` (roadmap 7, 2026-10-17). Owner questions were H1/H2 (相抵 / 德願); `owner_checks.py` checks (i), E1, E3 and D. **No Y-specific question or check.** The nearest owner Y decision, H1-B (an unprotected 忌 meeting another scope's 相抵 → 宜 not noted), points the other way for its own case |
| F1 R2 rule 3 | OWNER_RULING (2026-10-26) | first explicit statement. It adopted the composer state measured in F1 Stage 2; it did not come from a source finding |

**Classification: IMPLEMENTATION_DEFAULT**, accepted wholesale in Golden v2 with no Y-specific review. First artifact: A05 day composition (`3800d99`). F1 inherited it.

**Scope of this classification:** the sole-ungraded families U1, U2, U3, U5. U4 and U7 are unverified (§3).

## 8. The six-grade framework

| | |
|---|---|
| Old rule | 「舊本凡吉神遇凶煞皆從忌而不從宜」, criticized as 「於理固屬不合於事尤為不便」 |
| Replacement | 「除建破等日條例簡易及專忌之日無庸分别外餘分為六等」: six grades, each fixing 從宜/從忌 with or without 德 |
| Scope | the 宜忌等第表 cells (subject × month). The table itself is not in the raw text |
| Ungraded 凶煞 vs 宜 | **not defined** |
| Ungraded entries say | only 「與…併則不忌」, 猶忌, and (重日/復日) 「則不忌亦不註宜」, which speaks of 宜 only for the lifted case |
| What absence implies | **no conclusion**: the prose replaces the blanket rule for what it grades and is silent on the rest |
| 月表 | prints only_ji on every comparable row: a printed convention the prose does not state |

## 9. Diagnostic Y-NARROW impact (diagnostic only, not approved)

**Hypothesis.** A production both_present row whose surviving 忌 includes an ungraded remaining-ji god reads only_ji instead.

**How it was run.** As a test-only wrapper around `resolveP4OwnerRulesDay`, one module graph per scope, over 2025–2027. Each scope was **measured directly**, not inferred from dates.

**Scopes:**
- **All:** the full hypothesis.
- **Evidence-bounded:** the row's ungraded god × family matches a source pattern (九空/五虛 U2, 五墓/五離 U3).
- **F1-Y:** 五離 is the sole ungraded source.
- **U7:** protected rows only, i.e. what extrapolating to them would cost.

| Scope | Heading | Activity | Status changes | Score changes | Hard warnings | Events | Event class | Event score |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **All** | 1,110 | 1,082 | 559 | 1,040 | 0 | 1,330 | 0 | 1,245 |
| **Evidence-bounded** | **198** | **211** | **106** | **208** | 0 | **354** | 0 | **328** |
| **F1-Y (五離 sole)** | 61 | 68 | 2 | 65 | 0 | 224 | 0 | 203 |
| **U7 only** | 767 | 714 | 395 | 690 | 0 | 648 | 0 | 635 |

**Status moves:**
- **All:** watch→avoid 520, consider→avoid 39.
- **Evidence-bounded:** watch→avoid 106.
- **F1-Y:** watch→avoid 2; the other 63 rows only move score within watch.

**Breakdowns:**
- **Evidence-bounded by god:** 五墓 84, 九空 45, 五離 39, 五虛 30.
- **Evidence-bounded by activity:** contract 26, transaction 26, warehouse_opening 24, opening 19, business 19, warehouse 17, wedding 16, engagement 16, …
- **F1-Y by heading:** 宴會 26, 立券交易 21, 納采問名 7, 結婚姻 7.
- **F1-Y by activity:** contract 21, transaction 21, meeting 12, wedding 7, engagement 7.
- **All, by heading:** 求醫療病 165, 修倉庫 109, 栽種 93, 嫁娶 79, 般移 72, …
- **All, by family:** U7 767, U3 221, U2 82, U1 29, U4 7, U5 4.
- **All, by coverage:** uncovered 911, pattern-covered 152, direct 47.

**Evidence scope vs direct coverage.** The evidence scope matches by family. One directly covered row falls outside it: 2025-08-09 申-庚戌 納財, where the dated 母倉 宜 makes the family U1.

No Golden was modified and no test was repinned.

## 10. Source coverage vs production

**Definitions.**
- **Direct:** the same context and heading as a source row.
- **Pattern:** the same god and family as a source pattern.

| God | Production rows | Direct | Pattern | Uncovered |
|---|---:|---:|---:|---:|
| 九空 | 80 | 19 | 27 | 34 |
| 五虛 | 69 | 4 | 26 | 39 |
| 小耗 | 29 | 0 | 0 | 29 |
| 五墓 | 99 | 18 | 66 | 15 |
| 五離 | 67 | 6 | 33 | 28 |
| other 16 gods | 779 | 0 | 0 | 779 |

| Heading (largest) | Rows | Direct | Pattern | Uncovered |
|---|---:|---:|---:|---:|
| 求醫療病 | 165 | 0 | 6 | 159 |
| 修倉庫 | 109 | 0 | 17 | 92 |
| 栽種 | 93 | 0 | 3 | 90 |
| 嫁娶 | 79 | 3 | 9 | 67 |
| 般移 | 72 | 0 | 3 | 69 |
| 結婚姻 | 61 | 6 | 10 | 45 |
| 納采問名 | 58 | 6 | 10 | 42 |
| 立券交易 | 55 | 5 | 21 | 29 |
| 開倉庫出貨財 | 45 | 8 | 16 | 21 |
| 開市 | 23 | 5 | 14 | 4 |

**Totals.** Direct **47 (4.2 %)**, pattern 152, uncovered **911 (82 %)**.

**Consequence.** A migration scoped to the evidence could reach about 198–199 rows; measured, that is 198 heading / 211 activity / 354 event changes. Anything wider, especially the 767 U7 rows and the 16 other gods, would need owner extrapolation.

## 11. Acquisition plan v3 (not acquired)

**Ranking.** Information gain first (J, Y, F1-Y, Y-family gaps), then 2025–2027 production Y rows.

| Priority | Page | Gain | Prod Y rows | Locator (HYPOTHESIS) |
|---|---|---|---:|---|
| P0 | **午-戊申** | J (五虛) + Y + **F1-Y 立券交易** + U1/U5 family gaps | 5 | 06067694-n50 |
| P0 | 子-丙寅 | J (五虛 時德) + Y | 15 | 06067697-n8 |
| P0 | 巳-戊戌 | J (小耗 四相) + Y | 6 | 06067693-n107 |
| P1 | 卯-丁丑 | J replication + **U4 and U7** family gaps | 2 | 06067692-n86 |
| P1 | 丑-甲申 | F1-Y 立券交易 (3 R2 rows) | 21 | 06067697-n93 |
| P1 | 午-戊辰 | J (九空 × 月恩, 四相, 時德) | 0 | 06067694-n10 |
| P2 | 8 replications | — | — | — |
| P3 | 戌-癸亥, 戌-癸卯 | contaminated | — | — |
| — | 五墓 | no J target (models coincide); Y already direct (n95) | — | — |

## 12. Owner gate

| Gate | Classification | Reason |
|---|---|---|
| **Y** | **Y-B**: source pattern strong (21/21, 5 propositions, 4 gods, 0 counterexamples); textual semantics unresolved | The six-grade prose is silent on ungraded 凶煞. The pattern covers families U2/U3 only, and 4.2 % of production rows directly. Not Y-C, because nothing splits; not Y-D, because nothing contradicts |
| **F1-Y** | **F1Y-B**: strong indirect evidence (n14 sole; n62 co-operand) | A direct 立券交易 witness (午-戊申 / 丑-甲申) is still required |

No migration.

## Production and regression

- **Production:** unchanged (authority v4). No change under `shared/almanac-data`, `p4OwnerRules.ts` or `p4Puzhu06.ts`. The Golden v4 / score v5 suites stay green.
- **Diagnostic:** the Y-NARROW model runs only in the test harness.
- **F1 R2 J axis:** unchanged (`liftExclusions.五離`). G2/W1 is CLOSED. P21 is untouched.

## Open debts

1. **Q4-REST J axis:** unresolved for every god; Q4 = yes in force.
2. **F1-Y:** owner decision after a direct 立券交易 witness.
3. **Y-CONVENTION:** the sole-ungraded rows (U1–U3, U5; 336) rest on an implementation default, and the source pattern contradicts it wherever it is tested. U4 (7) and U7 (767) provenance is unverified.
4. **Y scope:** which families (U1/U4/U5/U7) and which of the 16 other gods follow the pattern. Untested; owner extrapolation would be needed.
5. **Unchanged:** P21; puzhu:21 N-A vs N-C.
