# F1 Stage 1: 五離 × 立券交易, witness acquisition (audit only)

2026-10-26. Branch `claude/f1-witness-acquisition`, cut from `origin/main` `f66c74f` (PR #105 merged). No production behaviour changes.

This audit covers F1: the 五離 × 立券交易 heading authority. G2-n117 / W1 is **CLOSED** and stays closed.

Artifacts are in `sources/p4-vol10/f1-wuli-lijuan-stage1/`:

- `build_evidence.py`, `evidence.json`, `lock.json`;
- `pages/06067696-n14.jpg` and `pages/06067696-n62.jpg`, the two downloaded scans, unmodified.

The harness is `shared/lunar/p4F1WuliLijuanStage1Lock.test.ts`.

**Classification: F1-B, SUPPORTS WULI-NARROW.** Two decisive witnesses agree.

## Question

When 五離 forbids 立券交易, does a puzhu:06 trigger lift that 忌? The two models give different answers:

| Model | Rule | Prediction for 立券交易 |
|---|---|---|
| **Q4** (owner-adopted) | A puzhu:06 trigger such as 四相 or 月恩 lifts 五離's 忌 | not on the 忌 line |
| **WULI-NARROW** | 五離 stays 忌 unless one of its own lifters applies: 「與天德月德天德合月德合天赦三合六合併則不忌」 | on the 忌 line |

## 1. Baseline

| Item | Value |
|---|---|
| `origin/main` | `f66c74f` = local `main` (fast-forwarded from `aebcf2e`) |
| PR #105 | present: merge `f66c74f`, which contains `3afb22d`, `2752d02` and `3f831f5` |
| G2 Stage 3 closure on main | yes. `p4-g2-n117-stage3-owner-ruling.md` and `g2-n117-stage3/owner-ruling.json` (`w1: CLOSED`) are present, and the item header reads CLOSED. |
| Working tree | clean apart from the untracked `.claude/` |

## 2. Repository search

Searched the current tree and the full git history (`git log --all -S`, including deleted files) for 戌壬申, 戌-壬申, 戌庚申, 戌-庚申, `06067696` and the leaves n14 and n62.

- **No scan, transcription or deleted file exists for either target.** The only hits are model rows: the puzhu:06 sweep, full-Golden context tables and the G2-n117 Stage 2 / 3 references.
- **Where n14 and n62 come from.** Stage 2 reasoned from `06067696-n63` = 辛酉 at one leaf per pillar.
- **Calibration this Stage.** On all six committed 戌月 leaves (n17 乙亥, n29 丁亥, n41 己亥, n53 辛亥, n63 辛酉, n65 癸亥), the leaf number equals the 60-cycle index plus 6. That gives 壬申 (index 8) → n14 and 庚申 (index 56) → n62.

## 3. Acquisition

- **Source:** the same collection and edition as the existing 月表 corpus: archive.org item `06067696.cn` (欽定協紀辨方書, 四庫全書本, 卷二十八).
- **Method:** `curl --fail` of `page/n14_w1200.jpg` and `page/n62_w1200.jpg`, the same w1200 size used by every committed page.
- **Images:** saved byte-for-byte and never modified.
- **Format:** follows the repository convention for committed page JPGs, about 640 KB each.

## 4. Authentication

The check is based on page content, not the filename.

| | 06067696-n14 | 06067696-n62 |
|---|---|---|
| Archive filename | `n14_w1200.jpg` | `n62_w1200.jpg` |
| sha256 | `a3a5180ff7d004d4acbbb7752ef41b192a6e2a8410b0546cf6881c0270b7c127` | `6c2097b8787c0ea848340c45df1cb379e40503849347721b96349c9092c83a9a` |
| Header | 壬申劍鋒金義開日 | 庚申石榴木專開日 |
| Foliation | 七 | 三十一 |
| Pillar | 壬申 | 庚申 |
| Officer | 開 | 開 |
| Month, from content | 戌: 開 on a 申 day puts 建 on 戌. 四相 on 壬 also fits autumn. | 戌: 開 on a 申 day puts 建 on 戌. 月恩 on 庚 also fits 戌. |
| Month, from leaf block | 戌, supporting only | 戌, supporting only |
| Prediction | n14 **correct** | n62 **correct** |
| Result | **AUTHENTICATED: 戌-壬申** | **AUTHENTICATED: 戌-庚申** |

## 5. Transcription

The raw text is kept as read, with ｜ marking a column break. Both pages print the heading in the 券 form, as on every earlier 月表 read. Normalization uses only the G2 mapping 立劵交易 → 立券交易, so for these pages it changes nothing.

**戌-壬申 (n14)**

- 吉神: 月空 四相 王日 驛馬 天后 時陽 生氣 六儀 金堂 除神 金匱 鳴吠
- 凶神: 厭對 招搖 五離
- 宜: 祭祀祈福求嗣上冊受封上表章襲爵受封｜入學出行上官赴任臨政親民移徙解除沐｜浴剃頭整手足甲求醫療病裁衣修造動土｜豎柱上梁**開市納財**開倉庫出貨財修置產｜室安碓磑掃舍宇栽種牧養
- 忌: 會親友結婚姻納采問名嫁娶安牀**立券交｜易**開渠伐木畋獵取魚乘船渡水

**戌-庚申 (n62)**

- 吉神: 月恩 王日 驛馬 天后 時陽 生氣 六儀 金堂 除神 金匱 鳴吠
- 凶神: 厭對 招搖 五離 八專
- 宜: 祭祀祈福求嗣上冊受封上表章襲爵受封｜入學出行上官赴任臨政親民移徙解除沐｜浴剃頭整手足甲求醫療病裁衣修造動土｜豎柱上梁**開市**開倉庫出貨財修置產室開｜渠穿井安碓磑掃舍宇栽種牧養
- 忌: 會親友結婚姻納采問名嫁娶安牀經絡**立｜券交易**伐木畋獵取魚乘船渡水

## 6. Operand reconstruction (source-rule layer)

| | 戌-壬申 | 戌-庚申 |
|---|---|---|
| 五離 present / active | yes / **yes** | yes / **yes** |
| 五離's own lifters (天德 月德 天德合 月德合 天赦 三合 六合) | none | none |
| puzhu:06 trigger | **四相** | **月恩** |
| Other 立券交易 忌 operands (卷十一 list) | none: 厭對 and 招搖 are not in the list | none: 厭對, 招搖 and 八專 are not in the list |
| 立券交易 宜 operands (天願 民日 三合 滿日 六合 五富 五合) | none | none |
| Other 凶神 entries (卷十) | 厭對 忌嫁娶; 招搖 忌取魚乘船渡水 | the same, plus 八專 忌…結婚姻納采問名嫁娶 (no 立劵交易) |

Checks against puzhu:06's own exceptions and other 鋪註:

- **從忌不從宜:** no 等第-graded subject god is on either page, so that route is closed.
- **遇德猶忌:** no 德 is present.
- **Other 鋪註:** the only other line naming 立劵交易 is the 二至二分 line, which applies to solstice and equinox dates, not to a pillar page.
- **puzhu:21 / 22:** these need 相抵 on the triad. 開市 and 納財 are 宜-only and carry no 忌, so there is no 相抵.

**Decisive: both witnesses.** The two models predict different prints, and no other operand, rule or exception interferes.

## 7. Comparison matrix

| Witness | Context | 五離 active | Q4 trigger | 五離 lifter | Other 忌 | Other 宜 | 開市 | 立券交易 | 納財 | Decisive |
|---|---|---|---|---|---|---|---|---|---|---|
| 06067694-n117 | 未-戊申 | yes | 四相 | none | **劫煞** | none | — | 忌 | 忌 | no (baseline) |
| **06067696-n14** | 戌-壬申 | yes | 四相 | none | none | none | 宜 | **忌** | 宜 | **yes** |
| **06067696-n62** | 戌-庚申 | yes | 月恩 | none | none | none | 宜 | **忌** | — | **yes** |

The four layers for the two targets are kept apart:

| Layer | 戌-壬申 | 戌-庚申 |
|---|---|---|
| **Page observation** | 立券交易 on 忌 | 立券交易 on 忌 |
| **Source-rule derivation** | Q4 predicts not 忌; WULI-NARROW predicts 忌. Decisive. | same |
| **Project interpretation** (puzhu:06 sweep, owner Q4) | 2025-10-30: only_ji → **not_recorded** (QL lift); raw 忌 source [五離] | 2025-10-18: only_ji → **not_recorded** (QL lift); raw 忌 source [五離] |
| **Current production** (observed in G2 Stage 2, unchanged) | contract 50 no_evidence; 五離 lifted | contract 50 no_evidence; 五離 lifted |

The page disagrees with both the project model and current production on both dates. That is recorded as a fact, and nothing is changed.

## 8. Classification

**F1-B: SUPPORTS WULI-NARROW.**

- Two independent, decisive, authenticated witnesses from the same edition agree.
- On each, a non-lifter puzhu:06 trigger (四相, 月恩) meets an active 五離, and 立券交易 is printed on the 忌 line.

**Confidence:** high for the page facts and the decisiveness of both witnesses. It is moderate for generalization, because both witnesses share one month (戌) and one officer (開).

**Scope.** F1-B covers 五離 under a non-lifter puzhu:06 trigger, on 立券交易 only. It does **not** extend to:

- the other Q4-class gods: 九空, 五虛, 小耗, 五墓;
- other headings.

**Sizing for Stage 2.** In 2025–2027 the frozen sweep has 68 QL-lift rows. In 12 of them, all 立券交易, the only lifted remaining-ji source is 五離. Q1–Q3 are already "no", so if Stage 2 narrows Q4 for 五離, little of puzhu:06 is left for 五離 days. This has not been measured against production.

## 9. Implication for n117 (not reconciled here)

- n117's printed 立券交易 忌 is **consistent with** WULI-NARROW.
- It is not a third witness, because 劫煞 confounds it.
- This Stage does not call n117 correct, and it does not call Q4 an error. That reconciliation is the job of F1 Stage 2.
- The 劫煞 cell and W1 are unaffected under every reading: 劫煞 × 立券交易 = BLANK / I1 by the LOCAL owner ruling D1(a).

## 10. Side observations (outside F1)

- **安牀** is printed 忌 on both pages. Its raw 忌 sources in the baseline are empty (a fixed day rule), and the model leaves it untouched by puzhu:06. It does not confound 立券交易.
- **納財 on 戌-庚申** appears on neither line, although 月恩 is in the 卷十一 納財 宜 list and the model has only_yi. It is not used in this audit and does not weaken n14.
- **經絡** is printed 忌 on 戌-庚申, an 八專 day. It is not modelled as a P4 heading.

## 11. Production

No behaviour, data, Golden or configuration change. Q4, the 五離 runtime, `p4OwnerRules`, heading resolution, lookups, G2 cells and G1 / G1-b are all untouched. G2-n117 / W1 stays CLOSED and unchanged.

## 12. Next step

**F1 Stage 2 is required.** It is an owner decision on Q4 for 五離 under non-lifter triggers, with a migration only if the owner changes it. Before any change, Stage 2 should:

- reconcile n117, Q4 and these two witnesses;
- measure the production impact, starting from the 12 立券交易 rows above and the 2026-08-02 / 2027-07-28 未-戊申 rows;
- decide the scope of any change.
