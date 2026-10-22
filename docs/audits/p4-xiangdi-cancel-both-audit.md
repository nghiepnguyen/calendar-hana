# 相抵 / cancel_both — source audit (evidence only)

2026-10-21, branch `claude/xiangdi-cancel-both-audit`, cut from the H1-B audit head `18faa35` (main `f1e5c54`). No runtime, Golden v2, policy or authority change. H1-B conclusions are unchanged.

## Background

The H1-B 月表 review ([p4-h1b-yuebiao-witness.md](p4-h1b-yuebiao-witness.md)) found that on 11 pages for 劫煞 in 辰/戌/未 months without 德, the 月表 prints 忌 headings that Golden v2 (and production) leave `neither_recorded`. This document audits the meaning of 相抵 behind that behavior.

## Current project interpretation

The project rule is: one 卷十 clause wording ⇒ effect `cancel_both` ⇒ no 宜 and no 忌 on every heading in the subject's list.

| Step | Where | Sourced or inferred |
|---|---|---|
| Source clause | 卷十 刼煞 (raw offset 11115): 「辰戌丑未月值除日相日與天德月德天德合月德合併止忌…餘皆不忌不與德神併凡所忌者則不註宜所宜者亦不註忌」 | sourced |
| Encoded as `cancel_both`, documented "(no 宜 and no 忌)" | `shared/almanac-data/xiejibianfangshu-vol10-yiji.json` (刼煞 `otherwise: cancel_both`); `docs/audits/xieji-vol10-resolution.md` | **inference**: the clause says 「所忌者則不註宜, 所宜者亦不註忌」; nothing in it says the 忌 itself is withheld |
| Production 卷十 scoring, all years | `shared/lunar/xiejiVol10Resolution.ts` (`cancel_both` → `avoided: ∅` → verdict `no_annotation` → delta 0) | implementation of the inference |
| P4 heading state | `shared/lunar/p4HeadingAnnotation.ts:131` (`cancel_both` → `neither_recorded`); owner approval "相抵 → 不註 (鋪註 05)" in [p4-vol10-heading-annotation.md](p4-vol10-heading-annotation.md) | owner decision; 鋪註 05 qualifies only the 「不註宜亦不註忌」 case, it does not define which headings fall into it |
| Golden v2 output | `p4-full-golden-v2/compose` (`xiangdi;xd=刼煞`) | follows the project rule |

The repository history starts at `3800d99` (2026-10-16), because earlier history is squashed. `docs/project-context/history.md` holds the narrative:

- **§18, 卷十 resolution:** the diagnostics branch encoded 「凡所忌者則不註宜所宜者亦不註忌」 as `cancel_both`, yielding verdict `no_annotation`. This was agent work with a single reviewer, and the score did not change.
- **§21–22, owner, 2026-10-10:** the owner approved the verdict → score table, in which `no_annotation` drops both the negative and the positive delta. The owner approved what `no_annotation` *does*, not the reading that this 劫煞 clause produces `no_annotation` for every heading.
- **PR #31/#32:** activated the flag `xiejiVol10Scoring`. From then on, 劫煞 in 辰戌丑未 months without 德 adds no penalty in **every year**, not only 2025–2027.
- **P4, later:** added the owner approval "相抵 → 不註 (鋪註 05)" for heading annotation.

## Source text

The relevant 卷十 sentences, all from `vol10.raw.txt`:

- **刼煞 按 (offset ≈11765):** 「辰戌丑未月值除日相日…若不與德神併則吉凶僅足相抵故忌則不宜宜則不忌也」.
  - The subject is the day's 吉 and 凶 as a whole.
  - The effect is stated per heading: where 忌, no 宜; where 宜, no 忌.
- **The same 按, 子午卯酉:** 「與德神併吉凶僅足相抵故忌則不宜宜則不忌，不與德神併則止乎刼煞之凶故如常例」.
- **月煞 按 (≈12371):** 「…吉凶僅足相抵故與德願併而後從德願所宜否則不宜不忌」.
- **月刑 按 (≈13100–13182):** 「…助以德神然後吉凶相抵故與德神併而後不宜不忌」.
- **天吏 / 閉日 / 大時 按 (≈13651, 16407):** 「與德合併吉凶僅足相抵而不宜不忌」.
- **鋪註 05 (21793):** 「凡吉凶相抵不註宜亦不註忌者如遇徳猶忌之事則仍註忌」.
- **鋪註 相抵 family (21980–22513):**
  - 「凡吉凶相抵不註忌祈福亦不註忌求嗣」
  - 「…不註忌結婚姻亦不註忌冠帶納采問名嫁娶進人口…」
  - 「…不註忌般移亦不註忌安牀…」
  - 「…不註忌開市立劵交易亦不註忌開倉庫出貨財…」
  - 「…不註忌牧養亦不註忌納畜…」
  - 「凡吉凶相抵有宜安葬不註忌啟攢…」

  These rules only make sense if, on a 相抵 day, 忌 is withheld heading by heading, so that some headings still carry 忌. 「有宜安葬不註忌啟攢」 ties the withholding to the presence of 宜.
- **義例 等第 (≈9750):** 「中次凶勝於吉遇德始相抵從宜亦從忌」. Here 相抵 is also used for the grading table, with a different stated outcome. It is not used below.

So 相抵 names a balance between the day's 吉 and 凶. The effect clause attached to it is worded in two ways: 「忌則不宜宜則不忌」 / 「凡所忌者則不註宜所宜者亦不註忌」 on one side, and 「不宜不忌」 on the other.

## Readings tested

- **CANCEL_BOTH** (production): every heading in the subject's list is on neither line.
- **OVERLAP** (text-literal, `build_holdout.overlap`):
  1. A heading in the subject's list that also has 宜 evidence is on neither line; without 宜 it keeps 忌.
  2. The 鋪註 相抵 pairs then carry a dropped heading to its partners.
  3. 宜 evidence is Golden v2's, which covers modelled 宜 gods only.

OVERLAP was written after the 16 frozen pages had been read. Only the holdout is out-of-sample.

## Frozen contradiction

[`freeze.json`](sources/p4-vol10/xiangdi-cancel-both-v1/freeze.json), commit `ea94c37`, made before any further source reading. It covers 298 context rows on the 16 locked 劫煞 pages of 辰/戌/未/丑 months, i.e. every row whose Golden code names 刼煞 as 相抵 subject:

| Month | A: contradiction | B: ambiguous | C: match | Not compared |
|---|---:|---:|---:|---:|
| 辰 (4 pages) | 35 | 0 | 30 | 4 |
| 戌 (4) | 24 | 4 | 48 | 17 |
| 未 (4) | 21 | 10 | 33 | 4 |
| 丑 (4) | 1 | 0 | 63 | 4 |

- A means Golden says `neither_recorded`, the 月表 prints 忌, and no other modelled 忌 exists.
- Rows in A cover 102 dated rows on 15 dates.
- "Not compared" rows have no unambiguous 月表 term.

## X1 — lexical semantics

**Status: PARTIALLY_SOURCE_WITNESSED.**

- In the 劫煞 按 and the clause, 相抵 is a balance of the day's 吉 against 凶. Its stated consequence is per heading: 「忌則不宜宜則不忌」 / 「凡所忌者則不註宜所宜者亦不註忌」. That does not say "neither for all".
- The 鋪註 相抵 family presupposes per-heading withholding tied to 宜.
- Other gods' 按 say 「不宜不忌」 instead, which is wording-dependent.
- The bare word 相抵 carries no single effect. Confidence: MEDIUM-HIGH for the 劫煞 sentence, LOW for a global meaning.

## X2 — 劫煞 operational semantics

**Status for 劫煞, 辰戌丑未 without 德:**

- **Current production rule (CANCEL_BOTH): CONTRADICTED_BY_WITNESS.** The rule was fixed before any page was read.
- **OVERLAP as replacement: PARTIALLY_SOURCE_WITNESSED.** It is the literal text, and it fits in-sample, but no out-of-sample 劫煞 test was possible.

Frozen OVERLAP function against the 16 locked pages, distinguishing items only. Headings are not independent: the 鋪註 pairs link them into clusters, and one 宜 decision can flip a whole cluster. The clusters are {祈福, 求嗣}, {結婚姻, 納采問名, 嫁娶, 般移, 安牀}, {興造動土, 豎柱上梁, 修宮室, 修倉庫, 破屋壊垣}, {開市, 立券交易, 納財, 開倉庫出貨財}, {牧養, 納畜}; every other heading is its own cluster.

| Month | Pages | Production predicts | 月表 | OVERLAP headings | CANCEL_BOTH headings | OVERLAP clusters | CANCEL_BOTH clusters | Matches production? |
|---|---:|---|---|---:|---:|---:|---:|---|
| 辰 | 4 | all 劫煞 headings unnoted | 劫煞 headings without 宜 printed | 35/35 | 0/35 | 15/15 | 0/15 | no |
| 戌 | 4 | same | same | 24/24 | 0/24 | 12/12 | 0/12 | no |
| 未 | 4 | same | same | 19/19 | 0/19 | 12/12 | 0/12 | no |
| 丑, excluding 丑-丙寅 | 3 | same | mostly unnoted (many 宜) | 1/3 | 2/3 | 1/3 | 2/3 | mostly yes |

- 丑-丙寅 prints 月德, which is a 德 presence mismatch with Golden (月德 in 丑 month falls on 庚). It is excluded from the no-德 tally.
- The two remaining 丑 misses are 安葬 on pages listing 鳴吠對, which is not modelled as 宜 安葬. The same cause explains the 巳-癸卯 holdout miss.
- The 辰/戌/未 vs 丑 contrast is not a different rule. On the 丑 pages 時德/月德/四相/鳴吠對 give 宜 to almost every heading, so OVERLAP and CANCEL_BOTH coincide there.
- Caveat: this is in-sample (OVERLAP was formed after reading these pages). There is no unread 劫煞 no-德 context in 辰戌丑未 left to test it on: all 16 are witnessed.

## X3 — 德 interaction

**Status: PARTIALLY_SOURCE_WITNESSED.**

- **劫煞 + 德** (辰-丁巳, 戌-辛亥, 未-甲申, 丑-庚寅): `only_avoid`, i.e. 止忌 軍事/療病. All 4 holdout pages match Golden v2 on every compared heading.
- **劫煞 子午卯酉 執日 + 月德/月德合** (午-辛亥, 卯-甲申, 酉-庚寅): `cancel_both` with 德. These match Golden, but every heading has 宜, so the two readings coincide and the pages are not distinguishing.
- **子-丁巳:** Golden `as_usual` under the 德作建論 override; it matches.
- **Clauses that fire with 德:** 月刑 辰-壬辰 and 天吏/閉日 戌-辛酉. On both pages the frozen scores favour CANCEL_BOTH (one cluster each), but the pages are classified **NOT_DISTINGUISHING**:
  - The missing cluster, 開市/立券交易/納財/開倉庫出貨財, is exactly what 鋪註 puzhu:06 withholds on its trigger days.
  - The repo's trigger set in `p4b-puzhu06-v3.json` includes 天德 and 月德 (辰-壬辰) and 天德合 and 月德合 (戌-辛酉).
- **Clauses without 德:**
  - 災煞: OVERLAP 2 of 3 clusters.
  - 月煞: OVERLAP 4 of 4 clusters.
- So there is no witnessed "with 德 → CANCEL_BOTH" pattern, and no global 德 rule follows.
- Anomaly: 丑-丙寅 prints 月德, but 月德 in 丑 month should fall on 庚. Golden treats the day as without 德. Not used.

## X4 — global applicability

**Status: SOURCE_DEPENDENT. Default is no propagation.**

Scores from the holdout, with predictions frozen in `5c35a9e` before the pages were fetched; distinguishing headings only:

| Subject (clause) | Pages | OVERLAP headings | CANCEL_BOTH headings | OVERLAP clusters | CANCEL_BOTH clusters | Classification |
|---|---|---:|---:|---:|---:|---|
| 災煞 寅申巳亥, no 德 | 寅-戊子, 巳-癸卯 | 4/5 | 1/5 | 2/3 | 1/3 | 寅-戊子 supports OVERLAP; 巳-癸卯 supports CANCEL_BOTH (candidate cause: unmodelled 鳴吠對) |
| 月煞 卯酉, no 德願 (按 「否則不宜不忌」) | 卯-戊戌, 酉-甲辰 | 6/6 | 0/6 | 4/4 | 0/4 | both support OVERLAP |
| 月刑, with 德 | 辰-壬辰 | 0/4 | 4/4 | 0/1 | 1/1 | NOT_DISTINGUISHING (puzhu:06 trigger 天德/月德) |
| 天吏/閉日, with 德合 | 戌-辛酉 | 0/4 | 4/4 | 0/1 | 1/1 | NOT_DISTINGUISHING (puzhu:06 trigger 德合) |

- The 劫煞 result does not transfer.
- 災煞 and 月煞 each have their own witnesses, but only a few clusters each.
- 月刑 and 天吏 with 德 are UNRESOLVED.
- 月煞's 按 says 「不宜不忌」, yet its pages follow OVERLAP, so the wording alone does not predict behavior either.
- 重日, 復日 and other `cancel_both` clauses were not tested.

## Unexplained prints (from H1-B)

| Page | Print | Class |
|---|---|---|
| 丑-戊寅 | 安葬 | EXPLAINED_BY_XIANGDI: OVERLAP, with no 宜 安葬 and no 鳴吠對 |
| 申-庚午 | 結婚姻, 納采問名, 嫁娶 | EXPLAINED_BY_XIANGDI: OVERLAP for 災煞, since these headings have no 宜 |
| 亥-辛酉 | 嫁娶; 結婚姻, 納采問名 | EXPLAINED_BY_XIANGDI. Under OVERLAP 嫁娶 keeps 忌, so the 嫁娶 → 結婚姻/納采問名 propagation does not fire, and 五離's 忌 stands |
| 戌-癸亥 | 開倉庫出貨財 | SOURCE_AMBIGUOUS. 五虛's own 忌 surviving is a candidate if puzhu:22 withholds only the 相抵 subject's 忌; not established |
| 亥-己丑 | 結婚姻, 納采問名, 嫁娶 | UNEXPLAINED_PRINT. The headings have 宜, so both readings predict unnoted (月厭 + 月德合) |

## Proposed correction (not implemented)

```text
CURRENT
劫煞, 辰戌丑未 月, 除日相日, no 天德/月德/天德合/月德合
→ cancel_both: every 劫煞 heading neither_recorded (卷十 scoring: no_annotation)

SOURCE-WITNESSED (in-sample, MEDIUM)
same condition
→ heading with 宜 on the day: neither_recorded
→ heading without 宜: keep 忌 (only_ji)
→ then the 鋪註 「凡吉凶相抵不註忌X亦不註忌Y」 pairs
```

- Status: a candidate only, PARTIALLY_SOURCE_WITNESSED. Scope: 劫煞 only.
- 災煞 寅申巳亥 and 月煞 卯酉 are separate candidates with a few clusters each.
- 月刑 and 天吏/閉日 with 德 stay unresolved. Keep them as they are.
- Open precondition: 宜 evidence must cover 鳴吠對 (宜 安葬), or 安葬 is over-noted on 鳴吠對 days. Two of the three 丑 misses and the 巳-癸卯 miss depend on this.

## Migration impact (dry run, annotation only)

**Largest exposure, not measured here:** since PR #31/#32 the deployed 卷十 scoring (`xiejiVol10Resolution`, flag `xiejiVol10Scoring`) has treated 劫煞 in 辰戌丑未 months without 德 as `no_annotation`, i.e. no penalty, in every year.

Three counts appear across the two audits. They measure different things:

| Count | Meaning |
|---|---|
| 235 dated rows (124 without 宜) | H1-B review: every `neither_recorded` row on the 劫煞 dates, an upper bound |
| 102 dated rows on 15 dates | freeze category A: the 月表 prints 忌, Golden says unnoted, and no other modelled 忌 exists, on mapped headings only |
| 113 dated rows on 18 dates | dry run: OVERLAP applied to all headings, including those without a 月表 term and the 丑 dates; over-predicts 安葬 on 鳴吠對 days |

[`dryrun.json`](sources/p4-vol10/xiangdi-cancel-both-v1/dryrun.json) applies the frozen OVERLAP function to Golden v2. Every change is `neither_recorded` → `only_ji`:

| Subject | Dated rows | Dates | Context rows | Contexts |
|---|---:|---:|---:|---:|
| 劫煞 (proposed) | 113 | 18 | 82 | 15 |
| 災煞 (candidate) | 42 | 14 | 19 | 10 |
| 月煞 (candidate) | 96 | 14 | 24 | 6 |

Top 劫煞 headings: 般移 12, 豎柱上梁 12, 祈福 9, 求嗣 9, 結婚姻 9, 納采問名 9, 安牀 9, 嫁娶 8, 宴會 8, 安葬 6.

- The 劫煞 count includes 丑 rows. Some 丑 安葬 rows are over-predicted where 鳴吠對 is present.
- **Not computed:** score changes, rating changes and visible UI changes. They need an engine variant, which this audit is not authorized to add.
- The change also reaches the deployed 卷十 scoring for all years (`xiejiVol10Resolution`: 劫煞 `no_annotation` → `avoid` on non-宜 headings). That effect is not counted here.
- Annotation rows ≠ score changes ≠ visible changes.

## If implementation is approved later (not done)

1. Keep Golden v2 and freeze Golden v3.
2. Add a narrowly scoped policy flag covering 劫煞 only, shipped `true`, with historical tests pinned `false`.
3. Append a revision to the adapter baseline.
4. Produce a migration diff with 0 `UNEXPECTED_REGRESSION`.
5. Add mutation coverage.
6. Run `ci:p4`.
7. Decide separately about the 卷十 scoring (`xiejiVol10Resolution`) for years outside 2025–2027.

## Non-inferences

- The 劫煞 contradiction does not automatically invalidate other 相抵 clauses; 月刑 and 天吏 with 德 remain unresolved.
- A printed 忌 on the 月表 does not identify 劫煞 as the cause if another operand can explain it.
- Golden v2 is project evidence, not historical authority.
- 相抵 must not be translated directly to `cancel_both`, or to OVERLAP, without each clause's own evidence.
- 德 behavior must not be globalised.
- In-sample fit (16 劫煞 pages) is not out-of-sample confirmation.
- Heading tallies are not independent tests; clusters are the unit.
- Pages on puzhu:06 trigger days cannot separate CANCEL_BOTH from OVERLAP for the puzhu:06 headings.

## Artifacts and tests

All under `sources/p4-vol10/xiangdi-cancel-both-v1/`:

| Artifact | Contents |
|---|---|
| `freeze.json` + `build_freeze.py` | `ea94c37` |
| `holdout-predictions.json` + `build_holdout.py` | `5c35a9e` |
| `witness-lock.json` | 14 new pages: original bytes, SHA-256, 建除 officer; plus artifact hashes |
| `dryrun.json` + `build_dryrun.py` | annotation dry run |

The 29 H1-B pages are reused by path and hash, not copied.

`shared/lunar/p4XiangdiCancelBothAudit.test.ts` checks:

- page bytes, locators and officers;
- artifact hashes;
- the freeze recomputed from Golden v2;
- the month matrix;
- the holdout tallies per subject;
- controls agreeing with Golden.
