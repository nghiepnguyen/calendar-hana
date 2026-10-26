# Q4-REST Stage 2B: targeted witness acquisition (audit only)

2026-10-26, branch `claude/q4-rest-stage2b-witness-acquisition`, cut from `2862d6d` (Stage 2A.1). Stage 1 (`6b9a9e2`), 2A (`cf4c1e9`) and 2A.1 are frozen and not amended. **No production change, no Golden change, no migration.** Reviewer: Claude, single agent, reading the scans directly; no independent second review.

**Owner gates for this stage**

| Item | Gate |
|---|---|
| Q4 J axis | acquisition approved, production change not approved |
| F1-Y | direct-witness acquisition approved, production change not approved |
| F1 R2 J axis | CLOSED and valid |
| Y-CONVENTION | SOURCE_PATTERN_CONFIRMED, SEMANTICS_UNRESOLVED. Investigate sole-ungraded families U1/U2/U3/U5 only; U4/U7 quarantined |

**Result: all six primary pages were acquired and authenticated at their predicted locators.**

| Question | Result |
|---|---|
| J axis | Every clean cell keeps the target god's 忌 under a generic trigger: 九空 2 pages, 五虛 3 (with Stage 1's n126), 小耗 1 |
| F1-Y | Both direct 立券交易 witnesses print **only_ji** with a clean independent 宜: **F1Y-E1** |
| Y axis | 26 new cells, **all only_ji**, none both_present: 15 sole-ungraded, 5 quarantined U4/U7, 3 with production undetermined, 3 百忌 |

**Artifacts** in `sources/p4-vol10/q4-rest-stage2b/`:

| File | Contents |
|---|---|
| `pages/*.jpg` | The six scans |
| `runtime.json` | Production (v4) owner-rules rows of the six contexts and of the replication candidate 戌-癸卯. Written by `p4Q4RestStage2BRuntime.test.ts` with `Q4R2B_DUMP=1` |
| `build_evidence.py` | Deterministic builder (optional OUTDIR) |
| `pages.json` | Locators, hashes, authentication |
| `transcriptions.json` | Raw and normalized 宜/忌 lines, with hashes |
| `operands.json` | Operands per heading |
| `j-axis.json` | J cells and aggregates |
| `y-axis.json` | Y cells and families |
| `f1-y.json` | F1-Y table |
| `classification.json` | Gates |
| `replication-plan.json` | Replication proposal |
| `lock.json` | Hashes |

Test: `shared/lunar/p4Q4RestStage2BLock.test.ts`.

## 1. Acquisition and authentication

**Retrieval.** `curl --fail` of `https://archive.org/download/<item>.cn/page/<leaf>_w1200.jpg`, images unmodified. Each page was read whole, then in full-resolution crops of the 宜/忌 block.

| Priority | Context | Locator (predicted → confirmed) | SHA-256 | Header | Officer → month | Foliation |
|---|---|---|---|---|---|---|
| P0 | 午-戊申 | 06067694-n50 ✓ | `3f099e36…9e` | 戊申大驛土寶滿日 | 滿 on 申 → 午 | [UNCERTAIN: 二十五] |
| P0 | 子-丙寅 | 06067697-n8 ✓ | `4504919b…1d` | 丙寅鑪中火義滿日 | 滿 on 寅 → 子 | 四 |
| P0 | 巳-戊戌 | 06067693-n107 ✓ | `87cf66ce…a8` | 戊戌平地木專執日 | 執 on 戌 → 巳 | [UNCERTAIN: 三十] |
| P1 | 卯-丁丑 | 06067692-n86 ✓ | `6c57e127…d9` | 丁丑澗下水寶開日 | 開 on 丑 → 卯 | not visible (margin 卷二十一) |
| P1 | 丑-甲申 | 06067697-n93 ✓ | `f9995cbf…45` | 甲申井泉水伐危日 | 危 on 申 → 丑 | 十三 |
| P1 | 午-戊辰 | 06067694-n10 ✓ | `0ce9802b…b2` | 戊辰大林木專開日 | 開 on 辰 → 午 | 五 |

- **Status: all AUTHENTICATED.** No replacement or fallback page was used.
- **Uncertainty.** The only uncertain glyphs are two foliation numbers, neither on any tested heading.

**Transcriptions** (column breaks ｜). The god lists are in `transcriptions.json`.

| Context | 宜 | 忌 |
|---|---|---|
| 午-戊申 | 祭祀祈福求嗣上冊受封上表章襲爵受封｜出行上官赴任臨政親民嫁娶進人口移徙｜解除沐浴剃頭整手足甲求醫療病裁衣修｜造動土豎柱上梁經絡開市納財補垣塞穴｜掃舍宇栽種牧養 | 會親友結婚姻納采問名安牀修倉庫立券｜交易開倉庫出貨財 |
| 子-丙寅 | 上冊受封上表章會親友出行進人口解除｜裁衣修造動土豎柱上梁經絡開市立券交｜易納財補垣塞穴栽種牧養破土啟攢 | 祭祀襲爵受封上官赴任臨政親民結婚姻｜納采問名移徙遠迴求醫療病修倉庫開倉｜庫出貨財 |
| 巳-戊戌 | 祭祀祈福求嗣上表章襲爵受封會親友上｜官赴任臨政親民結婚姻納采問名嫁娶移｜徙解除沐浴剃頭整手足甲求醫療病裁衣｜修造動土豎柱上梁捕捉栽種牧養 | 出行修倉庫開市立券交易納財開倉庫出｜貨財 |
| 卯-丁丑 | 祭祀祈福求嗣上冊受封上表章襲爵受封｜會親友入學出行上官赴任臨政親民結婚｜姻納采問名嫁娶移徙解除求醫療病裁衣｜修造動土豎柱上梁修置產室開渠穿井安｜碓磑牧養納畜 | 冠帶進人口剃頭修倉庫鼓鑄開市立券交｜易納財開倉庫出貨財補垣塞穴伐木畋獵｜取魚乘船渡水栽種 |
| 丑-甲申 | 祭祀上表章襲爵受封出行上官赴任臨政｜親民移徙沐浴剃頭整手足甲裁衣修造動｜土豎柱上梁修倉庫經絡醞釀開市納財掃｜舍宇伐木畋獵栽種牧養納畜破土安葬 | 祈福求嗣會親友結婚姻納采問名安牀解｜除求醫療病立券交易開倉庫出貨財 |
| 午-戊辰 | 祭祀祈福求嗣上冊受封上表章襲爵受封｜會親友入學出行上官赴任臨政親民結婚｜姻納采問名移徙解除求醫療病裁衣修造｜動土豎柱上梁修置產室開渠穿井安碓磑｜栽種牧養 | 進人口修倉庫開市立券交易納財開倉庫｜出貨財伐木畋獵取魚 |

**Layout checks.**
- 立券交易 wraps on 午-戊申 (立券｜交易), 子-丙寅 (宜: 立券交｜易) and 卯-丁丑 (立券交｜易).
- 開倉庫出貨財 wraps on 子-丙寅 (開倉｜庫出貨財), 巳-戊戌 (開倉庫出｜貨財) and 午-戊辰 (開倉庫｜出貨財).
- Every wrap was checked across adjacent columns.

## 2. Operands

**Method.** Each tested heading's operands come from:
- the 卷十一 lists, intersected with the page's gods, officer and day stem/branch (百忌);
- the production owner-rules rows (`runtime.json`).

**No other transformation reaches a tested heading.** None has a 相抵 (so puzhu:21/22 do not apply), a 又為 scope, a graded subject or a dated rule. 百忌 appears only where noted.

## 3. J axis (clean cells only)

**Predictions** come from Stage 1 `models.json`: generic = v4, narrow = own lifters only.

| Page | God × heading | Non-own trigger | Other 忌 | Generic | Narrow | Printed | J |
|---|---|---|---|---|---|---|---|
| 午-戊申 | 五虛 × 開倉庫出貨財 | 月恩 四相 | — | only_yi | both_present | only_ji | **J-NARROW** |
| 子-丙寅 | 五虛 × 開倉庫出貨財 | 時德 | — | only_yi | both_present | only_ji | **J-NARROW** |
| 巳-戊戌 | 小耗 × 開市 / 立券交易 | 四相 | — | not_recorded | only_ji | only_ji | **J-NARROW** |
| 巳-戊戌 | 小耗 × 納財 | 四相 | — | only_yi | both_present | only_ji | **J-NARROW** |
| 卯-丁丑 | 九空 × 開市 / 納財 | 月恩 四相 | — | only_yi | both_present | only_ji | **J-NARROW** |
| 卯-丁丑 | 九空 × 立券交易 | 月恩 四相 | — | not_recorded | only_ji | only_ji | **J-NARROW** |
| 午-戊辰 | 九空 × 開市 / 納財 | 月恩 四相 時德 | — | only_yi | both_present | only_ji | **J-NARROW** |
| 午-戊辰 | 九空 × 立券交易 | 月恩 四相 時德 | — | not_recorded | only_ji | only_ji | **J-NARROW** |

**Not clean:**
- 巳-戊戌 開倉庫出貨財: contaminated by 天賊.
- 卯-丁丑 and 午-戊辰 開倉庫出貨財: 九空 and 五虛 together, so joint only.
- 午-戊申 and 丑-甲申 五離 × 立券交易: consistent with the closed R2.

| God | Classification | Witnesses | Triggers tested | Untested non-own triggers |
|---|---|---|---|---|
| 九空 | **J-B** (2 pages, 6 cells) | 卯-丁丑, 午-戊辰 | 月恩, 四相, 時德 (時德 only together with 月恩/四相) | 天德, 天赦, 天願 |
| 五虛 | **J-B** (3 pages) | 午-戊申, 子-丙寅, n126 (Stage 1) | 月恩, 四相, 時德 (alone on 子-丙寅) | 天赦 |
| 小耗 | **J-B** (1 page, 3 cells) | 巳-戊戌 | 四相 | 天赦, 時德, 月恩 |
| 五墓 | J-D | — | — | no discriminating context exists (Stage 1) |

There are no J-GENERIC cells and no conflicts. Each god is classified separately; there is no combined ruling.

## 4. F1-Y

| Context | 五離 active (no own lifter) | Independent 宜 on 立券交易 | Other 忌 | Printed 立券交易 | Production | Clean? |
|---|---|---|---|---|---|---|
| 午-戊申 (n50) | yes (月恩, 四相 are not 五離 lifters) | 滿日 | none (五虛 does not list it; 百忌申 is 安牀) | **only_ji** | both_present | **yes** |
| 丑-甲申 (n93) | yes (四相 is not a lifter) | 五富 | none (遊禍 does not list it; 百忌甲 is 開倉庫) | **only_ji** | both_present | **yes** |

**Control.** On each page the same 宜 source (滿日, 五富) prints on 開市 and 納財, where nothing holds 忌, and disappears only on 立券交易 (五離) and 開倉庫出貨財 (五虛 / 百忌甲).

**Classification: F1Y-E1.** Two clean direct witnesses agree on only_ji, against F1 rule 3 (both_present). Each page also prints 結婚姻 and 納采問名 as only_ji under 五離 + 四相 宜.

Production is unchanged and still reads both_present; F1-Y has not been migrated.

## 5. Y axis (new evidence, reported by family)

**Scope.** Y cells are headings where the page prints the surviving 忌 and an independent 宜 operand is present. 修倉庫 is left out (its 宜 is conditional, rule D), as is 宴會 (printed as 會親友).

| Family | Cells | Printed | Examples |
|---|---:|---|---|
| U1 sole, mixed 宜 | 2 | only_ji ×2 | 午-戊申 / 子-丙寅 五虛 × 開倉庫出貨財 (Q4 trigger + 滿日) |
| U2 sole, officer 宜 | 2 | only_ji ×2 | 卯-丁丑 / 午-戊辰 九空 × 開市 (開日) |
| U3 sole, 吉神 宜 | 9 | only_ji ×9 | 九空/小耗 × 納財; 五離 × 結婚姻/納采問名 (午-戊申, 丑-甲申); 滿日 × 結婚姻/納采問名 (子-丙寅) |
| U5 kept by puzhu:06 | 2 | only_ji ×2 | 午-戊申 / 丑-甲申 五離 × 立券交易 |
| U4 multiple 忌 (quarantined) | 2 | only_ji ×2 | 卯-丁丑 / 午-戊辰 九空+五虛 × 開倉庫出貨財 |
| U7 protected (quarantined) | 3 | only_ji ×3 | 巳-戊戌 天賊+小耗 × 開倉庫; 丑-甲申 遊禍 × 祈福/求嗣 |
| Production undetermined (separated, as in Stage 2A) | 3 | only_ji ×3 | 子-丙寅 滿日 × 求醫療病; 卯-丁丑 九焦 × 栽種; 丑-甲申 遊禍 × 求醫療病 |
| 百忌 only (not ungraded; separate finding BAIJI-Y) | 3 | only_ji ×3 | 子-丙寅 祭祀; 丑-甲申 安牀, 開倉庫出貨財 |

**Totals.**
- New only_ji: **26**, made up of 15 sole-ungraded (U1/U2/U3/U5), 5 quarantined (U4 2, U7 3), 3 production-undetermined and 3 百忌.
- New both_present: **0**. Counterexamples: **0**.

**卯-丁丑 family probe.** It yields U4 ×2 (clean: 九空 + 五虛 on 開倉庫出貨財). Its only U7 example (九焦 × 栽種) sits on a production-undetermined row, so it is not counted as U7.

**BAIJI-Y (new, separate).** Production gives both_present where a 百忌 heading meets an independent 宜; all three pages print only_ji. puzhu:07–10 (e.g. 「凡夘日忌穿井不註宜開渠」) withhold 宜 even from the companion heading, which implies the 百忌 heading carries none. The population is not measured.

**Scope discipline.**
- **U1 and U5** now have direct source examples; Stage 2A.1 had none.
- **U4 and U7:** source examples exist (**U4/U7 SOURCE EXAMPLE EXISTS**), and that is all this stage claims. Five U7 cells on 3 pages do not authorize the 767 U7 rows, and two U4 cells do not authorize the U4 rows.
- **No global Y rule** is drawn.

## 6. Replication gate

| Trigger condition | Status |
|---|---|
| A god with one clean J witness | **小耗** (巳-戊戌). The only other discriminating context is **戌-癸卯**. Stage 1 labelled it contaminated only because the graded 大時 appears in its source list, but production `trace.ji` is `['小耗']` on 開市, 立券交易, 納財 and 開倉庫出貨財, and the generic model lifts all four, so 大時 holds no 忌 there. It is a **conditional** replication target: clean if the grade model holds, and weaker than the six acquired pages |
| F1-Y with one witness | no: two |
| Conflicts | none |
| Trigger-specific behaviour | none observed |

**Minimum required set:** 戌-癸卯 (06067696-n45, HYPOTHESIS), 小耗 × 四相. Proposed only, not acquired.

**Optional:** 午-壬辰 (06067694-n34, HYPOTHESIS) would test 九空 under 時德 alone. Proposed only, not acquired.

## 7. Owner gate

| Item | Gate |
|---|---|
| 九空 | READY_FOR_OWNER_RULING (J-B, 2 pages; 天德/天赦/天願 untested) |
| 五虛 | READY_FOR_OWNER_RULING (J-B, 3 pages; 天赦 untested) |
| 小耗 | NEEDS_REPLICATION (戌-癸卯, conditional) |
| F1-Y | READY_FOR_OWNER_RULING (F1Y-E1) |
| Y-CONVENTION | EVIDENCE_EXPANDED (U1–U3/U5 strengthened; U4/U7 examples only) |

## Production and regression

- **Production:** unchanged (v4). No change under `shared/almanac-data`, `p4OwnerRules.ts` or `p4Puzhu06.ts`, and Stage 1/2A/2A.1 artifacts are untouched. The Golden v4 / score v5 suites stay green.
- **F1 R2 J axis:** unchanged. G2/W1 is CLOSED. P21 is untouched.

## Open debts

1. **Q4-REST:** owner ruling on 九空 and 五虛; 小耗 has one page.
2. **F1-Y:** owner ruling. Both direct witnesses contradict F1 rule 3.
3. **Y-CONVENTION:** U1–U3/U5 strengthened (15 new). U4/U7 stay quarantined, and so do the other 16 ungraded gods (new example: 滿日 U3 ×2).
4. **BAIJI-Y (new):** 百忌 heading + independent 宜 → production both_present; the pages print only_ji (3 cells). Population not measured.
5. **Unchanged:** P21; puzhu:21 N-A vs N-C.
