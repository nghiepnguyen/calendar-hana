# puzhu:17 不將 exception (audit only)

2026-10-22, branch `claude/puzhu17-bujiang-audit`, parent `d79b08e`. Nothing in production changes: no code, JSON, flag, adapter revision or Golden. Earlier audit commits are untouched.

Input: [faithful 卷十 劫煞 simulator](p4-jiesha-faithful-vol10.md). Its gate F2 was PARTIAL, partly because puzhu:17's 不將 exception had no settled reading.

Artifacts are in `sources/p4-vol10/puzhu17-bujiang-v1/`:

| File | Contents |
|---|---|
| `scope-dates.json` | the 1,636 faithful scope dates, by context |
| `freeze.json` | predictions, committed in `616698a` before any page was re-read |
| `full.json` | 384 cells under every variant, on every scope date |
| `witness.json` | the full-resolution deciding cells |
| `result.json` | from `build_result.py` |
| `lock.json` | hashes of the above |

## 1. Source text (卷十 鋪註條例, offset 22146)

**SOURCE TEXT**, quoted from `vol10.raw.txt` and `p4-vol10-transcription.md`; punctuation is mine:

> 凡吉凶相抵不註忌嫁娶，亦不註忌冠帶、結婚姻、納采問名、進人口、般移、安牀。如遇徳猶忌之日，則仍註忌。遇不將而不註忌嫁娶者，亦仍註忌。遇亥日、厭對、八專、四忌、四窮而仍註忌嫁娶者，止註所忌之事，其不忌者仍不註忌。

The rule has four parts:

- **Main clause.**
  - Trigger: 嫁娶 is left unnoted by 吉凶相抵.
  - Targets: 冠帶, 結婚姻, 納采問名, 進人口, 般移, 安牀. Their 忌 is not noted either.
- **德猶忌 exception.** On a 遇德猶忌 day, the 忌 is still noted.
- **不將 exception** (the subject of this audit): 「遇不將而不註忌嫁娶者，亦仍註忌」.
- **Second sub-clause** (亥日 / 厭對 / 八專 / 四忌 / 四窮): when one of these keeps 嫁娶's 忌, only the affairs that god avoids are noted. The others stay unnoted.

Supporting source facts:

- 不將 is a 宜 god for 嫁娶 only.
  - 卷十 entry: 「不將 / 宜嫁娶」 (offset 6707).
  - 卷十一 lists it in 嫁娶's 宜 list (「宜天徳月徳天徳合月徳合天赦天願三合天喜六合不將」) and in no target's list. The checked lists are 結婚姻, 納采問名, 進人口, 般移 and 安牀.
- 卷十's 月破 按 (offset 8681) calls 不將 the customary 嫁娶 day: 「嫁娶宜不將天德月德天德合月德合上吉」.

## 2. Provenance

| Layer | What it says or does |
|---|---|
| SOURCE TEXT | as quoted above |
| OWNER INTERPRETATION | `p4-vol10-day-composition-v2.json` line `puzhu:17`, `exceptionsNote`: 「不將 / 亥日厭對八專四忌四窮 concern 嫁娶 itself, not the 相抵 trigger; 亥日 is protected by 百忌」. Owner plan `docs/plans/p4-xieji-vol10-balancing.md:67` and `docs/audits/p4-vol10-remaining-ji.md:10`: 「不將 không miễn các kỵ khác của hôn lễ」 (不將 does not lift the other marriage 忌). This statement points to P17-A; the `exceptionsNote` and the engine do not implement it. No other owner decision exists. |
| ENGINE BEHAVIOR | `p4OwnerRules.ts:541–570`: one pass. A line fires when a `from` heading is `neither_recorded`; the target's 忌 is removed unless it is protected. The pass never reads 不將, so the engine propagates from 嫁娶 even when 不將 is 嫁娶's only 宜. The second sub-clause is not implemented either: the engine never fires when 嫁娶 keeps 忌. |
| Tests / Golden | `p4FullDayComposition.test.ts:18` checks that 不將 does not override 八專/百忌 on 嫁娶 itself (寅-甲寅). That holds under every reading here, and no test covers propagation. No Golden row targets the 不將 exception. `p4HeadingAnnotation.test.ts:129` lists `puzhu:17` only as an inventory id. Golden v2 holds the engine behaviour (P17-0). |
| Faithful simulator | Reuses the engine unchanged, so the table embeds P17-0. |

The note and the engine disagree. The note says the 不將 case is "not the 相抵 trigger". If so, a 嫁娶 that is unnoted *because of* 不將 should not trigger propagation. The engine fires anyway, because in its terms 不將's 宜 against 劫煞's 忌 *is* a 相抵 (`neither_recorded`).

## 3. Grammar and the competing readings

- 「亦仍註忌」 has no object of its own. Its 亦 parallels the 遇德猶忌 sentence just before it, which concerns the target headings.
- The next sentence, 「…而仍註忌嫁娶者，止註所忌之事，其不忌者仍不註忌」, makes the same move: it fixes 嫁娶's status and then says what happens to the targets.
- So the plain reading is: when 嫁娶 is unnoted by way of 不將, its 宜 does not carry to the targets, and they keep their 忌.
  - This fits 不將 being a 宜 god for 嫁娶 alone.
  - 而 can be read as cause ("unnoted because of 不將") or as plain conjunction ("不將 present and unnoted"), which gives readings A and B below.

| Reading | Heading-level consequence |
|---|---|
| **P17-0** | Engine as it stands. The exception is inert, and 嫁娶 `neither_recorded` always propagates. |
| **P17-A** | Condition on the source 宜. No propagation from 嫁娶 when 不將 is its only present 宜 source. 嫁娶 itself stays unnoted. |
| **P17-B** | No propagation from 嫁娶 whenever 不將 is in its 宜 trace, whatever the other sources. |
| **P17-C** | Owner note read literally: the exception concerns 嫁娶 itself. 不將 does not lift 嫁娶's 忌, so 嫁娶 keeps 忌 and nothing propagates. |

On P17-C:

- It is grammatically weak. 「不註忌嫁娶者…仍註忌」 applied to 嫁娶 contradicts itself.
- As implemented in the harness (不將 removed from 嫁娶's 宜 trace), it also drops 不將's 宜嫁娶 line in the P4 layer. That over-reaches, but it only matters for C.

None of the four is "an exception to the entire propagation rule". The exception never touches propagation that starts from another heading, such as puzhu:16 from 結婚姻.

Implementation: `p4Puzhu17Audit.test.ts` switches the engine's own `puzhu:17` line (`from: []`) per run, based on 嫁娶's present 宜 trace. For C it also filters that trace. Nothing else changes.

## 4. Prediction freeze (`616698a`)

不將 occurs in 3 of the 16 faithful contexts: 丑-丙寅, 未-壬申, 未-戊申. Under the 歴例 table (辰=3月, 未=6月, 戌=9月, 丑=12月), no 辰-巳 or 戌-亥 day has 不將. In all three, 嫁娶's only present 宜 is 不將.

| Context | Trigger | 不將 | Target heading | P17-0 | P17-A / B | P17-C | Observable |
|---|---|---|---|---|---|---|---|
| 未-壬申 | 嫁娶 `neither_recorded` (不將 vs 劫煞) | yes, sole 宜 | 結婚姻, 納采問名, 般移 | unnoted (propagated) | 忌 kept (劫煞, 五離 on the first two) | 忌 kept, and 嫁娶 noted | **yes, table cells** |
| 未-戊申 | same | yes, sole 宜 | 結婚姻, 納采問名 | unnoted (五離 removed) | 五離 kept; 劫煞 already cancelled by their own 宜 | as A, and 嫁娶 noted | yes: P4 headings; table only under C |
| 丑-丙寅 | same | yes, sole 宜 | none; 結婚姻, 納采問名, 般移 have their own 宜 | — | — | 嫁娶 is propagated back by puzhu:16 from 結婚姻 | no |

The freeze splits the contexts into three groups:

- **A, intersecting the 384-cell table:**
  - 未-壬申: wedding, engagement, moving. All three flip under A, B and C.
  - 未-戊申: wedding, under C only.
- **B, P4 only:** 未-戊申's 結婚姻 and 納采問名 heading rows (五離).
- **C, not distinguishing:**
  - 丑-丙寅;
  - the other 13 table contexts (no 不將);
  - all 13 locked non-劫煞 pages with 不將: 丑-庚寅, 亥-壬寅, 亥-己巳, 午-丙戌, 子-丁巳, 子-壬辰, 巳-丙戌, 巳-丙申, 巳-乙亥, 未-甲午, 未-甲申, 申-戊申, 酉-甲辰. The engine predicts identical output under every variant for these, because either 嫁娶 has other 宜 and A = 0, or no target holds an unprotected 忌.

Readings A and B never differ, either in the table or at P4 context level: 0 of the 149 P4 contexts with 不將.

**Disclosure.** Both distinguishing pages were transcribed in the H1-B audit, and the 未-戊申 mismatch was already known; it is one of the faithful study's F1 rows. The freeze is not blind. What it does fix is the exact cell-level predictions before the pages were re-read for this audit.

## 5. Witnesses

No page was fetched, and no image bytes were duplicated. Both pages are reused from the H1-B lock, with path and SHA-256 re-checked. Deciding cells were re-read from the stored JPG, the highest resolution stored (archive.org `n*_w1200`), using crops of the 忌 columns. OCR was not used.

| Page | Context | Officer | 吉神 / 凶神 | 不將 printed | 忌 line, first two columns | 嫁娶 | 結婚姻 | 納采問名 | 移徙 |
|---|---|---|---|---|---|---|---|---|---|
| 卷二十五 `06067694-n81` | 未-壬申 | 除 | 陽德 相日 吉期 不將 益後 除神 司命 鳴吠 / 劫煞 天賊 五虛 五離 | yes | 忌上冊受封上表章會親友冠帶出行結婚姻｜納采問名進人口移徙安牀求醫療病裁衣 | absent | printed | printed | printed |
| 卷二十五 `06067694-n117` | 未-戊申 | 除 | 四相 陽德 相日 吉期 不將 益後 除神 司命 / 劫煞 天賊 五虛 五離 | yes | 忌上冊受封上表章會親友出行結婚姻納采｜問名安牀求醫療病修倉庫立券交易納財 | absent | printed | printed | (absent, not deciding) |

On n81, 納采問名 runs straight into 進人口. 嫁娶, which comes between them in the 卷十一 order, is missing. 冠帶 and 進人口, both puzhu:17 targets that the engine does not model as P4 headings, are printed, which also fits A/B.

**P17-3 score:** 7 deciding cells on 2 pages.

| Reading | Supports | Contradicts |
|---|---|---|
| P17-A | 7 | 0 |
| P17-B | 7 | 0 |
| P17-0 | 2 | 5 (n81: 結婚姻, 納采問名, 移徙; n117: 結婚姻, 納采問名) |
| P17-C | 5 | 2 (嫁娶 on both pages) |

Ambiguous: 0.

## 6. 不將 presence (P17-2)

- **Source.** 卷四 義例二 隂陽不將, 歴例 per-month list (offset 9591 onward). The 按 accepts it as a 堪輿 吉日 and excludes 六月戊午 (逐陣; owner decision 2026-10-10).
- **Production.** `xieji-god-definitions.json` `bat_tuong`, read by `getXiejiGodPresence`. The engine's 嫁娶 宜 trace carries it as the `不將` operand.
- **Check.** The table agrees with the printed 吉神 line on all 67 locked 月表 contexts (16 with 不將, 51 without), with 0 presence mismatches (`p4Puzhu17AuditLock.test.ts`).
- Both deciding pages print 不將. No discrepancy is a presence problem.

## 7. Interaction with 劫煞 (the 384 cells)

Chain for 未-壬申 (all 104 scope dates, 1900–2100, none inside 2025–2027):

```text
嫁娶: 宜 = {不將} + 劫煞 忌 → 相抵 → neither_recorded
puzhu:17 trigger fires (P17-0) | blocked (P17-A/B: 不將 is the only 宜)
結婚姻 (五離, 劫煞; no 宜)   P17-0 not_recorded → P17-A only_ji, 劫煞 in trace
納采問名 (五離, 劫煞; no 宜) P17-0 not_recorded → P17-A only_ji, 劫煞 in trace
般移 (劫煞; no 宜)           P17-0 not_recorded → P17-A only_ji, 劫煞 in trace
wedding [結婚姻, 嫁娶] blank → avoid; engagement [納采問名] blank → avoid; moving [般移] blank → avoid
```

At 未-戊申, 結婚姻 and 納采問名 have their own 宜, so 劫煞 is already cancelled before propagation and no table cell moves under A or B. Under C, 嫁娶 keeps 劫煞, so wedding → avoid.

Mechanical recompute: all 384 cells on every one of the 1,636 scope dates under every variant (`full.json`).

- Each (context, activity, variant) has one value across all dates, so 0 vary.
- The 16 representative dates agree with the full range.
- Differences from P17-0:

| Reading | Cells changed | Exact cells |
|---|---|---|
| P17-A | 3 | 未-壬申: wedding, engagement, moving (CONFIRMED:blank → CONFIRMED:avoid) |
| P17-B | 3 | same as A |
| P17-C | 4 | the A cells + 未-戊申 wedding |

The second sub-clause has no 384-cell effect. Its precondition (嫁娶 has 宜 yet keeps 忌 from 亥日 / 厭對 / 八專 / 四忌 / 四窮) holds in none of the enumerated runs for the 16 contexts. In 戌-亥, 丑-甲寅 and 未-庚申, 嫁娶 has no 宜 at all.

## 7b. Page check of all 16 table contexts (added after review)

Six table contexts have no 2025–2027 date: 丑-丙寅, 丑-甲寅, 戌-己亥, 未-壬申, 未-庚申, 辰-癸巳. The faithful study's calibration therefore never compared them with their 月表 page, which is how the 未-壬申 cells went unnoticed.

This check covers all 16 locked H1-B pages:

- engine rows from `sensitivity.json`, with the P17-A marriage rows overlaid;
- the calibration's exclusions: dated 土王 and `undetermined`;
- results in `result.json` `pageCheckP17A`.

Of 342 comparable headings, 336 match and 6 contradict:

| Context | Heading | Page | Engine | 劫煞 in trace | Table effect |
|---|---|---|---|---|---|
| 戌-丁亥, 戌-乙亥, 戌-己亥 | 開倉庫出貨財 | printed | `neither_recorded`, 五虛 removed by propagation from 開市+立券交易 | no; cancelled by its own 宜 before propagation | none: warehouse_opening is blank under any reading. These are F1 rows (cross-god). 戌-己亥 is out of window, so it is new F1 evidence against removal. |
| 戌-癸亥 | 開倉庫出貨財 | printed | puzhu:06 Q4 `lift:QL` | no | none (the known puzhu:06 Q4 item) |
| 未-戊申 | 納財 | printed | `neither_recorded` (宜 present, 劫煞 cancelled) | no | **finance cell contradicted** (table blank; page notes 忌) |
| 未-戊申 | 立券交易 | printed | `not_recorded`, 五離 + 劫煞 removed by puzhu:21 from 納財 | **yes** | **contract / transaction cells depend on 納財** |

The 未-戊申 納財 宜 mismatch, which the faithful study listed as P4 only, does reach the table:

- 納財 is itself a 劫煞 heading, so the finance cell is directly at stake.
- Its `neither_recorded` state triggers puzhu:21. That removes 劫煞 from 立券交易, which affects the contract and transaction cells, and from 開市, which affects opening and business.
- The page does not fit a simple fix. It prints 納財 and 立券交易 but not 開市. "納財 has no 宜" would make 開市 printed as well.
- This is a 宜-premise question, not a 鋪註 reading, and it is outside this audit's scope. It stays an open table blocker for up to 5 cells of 未-戊申: finance, contract, transaction, opening and business.

丑-丙寅:

- The page prints 月德, while the 歴例 table puts 丑月's 月德 on 庚. The faithful, 相抵 and impact studies all excluded this context for that reason.
- Its 21 comparable headings all match the table's output, so the printed output gives no reason to change a cell.
- The premise is still unresolved. If 月德 is real, the day is outside the scoped branch. That leaves an uncertainty about scope, not about output; it affects the 24 cells of 丑-丙寅.

## 8. Findings

**P17-1, lexical/grammatical meaning: SOURCE_SUPPORTED (P17-A ≡ P17-B for every observable output here).**

- The exception is a condition on the source 宜. When 嫁娶 is unnoted by way of 不將, propagation to 冠帶, 結婚姻, 納采問名, 進人口, 般移 and 安牀 does not happen, and their 忌 stays.
- It is not an exception to the whole rule, not specific to one target, and not about 嫁娶's own 忌.
- A and B (sole versus any 不將) are not separated by any witness. They are also not separated by any table cell, and by none of the 149 P4 不將 contexts.

**P17-2, 不將 presence: VERIFIED.** 67/67 locked pages agree with the 歴例 table, 0 mismatches. Both deciding pages print 不將.

**P17-3, worked 月表 behaviour: SUPPORTS P17-A/B.**

- 2 distinguishing pages, 7 deciding cells.
- A/B: 7 support, 0 contradict.
- P17-0 is contradicted on 5 cells; P17-C on 2.
- In-sample: these are the only 不將 contexts in the 劫煞 domain, and both pages were seen before (§4).

**P17-4, 384-cell impact: AFFECTS_TABLE, 3 cells.** 未-壬申 wedding, engagement and moving go blank → avoid under the supported reading. All three stay CONFIRMED. The current faithful table (`jiesha-faithful-vol10-v1`, P17-0) is wrong in those 3 cells. Under A that is +3 avoid cells, giving 177 avoid and 207 blank. The 16-page check in §7b found one further table-reaching item that is not about puzhu:17: 未-戊申 納財.

**P17-5, P4 impact.**

- Under A/B, at context level in production P4, exactly 4 heading rows change, all in two contexts:
  - 未-壬申: 結婚姻, 納采問名 (`neither_recorded` → `only_ji`);
  - 未-戊申: 結婚姻, 納采問名 (五離 kept).
- Of these, only 未-戊申 occurs in 2025–2027, on 2026-08-02 and 2027-07-28. Its 4 rows are the 「未-戊申 (4 rows)」 that the faithful study's F1 table listed as contradicting the page. puzhu:17 explains them, so they are no longer F1 evidence. F1 itself is not reopened here.
- Under C, 26 rows change, most of them 嫁娶's 宜 state. C is contradicted by the witnesses.
- The second sub-clause is unimplemented in the engine. Its precondition holds in 71 P4 contexts, all outside the table. What it means there ("止註所忌之事，其不忌者仍不註忌") is open and is a P4-only item.

## 9. F2 re-evaluated

**F2_TABLE = PARTIAL.**

The puzhu:17 part is resolved. The Option C table must be regenerated with P17-A, which corrects 3 cells. One 鋪註-reachable uncertainty can still change cells: the 未-戊申 納財 宜 premise, which feeds puzhu:21.

| Issue | Can it change a cell? |
|---|---|
| puzhu:17 不將 exception | resolved (P17-A/B); +3 avoid cells in 未-壬申 |
| puzhu:17 second sub-clause | no; its precondition never holds in the 16 contexts |
| **未-戊申 納財 宜 → puzhu:21** | **yes.** finance directly; contract and transaction, plus opening and business, through 21. Up to 5 cells. Page contradicts finance and the 立券交易 heading (§7b). |
| 丑-丙寅 printed 月德 | scope premise only; page output matches all 21 comparable headings |
| F1 cross-god propagation | no. Every table-relevant propagation removes 劫煞 from a heading whose trigger lost 劫煞 to its own 宜. The 戌 開倉庫 rows lose 五虛, not 劫煞. |
| puzhu:06 Q4 (戌-癸亥) | no; 劫煞 is already cancelled on 開倉庫出貨財 |
| restored-scope label | no cell depends on it (faithful study) |
| medical adapter anomaly | score adapter, P4 window only |

The evidence is in-sample. Every 劫煞 context has now been read, so no out-of-sample witness can exist.

**F2_P4 = PARTIAL.** Open items:

- the puzhu:17 second sub-clause (precondition in 71 contexts);
- puzhu:06 Q4 against 戌-癸亥;
- 未-戊申 納財 宜;
- the restored-scope label SPEC_GAP;
- F1. It loses the 4 未-戊申 marriage rows, which puzhu:17 now explains, and gains 戌-己亥 開倉庫出貨財 (out of window).
- The engine still implements P17-0. Moving P4 to P17-A changes Golden v2 rows on 2026-08-02 and 2027-07-28.

## 10. Readiness by layer

**VOL10_OPTION_C: MORE_EVIDENCE_REQUIRED.**

- puzhu:17 no longer blocks: the corrected table is `full.json` under P17-A, with 177 avoid and 207 blank, all CONFIRMED.
- One blocker can still change cells: 未-戊申 納財 宜, up to 5 cells.
- 丑-丙寅's scope premise should be settled at the same time. It does not change printed output.
- Generating the migration table means applying P17-A on the audit/generator side without changing P4 production. Changing the engine would move Golden v2 on the two 未-戊申 dates.
- The table to migrate is not the `jiesha-faithful-vol10-v1` lock.

**P4 2025–2027: MORE_EVIDENCE_REQUIRED.** See the F2_P4 items.

Nothing was migrated. No Option C table, `resolveVol10` change, Golden successor, Golden v3, flag or adapter revision was made.

## 11. Non-inferences

- A versus B is not decided. It does not need to be for the table or for P4 as it stands.
- The in-window 未-戊申 match is not out-of-sample confirmation.
- The owner note's "concern 嫁娶 itself" is not shown wrong as an intent statement. It is shown not to be what the engine does, and its literal heading-level reading (C) is contradicted by both pages.
