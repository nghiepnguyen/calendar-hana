# P21 Stage 1 — puzhu:21 不註 scope, authority reconstruction (audit only)

2026-10-26, branch `claude/p21-stage1-authority`, base `eb4dfd6` (main after the post-Q4-REST checkpoint). Production is unchanged: no code, JSON, flag, Golden, lock or authority change. Production authority stays `p4b-puzhu06-v5`.

Artifacts are in [`sources/p4-vol10/p21-stage1/`](sources/p4-vol10/p21-stage1/):

| File | Contents |
|---|---|
| `projection.json` | Written by `shared/lunar/p4P21Stage1Projection.test.ts` with `P21_DUMP=1`. H1/H2 over every propagation line (puzhu:11, 16–24): 720 contexts, plus every day of 2025–2027 |
| `build_evidence.py` → `evidence.json`, `lock.json` | Evidence, the witness tally and the lock. Pages are referenced by path and hash, not copied |

Lock harness: `shared/lunar/p4P21Stage1Lock.test.ts`. The full 720-context re-check runs with `P21_FULL=1`.

**Conclusion: UNDERDETERMINED.**

## 1. Scope

This stage reconstructs authority only. It does not touch:

- Y-CONVENTION, U4/U7 or BAIJI-Y;
- G2/W1 or Q4-REST. Neither is reopened, and no new evidence bears on them;
- 五墓 (Q4a), which stays as it is.

The `未-戊申` debt is treated as a case study, not as a premise.

## 2. Authority question

When puzhu:21 fires (one triad heading among 開市 / 立券交易 / 納財 is left unnoted by 吉凶相抵), what does 「不註忌 [the other two]」 withhold?

- **H1, heading-wide:** every 忌 on the target heading. This is N-A.
- **H2, contribution-scoped:** only the 忌 of the gods whose 相抵 left the trigger unnoted. Independent 忌 survive. This is N-C.

## 3. Repository provenance

| Layer | Where | Level |
|---|---|---|
| Source line | `vol10.raw.txt` offset 22390, verified byte-exact by `build_evidence.py`; transcription `p4-vol10-transcription.md` | A |
| Authority data | `p4-vol10-authority.json` (`puzhu:21` raw); `p4-vol10-day-composition-v2.json` `propagation.lines` puzhu:21 = six directed `pairs` | B |
| Engine | `p4OwnerRules.ts` propagation pass: an edge fires when the source heading is `neither_recorded`. The target then gets `ji: false` unless `protectedJi` holds, in which case it gets `propagationBlocked` | C |
| N-A / N-C labels | [`p4-weishen-nacai-puzhu21.md`](p4-weishen-nacai-puzhu21.md) N2 (2026-10-22). Reused in G2 n117 Stage 2 §6–7 and F1 Stage 2/3 | D |
| Earlier general form | [faithful study](p4-jiesha-faithful-vol10.md) "F1 — cross-god propagation: SOURCE_DEPENDENT" (all lines) | D |
| Owner precedent | [`p4-full-golden-hold-questions.md`](p4-full-golden-hold-questions.md), owner decision 2026-10-17 (H1-B, H2-A; `OWNER_ADOPTED_SOURCE_DEPENDENT`). Its outcome table has puzhu:22 withhold the **independent** 月虛 忌 on 開倉庫出貨財 (11 dates; 月虛 is not 專忌), giving `neither_recorded`. The question posed was H1-B composition, not propagation scope, so heading-wide propagation was accepted **implicitly** as a consequence | D |
| Debt record | F1 Stage 3 §4: 「puzhu:21 (N-A) then withholds it [五離] … N-A vs N-C remains a separate debt」; PROJECT_CONTEXT §4 P21 | D |

**N-A and N-C are audit-internal labels, not source terms.**

Search coverage (files with a hit, over `docs/`, `tasks/`, `shared/`, `scripts/` and `PROJECT_CONTEXT.md`; `graft/` and `graphify-out/` excluded):

| Term | Files | Term | Files |
|---|---:|---|---:|
| 不註 | 178 | 開市 | 323 |
| 立券 | 358 | 立劵 | 145 |
| 交易 | 387 | 納財 | 326 |
| 吉凶相抵 | 69 | 戊申 | 335 |
| 未-戊申 | 174 | puzhu:21 | 51 |
| N-A | 31 | N-C | 24 |

The simplified variants 不注, 开市 and 纳财 have 0 hits each. The repository uses traditional forms, with 劵/券 normalized by `canonP4Heading`.

## 4. Primary source evidence (Level A)

> 凡吉凶相抵不註忌開市亦不註忌立劵交易納財不註忌納財亦不註忌開市立劵交易不註忌立劵交易亦不註忌開市納財 (puzhu:21)

Neighbouring lines in the same 鋪註條例, all verified at their offsets:

| Line | Exception clause |
|---|---|
| puzhu:05 (base 相抵) | 如遇徳猶忌之事則仍註忌 |
| puzhu:17 (嫁娶 → six targets) | 如遇徳猶忌之日則仍註忌; 遇不將而不註忌嫁娶者亦仍註忌; 遇亥日…而仍註忌嫁娶者止註所忌之事其不忌者仍不註忌 |
| puzhu:20 (修造動土 → …) | 如遇徳猶忌之日則仍註忌 |
| **puzhu:21** | **none** |
| puzhu:22 (開市+立劵交易 → 開倉庫出貨財) | 如遇專忌之日則仍註忌 |
| puzhu:06 (德合赦願… days) | 如遇徳猶忌及從忌不從宜之日則仍註忌 |

Witnesses: 13 scan-locked 月表 pages from `h1b-yuebiao-witness-v1/lock.json`, hashes re-pinned in this lock (§10).

## 5. Semantics of 吉凶相抵 / 不註

Structure: 「凡吉凶相抵不註忌 X 亦不註忌 Y」.

1. **Trigger:** heading X is unnoted *by 吉凶相抵*. The trigger is a heading state reached through 相抵.
2. **Object of 不註忌:** heading Y. The text names headings, never gods.
3. **What the grammar fixes:** the target is a heading (or a group, since the triad is symmetric).
4. **What it does not fix:** whether 「不註忌 Y」 means "Y gets no 忌 line" (H1) or "the 相抵 that cancelled X's 忌 also cancels that god's 忌 on Y" (H2).

Readings of the exception clauses:

- **Toward H1.** puzhu:22's 「如遇專忌之日則仍註忌」 keeps an independent day taboo on the target. Here 專忌 is the 百忌 day taboo, as in [`baiji-giap-at.md`](baiji-giap-at.md); the reading that excludes 月虛 is an owner convention (2026-10-11). Under H2 that exception would be redundant, so it implies that the default withholds independent 忌.
- **Toward H2.** puzhu:17's last clause, 「止註所忌之事其不忌者仍不註忌」, reasons god by god: note only the affairs the surviving god avoids.
- **Neither.** puzhu:21 has no exception at all. That fits H1 read literally (nothing survives, not even 百忌), and it also fits H2 (nothing needed an exception).

**Scope indicator: absent. Classification of the text alone: UNDERDETERMINED.**

## 6. N-A reconstruction

- **Origin:** the engine as built (owner rules layer, 2026-10-17). The same day, the owner accepted heading-wide propagation **implicitly**: the H1-B decision table shows puzhu:22 withholding 月虛 (§3). It was later labelled "N-A" in the 納財 audit. It is owner-accepted, not source-established.
- **Behaviour:** heading-wide removal, with one carve-out. Protected 忌 (專忌 / 百忌 / 止忌 / dated / `stop`) block every propagation line, puzhu:21 included, even though only puzhu:22 states a 專忌 exception. **Engine N-A is therefore H1 plus a protection convention (Level C), not pure literal H1.**
- **Trigger condition:** any `neither_recorded` row. The engine does not check that the cause was 相抵 (E1 復日/重日 also reads `neither_recorded`). Every puzhu:21 cell found here does have a 相抵 god on its trigger, so this does not change the set.
- **Trace:** `propagatedFrom` keeps only the last edge that fired. The harness re-derives edges from the lines.

## 7. N-C reconstruction

- **Origin:** the 納財 audit N2, as the alternative reading. It has never been implemented.
- **Definition:** withhold only the 忌 of the trigger's 相抵 gods.
- **This harness:** "cancelled" = the 卷十 subject scopes whose state on the trigger heading is `neither_recorded`. "Independent" = target `trace.ji` minus cancelled.
- **H2 output:**
  - `only_ji` (or `both_present` if 宜 is noted) when an independent 忌 survives;
  - otherwise the H1 output;
  - blocked edges are identical under both readings.
- **Limitation:** an H2 row is a projection. It does not re-run 相抵 between the surviving 忌 and the target's own 宜. It does not need to on this set, because no affected target notes 宜.

## 8. Affected-cell matrix (puzhu:21, P4 layer)

| Context | Heading | Activity | Source contribution (cancelled) | Other contribution | N-A (H1) | N-C (H2) | Difference |
|---|---|---|---|---|---|---|---|
| 未-壬申 | 立券交易 | contract, transaction | 劫煞 (開市, 納財 相抵) | 五離 | neither_recorded | only_ji | 五離 withheld only under H1 |
| 未-丙申 | 立券交易 | contract, transaction | 劫煞 | 五離 | neither_recorded | only_ji | same |
| 未-戊申 | 立券交易 | contract, transaction | 劫煞 | 五離 (`puzhu06 keep:QL_EXCLUDED`, F1 R2) | neither_recorded | only_ji | same |
| 未-庚申 | 立券交易 | contract, transaction | 劫煞 | 五離 | neither_recorded | only_ji | same |
| 亥-丁酉 | 立券交易 | contract, transaction | 災煞 | 五離 | neither_recorded | only_ji | same |
| 亥-癸酉 | 立券交易 | contract, transaction | 災煞 | 五離 | neither_recorded | only_ji | same |

Totals:

- **Context level (720 contexts):** 6 cells, all divergent, all with an independent contribution; 0 blocked.
- **Dated 2025–2027:** 8 cells, all divergent:
  - 2025-07-26, 2026-07-21, 2027-07-16 (未-丙申);
  - 2026-08-02, 2027-07-28 (未-戊申);
  - 2025-11-24, 2026-11-19, 2027-11-14 (亥-丁酉).

On every cell:

- **開市 and 納財 are never targets with 忌.** Their only 忌 is the trigger god's, which their own 相抵 already cancels.
- **The target has its own 相抵** with the same god. Owner rule H1-B keeps 五離 there (`preRule: H1-B`). Under H1, puzhu:21 then removes the 五離 that H1-B kept. Under H2, puzhu:21 changes nothing on these cells.
- **Provenance is not lost after the union.** `trace.ji` keeps the target's pre-propagation 忌 sources. The cancelled set is recomputed from the 卷十 scopes.

### The trigger premise at the source layer

| Context | Trigger 相抵 god | Faithful 卷十 (v4) trigger cells | Status |
|---|---|---|---|
| 未-壬申, 未-丙申, 未-庚申 | 劫煞 | finance / opening / contract = **avoid** | **P4_LAYER_ONLY.** The trigger exists only because P4 still runs `cancel_both` (P4-劫). Pages n81 / n105 / n129 print the whole triad |
| 未-戊申 | 劫煞 | blank | **SETTLED_BY_LOCAL_OWNER_RULING** (納財 宜 via 四相; G2/W1 D1(a)) |
| 亥-丁酉, 亥-癸酉 | 災煞 | outside the 劫煞 table | **UNAUDITED** (X相抵). No stored page |

## 9. 未-戊申 case study

1. **Path into P21.** 四相 gives 納財 a 宜. The 劫煞 clause (辰戌丑未, 除日/相日, no 德) makes it 相抵, so 納財 is unnoted. puzhu:21 then reaches 開市 and 立券交易.
2. **Contributions on 立券交易:** two, 劫煞 and 五離.
3. **Where the 忌 comes from:**
   - 劫煞 (卷十 entry lists 立劵交易);
   - 五離 (「忌…立劵交易」), which 四相 cannot lift (F1 R2).
4. **Where the 宜 comes from:**
   - on 立券交易: none (`yi: false`);
   - on 納財: 四相.
5. **H1 output:** 立券交易 unnoted. This is production: `neither_recorded`, contract/transaction unchanged since F1 R2.
6. **H2 output:** 立券交易 忌 from 五離 alone.

**Mechanism by layer.** In the P4 layer, 立券交易 has its own 劫煞 相抵, so H2's puzhu:21 is a no-op. In the faithful 卷十 layer, 立券交易 has no 宜, so under H2 puzhu:21 removes 劫煞 and 五離 stays. Both layers give the same outputs. H1-B is a P4 mechanism, not a source mechanism.

**Does the source decide?** No. n117 prints 立券交易 忌, which matches H2. But the same page prints 納財 忌, so on the page the trigger never fires. Its 立券交易 is then explained by 劫煞 + 五離 under either reading.

The owner LOCAL ruling holds that the page is wrong on 納財. It does not say whether the error is in the computation (then 立券交易 is uninformative) or in the typesetting (then it is H2 evidence). **The page is not probative for P21.** The earlier line "n117 rules out N-A for P4 rows" (納財 audit) depends on that unstated error mechanism.

## 10. Analogous source patterns

`projection.json` runs H1/H2 over every propagation line. Divergent contexts were intersected with stored, scan-locked 月表 pages.

A page can test the scope of a propagated 不註 only if the trigger is printed unnoted *and* the target has an independent 忌.

| Line | Page | Context | Trigger printed? | Target (independent 忌) | Target printed? | Fits |
|---|---|---|---|---|---|---|
| puzhu:21 | n117 | 未-戊申 | 納財 **yes** | 立券交易 (五離) | yes | none (premise not realised) |
| puzhu:21 | n81 / n105 / n129 | 未-壬申 / 丙申 / 庚申 | yes (whole triad) | 立券交易 (五離) | yes | none (faithful: no trigger) |
| puzhu:16/17 | n130 | 亥-辛酉 | 結婚姻 / 嫁娶 yes | 納采問名 / 結婚姻 (五離) | yes | none (災煞 相抵 not applied as modelled) |
| puzhu:17 | n81 / n117 | 未-壬申 / 戊申 | 嫁娶 absent | 結婚姻, 納采問名 (五離) | yes | none (the 不將 exception explains it; P17-A) |
| **puzhu:22** | n17 / n29 / n41 | 戌-乙亥 / 丁亥 / 己亥 | 開市 + 立券交易 absent | 開倉庫出貨財 (五虛) | **yes** | **H2** |
| puzhu:22 | n65 | 戌-癸亥 | absent | 開倉庫出貨財 (五虛) | yes | none (四相 day: the triad's absence is also explained by puzhu:06; SOURCE_AMBIGUOUS in the H1-B review) |
| **puzhu:22** | n11 / n23 / n35 / n47 | 辰-己巳 / 辛巳 / 癸巳 / 乙巳 | absent | 開倉庫出貨財 (五虛) | **no** | **H1** |

Other analogues:

- **puzhu:06** (n14 戌-壬申, n62 戌-庚申; F1 Stage 2). 「…日不註忌…立劵交易」 leaves 五離 printed. This is read as lex specialis: 五離's own lifter list governs. It is not a 相抵 line, and it carries its own exceptions, so it is an analogue only.
- **puzhu:05 / H1-B.** Same-heading 相抵 keeps independent 忌. The 德-lift sub-class is SOURCE_WITNESSED; the 相抵 sub-class is OWNER_ADOPTED_SOURCE_DEPENDENT. This is the same question one step earlier, not puzhu:21 evidence.

**The 辰 group is confounded.** On those cells, 開倉庫出貨財 also has its own 劫煞 相抵 (`preRule: H1-B`). Its absence fits H1 at puzhu:22, but it fits equally well with H1-B being wrong for the 相抵 sub-class (whole-heading 相抵 at puzhu:05), which is still SOURCE_DEPENDENT. The 戌 group needs H1-B and H2 together. So the split is contradictory, but not symmetric.

**Result.** The one same-system line that can be tested, puzhu:22, is **split**: 3 pages fit H2 and 4 fit H1. Both groups share the operand structure (劫煞 相抵 on the triggers, 五虛 independent on the target). The faithful study already recorded this as F1 SOURCE_DEPENDENT. **Contradictory Level A evidence is unresolved.**

## 11. H1 projection

H1 equals production. On the 6 contexts / 8 dates, 立券交易 is `neither_recorded`.

## 12. H2 projection

On the same cells, 立券交易 is `only_ji` (五離). No H2 row is `both_present`, because 立券交易 has no 宜 on any affected cell.

## 13. Divergent cells

All 6 contexts (8 dates) are divergent, and every one of them has an independent contribution (五離). Their per-cell evidence is in `evidence.json` `affectedCells`.

The score and event impact of H2 was **not measured**. That belongs to Stage 2.

## 14. Dependency analysis

| Item | Overlap |
|---|---|
| G2/W1 | DATA OVERLAP. The 未-戊申 劫煞 × 立券交易 cell is blank under H1 and H2. Not reopened |
| Q4a / 五墓 | NONE |
| Q4-REST (九空 / 五虛 / 小耗) | NONE. No puzhu:21 cell carries them |
| 五離 (F1 R2, R-F1Y) | SEMANTIC OVERLAP. 五離 is the independent 忌 on every cell: R2 keeps it at puzhu:06, and puzhu:21 N-A removes it afterwards |
| Y-CONVENTION | NONE. H2 never yields `both_present` on the affected set (checked in `build_evidence.py`) |
| BAIJI-Y, U4/U7 | NONE |
| **P4-劫** | **AUTHORITY DEPENDENCY.** The trigger premise of 未-壬申/丙申/庚申 exists only under P4 `cancel_both` |
| **X相抵 (災煞)** | **AUTHORITY DEPENDENCY.** The trigger premise of 亥-丁酉/癸酉 |
| H1-B | SEMANTIC OVERLAP. The same scope question at puzhu:05 |
| Owner decision 2026-10-17 (H1-B / H2-A) | AUTHORITY DEPENDENCY. It is the implicit heading-wide precedent at puzhu:22, and adopting N-C would revise it |

P21's scope question does not depend on Y-CONVENTION. The dependencies affect **which cells exist**, not what 不註 means. The classification is therefore UNDERDETERMINED rather than BLOCKED_BY_DEPENDENCY.

## 15. Evidence hierarchy

| Level | Items | Says |
|---|---|---|
| A | puzhu:05/06/17/20/21/22 text; 13 月表 pages | Text: scope unstated, with exception clauses pointing both ways. Pages: puzhu:21 untestable; puzhu:22 split |
| B | faithful v4 cells; `projection.json` | 6 P4 cells, of which 1 has a settled trigger |
| C | `p4OwnerRules.ts` (N-A + protection carve-out), Golden rows | What production does; not evidence of authority |
| D | 納財 audit N2, G2 Stage 2, F1 Stage 2/3, faithful F1, LOCAL owner rulings, owner H1-B decision 2026-10-17 | Framing only. 「n117 rules out N-A」 is conditional (§9). The 2026-10-17 decision accepted heading-wide propagation at puzhu:22 as a consequence, not on evidence |

Level C was not used to support any Level A claim.

## 16. Conclusion

**UNDERDETERMINED.**

Gate for H1_SUPPORTED or H2_SUPPORTED:

| Condition | Met? |
|---|---|
| (1) primary evidence on puzhu:21 itself | no: no page realises the trigger at source level with an independent 忌 |
| (2) clear provenance | yes |
| (3) explicable semantics | both readings explicable |
| (4) no unresolved contradictory primary evidence | **no:** puzhu:22 split 3/4; exception-clause arguments point both ways |
| (5) reproducible projection | yes |

Confidence that the evidence cannot decide: high. No lean is adopted.

## 17. Stage 2 recommendation

**Option 1: witness acquisition (recommended).** It must be frozen before reading. Candidates:

- another edition or digitization of n117 (未-戊申), to tell a computation error from a typesetting error;
- 亥-丁酉 and 亥-癸酉 月表 pages (災煞 trigger premise, X相抵);
- other 月表 pages in the 辰/戌 劫煞 groups that test puzhu:22, to explain the 辰-巳 vs 戌-亥 split (a 五虛 premise difference is possible).

A clean test needs four things on the same page:

- the trigger printed unnoted by 相抵;
- a target with **no 宜 and no 相抵 of its own**;
- an independent, unprotected 忌 on that target;
- no puzhu:06 trigger god on the day.

**Option 2: owner ruling.** Confirm or revise the implicit 2026-10-17 precedent. Choose N-A or N-C as an explicit convention, `OWNER_ADOPTED_SOURCE_DEPENDENT`, scoped to puzhu:21 or to all propagation lines. N-C on all lines would also revise the puzhu:22 / 月虛 consequence of that decision.

- **N-C changes production** on 8 dates in 2025–2027 (contract, transaction; 立券交易 `neither_recorded` → `only_ji`). That needs:
  - a successor authority or policy, with a rollback pin;
  - Golden successors;
  - a migration diff;
  - `ci:p4:full`.
- **N-A changes nothing.**

Do not resolve P21 through P4-劫 or X相抵. Those can remove cells from the set, but they cannot decide the scope.
