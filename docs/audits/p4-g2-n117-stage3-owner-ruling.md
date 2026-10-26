# G2-n117 Stage 3: owner ruling freeze, W1 closed

2026-10-26, branch `claude/g2-n117-stage3`, cut from Stage 2 `2752d02`. **No production behaviour change.**

- The owner ruling is recorded in `sources/p4-vol10/g2-n117-stage3/owner-ruling.json`.
- The lock (`build_lock.py` → `lock.json`) pins that ruling together with the frozen Stage 1/2 evidence and the parent 納財 ruling.
- Harness: `shared/lunar/p4G2N117Stage3Lock.test.ts`.

## 1. Stage 1 reference

- Report: [`p4-g2-n117-authority-discrepancy.md`](p4-g2-n117-authority-discrepancy.md), commit `3afb22d`.
- Ruling: `UNRESOLVED_CONFLICT`. The cell stayed BLANK / I1 and was not marked `SOURCE_WITNESSED`.
- This Stage leaves Stage 1 unchanged.

## 2. Stage 2 reference

- Report: [`p4-g2-n117-stage2-resolution.md`](p4-g2-n117-stage2-resolution.md), commit `2752d02`.
- Classification **C**: unresolved at the level of source evidence, so an owner ruling was justified.
- What Stage 2 established:
  - The 劫煞 cell is blank under every reading consistent with the LOCAL 納財 ruling.
  - Whether puzhu:06 Q4 or n117 governs is a separate question about the heading (F1).
- This Stage leaves Stage 2 unchanged.

## 3. Owner question D1

> Does the LOCAL 未-戊申 納財 ruling extend to its literal puzhu:21 consequence on 劫煞 × 立券交易 (contract, transaction)?

## 4. Owner ruling D1(a)

**D1(a) = YES** (owner, 2026-10-26).

- For the 未-戊申 authority context, the existing LOCAL 納財 owner ruling (`OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS`, [final gate](p4-option-c-final-gate.md)) propagates through the direct puzhu:21 consequence to 立券交易.
- Result: **劫煞 × 立券交易 = BLANK / I1.** W1 is CLOSED.

Class: **LOCAL OWNER RULING**. It is the same kind of record as the parent 納財 ruling (`owner-ruling.json`, scope `LOCAL: …`). No new provenance type is introduced.

## 5. Exact scope

| In | Out (not extended) |
|---|---|
| 未-戊申 × 劫煞 (`jie_sha`) × 立券交易, activities `contract` and `transaction` | 開市; other months; other day stems or branches; other gods; other 五離 cases; other 納財 conflicts; other puzhu:21 contexts |

Two clarifications:

- **納財 is not an alias of 立券交易.** The link is a source-rule consequence (puzhu:21), not taxonomy. `headingAliases` and the activity map are unchanged.
- **開市 is excluded on purpose**, even though it is in the puzhu:21 triad. Its blank cell already comes from the 納財 ruling's own `cellsKept`, so this ruling adds nothing there.

## 6. Why this is LOCAL rather than canonical

- **The parent 納財 ruling is itself LOCAL.** It explicitly says it is "not a general policy that source prose outranks 月表".
- **A derivative ruling cannot be broader than its parent.**
- **No source text decides the cell on its own.** The blank needs the owner's 納財 premise (Stage 2 §8: outcome A was unavailable).
- **n117 still prints 立券交易 on the 忌 line.** The cell is therefore not `SOURCE_WITNESSED`, and the discrepancy stays in provenance.

## 7. puzhu:21 propagation boundary

| Step | Text / record | Kind |
|---|---|---|
| 四相 gives 納財 a 宜; 劫煞 「宜則不忌」 | 卷十 四相 entry, 卷十一 納財 list, 劫煞 clause | source |
| n117 prints 納財 忌 anyway; source wins, locally | final-gate `owner-ruling.json` | LOCAL owner ruling (parent) |
| 納財 unnoted by 相抵, so 「不註忌立劵交易」 | puzhu:21, 卷十 offset 22390 | source rule, contextual on 相抵 |
| 劫煞's 忌 on 立券交易 withheld | identical under N-A and N-C | derived |
| **This ruling** | owner accepts that the step above applies on 未-戊申 | LOCAL owner ruling D1(a) |

The ruling covers exactly one hop: 納財 → 立券交易, for 劫煞. Three things are outside it:

- **The 開市 hop of the same line.** It is already blank, and this ruling does not decide it.
- **Any reverse direction.**
- **Any other god's 忌 on 立券交易.** Withholding 五離 is F1 (§11).

## 8. Final cell state

| Field | Value |
|---|---|
| Cell | `xieji-vol10-jiesha-authority-v4.json` → `cells.未戊申.contract`, `.transaction` |
| State | `blank`, runtime `{status: APPLIED, cell: blank}`; `resolveVol10` 劫煞 → `no_annotation` (I1) |
| Provenance | LOCAL OWNER RULING D1(a), derived from the LOCAL 納財 ruling through puzhu:21 |
| SOURCE_WITNESSED | **NO**; n117 discrepancy retained |

## 9. W1 closure

- **Before:** `OPEN, deferred` ([item](p4-weishen-lijuan-authority-item.md)), with PROJECT_CONTEXT W1 marked **OPEN**.
- **Now: CLOSED.** Updated in:
  - the item header;
  - `PROJECT_CONTEXT.md` on this branch (the G2 section line, the W1 row and the dependency line).
- **Closure reason:**

  > Closed by LOCAL OWNER RULING D1(a). The local 未-戊申 納財 ruling propagates through the direct puzhu:21 consequence to 立券交易. Result: 劫煞 × 立券交易 remains BLANK / I1. No production migration required.

- **Pending sync:**
  - The newer `PROJECT_CONTEXT.md` on the unmerged docs branch `claude/docs-project-context-g1-soil` (`967bb15`) still shows W1 as OPEN.
  - That branch was not merged or cherry-picked. Its W1 row needs the same closure when the two copies are reconciled.

## 10. Production impact

| | Value |
|---|---|
| Behaviour changed | NO |
| Rows changed | 0 |
| Events changed | 0 |
| Scores changed | 0 |
| Production data / Golden / aliases / lookup / P4 config / 五離 runtime | untouched |

**One source file touched:** the doc comment in `shared/lunar/p4OwnerRules.ts`.

- It said the layer is "audit-only" and "Not imported by the production pipeline". It now says production reaches the layer through `getP4DayHeadings` (`p4AlmanacHeadings.ts`) inside the P4 domain.
- This is a comment-only edit. No import, export or logic changed.
- No lock hashes this file. The owner-rules mutation script edits logic strings only.

## 11. F1 separation

**F1, 五離 × 立券交易 behaviour at the heading level: OPEN / SEPARATE.**

- **Current production (Stage 2 §11):** inside 2025–2027, the P4 owner-rules layer applies H1-B and then puzhu:06 Q4 (`lift:QL`). On 2026-08-02 the 立券交易 heading is therefore `neither_recorded`.
- **Not decided here:** keep Q4 (D2(a)), or a local n117 exception that preserves 忌 (D2(b)).
- **Outside 2025–2027:** 五離 presence is not locked. That is a separate part of F1.
- **Independence:** D1(a) is independent of D2. No D2 outcome changes the 劫煞 cell.

## 12. Remaining witness opportunity

These are for F1 only; nothing was fetched.

- **Targets:** archive.org `06067696.cn`, 戌月 **壬申** and **庚申**.
  - The leaves are predicted as n14 and n62. The page header must confirm them before use.
  - On these pages 五離 is the sole 立券交易 忌 source and the puzhu:06 trigger (四相, 月恩) is not one of 五離's own lifters. That combination can separate Q4 from 五離's narrower 「與…併則不忌」 list.
- **Supplementary:** a second edition of 卷二十五 未月 戊申.

## 13. Final G2-n117 status

```text
G2-n117 / W1: CLOSED   (LOCAL OWNER RULING D1(a); 劫煞 × 立券交易 = BLANK / I1; not SOURCE_WITNESSED)
F1:           OPEN / SEPARATE   (五離 × 立券交易 heading level; next evidence 戌-壬申, 戌-庚申)
```
