# G2-n117 Stage 1: 未-戊申 × 立券交易, authority discrepancy (audit only)

2026-10-26, branch `claude/g2-n117-stage1`, cut from `origin/main` `aebcf2e`. Nothing in production changes: no code, JSON, flag, adapter revision, Golden or runtime configuration.

This continues the open item [`p4-weishen-lijuan-authority-item.md`](p4-weishen-lijuan-authority-item.md) (W1).

Artifacts are in `sources/p4-vol10/g2-n117-stage1/`:

| File | Contents |
|---|---|
| `build_evidence.py` | Deterministic builder. Page readings are manual re-reads of the stored JPGs; everything else is read from committed files. |
| `evidence.json` | Canonical mapping, 卷十一 entries, 8 page rows (with mechanical 立券交易 operand sets), authority v1–v4 cells, runtime observation, hypotheses, ruling |
| `lock.json` | sha256 of the evidence, the builder, the raw 卷十 / 卷十一 text, the two frozen upstream artifacts, and the 8 page JPGs |

Harness: `shared/lunar/p4G2N117AuthorityLock.test.ts`.

**Ruling: `UNRESOLVED_CONFLICT`.** The cell stays `BLANK / I1` and is not `SOURCE_WITNESSED`.

## 1. Scope

- **In:** the 劫煞 authority cells `未戊申 × contract` and `未戊申 × transaction` (heading 立券交易), and witness page n117.
- **Out:**
  - the 納財 (finance) cell, which is owner-ruled ([final gate](p4-option-c-final-gate.md));
  - G2 heading identity;
  - G1 / G1-b / G1-SOIL cells, including 未戊申 demolition;
  - the P4 engine (2025–2027).

### Framing correction

The Stage brief states the conflict as "四相 宜 納財 vs n117 忌 納財". **That is the 納財 cell, not the target.**

- The 納財 conflict was settled by `OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS`. That ruling is LOCAL and covers 納財 only.
- The target cell has a different conflict. The 劫煞 cell for 立券交易 is `blank`, but n117 prints 立券交易 on its 忌 line.
- The blank follows from the 納財 ruling through the source rule puzhu:21.

## 2. Repository baseline

| Item | Value |
|---|---|
| Start branch | `claude/docs-project-context-g1-soil` at `967bb15` (docs only; not on main) |
| `origin/main` | `aebcf2e` (PR #104, G1-SOIL Stage 2) |
| Work branch | `claude/g2-n117-stage1` from `origin/main` |
| Working tree | clean (only the untracked `.claude/`) |
| Live authority | `xieji-vol10-jiesha-authority-v4.json` (`3d082727…`), `xieji-vol10-jiesha-faithful-v4` |

### Provenance trail

| Step | Document | What it settled |
|---|---|---|
| H1-B | [`p4-h1b-yuebiao-witness.md`](p4-h1b-yuebiao-witness.md) | n117 transcribed; 立券交易 in `printedButUnnoted` |
| 相抵 / OVERLAP | [`p4-xiangdi-cancel-both-audit.md`](p4-xiangdi-cancel-both-audit.md), [`p4-jiesha-overlap-impact.md`](p4-jiesha-overlap-impact.md) | 劫煞 clause: a heading that has 宜 is not noted 忌 |
| puzhu:06 | [`p4b-puzhu06.md`](p4b-puzhu06.md) | Owner Q4 (2026-10-16): 四相 lifts 五離 on 立券交易; the layer is audit-only |
| Faithful table | [`p4-jiesha-faithful-vol10.md`](p4-jiesha-faithful-vol10.md) | 未-戊申 立券交易 ← 納財 recorded as a 宜-evidence mismatch on 納財 first |
| puzhu:17 | [`p4-puzhu17-bujiang.md`](p4-puzhu17-bujiang.md) | Contract and transaction cells depend on 納財 |
| 納財 audit | [`p4-weishen-nacai-puzhu21.md`](p4-weishen-nacai-puzhu21.md) | N-A / N-B / N-C; the page is irreconcilable on {納財 noted, 開市 unnoted} |
| Final gate | [`p4-option-c-final-gate.md`](p4-option-c-final-gate.md) | LOCAL owner ruling; the five 未-戊申 cells stay blank |
| G2 Stage 1 / 2 | [`p4-g2-vol10-heading-match.md`](p4-g2-vol10-heading-match.md), [`p4-g2-stage2-migration.md`](p4-g2-stage2-migration.md) | Cell reachable, BLANK, I1 semantics; discrepancy deferred to W1 |
| G1-SOIL | [`p4-g1-soil-authority.md`](p4-g1-soil-authority.md) | Demolition 未戊申 is a separate cell; 0 contract/transaction changes |

## 3. Target cell

| Field | Value |
|---|---|
| Key | `未戊申` (Month Jian 未, pillar 戊申, officer 除), 劫煞 辰戌丑未 branch without 德 |
| Activities | `contract`, `transaction` → heading 立券交易 |
| Authority v1 | `blank`, UNREACHABLE (劵/券 mismatch) |
| Authority v2–v4 | `blank`, APPLIED |
| Runtime | `getVol10JieshaRuntime('未','戊申',·) = {APPLIED, blank}`; `resolveVol10` 劫煞 verdict `no_annotation` (I1) |
| Witness | `06067694-n117.jpg` (卷二十五), sha256 `2e845be6…`, archive.org `06067694.cn/page/n117` |

## 4. Canonical activity analysis

- **立劵交易 ↔ 立券交易: same activity.** This is `SAME_ACTIVITY_ALIAS_CONFIRMED` from G2.
  - The only `headingAliases` entry for it is `立劵交易 → ["立券交易"]`.
  - In the activity map, contract and transaction both map to `["立券交易"]`.
  - `canonP4Heading` maps 劵 → 券.
- **納財 → 立券交易: not a taxonomy mapping.**
  - `finance` maps to `["納財"]`, which is distinct from contract and transaction.
  - No alias touches 納財 (`aliasesTouching納財 = []`).
  - The only link is the source rule **puzhu:21** (卷十 鋪註, verified in `vol10.raw.txt`): 「凡吉凶相抵不註忌開市亦不註忌立劵交易納財…不註忌納財亦不註忌開市立劵交易…」.
  - When 納財 is left unnoted *by 相抵*, the rule withholds the 忌 on 開市 and 立券交易.
- **Is the mapping established?** Yes, as a source rule rather than as taxonomy. The stop condition "mapping cannot be established" does not apply.
- **H3 taxonomy-collapse check.** 萬年書 counts 立券 and 交易 as separate cells, but 卷十一 merges them into one heading with one 宜 list and one 忌 list (G2 §4). The app's single heading follows 卷十一. No collapse of 納財 into 立券交易 exists.

## 5. n117 witness evidence

Re-read in this Stage from the stored JPG. No OCR was used, and nothing was corrected.

| Part | Content |
|---|---|
| Heading | 戊申大驛土寶除日 |
| 吉神 | 四相 陽德 相日 吉期 不將 益後 除神 司命 |
| 凶神 | 劫煞 天賊 五虛 五離 |
| 宜 | 祭祀沐浴掃舍宇 |
| 忌, column 1 | 上冊受封上表章會親友出行結婚姻納采 |
| 忌, column 2 | 問名安牀求醫療病修倉庫**立券交易納財** |
| 忌, column 3 | 開倉庫出貨財破土安葬啟攢 |

- **Normalized text:** 立券交易 is printed in the 券 form and is contiguous. No 開 precedes it, so 開市 is absent. 納財 ends column 2.
- **Parsed representation:** `evidence.json` → `pages[0].onJiLine = {開市: false, 立券交易: true, 納財: true, 開倉庫出貨財: true}`.
- **Transcription risk:** low.
  - The glyphs are clear, and this matches the H1-B and 納財-audit readings.
  - There is no sign of column displacement: n117's column 2 is a subsequence of the neighbours' 劫煞 run 「修倉庫鼓鑄經絡醞釀開市立券交易納財開倉庫出貨財」.
- **Neighbour comparison:** n117's 忌 list is much shorter than its neighbours'. Every 劫煞 heading that 四相's 宜 can cancel has dropped out.

## 6. 四相 evidence

| Item | Evidence |
|---|---|
| Source | 卷十 四相/時德 entry 「宜…納財開倉庫出貨財栽種牧養」; 卷十一 納財 宜 list `vol11.raw.txt:234` 「母倉天願月恩四相時徳…」 |
| Kind | General god rule (宜 list), not table-specific |
| Condition | 四相 = 夏 戊己 day stems; 未 is a 夏 month and 戊申 is a 戊 day. **Satisfied.** 四相 is also printed on n117. |
| Effect on 納財 | 宜. Only operand on n117 (`operandsOnN117For納財宜 = [四相]`) |
| Effect on 立券交易 | **None directly.** 卷十一 立劵交易 宜 = 天願民日三合滿日六合五富五合; none is on n117 |
| Second route | puzhu:06 「凡徳合赦願月恩四相時徳等日不註忌…開市立劵交易納財…如遇徳猶忌及從忌不從宜之日則仍註忌」. 四相 triggers it, and 立券交易 is a named target. |
| Semantic level | 四相 acts on 納財. It reaches 立券交易 only through puzhu:21 (via 納財's 相抵) or puzhu:06 (as a trigger day). |

### Operands on n117 for 立券交易 (卷十一 `vol11.raw.txt:231`)

- **忌:** 劫煞 and 五離. 天賊 and 五虛 are not in the list; the officer is 除, which is not 平 or 收.
- **宜:** none.
- **五離 lifters** (天德 月德 天德合 月德合 天赦 三合 六合): none on n117, so 五離 is **unlifted** by its own clause.
- **納財 忌 list:** contains **no** 五離. 納財's printed 忌 can come only from 劫煞, which 相抵 cancels.

## 7. Existing precedence policy

| Rule | Where | Scope |
|---|---|---|
| `OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS` | final gate, `owner-ruling.json` | **LOCAL**, 未-戊申 納財 only; not a general "source beats 月表" policy |
| 丑-丙寅 月德: n75 = `WITNESS_PRINTING_ERROR` | [`p4-chou-bingyin-yuede.md`](p4-chou-bingyin-yuede.md) | Local, backed by 66/67 pages following the 歴例 德 tables |
| puzhu:06 Q1–Q4a | `p4b-puzhu06.md` | `OWNER_ADOPTED`, not canonical; audit-only layer, not runtime |
| Blank semantics I1 | G2 Stage 1 owner ruling | Once reached, BLANK is active authority |

- **What is missing:** no general precedence for general rule vs 月表, or derived rule vs explicit witness.
- **Do these contradict each other?** No. Both witness rulings went to the source side, but each was explicitly local.
- **Applicable here?** Only if the owner extends the 納財 ruling to its puzhu:21 consequence on 立券交易. The ruling's decision line keeps the contract cells blank, but its reasoning addressed 納財 only (W1 §3).

## 8. Neighbour comparison

These are the stored pages that carry 五離 (day branch 申/酉) and were re-read here. `onJiLine` refers to the printed 忌 line. The 立券交易 operands are intersected mechanically with the 卷十一 lists (`lijuanJiOperands`, `lijuanYiOperands`).

| Page | Context | 立券交易 忌 operands | 立券交易 宜 operands | 四相 | 五離 lifters | 開市 | 立券交易 | 納財 | Authority cell (contract) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| n81 | 未-壬申 | 劫煞 五離 | — | no | none | 忌 | 忌 | 忌 | avoid | Full 劫煞 run; agrees |
| n105 | 未-丙申 | 劫煞 五離 | — | no | none | 忌 | 忌 | 忌 | avoid | Full 劫煞 run; agrees |
| n129 | 未-庚申 | 劫煞 五離 | — | no | none | 忌 | 忌 | 忌 | avoid | Full 劫煞 run (+八專); agrees |
| **n117** | **未-戊申** | 劫煞 五離 | — | **yes** | none | **—** | **忌** | **忌** | **blank** | **Target**; triad split |
| n93 | 未-甲申 | 劫煞 (with 德) 五離 | — | no | 天德 月德 | — | — | — | out of table (德) | 五離 lifted, 立券交易 not printed |
| 06067695-n50 | 申-戊申 | 五離 | — | no | 天德合 天赦 | — | — | — | — | 五離 lifted; no 忌 line |
| 06067693-n105 | 巳-丙申 | 月刑 五離 | 天願 六合 五富 | no | 天德合 六合 | — | (宜) | (宜) | — | 五離 lifted; 立券交易 on the 宜 line |
| 06067692-n51 | 寅-己酉 | 天吏 五離 | — | no | none | 忌 | 忌 | 忌 | — | 五離 unlifted, no 劫煞; **non-discriminating**: 天吏 also lists 立劵交易 |

### Pattern

1. **未-申 pages without 四相 (n81, n105, n129).** They print 開市, 立券交易 and 納財 together, as the puzhu:21 triad predicts, and they match their `avoid` cells.
2. **n117.** It is the only page that **splits the triad**: it drops 開市 and keeps 立券交易 and 納財.
3. **Pages where 五離 is lifted by its own clause (n93, n50, 巳-丙申).** None prints 立券交易 on the 忌 line. That fits 五離 being the god that puts 立券交易 there.
4. **What the stored set does not contain:**
   - a page with a puzhu:06 trigger (四相 / 時德 / 月恩 / 天願 / 德合) and unlifted 五離, other than n117 itself;
   - a page where unlifted 五離 is the **only** 立券交易 忌 operand. The one candidate, 寅-己酉 (n51), also has 天吏, so it cannot isolate 五離.

   So nothing independently tests whether 五離 alone produces the print, and nothing tests whether a puzhu:06 day removes 五離's 忌 on 立券交易.

No row or column displacement is visible. n117 is a well-formed page whose 忌 set is internally irregular on one triad.

## 9. Hypothesis analysis

| Hypothesis | Verdict | Evidence for | Evidence against |
|---|---|---|---|
| **H1 Printing / transcription anomaly** (source governs) | **PARTIAL** | No rule set yields {納財 noted, 開市 unnoted} (納財 audit). The page also contradicts 相抵 on 納財 and puzhu:06 on 納財. | Nothing shows that the **立券交易** print *itself* is an error. Plain 卷十 / 卷十一 text explains it through 五離. The glyphs are clean, with no displacement. |
| **H2 月表 precedence** (n117 intentionally overrides) | **NO EVIDENCE** | — | No documented precedence. Both prior witness rulings went to the source side, locally. No analogous conflict was resolved in favour of 月表. |
| **H3 Semantic / scope mismatch** | **LEADING, NOT ESTABLISHED** | The cell asks only whether **劫煞's** 忌 survives, while the page marks the heading. Unlifted 五離 lists 立劵交易. Lifted-五離 pages drop 立券交易, but on them 五離 is never the only operand removed, so this is consistent rather than isolating. Under N-C (only the 相抵-cancelled god is withheld), blank cell + printed 忌 is consistent. | Owner-adopted puzhu:06 **Q4** says 四相 lifts 五離 on 立券交易, which would leave the heading unnoted. n117 prints it. No stored page tests Q4 on 五離 independently, and no stored page isolates 五離 as the sole operand (寅-己酉 also has 天吏). N-C is not adopted, and the engine runs N-A. |

### What is not the explanation

- Taxonomy collapse (§4).
- OCR or normalization: 券 and 劵 are the same heading, and the print is clear.

### Strength

- H1, for the 立券交易 print, and H3 are of similar strength. Each is contradicted by one owner-adopted or source reading.
- That matches the stop condition "evidence supports multiple interpretations with similar strength".

## 10. Production isolation check

| Path | Finding |
|---|---|
| Canonical lookup | `getVol10JieshaRuntime('未','戊申', contract/transaction) = {APPLIED, blank}`; neighbours 未壬申 etc. = avoid |
| `resolveVol10` (faithful-v1) | 劫煞 → `no_annotation` (I1). The dependency model `weishen` (cell = avoid) gives `avoid` and exists only in tests. |
| Activity aliases | `立劵交易 → [立券交易]` only. No alias reaches 納財. |
| Fallback | v1 rollback gives `not_listed` (G2 Stage 2 §6); not shipped |
| Generated datasets / migration tables | v1–v4 all carry `blank` for 未戊申 contract/transaction. Provenance says `NOT SOURCE_WITNESSED` for 納財; no `SOURCE_WITNESSED` claim exists anywhere |
| Shipped Goldens | No Golden pins 未戊申 contract/transaction. The only 未戊申 hits in `golden-xieji-vol10-scoring-v4/v5` are demolition rows. `npm test` passes on the non-gated Goldens. |
| Runtime config | `manifest.policies.xiejiVol10JieshaPolicy` shipped `faithful-v1`; unchanged |
| `SOURCE_WITNESSED` | A provenance label, not a runtime state. No code path can promote a cell to it. |

### Real days at `aebcf2e` (`getAlmanac`, current behaviour)

| Date | Layer | contract / transaction | 劫煞 | 五離 |
|---|---|---|---|---|
| 2026-08-02 | P4 (2025–2027) | 50 neutral | `no_annotation` | `no_annotation` |
| 2027-07-28 | P4 | 50 neutral | `no_annotation` | `no_annotation` |
| 2028-07-22 | 卷十 table | 50 neutral | `no_annotation` (cell blank, I1) | not present (`ngu_ly` / `tu_tuong` not in `auditedGodIds` outside 2025–2027) |

### Finding (pre-existing, not a leak)

- The **劫煞 cell** is consistent with frozen authority: BLANK / I1. `SOURCE_WITNESSED` is unreachable.
- The **heading-level output** is neutral on every 未-戊申 day, but n117 prints 立券交易 as 忌. Two separate gaps cause this:
  - **Inside 2025–2027:** the P4 engine withholds 五離 too (N-A via puzhu:21). This is the recorded F1 debt; the 納財 audit already notes that n117 rules out N-A for P4 rows.
  - **Outside 2025–2027:** 五離 presence is not locked, so no god penalizes 立券交易.
- Severity: known and pre-existing. It does not block, and it does not route through the target cell.
- Not fixed in Stage 1.

## 11. Final ruling

**`UNRESOLVED_CONFLICT`**

- **Not `SOURCE_RULE_WINS`.** The source chain gives blank under N-A and N-C. But n117 is not shown to be wrong *on 立券交易*:
  - plain text explains the print through 五離;
  - the blank rests on a LOCAL 納財 ruling whose reasoning never addressed 立券交易.
- **Not `MONTH_TABLE_WINS`.** No precedence rule, commentary or analogue supports it. Under H3 the print need not even concern 劫煞.
- **Production stays `BLANK / I1`, not `SOURCE_WITNESSED`.** The authority debt is preserved explicitly in `evidence.json` (`witnessConflict: true`).

## 12. Confidence

| Claim | Confidence |
|---|---|
| Canonical mapping (立劵交易 = 立券交易; 納財 → 立券交易 only via puzhu:21) | high |
| n117 reading (立券交易 and 納財 on 忌, 開市 absent) | high |
| Production isolation (cell blank, I1, no SOURCE_WITNESSED path) | high, pinned by test |
| Ruling `UNRESOLVED_CONFLICT` | medium-high. Upgrading it needs one of the Stage 2 inputs. |

## 13. Remaining uncertainty

1. **Does puzhu:06 remove an unlifted 五離's 忌 on 四相 days?**
   - Owner Q4 says yes; n117 says no.
   - No stored page outside n117 tests this.
2. **N-A vs N-C** for independent 忌 under puzhu:21. These are identical for the 劫煞 table cell but differ for the heading.
3. **Does the 納財 ruling extend to its puzhu:21 consequences?** That is owner intent, not evidence.
4. **Single edition.** Only the 四庫 scans are stored. No second edition of 卷二十五 未月 戊申 exists in the repository.
5. **Unlifted-五離 neighbours.**
   - 寅-己酉 (n51) was re-read. It is non-discriminating, because 天吏 is a second operand.
   - 亥-辛酉 carries 災煞 and 四耗 as further 立券交易 忌 operands (H1-B), so it cannot isolate 五離.
   - 戌-辛酉 (`xiangdi-cancel-both-v1`) was not re-read.

## 14. Stage 2 recommendation

**Required: YES**, as an owner decision. No migration is required.

1. **Owner question (decisive):** does the LOCAL 納財 ruling explicitly extend to its puzhu:21 consequence on 立券交易?
   - **Yes:** close W1 as `SOURCE_RULE_WINS (derivative, LOCAL)`. Cells unchanged, 0 impact.
   - **No:** decide between blank and avoid. The avoid impact is already measured: 212 rows / 1,060 events outside the domain, 0 activity rows inside (G2 Stage 2 §6).
2. **Witness search (optional, strengthens either side):**
   - a second edition of the n117 page;
   - any 月表 page with a puzhu:06 trigger and unlifted 五離 (for example 夏 戊己 or 秋 壬癸 on 申/酉 days without 德/合/赦), to test Q4 against print practice.
   - any page where unlifted 五離 is the only 立券交易 忌 operand, to test whether 五離 alone produces the print.
3. **Keep separate:** the F1 / 五離 heading-level debt (P4 N-A; 五離 presence outside 2025–2027). It is not this cell's authority, and any fix is its own migration.

## Non-inferences

- n117 is not shown to be a print error on 立券交易.
- H3 is not adopted. N-C is not adopted.
- BLANK is neither approval nor prohibition. It is the frozen authority state.
