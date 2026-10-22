# H1-B — 月表 witness review (audit only)

2026-10-21, branch `claude/h1b-yuebiao-witness`, base `f1e5c54`. No runtime, Golden v2 or authority change. S1 not reopened.

## H1-B final review

### Question

Take a heading H where one scope gives an unprotected 忌 and another scope gives 相抵 (不註宜亦不註忌, or the 德 lift 不忌亦不註宜). Does the book print H on the 忌 line?

### Hypotheses

- **H1-B (owner rule, 2026-10-17; `p4OwnerRules.ts` branch `rule: 'H1-B'`):** the 忌 survives and 宜 is not noted, so the state is `only_ji`. Propagation runs afterwards.
- **Whole-heading 相抵:** the 相抵 neutralises H, so the state is `neither_recorded`.

### Prediction freeze

Two freezes were made, each committed before the pages it covers were read:

- [`predictions.json`](sources/p4-vol10/h1b-yuebiao-witness-v1/predictions.json), commit `372bdad`, built by `build_predictions.py` from Golden v2 `compose/h1b-changes.tsv` only.
- [`premise-predictions.json`](sources/p4-vol10/h1b-yuebiao-witness-v1/premise-predictions.json), commit `da73631`.

| | Count |
|---|---:|
| H1-B rows (dated / context) | 95 / 58 |
| H1-B contexts | 32 |
| Distinguishing rows, final `only_ji` (dated / context) | 33 / 23 |
| Distinguishing targets / 月表 pages | 24 / 22 |
| Non-distinguishing rows (end `neither_recorded` under both hypotheses) | 97 |

All counts match the inventory.

Disclosures:

- The 辰月己巳 page (n11) was opened once as a fetch test before the first freeze. It belongs to the 劫煞 class below, so it did not feed any CONFIRMS.
- The three reused lift-premise pages (寅-乙亥, 午-丁未, 亥-壬寅) were transcribed by the earlier reviewer in `yuebiao-witness-lock-v2`. Their predictions are post hoc.

### Witnesses

[`lock.json`](sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json) covers the 月表 卷二十–三十一 四庫 scans: 29 new pages, original JPG bytes plus SHA-256, read by eye with no OCR.

Every page records:

- the printed 吉神, 凶神, 宜 and 忌 lines;
- the 建除 officer, which the test checks against Month Jian and day branch;
- `goldenDiff`, the Golden v2 context state of every heading that maps unambiguously to the 月表 term (the map is in the lock).

Notes on coverage and reading:

- Three pages were reused from `yuebiao-witness-lock-v2`.
- 辰-戊寅 has no witness: archive.org returned 502 twice.
- Pages were read from downsampled copies.

| Context | Heading | 相抵 operand | Surviving 忌 | H1-B | Alternative | 月表 | Classification |
|---|---|---|---|---|---|---|---|
| 巳-乙亥 | 安葬 | 重日 + 月德合 | 月破 | 忌 | none | 忌 | CONFIRMS_H1B |
| 巳-辛亥 | 安葬 | 重日 + 天德 | 月破 | 忌 | none | 忌 | CONFIRMS_H1B |
| 亥-己巳 | 安葬 | 重日 + 月德合 | 月破 | 忌 | none | 忌 | CONFIRMS_H1B |
| 亥-乙巳 | 安葬 | 重日 + 天德 | 月破 | 忌 | none | 忌 | CONFIRMS_H1B |
| 巳-丙戌 | 安葬 | 復日 + 天德合 | 五墓 | 忌 | none | 忌 | CONFIRMS_H1B |
| 巳-丙辰 | 安葬 | 復日 + 天德合 | 月煞, 閉日 | 忌 | none | 忌 | CONFIRMS_H1B |
| 未-己丑 | 安葬 | 復日 + 天德合/月德合 | 月刑, 月破 | 忌 | none | 忌 | CONFIRMS_H1B |
| 戌-癸亥 | 安葬 | 劫煞 | 重日 | 忌 | none | 忌, plus 開倉庫出貨財 (Golden-unnoted) | SOURCE_AMBIGUOUS |
| 辰-己巳 / 辛巳 / 癸巳 / 乙巳 | 安葬 | 劫煞 | 重日 | 忌 | none | 忌, plus Golden-unnoted 劫煞 headings | PRESENCE_MISMATCH |
| 戌-乙亥 / 丁亥 / 己亥 | 安葬 | 劫煞 | 重日 | 忌 | none | 忌, plus Golden-unnoted 劫煞 headings | PRESENCE_MISMATCH |
| 未-壬申 / 丙申 / 戊申 / 庚申 | 宴會 (會親友) | 劫煞 | 五離 | 忌 | none | 忌, plus Golden-unnoted 劫煞 headings | PRESENCE_MISMATCH |
| 申-庚午 | 安葬 | 災煞 | 復日 | 忌 | none | 忌 | SOURCE_AMBIGUOUS |
| 亥-辛酉 | 開市, 立券交易, 開倉庫出貨財 | 災煞 | 四耗, 五離 | 忌 | none | 忌 | SOURCE_AMBIGUOUS |
| 亥-己丑 | 栽種 | 月厭 | 地火 (又為) | 忌 | none | 忌 | SOURCE_AMBIGUOUS |

Tally of dated rows: CONFIRMS_H1B 11, PRESENCE_MISMATCH 14, SOURCE_AMBIGUOUS 8, CONTRADICTS_H1B 0.

戌-癸亥 was first marked CONFIRMS after reading and then moved to SOURCE_AMBIGUOUS on review. It prints one Golden-unnoted heading, 開倉庫出貨財, which is the same pattern as 丑-戊寅. 劫煞's list holds both 開倉庫 and 安葬, so whatever printed 開倉庫 could also have printed 安葬.

The deciding characters were re-checked on full-resolution crops of the original JPGs: 安葬 present on the 7 CONFIRMS pages, and absent on the 3 new lift-premise pages.

### H1-α — 又為 sub-scope vs parent

The only distinguishing case is 亥-己丑 栽種 (2 dated rows). 栽種 is printed, but so are 結婚姻, 納采問名 and 嫁娶, which Golden marks as neutralised by 月厭. 月厭's own list also contains 栽種, so the page cannot tell whether 地火 survived or 月厭 was simply not neutralised.

The 月虛 / 月煞 rows all end `neither_recorded` under both readings and were not tested.

**SOURCE_DEPENDENT.** No conflict with the 2026-10-11 又為 convention was found.

### H1-β — independent operand composition

**德-lift sub-class (重日/復日 with 德), 7 contexts.**

- Every page prints 安葬 from the surviving 月破, 五墓, 月煞/閉日 or 月刑 scope.
- Every page agrees with Golden v2 on all mapped headings: `goldenDiff` is empty.
- The premise that the lift really removes 重日/復日's own 安葬 is verified on 6 pages where 重日/復日 + 德 is the only 安葬 source. None of them prints 安葬:
  - 寅-乙亥, 午-丁未, 亥-壬寅 (reused);
  - 申-己巳, 酉-乙巳, 未-己卯 (new). These carry the same 德 types as the target pages: 天願/六合, 月德合, 天德合 + 月德合.
- **SOURCE_WITNESSED (MEDIUM-HIGH) for this sub-class.** The rating is capped because there was a single AI reviewer, though the deciding characters were re-checked at full resolution.

**劫煞 / 災煞 / 月厭 相抵 sub-class.**

- No clean confirmation. On 戌-癸亥 no probe heading is printed and 安葬 is printed, but 開倉庫出貨財 is an unattributed print (see above).
- The 災煞 pages (申-庚午, 亥-辛酉) honour 相抵 for most headings but also print 冠帶, 結婚姻, 納采問名, 嫁娶 and 進人口, which are in 災煞's list. That mechanism is unexplained, and it could equally account for the target headings.
- The 劫煞 辰/戌/未 pages are premise mismatches; see H1-γ.
- **SOURCE_DEPENDENT.**

### H1-γ — presence and effect premise

**Presence.**

- 重日 is printed on every 巳/亥 page where Golden places it, which matches the owner's two-branch reading.
- 復日 is printed on 四月丙, 六月己, 七月庚 and 五月丁 (reused).
- 八風 is printed on 戌-丁亥, together with 取魚 and 乘船渡水.

No presence mismatch for 重日, 復日 or 八風.

**Effect mismatch: 劫煞 in 辰/戌/未 months without a 德 god.**

- Golden v2 reads the 卷十 clause 「辰戌丑未月…不與德神併凡所忌者則不註宜所宜者亦不註忌」 as `cancel_both`, leaving all of 劫煞's headings unnoted.
- On 11 of 12 pages the 月表 prints 5–10 of those headings on the 忌 line anyway (`goldenDiff.printedButUnnoted`). For example, 辰-己巳 prints 祈福, 求嗣, 結婚姻, 納采問名, 嫁娶, 移徙, 安牀, 會親友 and 豎柱上梁.
- The four 丑 pages of the same class, 丑-甲寅, 丙寅, 戊寅 and 壬寅, behave as Golden predicts. The only exception is 丑-戊寅, which prints 安葬.
- One co-variate, recorded but not explained: every 丑 page and 戌-癸亥 lists 時德, 月德 or 四相, while the mismatching pages list none of them. 未-戊申 lists 四相 and still mismatches.
- The 災煞 pages apply the same 「凡所忌者則不註宜…」 wording differently, so no single reading is established.

Classified PRESENCE_MISMATCH, subtype "相抵 effect not applied as modelled". These pages are not evidence for or against H1-B.

### H1-δ — propagation

- No distinguishing row involves propagation.
- 戌-癸亥 prints 開倉庫出貨財 while 開市 and 立券交易 are absent. Golden v2 gets `neither_recorded` there by puzhu:22 propagation, through H1-B on 五虛.
  - Two explanations fit the same page: puzhu:22 propagation not applied, or 劫煞 not fully neutralised.
  - So this is an unattributed print, not a PROPAGATION_MISMATCH.
- 申-庚午 is consistent: 開倉庫 is absent there.
- **NOT_TESTED.**

### Contradictions

1. **The 劫煞 相抵 effect (辰/戌/未 months, no 德) is contradicted by 11 月表 pages.** Production marks those headings `neither_recorded`, which lifts the 劫煞 penalty; the 月表 prints them as 忌.
   - Affected in 2025–2027: up to 235 dated rows on 14 dates, of which 124 have no 宜 evidence in Golden; and 154 context rows in 11 contexts.
   - Dates: 2025-04-06, 04-30, 07-26, 11-02; 2026-04-25, 07-21, 08-02, 10-28; 2027-04-20, 05-02, 07-16, 07-28, 10-23, 11-04.
   - The rule comes from the earlier owner-approved 相抵 → 不註 reading (鋪註 05, heading annotation), not from H1-B.
   - Not witnessed: the same wording in other `cancel_both` clauses (子午卯酉 劫煞 執日, 閉日, 天吏 and others). I have not extended the finding to them.
2. **Unattributed prints on pages that otherwise match the premise:**
   - 戌-癸亥: 開倉庫出貨財.
   - 丑-戊寅: 安葬.
   - 申-庚午, 亥-辛酉 and 亥-己丑: 冠帶, 結婚姻, 納采問名, 嫁娶 and 進人口.

No witness contradicts H1-B itself.

### Decision

**PARTIALLY_SOURCE_WITNESSED.**

- H1-β 德-lift sub-class (重日/復日 + 德): SOURCE_WITNESSED.
- H1-β 相抵 sub-class (劫煞 / 災煞 / 月厭): OWNER_ADOPTED_SOURCE_DEPENDENT.
- H1-α: OWNER_ADOPTED_SOURCE_DEPENDENT.
- H1-δ: not tested.

H1-B as a whole stays **OWNER_ADOPTED_SOURCE_DEPENDENT** in runtime and artifacts.

The stop condition is met because a source mismatch changes the premise (contradiction 1). Owner review is required before any follow-up.

### Runtime impact

None from this audit. Production, Golden v2 and the P4 locks are unchanged. Acting on contradiction 1 would change scores, which requires:

- an owner decision;
- Golden v3;
- a new manifest policy shipped `true`, with historical tests pinned `false`;
- an adapter baseline revision;
- a migration diff;
- `ci:p4`.

### Tests

`shared/lunar/p4H1bWitness.test.ts` checks:

- page bytes and locator;
- 建除 officer against Month Jian and day branch;
- freeze artifacts byte-locked (both build scripts and both JSONs);
- the freeze set recomputed from Golden v2;
- the classification tally;
- 安葬 on CONFIRMS pages and its absence on lift-premise pages, reused pages included.
