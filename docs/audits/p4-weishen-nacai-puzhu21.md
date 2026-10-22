# 未-戊申 納財 宜 → puzhu:21 (audit only)

2026-10-22, branch `claude/weishen-nacai-puzhu21-audit`, parent `a85ab0f`. Nothing in production changes: no code, JSON, flag, adapter revision or Golden. Earlier audit commits are untouched.

Input: [puzhu:17 audit](p4-puzhu17-bujiang.md). Its 16-page check found that 未-戊申 納財 reaches up to 5 cells of the faithful 劫煞 table.

Artifacts are in `sources/p4-vol10/weishen-nacai-puzhu21-v1/`:

| File | Contents |
|---|---|
| `predictions.json`, `freeze.json` | frozen in `718f06c`, before the re-read |
| `full.json` | 108 scope dates × N-A / N-B |
| `sensitivity.json` | N-B against N-A: almanac activities and events |
| `witness.json` | full-resolution cells |
| `result.json` | from `build_result.py` |
| `lock.json` | hashes of the above |

The harness `p4WeishenNacaiAudit.test.ts` gained its sensitivity test after `718f06c`. The freeze test body is unchanged, and the lock hashes the final file.

## Outcome

**STOP for owner review.** The page contradicts every source-derived reading on at least one cell:

- No textual source supports removing 納財's 宜.
- The page cannot be reconciled with any combination of rules: it prints 納財 as 忌 but leaves 開市 unnoted.
- Both source-derived readings, N-A and N-C, leave all 384 cells exactly as in the P17-A table.

The table changes only if the owner adopts the page-literal reading N-B. That reading has no textual basis and contradicts the page on 開市.

## N1: the 納財 premise

| Operand | Present on 未-戊申? | Effect on 納財 | Source status | Evidence |
|---|---|---|---|---|
| 四相 (夏 戊己) | yes: engine trace, and 四相 printed in 吉神 (re-read) | 宜 | SOURCE TEXT | 卷十 四相/時德 entry 「宜…納財開倉庫出貨財栽種牧養」; 卷十一 納財 「宜母倉天願月恩四相時徳…」 |
| other 納財 宜 gods (母倉 天願 月恩 時德 民日 三合 滿日 收日 六合 五富 天倉) | no | — | engine trace = [四相] | `freeze.json` `nacaiYi` |
| 劫煞 | yes | 忌 | SOURCE TEXT | 卷十 劫煞 忌 list contains 納財 |
| 劫煞 clause, 辰戌丑未 除日/相日, no 德 | applies: 除日, 相日 printed, no 德 | 「忌則不宜宜則不忌」: a heading with 宜 is not noted 忌 (OVERLAP) | SOURCE TEXT, OWNER-ADOPTED (相抵 audit) | 卷十 劫煞 entry |
| 天賊, 五虛, 五離 | yes | none on 納財 | SOURCE TEXT | 天賊: 行幸遣使 修倉庫 開倉庫出貨財. 五虛: 修倉庫 開倉庫出貨財. 五離: 慶賜賞賀 宴會 結婚姻 納采問名 立券交易. |
| 德 | absent | — | | scope premise; page shows no 德 |
| 建除 除日 | yes | not a 納財 宜/忌 operand | 卷十一 納財 lists | |
| puzhu:06 「凡徳合赦願月恩四相時徳等日不註忌…開市立劵交易納財開倉庫出貨財…如遇徳猶忌及從忌不從宜之日則仍註忌」 | 四相 day | withholds 納財's 忌 independently of 宜 | SOURCE TEXT; engine: owner class UNDETERMINED → hold | 卷十 offset 21817 |
| other 鋪註 before puzhu:21 | none names 納財 | — | | 鋪註 inventory (faithful study) |

ENGINE BEHAVIOR:

- 納財 has 宜 = {四相}, which meets 劫煞 in a 相抵, so 納財 is `neither_recorded`.
- puzhu:21 then takes 開市 to `not_recorded` (劫煞 removed) and 立券交易 to `not_recorded` (五離 and 劫煞 removed).

The source independently gives 納財 unnoted twice over: by 相抵 and by puzhu:06. Nothing in the source keeps 納財's 忌.

**月表 (n117):** 納財 is printed on the 忌 line and absent from the 宜 line.

Survey of the same 劫煞 branch:

- 時德, which shares one 卷十 entry and 宜 list with 四相, cancels 劫煞 on 納財 on 丑-壬寅 and 丑-戊寅 (unprinted).
- 五富 does the same on the four 戌-亥 days.
- 未-戊申 is the only context in the 劫煞 domain where 四相 is 納財's only 宜. Every other 劫煞 context's 納財 matches the page.

**N1 status: SOURCE_SUPPORTED (宜 present); WITNESS_CONFLICT on one cell.**

## N2: puzhu:21

SOURCE TEXT (卷十 offset 22390, with the next line for contrast):

> 凡吉凶相抵不註忌開市亦不註忌立劵交易納財；不註忌納財亦不註忌開市立劵交易；不註忌立劵交易亦不註忌開市納財
> 凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財，如遇專忌之日則仍註忌 (puzhu:22)

1. **Trigger:** any one of 開市, 立券交易, 納財 left unnoted by 吉凶相抵.
2. **Targets:** the other two. The relation is a symmetric triad.
3. **Is 宜 required?** Only through 相抵: the trigger must be unnoted *by 相抵*, which needs a 宜 meeting a 忌. Being unnoted for other reasons does not count.
4. **What "不註忌" covers:** heading-level wording; the text does not say which god's 忌 is withheld. puzhu:21 has no exception clause. puzhu:22, on the next line, carries 「如遇專忌之日則仍註忌」, so the authors added exceptions where they meant them.
5. **Independent 忌:** the text is silent. Two source-derived readings follow:
   - **N-A** (engine): all 忌 on the target are withheld.
   - **N-C**: only the 忌 the trigger's 相抵 cancelled (劫煞) is withheld; 五離 survives.

   For the table both are identical, by an analytic argument per god. A table cell asks whether 劫煞's 忌 survives on a listed heading. Both readings withhold 劫煞 on 開市 and 立券交易, so the cells match. N-C is not engine-implemented; a naive "noted AND 劫煞 in trace" check would misfire there.

The page prints 立券交易, which rules out N-A for the P4 heading row; 五離 explains it. That is an F1 note only, not resolved here.

**N2 status: SOURCE_SUPPORTED for the table** (N-A ≡ N-C on every cell). Independent-忌 behaviour stays SOURCE_DEPENDENT for P4, and F1 is not reopened.

## N3: chain on 未-戊申 (P17-A base, all 108 scope dates)

```text
四相 present → 納財 宜
劫煞 忌 納財 → 相抵 (宜則不忌) → 納財 neither_recorded
puzhu:21 → 開市 (劫煞) withheld; 立券交易 (劫煞 [+五離 under N-A]) withheld
finance [納財] blank · opening, business [開市] blank · contract, transaction [立券交易] blank
```

Activity mapping (`xiejibianfangshu-yiji.json`):

- finance → 納財
- opening, business → 開市
- contract, transaction → 立券交易
- warehouse_opening → 開倉庫出貨財: blank under every reading, because 劫煞 is cancelled by its own 宜 and the printed 忌 comes from 五虛/天賊.

The five suspected cells are exactly right.

## Prediction freeze and witness (`718f06c`)

**Not blind.** n117 was transcribed in H1-B and partly re-read in the puzhu:17 audit.

Re-read after the freeze from crops of the stored JPG (highest resolution stored; no OCR):

- 吉神: 四相 陽德 相日 吉期 不將 益後 除神 司命
- 宜: 祭祀沐浴掃舍宇
- 忌, three columns:
  - 忌上冊受封上表章會親友出行結婚姻納采
  - 問名安牀求醫療病修倉庫立券交易納財
  - 開倉庫出貨財破土安葬啟攢

Segmentation:

- 納財 ends column 2 and is separate from 開倉庫出貨財, which starts column 3.
- No 開 precedes 立券交易, so 開市 is absent.

| Heading | Production (cancel_both) | N-A | N-C | N-B | N-B6* | Printed | Confidence |
|---|---|---|---|---|---|---|---|
| 納財 | unnoted | unnoted | unnoted | **noted** | unnoted | **noted** | high |
| 開市 | unnoted | unnoted | unnoted | **noted** | unnoted | **unnoted** | high |
| 立券交易 | unnoted | unnoted | noted (五離) | noted | noted | noted | high |

\*N-B6 = N-B plus puzhu:06 read as text. It is a hybrid built on N-B's unsupported premise, not source-derived; its contract/transaction cells were frozen as `avoid?`.

Score on 3 deciding cells:

| Reading | Supports | Contradicts |
|---|---|---|
| N-A | 1 | 2 (納財, 立券交易) |
| N-C | 2 | 1 (納財) |
| N-B | 2 | 1 (開市) |
| N-B6 | 2 | 1 (納財) |

Uncertain: 0.

No rule set yields {納財 noted, 開市 unnoted}:

- 開市 has no 宜 on this day.
- Its only routes to "unnoted" are puzhu:21 from 納財 and puzhu:06 via 四相, and both unnote 納財 as well.

One of the two printed cells is a compilation or print error. The page alone cannot say which.

No other locked page can decide it, because 未-戊申 is unique in the 劫煞 domain. No page was fetched.

## 384-cell recomputation

| Step | Cells | Avoid | Changed cells |
|---|---|---|---|
| faithful (`d79b08e`) | 384 | 174 | — |
| after P17-A (`a85ab0f`) | 384 | 177 | 未-壬申 wedding, engagement, moving (blank → avoid) |
| source reading N-A / N-C (this audit) | 384 | 177 | **none** |
| page-literal N-B (hypothetical) | 384 | 182 | 未-戊申 finance, contract, transaction, opening, business (blank → avoid) |

The 未-戊申 cells are constant over all 108 scope dates under both readings, with 0 varying.

## Full-range sensitivity (hypothetical, N-B against N-A)

Under the source reading, this audit changes no cell. These are the stakes of the owner ruling:

- dates: 108 (1900–2100), including 2026-08-02 and 2027-07-28;
- activity rows: 328 (opening 108, business 108, finance 108; contract 2 and transaction 2, both in-window only);
- score: −15 on all 328;
- ratings: neutral→watch 324, watch→avoid 4;
- events: open_business caution→not_recommended on 108 dates.

## F2 gate

| Open issue | Can it change a table cell? | Evidence | Blocks Option C? |
|---|---|---|---|
| F1 cross-god propagation | no | table cells depend only on 劫煞; N-A ≡ N-C | no |
| puzhu:17 second clause | no | precondition never holds in the 16 contexts | no |
| puzhu:06 Q4 (戌-癸亥) | no | 劫煞 already cancelled on 開倉庫出貨財 | no |
| **未-戊申 納財** | **only under page-literal N-B (5 cells)** | source: 宜 present, nothing suppresses; page internally inconsistent | **yes, pending an owner ruling** |
| scope label SPEC_GAP | no | no cell depends on the label | no |
| medical adapter anomaly | no | P4 score adapter, 2025–2027 only | no |
| 丑-丙寅 printed 月德 | no cell value; it decides whether the override applies on 99 dates (24 cells) | page output matches all 21 comparable headings | owner call |

**F2_TABLE = PARTIAL.** One owner ruling is needed: do source text (卷十 四相 entry, 卷十一 納財 list, 劫煞 clause, puzhu:06) outrank a single, internally inconsistent 月表 cell? On a "yes", the table equals the P17-A table and F2_TABLE becomes COMPLETE.

**F2_P4 = PARTIAL.** Open items:

- F1 / independent 忌. On n117 the printed 立券交易 rules out N-A for P4 rows.
- the puzhu:17 second clause;
- puzhu:06 Q4, and the puzhu:06 四相 class (UNDETERMINED);
- the scope label;
- the medical adapter anomaly;
- the engine still runs P17-0.

## Readiness

- **VOL10_OPTION_C: MORE_EVIDENCE_REQUIRED.** It needs the owner ruling above, plus the 丑-丙寅 月德 scope call. No `candidate-final.json` was created, because step 11 requires F2_TABLE = COMPLETE.
- **P4: MORE_EVIDENCE_REQUIRED.**

Two routes close the table:

1. **Owner ruling, source over one cell.** The candidate is the P17-A table: `puzhu17-bujiang-v1/full.json`, 177 avoid / 207 blank, all CONFIRMED.
2. **Second witness.** Another edition or digitization of the same 未-戊申 月表 page would show whether 納財 or 開市 is the error. Nothing was fetched in this task.

## Option C implementation (design only; once the table is closed)

- **Table:** `vol10-jiesha-faithful-v1.json`. 384 cells, keyed `${monthJian}${pillar}` → `{activityId: 'avoid' | 'blank'}`. It records the generator (P4 engine at the pinned commit with P17-A applied on the generator side only), input hashes and a schema version.
- **Runtime:** in `resolveVol10`, only for `entry === 'jie_sha' && effect === 'cancel_both'` with Month Jian in 辰戌丑未. A cell of `avoid` becomes an avoid verdict; `blank` keeps `no_annotation`.
  - A missing key throws. The key set is closed: 16 contexts.
- **Flag:** a policy flag (for example `vol10JieshaPolicy: 'cancel_both' | 'faithful-v1'`), with the default switched in a separate commit and historical tests pinned to `cancel_both`.
- **P4 layer (2025–2027):** untouched. The P4 engine stays on P17-0 until its own blockers clear, because changing it moves Golden v2 on 2026-08-02 and 2027-07-28.
- **Golden:** a successor to `golden-xieji-vol10-scoring.json` plus the 卷十 migration tests re-pinned. No Golden v3 unless P4 moves.
- **Tests:**
  - migration diff, to equal the simulator's full-range rows under the final table;
  - mutation tests: flip each of the 384 cells, plus key removal;
  - flag-off invariance against today's production;
  - rollout checks of events and ratings on the 2025–2027 window.

## Non-inferences

- 未-戊申's 納財 is not shown to be a print error. It is shown to be irreconcilable with 開市 on the same page under any rule set.
- N-C is not adopted for P4. It is only shown equal to N-A on the table.
- No out-of-sample confirmation exists or can exist inside the 劫煞 domain.
