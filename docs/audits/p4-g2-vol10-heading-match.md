# G2 Stage 1: 立劵交易 / 立券交易, authority audit and frozen Stage 2 spec

2026-10-24. Branch `claude/g2-stage1-audit` from `origin/main` `394acbb` (PR #99 merged; G1-b Stage 2 shipped). **Audit and spec only.** No runtime code, data, authority, Golden, manifest or lock is changed. Production output is identical before and after.

**About the file name.** The task suggested `p4-g2-score-lookup.md`. The audit found that the G2 mismatch is **not** in the P4 score lookup; it is in 卷十 heading matching (§3). The file is named for what it covers.

Artifacts are in [`sources/p4-vol10/g2-stage1/`](sources/p4-vol10/g2-stage1/):

| File | Producer | Content |
|---|---|---|
| `inventory.json`, `source-evidence.json` | `build_evidence.py` | Every 劵 / 立券交易 occurrence, grouped by layer. Every raw-source glyph with its context. The 萬年書 list counts. Scan provenance. |
| `scan-06067687-p42-heading.png`, `scan-06067687-p37-dong.png` | PDFKit render of `yi-sources-v1/06067687.cn.pdf` | The 卷十一 heading crop, and a 力 comparison crop (動) |
| `candidate-impact.json`, `candidate-impact.tsv` | `shared/lunar/p4G2Stage1Audit.test.ts` (`G2_FULL=1`) | Current production vs two candidate mechanisms: the 1,095 domain days, the 3 outside controls, and all of 2028 |
| `range-impact.json` | the same test, run with `G2_RANGE=1` | Activities on every day from 1900 to 2100. Events on every 30th day. |
| `bound.py` | Python, frozen inputs only | An independent bound on the domain days the candidate can touch |
| `blast-radius.json` | throwaway worktree, not committed | Tests and locks that break when the candidate is applied |
| `lock.json` | — | sha256 of inputs and outputs |

## Decision: `SAME_ACTIVITY_ALIAS_CONFIRMED`

立劵交易 and 立券交易 are one 卷十一 用事 heading, written with two glyphs.

The live mismatch is in `resolveVol10` 卷十 heading matching:
- The 卷十 avoid lists keep 立劵交易, because `NORM` has no 劵.
- The activity map keys contract and transaction as 立券交易.
- So contract and transaction read `not_listed` in every 卷十 entry that lists them.

The P4 path is **not** affected: P4 already folds 劵→券 through `canonP4Heading`.

**Stage 2 is gated on owner decisions (§11).** They do not affect the identity decision.

**Owner ruling, 2026-10-25.** `未-戊申 × contract/transaction` stays **BLANK**, preserving current authority. The n117 discrepancy is `OUT_OF_SCOPE_AUTHORITY_DISCREPANCY`, deferred to a separate audit: [`p4-weishen-lijuan-authority-item.md`](p4-weishen-lijuan-authority-item.md).

## 1. Starting state (`394acbb`)

| Item | Value |
|---|---|
| `p4ScoreHeadingLookup` | `canonical-v1` (G1-b Stage 2, live) |
| `xiejiVol10JieshaPolicy` / `xiejiVol10BalancingEnabled` | `faithful-v1` / `true` |
| `datasetVersion` / `P4_SCORE_ADAPTER_VERSION` | `1.2.1` / `p4-score-adapter-v1` |
| `canonicalP4HeadingKey` | `canonP4Heading(splitHeadings(h)[0])`. `canonP4Heading` maps 劵→券, so 立劵交易 → 立券交易 |
| `NORM` (`xiejiVol10Resolution.ts:63`) | 12 pairs (册宫㑹產壞牆啟廻徳隂夘葢). There is **no** 劵 |
| Activity map | `contract` = `transaction` = `['立券交易']` (`xiejibianfangshu-yiji.json`) |
| P4 provider key | `立券交易` (measured; no 立劵交易 key) |
| 卷十 data | 立劵交易 in the avoid lists of 月破, 平日, 收日, 刼煞, 月厭 and 月刑. 月煞 and 災煞 read 刼煞's list through `avoidSameAs` |
| 劫煞 authority v1 | contract and transaction are `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION`. Their approved cells exist (13 blank, 3 avoid). `getVol10JieshaRuntime` throws if they are reached |
| G1-b | 破屋壞垣 → 破屋壊垣 live. Golden v3 and migration diff v3 pass on this tree (§12) |

## 2. Inventory

Counts come from `inventory.json`. Each count is occurrences across the tracked files in that layer.

| Layer | Files | 立劵交易 | 立券交易 |
|---|---|---|---|
| Source transcription (`*.raw.txt`) | 5 | 34 | 2 |
| Repository source data (`shared/almanac-data`) | 24 | 170 | 40 |
| Runtime code | 4 | 2 | 3 |
| Tests and gates | 19 | 10 | 28 |
| Derived data and audit fixtures (Golden, diffs, sweeps) | 103 | 48 | 41,859 |
| Documentation and audits | 66 | 80 | 5,223 |

Derived files are never counted as source authority.

How each layer uses the two forms:
- **Activity ID:** `contract` and `transaction` both use one heading, 立券交易.
- **UI and events:** labels come from the activity catalog. Events map `transaction` and `contract` (for example `sign_contract`) and call `resolveVol10` directly.

## 3. Provenance chain and the mismatch

| Step | Input → output | Transform | Source spelling kept |
|---|---|---|---|
| 卷十 transcription | 立劵交易 (32×) | — | yes |
| `xiejibianfangshu-vol10-yiji.json` | 立劵交易 in 6 avoid lists | — | yes |
| `splitHeadings(entry.avoid)` | 立劵交易 → 立劵交易 | `NORM`: no change | yes |
| Activity map | contract → 立券交易 | — | 卷十一-list spelling |
| `resolveVol10` match | `normalize('立券交易')` vs listed `'立劵交易'` | **mismatch: `not_listed`** | — |
| 卷十 verdict → score / event | no 卷十 verdict for contract or transaction | legacy rows apply unchanged | — |
| P4 provider | 卷十 / 卷十一 rows → `canonP4Heading` → 立券交易 | 劵→券 | provenance kept upstream |
| `p4ActivityState` / `applyP4Balancing` (`canonical-v1`) | 立券交易 → 立券交易 | none needed | yes |

The mismatch exists only at the `resolveVol10` match. P4 scoring reads contract and transaction correctly today. In the domain, contract's P4 states are `only_ji` 511, `only_yi` 288, `neither_recorded` 92, `both_present` 51 and `baseline` 153.

## 4. Source authority

All four 協紀辨方書 volumes are Wikisource 四庫 transcriptions. The evidence is **transcription-derived**, except for the one scan read noted below.

| Source | Form | Where |
|---|---|---|
| 卷十 (`vol10.raw.txt`) | 立劵交易 ×32, with 0 券 | 用事 lists of 月破, 平日, 收日, 劫煞, 月厭, 月刑, 五離 and others (`:189`…`:506`) |
| 卷十一 body heading (`vol11.raw.txt:231`) | `{{SK anchor\|立劵交易}}`, followed by one 宜 list and one 忌 list | The compiled 宜忌 entry |
| 卷十一 萬年書 lists (`:29`, `:43`, `:63`) | 立券 and 交易 as separate cells | 御用六十七事, 民用三十七事, 通書選擇六十事 |
| 卷五 (`:436`, `:439`) | 立劵交易; 立契劵 | 五合 宜, 五離 忌 |
| 卷六 (`:262`) | 立契劵合交易 | 李鼎祚 |
| 推步捷例 (Joseon 1861) | 立券交易 ×2 | Derivative compilation, not authority |

**Scan check** (`06067687.cn.pdf`, 卷十一〜卷十二, sha256 `472a6066…`, PDF page 42):
- The heading above 「宜天願民日…」 reads 立?交易.
- The lower element of the second glyph is drawn like 力. It matches 動 in the 興造動土 heading on page 37, so the glyph is 劵, consistent with the transcription.
- This is a single visual reading, medium confidence, for 卷十一 only. The 卷十 scans were not read.

**Are 立券 and 交易 one activity?**
- The three 萬年書 lists add up to their declared totals (67, 37, 60) **only** if 立券 and 交易 are separate cells (`source-evidence.json`). The same holds for 覃恩 / 肆赦, 行幸 / 遣使 and 開倉庫 / 出貨財.
- 卷十一 then states 「今以次合為一編而分列宜忌於事下」 and gives 立劵交易 **one** heading with **one** 宜 list and **one** 忌 list. This is how it treats every such pair.
- 卷十 prints 立劵交易 as one contiguous item in every list.
- So at the level where 宜忌 are assigned, the compound is one source heading.
- The repository activity map follows the 卷十一 body. It is a faithful transcription, not a product composition.

## 5. Character and activity identity

**Character level.**
- In-corpus, the work writes the same compound in both glyphs. The heading and 卷十 use 劵; the lists use 券.
- It uses 劵 in 立契劵 (卷五) and 契劵 (卷六), where only the sense "contract, deed" fits.
- Within 協紀辨方書, 劵 is used for 券. Character-level alias: **YES** (in this work).
- The general lexicographic status of 劵 (for example as a 俗 form or confusion of 券, or 劵 = 倦) is **not verified in the repository**, and nothing here relies on it.

**Activity level.**
- **立券:** draw up or establish a written deed, contract or bond (契券).
- **交易:** exchange and trade.
- The source groups the two as one 宜忌 heading (§4).
- Both spellings name that one heading. No source gives the two spellings different lists, values or conditions.
- Same source activity: **YES**.
- Repository composition faithful: **YES**.

## 6. Current production behaviour (measured)

The source is `candidate-impact.json` → `currentProduction`.

- **Lookup:** the provider key is 立券交易. `canonicalP4HeadingKey('立券交易')` is 立券交易, so P4 lookup **succeeds**.
- **P4 reachability:** fully reachable and correct in 2025–2027. On the 153 baseline days, scoring falls back to the vol10 / legacy path.
- **卷十 reachability:** **always unreachable** for the six listing entries plus 月煞 and 災煞. The verdict is `not_listed` on every date. The fallback is that legacy catalog rows apply with no 卷十 lift or keep.
- Rules from a separate path still reach contract today. These are the `xieji10:yue_jian`, `xieji10:yue_sha` and `xieji10:yue_yan` catalog rules, measured as `applied:avoid`.
- **`sourceRaw`:** 立券交易 in the activity map, 立劵交易 in the 卷十 data. Both are preserved.
- **Hard warning:** none involves G2.

## 7. Candidates

| Candidate | Verdict |
|---|---|
| A. Current production | Kept as the rollback. Leaves the 卷十 rules unread for contract and transaction. |
| **B. Narrow explicit alias in `xiejibianfangshu-vol10-yiji.json` `headingAliases`: `立劵交易 → ["立券交易"]`** | **Recommended.** It uses the existing alias mechanism (`補垣`, `補捉`…), keeps the 卷十 text as written and folds only this one heading. |
| B′. `NORM` 劵→券 | Rejected. It is a global character fold applied to every text `normalize` touches, which is broader than needed and not proven across all callers. (The historical G1-b spec also rejected it.) |
| C. Source correction (rewrite 卷十 text to 券) | Rejected. It rewrites a transcription that is correct (§4–5). |
| D. Provider correction | Not applicable. P4 already folds 劵→券. |
| E. Composite or split mapping | Rejected. The source has one heading (§4). |
| Activity-map respelling to 立劵交易 | Tried and rejected. P4 data keyed 立券交易 can no longer be split (measured). |

**B alone is not shippable.**
- With the alias and no authority change, `getVol10JieshaRuntime` throws `contract is UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION but was reached` from `getAlmanac` (71 failing tests; `blast-radius.json`).
- So Stage 2 = B + **劫煞 authority v2** with contract and transaction set to `APPLIED`, using their approved v1 cells.

## 8. Collisions

- **Before the alias:** under `canonicalP4HeadingKey`, every source heading maps to a distinct key. The G2 test for this on `main` is `p4MigrationDiffV3.test.ts`, "isolation".
- **The alias:** the reverse group 立券交易 ← {立券交易 (activity map: contract and transaction), 立劵交易 (卷十)}.
- **Distinct activities merged:** none. contract and transaction already share 立券交易.
- **The target already exists** as a source heading: yes, it is the same heading.
- **Other 劵 headings in the vocabulary:** none. 劵 occurs only in 立劵交易 in the 卷十 data. 契劵 appears only in raw prose, never in a 用事 list.
- **Is a global 劵→券 fold safe?** **NOT PROVEN** beyond the current vocabulary. Stage 2 must not introduce it.

## 9. Impact (candidate B + authority v2, vs current production)

Two mechanisms were measured: B (alias table) and a text-rewrite model. They give identical conclusions on every date and activity. Counts are activity-days, with contract and transaction counted separately. A "conclusion" change is a change in score, status or hard warning.

| Set | Days | State / evidence | Score (lower / higher) | Status | Hard warning | Conclusion | Other activities | Events (score / class / evidence-only) |
|---|---|---|---|---|---|---|---|---|
| P4 domain 2025-01-01 … 2027-12-31 | 1,095 / 1,095 | 24 | 24 (0 / 24) | 24 | 0 | 24 (12 dates) | 0 | 108 / 72 / 4,222 of 4,330 changed |
| Outside controls | 3 / 3 | 4 | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 20 |
| Outside sample 2028 | 365 | 184 | 70 (8 / 62) | 64 | 0 | 70 | 0 | 315 / 219 / 1,145 |
| **Full range 1900–2100, outside the domain** | 72,319 | 37,372 | 13,856 (2,020 / 11,836) | 13,254 | 0 | 13,856 | 0 | sampled every 30th day: 1,809 / 1,206 / 8,241 |

**P4 state changes:** 0 everywhere. G2 never changes a P4 state.

**Status transitions:**
- Domain: `watch→neutral` 22, `avoid→neutral` 2.
- Full range:

| Transition | Count |
|---|---|
| `watch→neutral` | 5,616 |
| `watch→recommended` | 4,022 |
| `no_evidence→avoid` | 1,810 |
| `avoid→neutral` | 1,596 |
| `watch→strong_avoid` | 210 |

**What the numbers mean.**
- **G2 is mainly a vol10-path and events change.** In the P4 domain only the 153 baseline days move on activities. Events move on every date, because they read `resolveVol10` directly.
- **Direction.** Most changes are lifts: 卷十 `not_avoided` or `no_annotation` makes a legacy penalty informational. The keeps (avoid kept or added) are 2,020 lower scores in the full range.
- **No change outside contract and transaction.** Other activities are 0 everywhere, which includes demolition (G1-b).

**Dependency on the disputed cell** (owner ruling 2026-10-25).
- **Method.** Model `weishen-avoid` is the same candidate with the 未-戊申 contract and transaction cells set to avoid. Comparing it with the ruling's blank isolates every row whose outcome depends on that cell. It is a measurement only, not a candidate.

| Set | Activity rows depending on the cell | Events depending on the cell |
|---|---|---|
| P4 domain | 0 | 20, evidence only (full mode) |
| 2028 | 2 (2028-07-22, contract and transaction) | 10 (9 score, 6 classification) |
| 1900–2100 outside the domain | 212 (106 dates × 2): blank gives a higher score than 忌 on all of them | none in the 1-in-30 event sample |

- **Two readings of "preserve the blank".**
  - **(I1) The approved blank is applied once reached.** This is the envelope in the table above (24 domain / 13,856 outside), and it needs no new representation.
  - **(I2) The cell stays inert, so those rows keep today's output.** The envelope is then 24 domain / 13,644 outside, with the 20 domain event rows unchanged as well.
- **I2 needs new authority data.** The existing data model has no per-context "not reached" state: per-activity `EXCLUDED_PENDING_GLYPH_AUDIT` also gives `no_annotation`. So I2 needs a new, narrow per-context representation in authority v2. **The owner should confirm which reading the ruling means** before the Stage 2 envelope is frozen.

**Independent bound** (`bound.py`, from frozen inputs only):
- 26 domain days have contract on baseline (Score Golden v3 layer B) and at least one listing entry present (frozen presence input).
- The runtime's 12 changed domain days are a subset of those 26.
- **Limitation:** `bound.py` bounds which days can change. It does not recompute verdicts or scores, and no fully independent re-implementation of `resolveVol10` exists.

## 10. Candidate witnesses (not owner-approved)

None of these depends on the disputed 未-戊申 cell (`weishen_cell_dependent = false` in `candidate-impact.tsv`). Per the owner ruling, 2028-07-22 (未-戊申) is removed from the G2 witnesses and kept as evidence for the separate authority item.

Every row is `contract`; `transaction` is identical. P4 state is `baseline` in all of them, and the hard warning is `false` before and after.

| Date | Before | After | 卷十 evidence after | Why this date |
|---|---|---|---|---|
| 2025-11-11 | 20 avoid | 50 neutral | 刼煞 not_avoided, 收日 not_avoided | Strongest change in the domain |
| 2025-07-14 | 35 watch | 50 neutral | 刼煞 not_avoided | Typical domain case |
| 2026-05-03 | 35 watch | 50 neutral | 收日 not_avoided | Officer entry alone |
| 2028-02-22 | 50 no_evidence | 25 avoid | 月煞 avoid applied | Strongest negative change |
| 2028-02-08 | 40 watch | 70 recommended | 刼煞 and 收日 not_avoided | Largest increase; moves to `recommended` |
| 2028-03-10 | 30 watch | 45 watch | 平日 no_annotation | Score changes, status does not |
| 2028-09-26 | 35 watch | 35 watch | 刼煞 avoid applied (approved cell) | Evidence changes only |

## 11. Owner gates for Stage 2

None of these block the identity decision.

**(a) Authority v2.** contract and transaction move from `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION` to `APPLIED` in a new 劫煞 authority version. v1 and the approved candidate `b24f6f68` stay frozen.

**(b) The 未-戊申 contract and transaction cell. RULED 2026-10-25: keep BLANK; the discrepancy is deferred.**
- Background: the approved cell is `blank`, but 月表 page n117 prints 立券交易 on its 忌 line (H1-B `printedButUnnoted`). The earlier ruling's reasoning covered 納財 only. The other 15 contexts agree with their pages.
- Stage 2 consequence: authority v2 copies the approved blank for both activities. No new representation is needed, because the existing per-context cell already holds `blank`. There is no date-specific runtime exception.
- The discrepancy (n117 vs blank) is `OUT_OF_SCOPE_AUTHORITY_DISCREPANCY` and goes to [`p4-weishen-lijuan-authority-item.md`](p4-weishen-lijuan-authority-item.md). `blank` stays production authority until that item is resolved.
- **What "blank" does once reached.** The blank cell yields 劫煞 `no_annotation`, so 劫煞's penalty becomes informational. Today the cell is never reached: contract reads `not_listed` and 劫煞's penalty stays applied. The rows whose outcome depends on this cell are measured in §9 under "Dependency on the disputed cell".

**(c) Scope.**
- The owner accepts that G2 changes behaviour **outside the P4 domain** (13,856 activity-days in the full range) and in **events** on every date.
- The owner accepts that G2 is not a score-lookup change.

## 12. G1-b protection

- The candidate changes 0 activities other than contract and transaction, on every date from 1900 to 2100. That includes demolition.
- Under the candidate:
  - `p4MigrationDiffV3` domain gate (full): passes. The 353 / 320 / 337 / 0 envelope and the five witnesses are unchanged.
  - `p4ScoreGoldenV3` layer C (full): fails on exactly the 24 contract and transaction domain rows. Those rows come from flag-OFF baseline v1, so a Score Golden successor is needed (§13).
- On this branch (current production), Golden v3 and diff v3 pass unchanged. Stage 1 changes no output.

## 13. Frozen Stage 2 scope

**Allowed:**
- one `headingAliases` entry, `立劵交易 → ["立券交易"]`, in `xiejibianfangshu-vol10-yiji.json`;
- 劫煞 authority v2 with contract and transaction set to `APPLIED`, using their v1 cells, after gate (b);
- successor artifacts for every lock in `blast-radius.json`;
- tests that pin the previous behaviour as rollback evidence.

**Forbidden:**
- a `NORM` 劵→券 fold, or any other new character fold;
- rewriting the 卷十 or 卷十一 transcription or `sourceRaw`;
- changing `canonicalP4HeadingKey`, `p4ScoreHeadingLookup`, the P4 composition or scoring rules;
- editing authority v1, the approved candidate, Golden v1–v3, migration diff v2/v3 or baseline v1;
- touching G1-b or demolition;
- Option C v2 demolition cells.

**Expected envelope:** the §9 table. Domain conclusion changes 24 (12 dates). Hard warning 0, other activities 0, P4 state 0. Outside the domain: 13,856 conclusion changes in 1900–2100.

**Stage 2 entry gate:** events were sampled 1-in-30 over the full range. Stage 2 must measure the **full-range event envelope** before sign-off.

**Successors** (from `blast-radius.json`; each needs a decision on freezing a new version):
- **Score Golden v4:** v3 with the contract and transaction baseline rows from a successor flag-OFF baseline. The 24 rows differ.
- **A baseline v1 successor:** `p4-adapter-baseline-v1` activities and events (`p4AdapterBaseline`, `p4MigrationRollback`, `p4MigrationDiff` baseline sha).
- **`golden-xieji-vol10-scoring-v2`:** its `jie-chen-contract-unreachable` case.
- **Authority tests:** `xiejiVol10JieshaAuthority.test.ts` (coverage states, the UNREACHABLE guard, the 未-戊申 corrections) and the Option C locks (`xiejiVol10JieshaMigrationLock`, `p4OptionCFinalGateLock`, `p4ChouBingyinYuedeAuditLock`).
- **Event and activation migrations:** `xiejiVol10Activation` (buy_property, buy_vehicle), `sameHeadingDuplicateMigration`, `legacyGodsMonthJian`.
- **Faithful harness safety checks:** `p4JieshaFaithfulVol10`, `p4JieshaOverlapImpact`.
- **Mutation guard:** `scripts/audit-vol10-jiesha-mutations.py:44`.

**Rollback:** remove the alias entry, and set authority back to v1 (contract and transaction `UNREACHABLE`). The result is current production: `canonical-v1` + Score Golden v3.

**Versioning, for Stage 2 to decide (none bumped here):**
- `datasetVersion`: a data file changes, unlike G1-b, so the PR #87 / G1-b no-bump precedent may not hold.
- `P4_SCORE_ADAPTER_VERSION`: expected to stay, because adapter rules don't change.
- The canonical lookup version (`canonical-v1`): expected to stay, because P4 lookup doesn't change.
- The 劫煞 authority version: becomes v2.

## 14. Decision matrix

| Criterion | Current | Alias (B) | Source fix (C) | Provider fix (D) | Composite (E) |
|---|---|---|---|---|---|
| Source fidelity | high | high (text untouched) | low (rewrites transcription) | n/a | low |
| Semantic correctness | low (卷十 rules unread) | high | high | n/a | low (two activities do not exist) |
| Provenance preservation | high | high | low | n/a | medium |
| Runtime complexity | none | one data entry + authority v2 | data edit + authority v2 | n/a | new mapping |
| Collision risk | none | none (one heading) | none | n/a | n/a |
| Other-activity impact | 0 | 0 (measured) | 0 | n/a | unknown |
| Rollback simplicity | — | remove one entry + authority v1 | revert data | n/a | — |
| Evidence strength | — | strong in-corpus, medium scan | contradicts source | — | contradicts source |

**Recommendation:** `SAME_ACTIVITY_ALIAS_CONFIRMED`, delivered through B and authority v2, after gates (a)–(c).
