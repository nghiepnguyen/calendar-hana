# P21 Stage 2 — Discriminating witness audit (audit only)

2026-10-26, branch `claude/p21-stage2-witness`, cut from Stage 1 `f2c1394`. Production is unchanged: no code, JSON, flag, Golden or lock outside this directory, and authority stays `p4b-puzhu06-v5`. The task follows from [Stage 1](p21-authority-reconstruction.md), which concluded UNDERDETERMINED.

Artifacts are in [`sources/p4-vol10/p21-stage2/`](sources/p4-vol10/p21-stage2/):

| File | Contents |
|---|---|
| `candidates.json` | W1–W7 screen of every Stage 1 propagation cell (720 contexts). Written by `shared/lunar/p4P21Stage2Candidates.test.ts` |
| `predictions.json` | Candidate status, H1/H2 predictions and page locators. Committed in **`fd11bd2`**, before any new page was fetched |
| `pages/06067696-n82.jpg`, `pages/06067696-n106.jpg` | The two new 月表 pages, fetched after the freeze (owner-approved), unmodified |
| `witnesses.json`, `conclusion.json`, `lock.json` | Built by `build_witnesses.py` |
| `impact.json` | Preliminary read-only N-C impact. Written by `shared/lunar/p4P21Stage2Impact.test.ts` |

Lock harness: `shared/lunar/p4P21Stage2Lock.test.ts`. It also checks that the commit adding `predictions.json` is an ancestor of the commit adding both pages.

**Conclusion: H2_SUPPORTED, scoped to puzhu:21.**

## 1. Clean-witness screen (W1–W8)

The screen runs over the 123 Stage 1 propagation cells (lines 16–22). It reads the production layer without changing it.

| Condition | How it is checked |
|---|---|
| W1 | The trigger has a 宜 and a 相抵 god. puzhu:22 needs both triggers (`requireAll`). A `cancel_both` mark on a trigger with no 宜 does not count (P4-劫) |
| W3 | The target has an independent 忌 (Stage 1 `independent`) |
| W4 / W5 | The target has no 宜, so there is no target-local 相抵 under the adopted 卷十 reading (Option C) |
| W6 | No puzhu:06 trigger god is present (`p4b-puzhu06-v5.triggers`) |
| W7 | The edge is not blocked and the target has no protected 忌 |
| W8 | A 月表 page exists and prints the target's line |

Result: **2 clean candidates out of 123 cells**, both puzhu:21:

- 亥-丁酉;
- 亥-癸酉.

Neither was in the repository. Every puzhu:22 cell fails W1, W4/W5 or W6.

Coverage:

- **Stored pages:** 69 locked 月表 pages with a transcribed 忌 line. 24 of the 57 candidate contexts have a page.
- **Date-dependent cells:** the 40 dated-only cells in 2025–2027 never touch puzhu:21 or 22.
- **Limitation:** contexts that need a date to resolve and fall outside 2025–2027 were not screened.

## 2. Prediction freeze (`fd11bd2`)

| ID | Locator | Trigger | Target | H1 | H2 |
|---|---|---|---|---|---|
| P21S2-亥-癸酉 | 06067696.cn n82 | 開市 (宜 開日; also 納財 via 母倉) vs 災煞 | 立券交易, 五離 independent, no 宜 | absent | printed (五離) |
| P21S2-亥-丁酉 | 06067696.cn n106 | same | same | absent | printed (五離) |

Pre-declared contamination checks:

- the page must itself show 開市 unnoted (災煞 / X相抵 is unaudited);
- no 五離 lifter may be printed.

Locators came from leaf calibration on stored pages: the 亥 block of 06067696 is cycle index + 73.

## 3. Witnesses

**Authentication.** Both pages are authenticated by their header pillar and 建除 officer (開日, as expected for 亥 month and a 酉 day).

**Reading method.** Both pages were read by eye from the full-resolution JPG, with no OCR. The 忌 columns were re-read on crops.

| | n82 (亥-癸酉) | n106 (亥-丁酉) |
|---|---|---|
| Header | 癸酉劒鋒金義開日 | 丁酉山下火制開日 |
| 吉神 | 母倉 時陽 生氣 聖心 除神 鳴吠 | same |
| 凶神 | 災煞 天火 五離 朱雀 | same |
| 宜 | 祭祀入學沐浴掃舍宇 | same |
| 忌 | 會親友冠帶結婚姻納采問名嫁娶進人口求醫療病經絡醞釀**立券交易**伐木畋獵取魚 | 會親友冠帶結婚姻納采問名嫁娶進人口剃頭求醫療病經絡醞釀**立券交易**伐木畋獵取魚 |
| Trigger realised (W1) | yes: 開市 on neither line; 納財 absent | yes |
| Target | **printed** | **printed** |
| Classification | **CLEAN_H2** | **CLEAN_H2** |

Level A checks behind W1/W4, from the 卷十一 lists (四庫 transcription, `xiejibianfangshu-yiji.json`):

- **立券交易 宜:** 天願民日三合滿日六合五富五合. No printed 吉神 is in it, so W4 and W5 hold.
- **立券交易 忌:** includes 災煞 and 五離.
- **開市 宜** includes 開日, and **開市 忌** includes 災煞. So W1 holds.
- **納財 宜** includes 母倉.
- **災煞 entry (卷十):** 「寅申巳亥月…不與德神併凡所忌者則不註宜所宜者亦不註忌」.
- **No 五離 lifter** (德 / 合 / 赦 / 三合 / 六合) is printed.
- **百忌 丁/癸/酉** do not touch 立券交易 (W7).

### Control and alternative explanations

**n30 (寅-戊子) is the control.** It was read in an earlier stage, and this use of it is post hoc. Classification: NOT_DISCRIMINATING.

- It has the same 災煞 開日 clause, and 開市 and 納財 are unnoted as triggers.
- 立券交易 has no 宜 and no independent 忌, and it is **absent**. The compiler therefore applies puzhu:21. This rules out "puzhu:21 not applied" as an explanation for n82/n106.
- 嫁娶, 結婚姻 and 納采問名 have no 宜, carry only 災煞, and are **printed**. So no-宜 headings keep 災煞, and the target has no local 相抵.

**H1 explanation.** With puzhu:21 applied, H1 would remove 五離 from 立券交易 on n82/n106. Both pages print it.

**Open point (not P21): 開倉庫出貨財 on n82/n106.**

- It is absent. Its own 宜 list (月恩四相時德滿日五富) has nothing printed, and 災煞 lists it.
- **Under H1:** puzhu:22 fires because 立券交易 is unnoted. That fits, but the page contradicts H1 on 立券交易.
- **Under H2 with a heading-level puzhu:22 trigger:** 開倉庫 should print, and it does not.
- **Under H2 applied to the trigger as well** (「不註忌開市立劵交易」 read as 災煞's 忌 being withheld on both): every heading fits. That reading was formed after the pages were read.

The point concerns puzhu:22's trigger semantics, not puzhu:21's scope. It stays open and caps confidence.

### Every other witness

| Page | Context | Line | Classification | Reason |
|---|---|---|---|---|
| n117 | 未-戊申 | 21 | NOT_DISCRIMINATING | 納財 printed (trigger not realised); W6 四相 |
| n81 / n105 / n129 | 未-壬申/丙申/庚申 | 21 | CONTAMINATED | W1: trigger only under P4 `cancel_both`; triad printed |
| n130 | 亥-辛酉 | 21 | NOT_DISCRIMINATING | triggers keep 四耗, printed |
| n112 | 巳-癸卯 | 21 | NOT_DISCRIMINATING | 立券交易 has its own 宜 (五合) |
| n17 / n29 / n41 | 戌-乙亥/丁亥/己亥 | 22 | CONTAMINATED | W4/W5: target 宜 五富, local 相抵 |
| n65 | 戌-癸亥 | 22 | CONTAMINATED | W4/W5/W6 (四相) |
| n11 / n23 / n35 / n47 | 辰-己巳/辛巳/癸巳/乙巳 | 22 | CONTAMINATED | W4/W5 |
| n107 | 卯-戊戌 | 22 | CONTAMINATED | W1; 月虛 is 月煞 又為 (W7) |

Tally: CLEAN_H2 2, CLEAN_H1 0, NOT_DISCRIMINATING 4, CONTAMINATED 12.

**puzhu:22 analogues.** Stage 1's 3/4 split (戌 vs 辰) is CONTAMINATED on both sides, because the target has its own 五富 宜 and 相抵. It is an unresolved Level A inconsistency about H1-B / puzhu:22, not a clean puzhu:21 contradiction.

**n117 variants.** None acquired:

- Wikisource 卷29/卷25 transcribe only the day headers, not the tables.
- The only other edition found is the 乾隆六年內府刊朱墨套印本 PDF (書格, about 1.17 GB). The owner chose not to fetch it.

So SOURCE_VARIANT_CONFLICT is **not tested**. n117 is non-discriminating either way.

## 4. Dependencies

| Item | Status |
|---|---|
| X相抵 (災煞) | Not resolved as an authority item. On these pages the 災煞 pattern is observed directly, and W1 does not depend on the reading (開市 has a 宜) |
| P4-劫 | Only affects contaminated 未 cells. Not needed |
| 五離 (F1 R2) | Data overlap only. 五離 is the independent 忌; nothing migrated |
| G2/W1, Q4-REST, Y-CONVENTION, BAIJI-Y, U4/U7 | Not touched |
| Owner precedent 2026-10-17 (H1-B; puzhu:22 withholds 月虛) | Project convention, not source authority, and in tension with this result. For Stage 3 |

## 5. Conclusion

**H2_SUPPORTED, for puzhu:21 only.** The supported configuration: the triad trigger is unnoted by 相抵, and an independent 忌 (五離) on 立券交易 survives.

Gate check:

| Condition | Status |
|---|---|
| CLEAN_H2 Level A witnesses | 2, both blind |
| CLEAN_H1 | 0 |
| Unresolved contradictory Level A on puzhu:21 | none |

**Authority level:** A (scan-locked 月表 pages), supported by A-transcribed 卷十一 lists. Level C and D were not used for the gate.

**Confidence: medium-high.** Limits:

- one edition, and two near-identical pages from one month block;
- one AI reader;
- a post hoc control;
- an open 開倉庫 corollary.

**Not extended to:** puzhu:22, other propagation lines, or a general "propagated 不註 is contribution-scoped" rule.

## 6. Preliminary N-C impact (read-only)

This is measured by wrapping the P4 provider inside a test only, so that 立券交易 reads `only_ji` on the 8 Stage 1 dates.

| | Value |
|---|---|
| Dates | 2025-07-26, 2025-11-24, 2026-07-21, 2026-08-02, 2026-11-19, 2027-07-16, 2027-07-28, 2027-11-14 |
| Activities | 16 rows (contract 8, transaction 8): neutral → avoid, score −30 |
| Hard warnings | 0 changes |
| Events | 72 records changed: sign_contract, buy_vehicle, buy_property, property_handover 16 each; receive_vehicle 8. 48 classification changes (caution → not_recommended) |
| Golden estimate | successors for the P4 score Golden (v6), full Golden (v4) and owner-rules Goldens; a `p4-adapter-baseline-v1` lock revision; a migration diff; `ci:p4:full` |

The premise differs by date, and only one group is source-witnessed:

| Dates | Context | Premise |
|---|---|---|
| 2025-11-24, 2026-11-19, 2027-11-14 | 亥-丁酉 | **source-witnessed** (n106) |
| 2026-08-02, 2027-07-28 | 未-戊申 | LOCAL owner ruling |
| 2025-07-26, 2026-07-21, 2027-07-16 | 未-丙申 | P4-layer only (P4-劫) |

A migration has to decide whether N-C applies to all of these.

## 7. Stage 3 recommendation

**P21 Stage 3 is an owner ruling, then a migration if adopted.** The owner needs to decide three things:

- adopt N-C for puzhu:21, as a successor authority or policy with N-A kept as the rollback pin;
- whether the 未 cells, whose triggers are not source-witnessed, are included;
- how to treat the 2026-10-17 puzhu:22 precedent. The recommendation is to leave it unchanged: this result does not reach puzhu:22.

The default projection test in Stage 1 pins N-A, so a migration must re-point it. `PROJECT_CONTEXT.md` is left for the owner to update.
