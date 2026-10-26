# Q4-REST Stage 2A: review of n126 and the 宜 axis (audit only)

2026-10-26, branch `claude/q4-rest-stage2a-n126-review`, cut from the frozen Stage 1 commit `6b9a9e2` (not amended). **No production, Q4, F1 or owner-ruling change.**

**Who reviewed.** The "independent" review is the same reviewer (Claude, single agent) re-reading the scan at full resolution, without consulting the Stage 1 text first. There was no independent second reviewer.

**Result**

- **The n126 reading holds.** 開倉庫出貨財 is printed on the 忌 line only.
- **J axis: supports GOD-NARROW.** 五虛's 忌 survives 月恩 and 四相.
- **Y axis: 宜 is suppressed, and no rule explains it.**
  - **The suppression is real.** Across the stored corpus, every comparable row (a surviving ungraded remaining-ji 忌 with an independent 宜) prints only_ji, and none prints both_present. That is 21 rows on 7 pages covering 九空, 五虛, 五墓 and 五離, including the F1 witness n14.
  - **Only candidate explanation.** The 卷十 note on the old practice, 「吉神遇凶煞皆從忌而不從宜」. The compilers present it as superseded by the six 等第 grades, so it is not authority.
- **Classification:** N126-B, JI_SUPPORTS_NARROW, YI_SUPPRESSED_UNEXPLAINED.
- **F1:** POTENTIAL_F1_CONFLICT, which opens debt F1-Y.
- **Status: NEEDS_OWNER_REVIEW.**
- **Acquisition:** the 44 Stage 1 targets reduce to 4 J primaries plus 1 F1-Y page.

**Artifacts** in `sources/p4-vol10/q4-rest-stage2a/`:

| File | Contents |
|---|---|
| `pattern-input.json` | Production (v4) state per context × heading wherever a remaining-ji 忌 is kept. Written by `p4Q4RestStage2AModels.test.ts` with `Q4R2A_DUMP=1` |
| `build_review.py` | Deterministic builder (optional OUTDIR). Reads Stage 1, never writes it |
| `n126-review.json` | Fresh reading, authentication, operands, two-axis classification, F1 comparison, stop conditions |
| `grammar-analysis.json` | puzhu:06 clauses, 從忌不從宜 scope, model grammar |
| `corpus-pattern-search.json` | 69 pages (55 searchable), hits, exclusions, suibao correction |
| `acquisition-review.json` | The 44 Stage 1 targets on the J and Y axes |
| `acquisition-plan-v2.json` | Successor plan (supersedes Stage 1's; Stage 1's is untouched) |
| `lock.json` | Hashes, including Stage 1's files and the record files |

Test: `shared/lunar/p4Q4RestStage2AN126Lock.test.ts`.

## 1–3. n126 from the scan

**Method.** Five full-resolution crops of the stored JPG (margin/header, 神 block, two 宜/忌 bands), read directly. The Stage 1 text was compared afterwards and agrees on 宜 and on 忌.

| | |
|---|---|
| Locator | archive.org `06067692.cn` n126 (欽定協紀辨方書 四庫全書本, 月表) |
| SHA-256 | `df862750…6a1e`, equal to every prior record |
| Volume (margin) | 卷二十一 |
| Foliation | not visible on the stored page |
| Header | 丁巳沙中土專滿日 |
| Month | 滿 on a 巳 day ⇒ 建 = 卯 |
| Cross-checks | 月恩 丁 (二月), 四相 丙丁, 相日 巳, 驛馬 巳, 五虛 巳酉丑, 往亡 巳; leaf = cycle + 73 |
| Status | **AUTHENTICATED** as 卯-丁巳 |

Transcription (column breaks ｜):

| | Text |
|---|---|
| 吉神 | 月恩 四相 相日 驛馬 天后 天巫 福德 聖心 |
| 凶神 | 五虛 八風 土符 大煞 往[UNCERTAIN: 亡 printed with a 日-like form] 重日 朱雀 |
| 宜 | 祭祀祈福求嗣會親友結婚姻納采問名解｜除裁衣豎柱上梁經絡開市立券交易納財｜牧養 |
| 忌 | 上冊受封上表章出行上官赴任臨政親民｜嫁娶進人口移徙剃頭求醫療病築隄防修｜造動土修倉庫開倉庫出貨財修置產室開｜渠穿井安碓磑補垣修飾垣牆平治道塗破｜屋壞垣捕捉畋獵取魚乘船渡水栽種破土｜安葬啟攢 |

The one uncertain glyph is not on the target path.

**Target: 開倉庫出貨財 = only_ji.**

| Check | Finding |
|---|---|
| 忌 line | Unbroken in column 3, between 修倉庫 and 修置產室 |
| 宜 line | Absent: column 2 ends 開市立券交易納財, column 3 is 牧養 alone |
| Layout | No split, variant, abbreviation or absorption; all six glyphs clear |

## 4. Operands on 開倉庫出貨財

| Operand | Role | Basis |
|---|---|---|
| 五虛 | 忌 | 「忌修倉庫開倉庫出貨財」; no own lifter on the page |
| 月恩, 四相 | 宜 and puzhu:06 trigger | the 卷十 月恩/四相/時德 宜 list names the heading; neither is a 五虛 lifter |
| 滿日 | 宜 | 「宜…開倉庫出貨財…」. Its own 忌 omits the heading and is itself lifted here |

**Ruled out:**

- **Other 凶神.** 八風, 土符, 大煞, 往亡, 重日 and 朱雀 do not name the heading.
- **Graded subjects.** `resolveP4Grades('卯','丁巳')` has none, so the day has no 等第 grade.
- **Other rules.** No 又為, not 甲日. puzhu:22 needs a 相抵. No 不註宜 line (puzhu:07–10, 土府, 開日, 四忌) names the heading. 卷十's ungraded 不註宜 clauses (重日/復日 with 德, 晦日) do not apply. Nothing in the warehouse audits applies either.

## 5–6. Grammar

The puzhu:06 rule (offset 21817), clause by clause:

| Clause | Role |
|---|---|
| 凡徳合赦願月恩四相時徳等日 | condition |
| 不註忌 + headings | action: withhold 忌 |
| 如遇徳猶忌 | exception 1 |
| 及從忌不從宜之日 | exception 2: a *kind of day* |
| 則仍註忌 | consequence of the exceptions |

- **The clause boundaries are clear.** puzhu:06 only withholds 忌. It never touches 宜. It names 從忌不從宜 as an exception day-class without defining it.
- **Where 從忌不從宜 is defined.** The 等第 grade prose (offset ~9700).
- **The reform note** (offset 9569): 「又按舊本凡吉神遇凶煞皆從忌而不從宜…於理固屬不合…今參互較量除建破等日條例簡易及專忌之日無庸分别外餘分為六等」. The blanket rule is the *old* practice, explicitly rejected and replaced by the six grades. The 宜忌等第表 is not in the raw text; the project grid holds its columns.
- **Scope of 從忌不從宜: NOT ESTABLISHED.** It certainly covers graded subjects. For ungraded 凶煞 (五虛, 九空, 小耗, 五墓, 五離) facing a 吉神's 宜, the text is silent, and the only blanket statement is the superseded one.

| Model | Grammar | n126 |
|---|---|---|
| LIFT-JI | the literal action | contradicted (忌 printed) |
| KEEP-JI (both_present) | needs an exception to keep 忌; puzhu:06 itself never yields both_present | 忌 fits, 宜 contradicted |
| JI-DOMINATES (only_ji) | not required by puzhu:06; would need the superseded blanket rule to persist for ungraded 凶煞 | fits both axes |

Production's both_present for "remaining-ji kept + 宜" is a P4-C convention (`p4DayComposition.ts`: only subject clause effects suppress 宜). It is not a source rule.

## 7. F1: POTENTIAL_F1_CONFLICT (F1 not changed, debt YES)

**F1 rule 3** (owner): independent 宜 on 立券交易 + surviving 五離 忌 ⇒ both_present. Its 4 extrapolated rows (丑-甲申, 午-戊申) are not source-witnessed.

**The F1 witness disagrees on other headings.** On 06067696-n14 (戌-壬申), 五離 survives on 結婚姻 and 納采問名 while 四相 gives them 宜. The page prints both only_ji.

**Corpus.** The other 19 comparable rows agree, and none disagrees.

**Not established:**
- No page shows 五離 × 立券交易 with independent 宜.
- The 從忌不從宜 scope is open.

**New debt F1-Y.**

## 8. Corpus pattern search

**Filter.**
- **Headings:** printed under their own P4 name (22). Differently-worded ones are excluded, not aliased.
- **忌 sources:** remaining-ji kept only. No graded subject, no 又為, not protected.
- **Engine and rules:** the engine state is `both_present`, and no 卷十 rule already withholds the 宜.

**Coverage.** 69 pages. 55 are searchable: 50 from prior full lines, n126 re-read, and 5 read in this stage. Those 5 are 06067692-n10, n46, n90, n114 and 06067695-n52: the only not-yet-searchable pages whose context has a qualifying row. The remaining 14 have no qualifying row.

| Page | Context | God × headings | 宜 operands | Printed |
|---|---|---|---|---|
| 06067692-n10 | 寅-戊辰 | 九空 × 開市 立券 納財 開倉庫 | 滿日 | only_ji ×4 |
| 06067692-n46 | 寅-甲辰 | 九空 × 開市 立券 納財 | 滿日 | only_ji ×3 |
| 06067695-n52 | 申-庚戌 | 九空 × 開市 立券 納財 開倉庫 | 滿日 | only_ji ×4 |
| 06067692-n114 | 卯-乙巳 | 五虛 × 開倉庫 | 滿日 | only_ji |
| 06067692-n90 | 卯-辛巳 | 五虛 × 開倉庫 | 滿日 | only_ji |
| 06067693-n95 | 巳-丙戌 | 五墓 × 嫁娶 牧養 納畜 納采問名 結婚姻 豎柱上梁 | 天德合 | only_ji ×6 |
| 06067696-n14 | 戌-壬申 | 五離 × 結婚姻 納采問名 | 四相 | only_ji ×2 |
| 06067692-n126 (Q4 lift) | 卯-丁巳 | 五虛 × 開倉庫 | 月恩 四相 滿日 | only_ji |

**Totals.** 21 surviving rows plus 1 Q4 row: **all only_ji. Counterexamples: none.** Result: **CONSISTENT_JI_DOMINATES**, across 8 pages, 4 gods and 3 kinds of 宜 source.

**Excluded rows.**
- **n95 安葬:** explained by rule. 復日 + 天德合 「…則不忌亦不註宜」.
- **n95 栽種 and 求醫療病:** the engine reads them undetermined.

Both still print only_ji.

**Suibao correction.** Stage 1 called the 8 `suibao-zhuzhen` scans "other volumes". They are 月表 day leaves; their headers were read here: 巳-丙午, 巳-戊午, 未-丙午, 未-戊午, 亥-戊子, 亥-壬子, 丑-戊子, 丑-壬子.
- None of these contexts carries 九空, 五虛, 小耗 or 五墓, so the 27-candidate count stands.
- None has a qualifying Y row.
- Recorded here only; Stage 1 is not edited.

**Production impact.** Production shows both_present on all 21 rows where the page prints only_ji. Prior audits compared 忌 only, so this was never examined. Open debt **Y-CONVENTION**; production-wide impact is not measured.

## 9. Classification

| Axis | Result | Confidence |
|---|---|---|
| **Overall** | **N126-B**: only_ji confirmed; no source rule explains the 宜 suppression | reading high |
| **J** | **JI_SUPPORTS_NARROW** | medium (one page) |
| **Y** | **YI_SUPPRESSED_UNEXPLAINED** | suppression real, cause unexplained |

**Candidates for the owner (Y):**
1. The superseded old-practice rule still governs ungraded 凶煞.
2. Some reading of 專忌 or of the missing 等第表.

This replaces the Stage 1 single-state C classification for this cell. Stage 1 files are untouched.

## 10. Acquisition review (no acquisition)

The 44 targets on the J and Y axes:

| Usefulness | Targets |
|---|---|
| J_AND_Y | 20 |
| J_ONLY | 9 |
| NON_DECISIVE (九空+五虛 joint) | 10 |
| CONTAMINATED | 5 |
| Y_ONLY | 0 among Stage 1's targets |

The corpus now answers Y for the Q4 gods: 21/21 only_ji. So **J is the open question for Q4-REST, and Y is the open question for F1**.

**Reduction.** One page answers its whole context: 15 pages. A god keeping its 忌 under several non-own triggers shows none of them lifts it, so a greedy cover over (god, trigger) leaves **4 J primaries**.

| Priority | Page | Tests | Locator (HYPOTHESIS) |
|---|---|---|---|
| P0 | 午-戊申 | 五虛 × 月恩, 四相 (J) **and 五離 × 立券交易 with own 宜 (F1-Y)** | 06067694-n50 |
| P0 | 午-戊辰 | 九空 × 月恩, 四相, 時德 (J) | 06067694-n10 |
| P0 | 子-丙寅 | 五虛 × 時德 (J) | 06067697-n8 |
| P0 | 巳-戊戌 | 小耗 × 四相 (J) | 06067693-n107 |
| P2 | 丑-甲申 | 五離 × 立券交易 with own 宜 (F1-Y, the other extrapolated context) | 06067697-n93 |

- **Replication P0** (9): 午-壬辰, 午-庚辰, 午-甲辰, 卯-丁丑, 子-庚寅, 子-戊寅, 子-甲戌, 酉-癸亥, 酉-癸未. If 午-戊辰 shows a lift, 午-壬辰 (時德 alone) tells which trigger did it.
- **P3** (2): 戌-癸亥, 戌-癸卯.
- **五墓:** no J target possible.

## Production, regression, debts

- **No production change.** No change to v4, `p4Puzhu06.ts`, Goldens or scores.
- **Diff vs `6b9a9e2`.** New audit files and two test files only. The Golden v4 / score v5 suites stay green.
- **F1 R2.** Unchanged.
- **G2/W1.** CLOSED.
- **P21.** Untouched.

**Open debts**
1. **Q4-REST:** unresolved for every god; Q4 = yes stays in force.
2. **F1-Y (new):** F1 rule 3 both_present vs the corpus only_ji pattern, including n14. Needs 午-戊申 / 丑-甲申 and an owner decision.
3. **Y-CONVENTION (new):** P4-C both_present for ungraded remaining-ji 忌 + 宜. The corpus contradicts it on 21/21 rows; production-wide impact is not measured.
4. **從忌不從宜 scope for ungraded 凶煞:** an owner question. The candidates are in §9.
5. **Stage 1 inventory wording:** the suibao scans are 月表 leaves (§8). Count unchanged.
6. **Unchanged:** P21; puzhu:21 N-A vs N-C.
